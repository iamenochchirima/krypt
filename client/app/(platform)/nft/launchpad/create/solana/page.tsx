"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Eye, CheckCircle, Info, Rocket, Check, Clock } from "lucide-react"
import { PreviewFilesModal } from "@/components/solana/PreviewFilesModal"
import { saveDraft, loadDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { PaymentModal } from "@/components/nft/PaymentModal"
import { useAuth } from "@/providers/auth-context"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import { uploadToStorage, StorageProvider } from "@/lib/storage"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "sonner"
import { createCollectionNFTInstruction, createCandyMachineInstruction, deployCandyMachineViaCanister } from "@/lib/solana/candyMachine"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  imageUrl: string
  supply: string
  mintPrice: string
  royaltyBps: string
  goLiveDate: string
  maxPerWallet: string
  whitelistEnabled: string
  collectionId?: string
  deploymentStage?: string
  manifestUrl?: string
  candyMachineAddress?: string
  canisterRecordId?: string 
}

type SaveStatus = "saving" | "saved" | "idle"

export default function CreateSolanaCollectionPage() {
  const router = useRouter()
  const { identity, usersActor } = useAuth()
  const { wallet, publicKey, connected } = useWallet()

  const draftId = "solana-draft"
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    supply: "10000",
    mintPrice: "0.1",
    royaltyBps: "500",
    goLiveDate: "",
    maxPerWallet: "10",
    whitelistEnabled: "false",
  })
  const [collectionImage, setCollectionImage] = useState<File | null>(null)
  const [nftAssets, setNftAssets] = useState<FileList | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("nft-storage")

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState<string>("")
  const debouncedFormData = useDebounce(formData, 1000)

  useEffect(() => {
    const autoSave = async () => {
      if (!isLoading && (formData.name || formData.symbol || formData.description)) {
        setSaveStatus("saving")
        try {
          await saveDraft(draftId, formData, collectionImage || undefined, nftAssets || undefined)
          setSaveStatus("saved")
          setLastSaved(Date.now())
        } catch (error) {
          console.error("Failed to save draft:", error)
          setSaveStatus("idle")
        }
      }
    }

    autoSave()
  }, [debouncedFormData, collectionImage, nftAssets, draftId, isLoading])

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

          if (saved.nftAssets) {
            const dataTransfer = new DataTransfer()
            saved.nftAssets.forEach((file: File) => dataTransfer.items.add(file))
            setNftAssets(dataTransfer.files)
          }

          setLastSaved(saved.lastUpdated)
          setSaveStatus("saved")
        }
      } catch (error) {
        console.error("Failed to load draft:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      loadSavedDraft()
    }
  }, [])

  useEffect(() => {
    if (identity && usersActor) {
      queryMarketplace()
    }
  }, [usersActor, identity])

  const queryMarketplace = async () => {

    const data = await usersActor?.get_users();
    console.log("Backend users :", data)
    const actor = await  getMarketplaceActor(identity)
    const res = await actor.get_user_collections(0, 0)
    console.log("Market res :", res)
  }

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }, [])

  const steps = [
    { id: 1, title: "Basic Info", description: "Collection details" },
    { id: 2, title: "Assets", description: "Upload artwork & metadata" },
    { id: 3, title: "Review", description: "Verify & deploy" },
  ]

  const handleNext = async () => {
    if (currentStep === 2 && !formData.manifestUrl) {
      try {
        await handleArweaveUpload()
      } catch (error) {
        console.error("Failed to upload:", error)
        return
      }
    }

    if (currentStep === 2 && formData.manifestUrl && !formData.canisterRecordId) {
      try {
        setIsUploading(true)
        setUploadProgress("Creating collection record...")

        const actor = await getMarketplaceActor(identity)

        const createResult = await actor.create_collection({
          blockchain: { Solana: null },
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image_url: formData.imageUrl,
          banner_url: [],
          total_supply: BigInt(formData.supply),
          royalty_bps: parseInt(formData.royaltyBps),
          metadata: [
            ["mint_price", formData.mintPrice || "0"],
            ["go_live_date", formData.goLiveDate || ""],
            ["max_per_wallet", formData.maxPerWallet || "10"],
            ["whitelist_enabled", formData.whitelistEnabled || "false"],
          ],
          chain_data: {
            Solana: {
              deployment_stage: { FilesUploaded: null },
              candy_machine_address: [],
              collection_mint: [],
              manifest_url: [formData.manifestUrl],
              files_uploaded: true,
              metadata_created: true,
              candy_machine_authority: [],
              candy_machine_config: [],
              candy_machine_items_uploaded: false,
            }
          }
        })

        if ('Err' in createResult) {
          throw new Error(createResult.Err)
        }

        const canisterRecordId = createResult.Ok

        const updatedFormData = {
          ...formData,
          canisterRecordId,
          collectionId: canisterRecordId,
          deploymentStage: "FilesUploaded"
        }
        setFormData(updatedFormData)

        await saveDraft(draftId, updatedFormData, collectionImage || undefined, nftAssets || undefined)

        console.log("Collection record created:", canisterRecordId)
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

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: keyof CollectionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCollectionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCollectionImage(file)
      const imageUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, imageUrl }))
    }
  }

  const handleNftAssetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setNftAssets(files)
    }
  }

  const handleDeployClick = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your Solana wallet", {
        description: "You need to connect your wallet to deploy the candy machine"
      })
      return
    }

    if (!formData.canisterRecordId) {
      toast.error("Collection record not found", {
        description: "Please go back and create the collection record first"
      })
      return
    }

    if (!formData.manifestUrl) {
      toast.error("Manifest URL not found", {
        description: "Please upload your NFT files first"
      })
      return
    }

    try {
      setIsDeploying(true)
      setDeploymentStep("Getting canister information...")

      const actor = await getMarketplaceActor(identity)

      setDeploymentStep("Fetching collection Solana accounts...")

      const collectionAccountsResult = await actor.get_collection_solana_accounts(formData.canisterRecordId)
      if ('Err' in collectionAccountsResult) {
        throw new Error(collectionAccountsResult.Err)
      }
      const collectionAccounts = collectionAccountsResult.Ok
      const canisterPayerAddress = collectionAccounts.payer_address
      const candyMachineAddress = collectionAccounts.candy_machine_address
      const collectionMintAddress = collectionAccounts.collection_mint?.[0]

      if (!collectionMintAddress) {
        throw new Error("Collection mint address not available from canister")
      }

      console.log("Deployment addresses:")
      console.log("  Canister Payer:", canisterPayerAddress)
      console.log("  Candy Machine:", candyMachineAddress)
      console.log("  Collection Mint:", collectionMintAddress)

      // STEP 1: Create Collection NFT (REQUIRED for Candy Machine V3)
      setDeploymentStep("Creating Collection NFT instruction...")

      const collectionNFTInstructions = await createCollectionNFTInstruction({
        name: formData.name,
        uri: formData.manifestUrl,
        royaltyBps: parseInt(formData.royaltyBps),
        collectionMintAddress,
        canisterPayerAddress,
        network: 'devnet',
      })

      setDeploymentStep("Creating Collection NFT via canister...")

      // Send Collection NFT creation to canister
      // IMPORTANT: This must use 'finalized' commitment
      const collectionTxResult = await actor.create_candy_machine_from_instruction(
        formData.canisterRecordId,
        collectionNFTInstructions.map(ix => ({
          program_id: ix.programId,
          accounts: ix.accounts.map(acc => ({
            pubkey: acc.pubkey,
            is_signer: acc.isSigner,
            is_writable: acc.isWritable,
          })),
          data: ix.data,
        }))
      )

      if ('Err' in collectionTxResult) {
        throw new Error(`Collection NFT creation failed: ${collectionTxResult.Err}`)
      }

      const collectionTxSignature = collectionTxResult.Ok
      console.log("Collection NFT created:", collectionTxSignature)

      // Wait a bit for the Collection NFT to be indexed
      setDeploymentStep("Waiting for Collection NFT to be indexed...")
      await new Promise(resolve => setTimeout(resolve, 3000))

      // STEP 2: Create Candy Machine V3
      setDeploymentStep("Building Candy Machine V3 instruction...")

      const candyMachineInstructions = await createCandyMachineInstruction({
        collectionId: formData.canisterRecordId,
        name: formData.name,
        symbol: formData.symbol,
        supply: parseInt(formData.supply),
        mintPrice: parseFloat(formData.mintPrice),
        goLiveDate: formData.goLiveDate,
        royaltyBps: parseInt(formData.royaltyBps),
        manifestUrl: formData.manifestUrl,
        canisterPayerAddress,
        candyMachineAddress,
        collectionMintAddress,
        network: 'devnet',
      })

      setDeploymentStep("Creating Candy Machine via canister...")

      // Send Candy Machine creation to canister
      const txSignature = await deployCandyMachineViaCanister(
        actor,
        formData.canisterRecordId,
        candyMachineInstructions
      )

      setDeploymentStep("Updating collection record...")

      // Update collection with candy machine address
      const updateResult = await actor.update_candy_machine_address(
        formData.canisterRecordId,
        candyMachineAddress
      )

      if ('Err' in updateResult) {
        throw new Error(updateResult.Err)
      }

      setDeploymentStep("Finalizing deployment...")

      // Remove the draft after successful deployment
      if (draftId) {
        localStorage.removeItem(`solana-collection-draft-${draftId}`)
      }

      toast.success("Candy Machine V3 deployed successfully!", {
        description: (
          <div className="space-y-1">
            <div>Collection NFT: {collectionTxSignature.slice(0, 8)}...{collectionTxSignature.slice(-8)}</div>
            <div>Candy Machine: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}</div>
          </div>
        ),
        duration: 7000,
      })

      setIsDeploying(false)
      setDeploymentStep("")

      // Navigate to collection management page
      setTimeout(() => {
        router.push(`/collections/solana/manage/${formData.canisterRecordId}`)
      }, 1000)
    } catch (error) {
      console.error("Deployment failed:", error)
      setIsDeploying(false)
      setDeploymentStep("")
      toast.error("Failed to deploy Candy Machine", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    }
  }

  const handleArweaveUpload = async () => {
    if (!collectionImage || !nftAssets) {
      console.error("Missing required data for upload")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress("Initializing upload...")
      console.log(`Using ${storageProvider} for upload...`)
      console.log("Wallet object:", wallet)
      console.log("Wallet adapter:", wallet?.adapter)
      console.log("Connected:", connected)
      console.log("PublicKey:", publicKey)

      if (storageProvider === "arweave" && !connected) {
        throw new Error("Please connect your Solana wallet first")
      }

      setUploadProgress("Uploading collection image and NFT assets...")
      const result = await uploadToStorage(
        storageProvider,
        collectionImage,
        nftAssets,
        {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          supply: parseInt(formData.supply),
        },
        storageProvider === "arweave" ? wallet?.adapter : undefined,
        storageProvider === "nft-storage" ? process.env.NEXT_PUBLIC_PINATA_JWT : undefined
      )

      const { collectionImageUrl, manifestUrl } = result

      const updatedFormData = {
        ...formData,
        imageUrl: collectionImageUrl,
        manifestUrl: manifestUrl
      }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, nftAssets || undefined)

      setUploadProgress("Upload complete!")
      console.log("Files uploaded. Manifest URL:", manifestUrl)
    } catch (error) {
      console.error("Arweave upload failed:", error)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress("")
    }
  }

  const handlePaymentSuccess = async (signature: string) => {
    console.log("Payment successful:", signature)
    setShowPaymentModal(false)

    try {
      if (!formData.canisterRecordId || !formData.manifestUrl) {
        console.error("Missing canister record ID or manifest URL")
        return
      }

      const actor = await getMarketplaceActor(identity)

      await actor.update_solana_stage({
        collection_id: formData.canisterRecordId,
        stage: { CandyMachineDeploying: null },
        manifest_url: [formData.manifestUrl],
        files_uploaded: [true],
        metadata_created: [true],
        candy_machine_address: [],
        collection_mint: [],
        candy_machine_authority: [],
        candy_machine_config: [],
      })

      setFormData(prev => ({
        ...prev,
        deploymentStage: "CandyMachineDeploying"
      }))

      console.log("Candy Machine deployment initiated")
    } catch (error) {
      console.error("Deployment failed:", error)
    }
  }

  const progress = (currentStep / 3) * 100

  return (
    <div className="container mx-auto px-4 py-24">
      {(saveStatus === "saving" || saveStatus === "saved") && (
        <div className="fixed top-20 right-6 z-50 bg-background border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          {saveStatus === "saving" ? (
            <>
              <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-sm text-muted-foreground">Saving…</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                All changes saved
                {lastSaved && ` • ${formatTime(lastSaved)}`}
              </span>
            </>
          )}
        </div>
      )}

      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-4">
          Create Solana NFT Collection
        </h1>
        <p className="text-lg text-muted-foreground">
          Launch your Solana NFT collection with permanent Arweave storage
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep
                    ? "bg-purple-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
              {step.id < 3 && (
                <div className="w-12 h-px bg-muted mx-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {steps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nftStandard">NFT Standard *</Label>
                    <Select defaultValue="metaplex">
                      <SelectTrigger>
                        <SelectValue placeholder="Select NFT standard" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metaplex">
                          <div className="flex items-center justify-between w-full">
                            <span>Metaplex Token Metadata</span>
                            <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                              Most Common
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="pnft" disabled>
                          <div className="flex items-center justify-between w-full opacity-50">
                            <span>Programmable NFTs (pNFTs)</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="cnft" disabled>
                          <div className="flex items-center justify-between w-full opacity-50">
                            <span>Compressed NFTs (cNFTs)</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="core" disabled>
                          <div className="flex items-center justify-between w-full opacity-50">
                            <span>Core NFTs</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Metaplex Token Metadata is the most widely supported standard across wallets and marketplaces
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Solana Collection"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="MSC"
                        maxLength={10}
                        value={formData.symbol}
                        onChange={(e) =>
                          handleInputChange("symbol", e.target.value.toUpperCase())
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Max 10 characters
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your NFT collection..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply">Total Supply *</Label>
                      <Input
                        id="supply"
                        type="number"
                        min="1"
                        max="50000"
                        placeholder="10000"
                        value={formData.supply}
                        onChange={(e) =>
                          handleInputChange("supply", e.target.value)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Max 50,000 NFTs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mintPrice">Mint Price (SOL) *</Label>
                      <Input
                        id="mintPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.1"
                        value={formData.mintPrice}
                        onChange={(e) =>
                          handleInputChange("mintPrice", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="royaltyBps">Royalty Percentage</Label>
                    <Input
                      id="royaltyBps"
                      type="number"
                      min="0"
                      max="1000"
                      placeholder="500"
                      value={formData.royaltyBps}
                      onChange={(e) =>
                        handleInputChange("royaltyBps", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter basis points (500 = 5%, max 10%)
                    </p>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Candy Machine Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="goLiveDate">Go Live Date & Time</Label>
                        <Input
                          id="goLiveDate"
                          type="datetime-local"
                          value={formData.goLiveDate}
                          onChange={(e) => handleInputChange("goLiveDate", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          When minting will start
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxPerWallet">Max Per Wallet</Label>
                        <Input
                          id="maxPerWallet"
                          type="number"
                          min="1"
                          max="100"
                          placeholder="10"
                          value={formData.maxPerWallet}
                          onChange={(e) => handleInputChange("maxPerWallet", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Limit per wallet address
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="whitelistEnabled"
                          type="checkbox"
                          checked={formData.whitelistEnabled === "true"}
                          onChange={(e) => handleInputChange("whitelistEnabled", e.target.checked.toString())}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="whitelistEnabled" className="cursor-pointer">
                          Enable Whitelist
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Only whitelisted wallets can mint
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Solana Collection
                        </div>
                        <div className="text-blue-700 dark:text-blue-200">
                          Your collection will be deployed on Solana with
                          metadata stored permanently on Arweave
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Storage Provider</Label>
                    <Select value={storageProvider} onValueChange={(value) => setStorageProvider(value as StorageProvider)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nft-storage">
                          <div className="flex items-center justify-between w-full">
                            <span>Pinata (IPFS)</span>
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
                              1GB Free
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="arweave">
                          <div className="flex items-center justify-between w-full">
                            <span>Arweave (Irys)</span>
                            <Badge variant="secondary" className="ml-2">
                              Permanent
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {storageProvider === "nft-storage"
                        ? "1GB free IPFS storage via Pinata (more available)"
                        : "Permanent Arweave storage (~$0.01/MB)"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>Collection Image</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      {collectionImage ? (
                        <div className="space-y-4">
                          <div className="mx-auto w-48 h-48 rounded-lg overflow-hidden">
                            <img
                              src={formData.imageUrl}
                              alt="Collection preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium">{collectionImage.name}</p>
                          {formData.imageUrl?.startsWith("https://gateway.pinata.cloud") && (
                            <Badge variant="secondary" className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Uploaded to IPFS
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCollectionImage(null)
                              setFormData((prev) => ({ ...prev, imageUrl: "" }))
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <div className="text-sm text-muted-foreground mb-2">
                            Upload collection logo/banner
                          </div>
                          <input
                            type="file"
                            id="collectionImage"
                            accept="image/png,image/jpeg,image/gif"
                            className="hidden"
                            onChange={handleCollectionImageChange}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("collectionImage")?.click()}
                          >
                            Choose File
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>NFT Assets</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      {nftAssets && nftAssets.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">
                                {nftAssets.length} file{nftAssets.length > 1 ? "s" : ""} selected
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(Array.from(nftAssets).reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB total
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <PreviewFilesModal files={nftAssets} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNftAssets(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <div className="text-sm text-muted-foreground mb-2">
                            Upload your NFT images and metadata
                          </div>
                          <input
                            type="file"
                            id="nftAssets"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleNftAssetsChange}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("nftAssets")?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Upload a folder with numbered images (0.png, 1.png,
                            etc.)
                          </p>
                        </>
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
                            Your collection files have been uploaded to IPFS. You can proceed to the next step or re-upload if needed.
                          </div>
                          <a
                            href={formData.manifestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline break-all"
                          >
                            View Manifest: {formData.manifestUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                          {storageProvider === "arweave" ? "Arweave Storage" : "Pinata IPFS Storage"}
                        </div>
                        <div className="text-purple-700 dark:text-purple-200">
                          {storageProvider === "arweave"
                            ? "All assets will be uploaded to Arweave for permanent, decentralized storage. Estimated cost: ~$5-8 for 1GB"
                            : "IPFS storage via Pinata. 1GB free tier, files remain available as long as pinned."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isUploading && uploadProgress && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-blue-600 animate-spin" />
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {uploadProgress}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Rocket className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">
                      Ready to Deploy!
                    </h3>
                    <p className="text-muted-foreground">
                      Review your collection and deploy to Solana
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Collection Summary</h4>
                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Symbol:</span>
                        <span className="font-medium">{formData.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supply:</span>
                        <span className="font-medium">{formData.supply}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Mint Price:
                        </span>
                        <span className="font-medium">
                          {formData.mintPrice} SOL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Royalty:</span>
                        <span className="font-medium">
                          {Number(formData.royaltyBps) / 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Deployment Steps</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Files uploaded to {storageProvider === "arweave" ? "Arweave" : "IPFS"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Collection record created</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-purple-600" />
                        </div>
                        <span className="text-sm font-medium">Deploy Candy Machine on Solana</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isUploading}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {currentStep === 2 ? (
                <>
                  {formData.manifestUrl && (
                    <Button onClick={handleNext} disabled={isUploading}>
                      Next
                    </Button>
                  )}
                  <Button
                    onClick={formData.manifestUrl ? handleArweaveUpload : handleNext}
                    disabled={isUploading}
                    variant={formData.manifestUrl ? "outline" : "default"}
                  >
                    {isUploading ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
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
                </>
              ) : currentStep < 3 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button
                  onClick={handleDeployClick}
                  disabled={isDeploying || !connected}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isDeploying ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      {deploymentStep || "Deploying..."}
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Deploy Collection
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Collection"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-white" />
                )}
              </div>

              <div>
                <h3 className="font-semibold">
                  {formData.name || "Collection Name"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.symbol || "SYMBOL"}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {formData.description ||
                  "Collection description will appear here..."}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Blockchain:</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                    Solana
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Standard:</span>
                  <span className="text-xs">Metaplex</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Supply:</span>
                  <span>{formData.supply || "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mint Price:</span>
                  <span>{formData.mintPrice || "0"} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Royalty:</span>
                  <span>{Number(formData.royaltyBps) / 100 || "0"}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        collectionName={formData.name || "Your Collection"}
      />
    </div>
  )
}
