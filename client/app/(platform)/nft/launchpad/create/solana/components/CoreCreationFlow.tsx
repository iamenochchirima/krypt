"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, CheckCircle, Info, Rocket, Check, Clock, Loader2, ExternalLink, Globe, Twitter, MessageCircle, Send, ArrowLeft, Sparkles } from "lucide-react"
import { saveDraft, loadDraft, deleteDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import type { Socials, CollectionCategory, InitialSale } from "@/declarations/registry/registry.did"
import { uploadToStorage, StorageProvider } from "@/lib/storage"
import { toast } from "sonner"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplCore, createCollection, ruleSet } from "@metaplex-foundation/mpl-core"
import { mplCandyMachine as mplCoreCandyMachine, create as createCoreCandyMachine, addConfigLines, fetchCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine"
import { generateSigner, some, sol, dateTime, percentAmount } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  imageUrl: string
  bannerUrl: string
  maxSupply: string
  unlimitedSupply: boolean
  royaltyBps: string
  mintPrice: string
  category: string
  website: string
  twitter: string
  discord: string
  telegram: string
  saleStartDate: string
  saleStartTime: string
  saleEndDate: string
  saleEndTime: string
  hasEndTime: boolean
  collectionId?: string
  manifestUrl?: string
  canisterRecordId?: string
  collectionAddress?: string
  candyMachineAddress?: string
  nftMetadataUrls?: string[]
}

type SaveStatus = "saving" | "saved" | "idle"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

interface CoreCreationFlowProps {
  onBack: () => void
}

