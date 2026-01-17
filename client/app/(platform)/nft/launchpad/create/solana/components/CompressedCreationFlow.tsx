"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, CheckCircle, Rocket, Check, Clock, Loader2, ExternalLink, Globe, Twitter, MessageCircle, Send, ArrowLeft, TreePine, AlertCircle } from "lucide-react"
import { saveDraft, loadDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import type { Socials, CollectionCategory } from "@/declarations/registry/registry.did"
import { uploadToStorage, StorageProvider } from "@/lib/storage"
import { toast } from "sonner"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplBubblegum, createTree, mintToCollectionV1 } from "@metaplex-foundation/mpl-bubblegum"
import { mplTokenMetadata, createNft, TokenStandard } from "@metaplex-foundation/mpl-token-metadata"
import {
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
  none,
} from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  imageUrl: string
  bannerUrl: string
  maxSupply: string
  royaltyBps: string
  mintPrice: string
  category: string
  website: string
  twitter: string
  discord: string
  telegram: string
  treeSize: string
  collectionId?: string
  manifestUrl?: string
  collectionMintAddress?: string
  merkleTreeAddress?: string
}

type SaveStatus = "saving" | "saved" | "idle"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

// Tree size configurations
const TREE_CONFIGS = {
  small: { maxDepth: 14, maxBufferSize: 64, label: "Small (up to 16K NFTs)", cost: "~0.15 SOL" },
  medium: { maxDepth: 17, maxBufferSize: 64, label: "Medium (up to 131K NFTs)", cost: "~1.2 SOL" },
  large: { maxDepth: 20, maxBufferSize: 256, label: "Large (up to 1M NFTs)", cost: "~9.5 SOL" },
  xlarge: { maxDepth: 24, maxBufferSize: 512, label: "XLarge (up to 16M NFTs)", cost: "~150 SOL" },
}

interface CompressedCreationFlowProps {
  onBack: () => void
}

export default function CompressedCreationFlow({ onBack }: CompressedCreationFlowProps) {
  const router = useRouter()
  const { identity } = useAuth()
  const wallet = useWallet()
  const { publicKey, connected } = wallet

  const draftId = "solana-compressed-draft"
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    bannerUrl: "",
    maxSupply: "10000",
    royaltyBps: "500",
    mintPrice: "0",
    category: "",
    website: "",
    twitter: "",
    discord: "",
    telegram: "",
    treeSize: "small",
  })

  const [collectionImage, setCollectionImage] = useState<File | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [nftAssets, setNftAssets] = useState<FileList | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("nft-storage")

  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState<string>("")
  const [mintProgress, setMintProgress] = useState({ current: 0, total: 0 })

  const debouncedFormData = useDebounce(formData, 1000)

  useEffect(() => {
    const loadSavedDraft = async () => {
      try {
        const saved = await loadDraft(draftId)
        if (saved) {
          setFormData(saved.formData)
          if (saved.collectionImage) {
            setCollectionImage(saved.collectionImage)
            setFormData(prev => ({...prev, imageUrl: URL.createObjectURL(saved.collectionImage)}))
          }
          if (saved.bannerImage) {
            setBannerImage(saved.bannerImage)
            setFormData(prev => ({...prev, bannerUrl: URL.createObjectURL(saved.bannerImage)}))
          }
          if (saved.nftAssets) {
            const dataTransfer = new DataTransfer()
            saved.nftAssets.forEach((file: File) => dataTransfer.items.add(file))
            setNftAssets(dataTransfer.files)
          }
        }
      } catch (error) {
        console.error("Failed to load draft:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSavedDraft()
  }, [])

  useEffect(() => {
    const autoSave = async () => {
      if (!isLoading && (formData.name || formData.symbol || formData.description)) {
        setSaveStatus("saving")
        try {
          await saveDraft(draftId, formData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)
          setSaveStatus("saved")
          setLastSaved(Date.now())
        } catch (error) {
          console.error("Failed to save draft:", error)
          setSaveStatus("idle")
        }
      }
    }
    autoSave()
  }, [debouncedFormData, collectionImage, bannerImage, nftAssets, isLoading])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'collection' | 'banner') => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      if (type === 'collection') {
        setCollectionImage(file)
        setFormData(prev => ({ ...prev, imageUrl: url }))
      } else {
        setBannerImage(file)
        setFormData(prev => ({ ...prev, bannerUrl: url }))
      }
    }
  }

  const handleNftAssetsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNftAssets(e.target.files)
      setFormData(prev => ({ ...prev, maxSupply: e.target.files!.length.toString() }))
    }
  }

  const getTreeConfig = () => {
    return TREE_CONFIGS[formData.treeSize as keyof typeof TREE_CONFIGS] || TREE_CONFIGS.small
  }

  const handleDeploy = async () => {
    if (!connected || !publicKey || !identity) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!collectionImage || !nftAssets || nftAssets.length === 0) {
      toast.error("Please upload collection image and NFT assets")
      return
    }

    setIsDeploying(true)
    const totalNfts = nftAssets.length
    setMintProgress({ current: 0, total: totalNfts })

    try {
      // Step 1: Upload assets
      setDeploymentStep("Uploading assets to storage...")
      const uploadResult = await uploadToStorage(
        storageProvider,
        collectionImage,
        Array.from(nftAssets),
        {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          royaltyBps: parseInt(formData.royaltyBps),
        },
        wallet,
        bannerImage || undefined
      )

      setFormData(prev => ({ ...prev, manifestUrl: uploadResult.manifestUrl }))
      toast.success("Assets uploaded!")

      // Step 2: Initialize UMI
      setDeploymentStep("Creating Merkle tree...")

      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplBubblegum())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))

      // Generate keypairs
      const merkleTreeSigner = generateSigner(umi)
      const collectionMintSigner = generateSigner(umi)

      // Get tree config
      const treeConfig = getTreeConfig()

      // Create Merkle tree
      const createTreeTx = await createTree(umi, {
        merkleTree: merkleTreeSigner,
        maxDepth: treeConfig.maxDepth,
        maxBufferSize: treeConfig.maxBufferSize,
      })

      await createTreeTx.sendAndConfirm(umi)
      console.log("Merkle tree created:", merkleTreeSigner.publicKey.toString())
      toast.success("Merkle tree created!")

      // Step 3: Create collection NFT
      setDeploymentStep("Creating collection NFT...")

      const createCollectionTx = createNft(umi, {
        mint: collectionMintSigner,
        name: formData.name,
        uri: uploadResult.collectionImageUrl,
        sellerFeeBasisPoints: percentAmount(parseInt(formData.royaltyBps) / 100, 2),
        isCollection: true,
        collectionDetails: {
          __kind: 'V1',
          size: 0,
        },
      })

      await createCollectionTx.sendAndConfirm(umi)
      console.log("Collection created:", collectionMintSigner.publicKey.toString())
      toast.success("Collection NFT created!")

      // Step 4: Mint all cNFTs
      setDeploymentStep(`Minting ${totalNfts} compressed NFTs...`)

      for (let i = 0; i < uploadResult.nftMetadataUrls.length; i++) {
        setMintProgress({ current: i + 1, total: totalNfts })
        setDeploymentStep(`Minting NFT ${i + 1} of ${totalNfts}...`)

        const mintTx = await mintToCollectionV1(umi, {
          leafOwner: umi.identity.publicKey,
          merkleTree: merkleTreeSigner.publicKey,
          collectionMint: collectionMintSigner.publicKey,
          metadata: {
            name: `${formData.name} #${i + 1}`,
            uri: uploadResult.nftMetadataUrls[i],
            sellerFeeBasisPoints: parseInt(formData.royaltyBps),
            collection: { key: collectionMintSigner.publicKey, verified: false },
            creators: [
              { address: umi.identity.publicKey, verified: false, share: 100 },
            ],
          },
        })

        await mintTx.sendAndConfirm(umi)

        // Add small delay between mints to avoid rate limiting
        if (i < uploadResult.nftMetadataUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      toast.success("All NFTs minted!")

      // Step 5: Create registry record
      setDeploymentStep("Saving to registry...")

      const registryActor = await getRegistryActor(identity)

      const socials: Socials = {
        website: formData.website ? [formData.website] : [],
        twitter: formData.twitter ? [formData.twitter] : [],
        discord: formData.discord ? [formData.discord] : [],
        telegram: formData.telegram ? [formData.telegram] : [],
      }

      const categoryMap: Record<string, CollectionCategory> = {
        art: { Art: null },
        pfp: { PFP: null },
        gaming: { Gaming: null },
        music: { Music: null },
        photography: { Photography: null },
        utility: { Utility: null },
        metaverse: { Metaverse: null },
        other: { Other: null },
      }

      const createResult = await registryActor.create_collection({
        blockchain: { Solana: null },
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image_url: uploadResult.collectionImageUrl,
        banner_url: uploadResult.bannerImageUrl ? [uploadResult.bannerImageUrl] : [],
        total_supply: BigInt(totalNfts),
        royalty_bps: parseInt(formData.royaltyBps),
        mint_price: [BigInt(0)],
        metadata: [],
        chain_data: {
          Solana: {
            Compressed: {
              deployment_stage: { Deployed: null },
              merkle_tree_address: [merkleTreeSigner.publicKey.toString()],
              collection_mint: [collectionMintSigner.publicKey.toString()],
              manifest_url: [uploadResult.manifestUrl],
              authority: [publicKey.toString()],
            }
          }
        },
        socials: [socials],
        category: formData.category ? [categoryMap[formData.category]] : [],
        tags: [],
      })

      if ('Err' in createResult) {
        throw new Error(createResult.Err)
      }

      setFormData(prev => ({
        ...prev,
        collectionId: createResult.Ok,
        collectionMintAddress: collectionMintSigner.publicKey.toString(),
        merkleTreeAddress: merkleTreeSigner.publicKey.toString(),
      }))

      toast.success("Collection deployed successfully!")
      setDeploymentStep("Deployment complete!")
      setCurrentStep(4)

    } catch (error) {
      console.error("Deployment failed:", error)
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setDeploymentStep("")
    } finally {
      setIsDeploying(false)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.symbol && formData.description)
      case 2:
        return !!(formData.treeSize)
      case 3:
        return !!(collectionImage && nftAssets && nftAssets.length > 0)
      default:
        return true
    }
  }

  const progress = (currentStep / 4) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(saveStatus === "saving" || saveStatus === "saved") && (
        <div className="fixed top-20 right-6 z-50 bg-background border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          {saveStatus === "saving" ? (
            <>
              <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-sm text-muted-foreground">Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                All changes saved
                {lastSaved && ` - ${formatTime(lastSaved)}`}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Compressed NFTs</h1>
            <p className="text-sm text-muted-foreground">Ultra low-cost using Merkle trees</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                currentStep >= step
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              <span className="ml-2 text-sm hidden sm:inline">
                {step === 1 && 'Details'}
                {step === 2 && 'Tree Config'}
                {step === 3 && 'Assets'}
                {step === 4 && 'Deploy'}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Collection Details */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Details</CardTitle>
                <CardDescription>Basic information about your compressed NFT collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Collection Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Collection"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      placeholder="MAC"
                      maxLength={10}
                      value={formData.symbol}
                      onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your collection..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="royaltyBps">Royalty (basis points)</Label>
                  <Input
                    id="royaltyBps"
                    type="number"
                    placeholder="500"
                    value={formData.royaltyBps}
                    onChange={(e) => setFormData(prev => ({ ...prev, royaltyBps: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">500 = 5%, 1000 = 10%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="pfp">PFP</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="metaverse">Metaverse</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Social Links</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Website URL"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Twitter handle"
                        value={formData.twitter}
                        onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Discord invite"
                        value={formData.discord}
                        onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Telegram"
                        value={formData.telegram}
                        onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!validateStep(1)}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Tree Configuration */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Merkle Tree Configuration</CardTitle>
                <CardDescription>Choose the size of your Merkle tree based on your collection size</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium">Important: Tree size cannot be changed</p>
                      <p className="mt-1">The Merkle tree size determines the maximum number of NFTs you can mint. Choose a size that fits your collection with some room to grow.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Tree Size</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(TREE_CONFIGS).map(([key, config]) => (
                      <div
                        key={key}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          formData.treeSize === key
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'hover:border-muted-foreground'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, treeSize: key }))}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{key}</span>
                          <Badge variant="outline">{config.cost}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateStep(2)}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Assets Upload */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Assets</CardTitle>
                <CardDescription>Upload your collection image and NFT assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select
                    value={storageProvider}
                    onValueChange={(value: StorageProvider) => setStorageProvider(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nft-storage">NFT.Storage (IPFS)</SelectItem>
                      <SelectItem value="arweave">Arweave (Permanent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collection Image *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Collection" className="w-32 h-32 object-cover mx-auto rounded-lg" />
                      ) : (
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        className="mt-2"
                        onChange={(e) => handleImageUpload(e, 'collection')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banner Image</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {formData.bannerUrl ? (
                        <img src={formData.bannerUrl} alt="Banner" className="w-full h-20 object-cover rounded-lg" />
                      ) : (
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        className="mt-2"
                        onChange={(e) => handleImageUpload(e, 'banner')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>NFT Assets *</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your NFT images - all will be minted as cNFTs
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNftAssetsUpload}
                    />
                    {nftAssets && (
                      <p className="mt-2 text-sm text-green-600">
                        {nftAssets.length} files selected - all will be minted
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    disabled={!validateStep(3)}
                  >
                    Continue to Deploy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Deploy */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Deploy Collection</CardTitle>
                <CardDescription>Review and deploy your compressed NFT collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.merkleTreeAddress ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                      Deployment Successful!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                      {mintProgress.total} compressed NFTs have been minted!
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Merkle Tree: </span>
                        <a
                          href={`https://explorer.solana.com/address/${formData.merkleTreeAddress}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline inline-flex items-center gap-1"
                        >
                          {formData.merkleTreeAddress?.slice(0, 8)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Collection: </span>
                        <a
                          href={`https://explorer.solana.com/address/${formData.collectionMintAddress}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline inline-flex items-center gap-1"
                        >
                          {formData.collectionMintAddress?.slice(0, 8)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                    <Button className="mt-4" onClick={() => router.push('/nft/collections')}>
                      View My Collections
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">Summary</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{formData.name}</span>
                        <span className="text-muted-foreground">Symbol:</span>
                        <span>{formData.symbol}</span>
                        <span className="text-muted-foreground">NFTs to mint:</span>
                        <span>{nftAssets?.length || 0}</span>
                        <span className="text-muted-foreground">Tree Size:</span>
                        <span className="capitalize">{formData.treeSize}</span>
                        <span className="text-muted-foreground">Tree Cost:</span>
                        <span>{getTreeConfig().cost}</span>
                        <span className="text-muted-foreground">Royalty:</span>
                        <span>{parseInt(formData.royaltyBps) / 100}%</span>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <p className="font-medium">Ultra low cost minting</p>
                          <p className="mt-1">Each NFT costs ~0.00005 SOL to mint after tree creation!</p>
                        </div>
                      </div>
                    </div>

                    {deploymentStep && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{deploymentStep}</span>
                        </div>
                        {mintProgress.total > 0 && (
                          <Progress value={(mintProgress.current / mintProgress.total) * 100} className="h-2" />
                        )}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isDeploying}>
                        Back
                      </Button>
                      <Button
                        onClick={handleDeploy}
                        disabled={isDeploying || !connected}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isDeploying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Deploy & Mint All
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-green-500" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Collection preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <h3 className="font-semibold">{formData.name || "Collection Name"}</h3>
              <p className="text-sm text-muted-foreground">{formData.symbol || "SYMBOL"}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                {formData.description || "Collection description will appear here"}
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">cNFT</Badge>
                <Badge variant="outline">{nftAssets?.length || 0} items</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">cNFT Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>~99% lower mint costs</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Ideal for large collections (10k+)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Supported by major marketplaces</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>State compression technology</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