export default function CoreCreationFlow({ onBack }: CoreCreationFlowProps) {
  const router = useRouter()
  const { identity } = useAuth()
  const wallet = useWallet()
  const { publicKey, connected, signTransaction, signAllTransactions } = wallet

  const draftId = "solana-core-draft"
  const [currentStep, setCurrentStep] = useState(1)

  const getDefaultDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    }
  }

  const defaultDateTime = getDefaultDateTime()

  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    bannerUrl: "",
    maxSupply: "10000",
    unlimitedSupply: false,
    royaltyBps: "500",
    mintPrice: "0.005",
    category: "",
    website: "",
    twitter: "",
    discord: "",
    telegram: "",
    saleStartDate: defaultDateTime.date,
    saleStartTime: defaultDateTime.time,
    saleEndDate: "",
    saleEndTime: "",
    hasEndTime: false,
  })

  const [collectionImage, setCollectionImage] = useState<File | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [nftAssets, setNftAssets] = useState<FileList | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("nft-storage")

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalUploadCount, setTotalUploadCount] = useState(0)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState<string>("")

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
    }
  }

  const handleStorageUpload = async () => {
    if (!collectionImage || !nftAssets || nftAssets.length === 0) {
      toast.error("Please upload collection image and NFT assets")
      return
    }

    try {
      setIsUploading(true)
      const totalFiles = nftAssets.length + 1
      setTotalUploadCount(totalFiles)
      setUploadedCount(0)
      setUploadProgress("Uploading collection image...")

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
        (uploaded: number, total: number) => {
          setUploadedCount(uploaded)
          setTotalUploadCount(total)
          setUploadProgress(`Uploading file ${uploaded} of ${total}...`)
        },
        storageProvider === "nft-storage" ? process.env.NEXT_PUBLIC_PINATA_JWT : undefined,
        bannerImage || undefined,
        wallet
      )

      const updatedFormData = {
        ...formData,
        imageUrl: uploadResult.collectionImageUrl,
        bannerUrl: uploadResult.bannerImageUrl || formData.bannerUrl,
        manifestUrl: uploadResult.manifestUrl,
        nftMetadataUrls: uploadResult.nftMetadataUrls,
      }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)

      setUploadedCount(totalFiles)
      setUploadProgress("Upload complete!")
      toast.success(`${totalFiles} files uploaded successfully`)
      return uploadResult.manifestUrl
    } catch (error) {
      console.error("Storage upload failed:", error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress("")
      setUploadedCount(0)
      setTotalUploadCount(0)
    }
  }

  const handleNext = async () => {
    let manifestUrl = formData.manifestUrl
    if (currentStep === 3 && !manifestUrl) {
      try {
        manifestUrl = await handleStorageUpload()
      } catch (error) {
        return
      }
    }

    if (currentStep === 3 && manifestUrl && !formData.canisterRecordId) {
      if (!manifestUrl) {
        toast.error("Manifest URL is required")
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress("Creating collection record...")

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
          image_url: formData.imageUrl,
          banner_url: formData.bannerUrl ? [formData.bannerUrl] : [],
          total_supply: BigInt(formData.maxSupply),
          royalty_bps: parseInt(formData.royaltyBps),
          mint_price: [BigInt(Math.floor(parseFloat(formData.mintPrice) * 1e9))],
          metadata: [],
          chain_data: {
            Solana: {
              Core: {
                deployment_stage: { FilesUploading: null },
                collection_address: [],
                candy_machine_address: [],
                manifest_url: [manifestUrl],
                authority: publicKey ? [publicKey.toString()] : [],
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

        const canisterRecordId = createResult.Ok

        // Set initial sale data for launchpad
        const startDateTime = new Date(`${formData.saleStartDate}T${formData.saleStartTime}`)
        const startTimeNs = BigInt(startDateTime.getTime()) * BigInt(1000000)

        const initialSale: InitialSale = {
          start_time: startTimeNs,
          end_time: formData.hasEndTime && formData.saleEndDate && formData.saleEndTime
            ? [BigInt(new Date(`${formData.saleEndDate}T${formData.saleEndTime}`).getTime()) * BigInt(1000000)]
            : [],
          public_start_time: [],
          ended: false,
          config: {
            Solana: {
              sale_type: formData.unlimitedSupply ? { OpenEdition: null } : { FixedPrice: null }
            }
          }
        }

        await registryActor.update_initial_sale({
          collection_id: canisterRecordId,
          initial_sale: [initialSale]
        })

        const updatedFormData = { ...formData, manifestUrl, canisterRecordId, collectionId: canisterRecordId }
        setFormData(updatedFormData)
        await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)
      } catch (error) {
        console.error("Failed to create collection record:", error)
        toast.error("Failed to create collection record", {
          description: error instanceof Error ? error.message : "Please try again"
        })
        return
      } finally {
        setIsUploading(false)
        setUploadProgress("")
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleDeploy = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!formData.manifestUrl || !formData.canisterRecordId || !formData.nftMetadataUrls) {
      toast.error("Please upload assets and create collection record first")
      return
    }

    setIsDeploying(true)

    try {
      setDeploymentStep("Initializing...")
      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplCore())
        .use(mplCoreCandyMachine())
        .use(walletAdapterIdentity(wallet))

      const confirmOptions = {
        send: { commitment: 'confirmed' as const },
        confirm: { commitment: 'confirmed' as const },
      }

      const finalizedOptions = {
        send: { commitment: 'finalized' as const },
        confirm: { commitment: 'finalized' as const },
      }

      setDeploymentStep("Creating Core Collection...")
      const collectionSigner = generateSigner(umi)
      const candyMachineSigner = generateSigner(umi)

      const createCollectionTx = await createCollection(umi, {
        collection: collectionSigner,
        name: formData.name,
        uri: formData.imageUrl,
        plugins: [
          {
            type: 'Royalties',
            basisPoints: parseInt(formData.royaltyBps),
            creators: [{ address: umi.identity.publicKey, percentage: 100 }],
            ruleSet: ruleSet('None'),
          },
        ],
      })

      await createCollectionTx.sendAndConfirm(umi, finalizedOptions)
      toast.success("Core Collection created!")

      setDeploymentStep("Creating Core Candy Machine...")
      const itemsAvailable = formData.nftMetadataUrls!.length

      let startDateForGuard: Date
      if (formData.saleStartDate && formData.saleStartTime) {
        const parsed = new Date(`${formData.saleStartDate}T${formData.saleStartTime}`)
        startDateForGuard = isNaN(parsed.getTime()) ? new Date() : parsed
      } else {
        startDateForGuard = new Date()
      }

      let endDateForGuard: Date | null = null
      if (formData.hasEndTime && formData.saleEndDate && formData.saleEndTime) {
        const parsed = new Date(`${formData.saleEndDate}T${formData.saleEndTime}`)
        if (!isNaN(parsed.getTime()) && parsed > startDateForGuard) {
          endDateForGuard = parsed
        }
      }

      const createCmBuilder = await createCoreCandyMachine(umi, {
        candyMachine: candyMachineSigner,
        collection: collectionSigner.publicKey,
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: itemsAvailable,
        authority: umi.identity.publicKey,
        isMutable: true,
        configLineSettings: some({
          prefixName: '',
          nameLength: 32,
          prefixUri: '',
          uriLength: 200,
          isSequential: false,
        }),
        guards: {
          botTax: some({ lamports: sol(0.001), lastInstruction: true }),
          solPayment: some({
            lamports: sol(parseFloat(formData.mintPrice)),
            destination: umi.identity.publicKey,
          }),
          startDate: some({ date: dateTime(startDateForGuard.toISOString()) }),
          ...(endDateForGuard ? { endDate: some({ date: dateTime(endDateForGuard.toISOString()) }) } : {}),
        },
      })

      await createCmBuilder.sendAndConfirm(umi, confirmOptions)
      toast.success("Core Candy Machine created!")

      setDeploymentStep("Verifying Candy Machine...")
      let verified = false
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 3000))
          await fetchCandyMachine(umi, candyMachineSigner.publicKey)
          verified = true
          break
        } catch (e) {
          console.log(`Attempt ${attempt + 1}/10: Candy Machine not ready yet...`)
        }
      }

      if (!verified) {
        throw new Error('Failed to verify Candy Machine creation')
      }

      setDeploymentStep("Adding NFT items...")
      const items = formData.nftMetadataUrls!.map((uri, index) => ({
        name: `${formData.name} #${index + 1}`,
        uri: uri,
      }))

      const BATCH_SIZE = 6
      let currentIndex = 0
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE)
        setDeploymentStep(`Adding items ${currentIndex + 1}-${currentIndex + batch.length} of ${items.length}...`)

        const configLinesBuilder = addConfigLines(umi, {
          candyMachine: candyMachineSigner.publicKey,
          index: currentIndex,
          configLines: batch,
        })

        await configLinesBuilder.sendAndConfirm(umi, confirmOptions)
        currentIndex += batch.length
      }

      toast.success("All items added to Candy Machine!")

      const updatedFormData = {
        ...formData,
        collectionAddress: collectionSigner.publicKey.toString(),
        candyMachineAddress: candyMachineSigner.publicKey.toString(),
      }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)

      toast.success("Collection deployed on-chain!")
      setDeploymentStep("")
    } catch (error) {
      console.error("Deployment failed:", error)
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setDeploymentStep("")
    } finally {
      setIsDeploying(false)
    }
  }

  const handleFinish = async () => {
    if (!formData.collectionAddress || !formData.candyMachineAddress || !publicKey || !formData.canisterRecordId) {
      toast.error("Missing required data")
      return
    }

    setIsDeploying(true)
    setDeploymentStep("Updating registry...")

    try {
      const registryActor = await getRegistryActor(identity)

      const updateResult = await registryActor.update_solana_stage({
        collection_id: formData.canisterRecordId,
        update_data: {
          Core: {
            stage: { Deployed: null },
            collection_address: [formData.collectionAddress],
            candy_machine_address: [formData.candyMachineAddress],
            manifest_url: [],
            authority: [publicKey.toString()],
          }
        },
      })

      if ('Err' in updateResult) {
        throw new Error(updateResult.Err)
      }

      setDeploymentStep("Activating collection...")
      await registryActor.update_collection_status({
        collection_id: formData.canisterRecordId,
        status: { Active: null },
      })

      await deleteDraft(draftId)
      toast.success("Collection published!")

      const collectionResult = await registryActor.get_collection(formData.canisterRecordId)
      if (!collectionResult[0]?.slug) {
        throw new Error("Failed to retrieve collection slug")
      }
      router.push(`/nft/collections/solana/manage/${collectionResult[0].slug}`)
    } catch (error: any) {
      console.error("Finish failed:", error)
      toast.error(`Failed to publish: ${error.message || 'Unknown error'}`)
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
        return !!(formData.maxSupply && formData.mintPrice && formData.saleStartDate)
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
          <Sparkles className="h-6 w-6 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold">Metaplex Core</h1>
            <p className="text-sm text-muted-foreground">Next-gen NFT standard with plugins</p>
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
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              <span className="ml-2 text-sm hidden sm:inline">
                {step === 1 && 'Details'}
                {step === 2 && 'Sale Config'}
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
                <CardDescription>Basic information about your NFT collection</CardDescription>
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

          {/* Step 2: Sale Configuration */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Sale Configuration</CardTitle>
                <CardDescription>Set up your mint price and timing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxSupply">Max Supply *</Label>
                    <Input
                      id="maxSupply"
                      type="number"
                      placeholder="10000"
                      value={formData.maxSupply}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxSupply: e.target.value }))}
                      disabled={formData.unlimitedSupply}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mintPrice">Mint Price (SOL) *</Label>
                    <Input
                      id="mintPrice"
                      type="number"
                      step="0.001"
                      placeholder="0.005"
                      value={formData.mintPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, mintPrice: e.target.value }))}
                    />
                  </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.saleStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, saleStartDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Start Time *</Label>
                    <Input
                      type="time"
                      value={formData.saleStartTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, saleStartTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasEndTime"
                    checked={formData.hasEndTime}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasEndTime: !!checked }))}
                  />
                  <Label htmlFor="hasEndTime">Set end time for sale</Label>
                </div>

                {formData.hasEndTime && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sale End Date</Label>
                      <Input
                        type="date"
                        value={formData.saleEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, saleEndDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sale End Time</Label>
                      <Input
                        type="time"
                        value={formData.saleEndTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, saleEndTime: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

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
                      Upload your NFT images (numbered: 0.png, 1.png, etc.)
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNftAssetsUpload}
                    />
                    {nftAssets && (
                      <p className="mt-2 text-sm text-green-600">
                        {nftAssets.length} files selected
                      </p>
                    )}
                  </div>
                </div>

                {formData.manifestUrl && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-green-900 dark:text-green-100 mb-1">
                          Files Already Uploaded
                        </div>
                        <div className="text-green-700 dark:text-green-200 mb-2">
                          Your collection files have been uploaded. You can proceed to the next step or re-upload if needed.
                        </div>
                        <a
                          href={formData.manifestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline break-all"
                        >
                          View Manifest
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {uploadProgress}
                      </div>
                    </div>
                    {totalUploadCount > 0 && (
                      <div className="space-y-1">
                        <Progress value={(uploadedCount / totalUploadCount) * 100} className="h-2" />
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          {uploadedCount} of {totalUploadCount} files uploaded
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isUploading}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    {formData.manifestUrl && (
                      <Button onClick={handleNext} disabled={isUploading}>
                        Next
                      </Button>
                    )}
                    <Button
                      onClick={formData.manifestUrl ? handleStorageUpload : handleNext}
                      disabled={isUploading || !collectionImage || !nftAssets}
                      variant={formData.manifestUrl ? "outline" : "default"}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploadedCount > 0 ? `Uploading ${uploadedCount}/${totalUploadCount}...` : "Uploading..."}
                        </>
                      ) : formData.manifestUrl ? (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Re-upload
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Deploy */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Deploy Collection</CardTitle>
                <CardDescription>Review and deploy your Core NFT collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.name}</span>
                    <span className="text-muted-foreground">Symbol:</span>
                    <span>{formData.symbol}</span>
                    <span className="text-muted-foreground">Supply:</span>
                    <span>{formData.maxSupply}</span>
                    <span className="text-muted-foreground">Mint Price:</span>
                    <span>{formData.mintPrice} SOL</span>
                    <span className="text-muted-foreground">Royalty:</span>
                    <span>{parseInt(formData.royaltyBps) / 100}%</span>
                    <span className="text-muted-foreground">NFT Assets:</span>
                    <span>{formData.nftMetadataUrls?.length || nftAssets?.length || 0} files</span>
                  </div>
                </div>

                {formData.candyMachineAddress && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-green-900 dark:text-green-100 mb-2">
                          Collection Deployed
                        </div>
                        <div className="space-y-1 text-green-700 dark:text-green-200">
                          <p className="font-mono text-xs break-all">
                            Candy Machine: <a href={`https://explorer.solana.com/address/${formData.candyMachineAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{formData.candyMachineAddress.slice(0, 8)}...{formData.candyMachineAddress.slice(-6)}</a>
                          </p>
                          <p className="font-mono text-xs break-all">
                            Collection: <a href={`https://explorer.solana.com/address/${formData.collectionAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{formData.collectionAddress?.slice(0, 8)}...{formData.collectionAddress?.slice(-6)}</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Files uploaded to storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Collection record created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.candyMachineAddress ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : isDeploying ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-purple-600" />
                    )}
                    <span className="text-sm">
                      {formData.candyMachineAddress ? "Deployed to Solana" : isDeploying ? deploymentStep : "Deploy to Solana"}
                    </span>
                  </div>
                </div>

                {!connected && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Wallet Not Connected
                        </div>
                        <div className="text-yellow-700 dark:text-yellow-200">
                          Please connect your Solana wallet to deploy
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isDeploying}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeploy}
                      disabled={isDeploying || !connected || !!formData.candyMachineAddress}
                      variant={formData.candyMachineAddress ? "outline" : "default"}
                      className={!formData.candyMachineAddress ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                      {isDeploying && !formData.candyMachineAddress ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : formData.candyMachineAddress ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Deployed
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Deploy
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleFinish}
                      disabled={isDeploying || !formData.candyMachineAddress}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isDeploying && formData.candyMachineAddress ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
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
                <Badge variant="secondary">Core</Badge>
                <Badge variant="outline">{formData.maxSupply || "0"} items</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Core Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>~50% lower mint costs vs Legacy</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Built-in royalty enforcement</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Single account per NFT</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Plugin system for extensibility</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
