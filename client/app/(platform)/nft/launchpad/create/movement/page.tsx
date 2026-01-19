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
import { Upload, Eye, CheckCircle, Info, Rocket, Check, Clock, Loader2 } from "lucide-react"
import { saveDraft, loadDraft, deleteDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { uploadToStorage, StorageProvider } from "@/lib/storage"
import { toast } from "sonner"
import { useMovementWallet } from "@/connect-wallet/hooks/useMovementWallet"
import { buildCreateCollectionPayload, getCollectionAddress } from "@/lib/movement/collection"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"
import AuthGuard from "@/components/auth-guard"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  imageUrl: string
  maxSupply: string
  unlimitedSupply: boolean
  royaltyBps: string
  collectionId?: string
  manifestUrl?: string
  canisterRecordId?: string
  collectionAddress?: string
}

type SaveStatus = "saving" | "saved" | "idle"

export default function CreateMovementCollectionPage() {
  const router = useRouter()
  const { identity } = useAuth()
  const { account, connected, connect, wallet, signAndSubmitTransaction } = useMovementWallet()

  const draftId = "movement-draft"
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    maxSupply: "10000",
    unlimitedSupply: false,
    royaltyBps: "500",
  })
  const [collectionImage, setCollectionImage] = useState<File | null>(null)
  const [nftAssets, setNftAssets] = useState<FileList | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("nft-storage")

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
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
        await handleStorageUpload()
      } catch (error) {
        console.error("Failed to upload:", error)
        return
      }
    }

    if (currentStep === 2 && formData.manifestUrl && !formData.canisterRecordId) {
      try {
        setIsUploading(true)
        setUploadProgress("Creating collection record...")

        const actor = await getRegistryActor(identity)

        const createResult = await actor.create_collection({
          blockchain: { Movement: null },
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image_url: formData.imageUrl,
          banner_url: [],
          total_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
          royalty_bps: parseInt(formData.royaltyBps),
          metadata: [
            ["unlimited_supply", formData.unlimitedSupply.toString()],
          ],
          chain_data: {
            Movement: {
              deployment_stage: { FilesUploaded: null },
              collection_address: [],
              collection_created: false,
              manifest_url: [formData.manifestUrl],
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

  const handleInputChange = (field: keyof CollectionFormData, value: string | boolean) => {
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
    if (!connected || !account) {
      toast.error("Please connect your Movement wallet")
      return
    }

    if (!formData.manifestUrl) {
      toast.error("Please upload your NFT files first")
      return
    }

    try {
      setIsDeploying(true)
      setDeploymentStep("Building transaction payload...")

      const maxSupply = formData.unlimitedSupply
        ? undefined
        : parseInt(formData.maxSupply) || 0;

      const royaltyBps = parseInt(formData.royaltyBps) || 0;
      const royaltyPercentage = royaltyBps / 100;

      if (!formData.name || !formData.manifestUrl) {
        throw new Error("Missing required fields: name and manifest URL");
      }

      const description = formData.description || `${formData.name} NFT Collection`;

      const payload = buildCreateCollectionPayload({
        creatorAddress: account.address,
        name: formData.name,
        symbol: formData.symbol,
        description,
        uri: formData.manifestUrl,
        maxSupply,
        royaltyPercentage,
        network: "testnet",
      })

      setDeploymentStep("Waiting for wallet approval...")

      const response = await signAndSubmitTransaction(payload)

      setDeploymentStep("Transaction submitted. Waiting for confirmation...")

      const aptosConfig = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: "https://testnet.movementnetwork.xyz/v1",
      })
      const aptos = new Aptos(aptosConfig)

      try {
        await aptos.waitForTransaction({
          transactionHash: response.hash,
        })
      } catch (waitError) {
        console.warn("Could not wait for transaction confirmation:", waitError)
      }

      const collectionAddr = await getCollectionAddress(
        account.address.toString(),
        formData.name,
        "testnet"
      )

      const updatedFormData = {
        ...formData,
        collectionAddress: collectionAddr,
      }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, nftAssets || undefined)

      toast.success("Collection deployed on-chain!")
      setDeploymentStep("")
    } catch (error) {
      console.error("Deployment failed:", error)
      toast.error("Failed to deploy collection", {
        description: error instanceof Error ? error.message : "Please try again"
      })
      setDeploymentStep("")
    } finally {
      setIsDeploying(false)
    }
  }

  const handleFinish = async () => {
    if (!formData.collectionAddress || !formData.canisterRecordId) {
      toast.error("Missing required data")
      return
    }

    setIsDeploying(true)
    setDeploymentStep("Updating registry...")

    try {
      const actor = await getRegistryActor(identity)

      const updateResult = await actor.update_movement_stage({
        collection_id: formData.canisterRecordId,
        stage: { Deployed: null },
        collection_created: [true],
        collection_address: [formData.collectionAddress],
        manifest_url: [],
      })

      if ('Err' in updateResult) {
        throw new Error(updateResult.Err)
      }

      setDeploymentStep("Activating collection...")
      await actor.update_collection_status({
        collection_id: formData.canisterRecordId,
        status: { Active: null },
      })

      await deleteDraft(draftId)
      toast.success("Collection published!")

      const collectionResult = await actor.get_collection(formData.canisterRecordId)
      if (!collectionResult[0]?.slug) {
        throw new Error("Failed to retrieve collection slug")
      }
      router.push(`/nft/collections/movement/manage/${collectionResult[0].slug}`)
    } catch (error: any) {
      console.error("Finish failed:", error)
      toast.error(`Failed to publish: ${error.message || 'Unknown error'}`)
      setDeploymentStep("")
    } finally {
      setIsDeploying(false)
    }
  }

  const handleStorageUpload = async () => {
    if (!collectionImage || !nftAssets) {
      console.error("Missing required data for upload")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress("Initializing upload...")

      setUploadProgress("Uploading collection image and NFT assets...")
      const result = await uploadToStorage(
        storageProvider,
        collectionImage,
        nftAssets,
        {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          supply: formData.unlimitedSupply ? 0 : parseInt(formData.maxSupply),
        },
        undefined,
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
      console.error("Storage upload failed:", error)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress("")
    }
  }

  const progress = (currentStep / 3) * 100

  return (
    <AuthGuard>
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

      <h1 className="text-2xl font-bold">Launch on Movement</h1>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep
                    ? "bg-emerald-600 text-white"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Movement Collection"
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
                        placeholder="MMC"
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

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="unlimitedSupply"
                        checked={formData.unlimitedSupply}
                        onCheckedChange={(checked) =>
                          handleInputChange("unlimitedSupply", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="unlimitedSupply"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Unlimited Supply
                      </Label>
                    </div>

                    {!formData.unlimitedSupply && (
                      <div className="space-y-2">
                        <Label htmlFor="maxSupply">Maximum Supply *</Label>
                        <Input
                          id="maxSupply"
                          type="number"
                          min="1"
                          max="1000000"
                          placeholder="10000"
                          value={formData.maxSupply}
                          onChange={(e) =>
                            handleInputChange("maxSupply", e.target.value)
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of NFTs in this collection
                        </p>
                      </div>
                    )}
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

                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">
                          Movement Collection
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-200">
                          Your collection will be deployed on Movement testnet using the
                          Aptos Digital Asset standard with metadata stored on IPFS
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
                        ? "1GB free IPFS storage via Pinata"
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
                            Upload your NFT images
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
                            Upload numbered images (0.png, 1.png, etc.)
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
                        <span className="font-medium">
                          {formData.unlimitedSupply ? "Unlimited" : formData.maxSupply}
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

                  {formData.collectionAddress && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-green-900 dark:text-green-100 mb-1">
                            Collection Deployed
                          </div>
                          <p className="font-mono text-xs break-all text-green-700 dark:text-green-300">
                            {formData.collectionAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="font-semibold">Deployment Steps</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Files uploaded to IPFS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Collection record created</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.collectionAddress ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isDeploying ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-emerald-600" />
                        )}
                        <span className="text-sm">
                          {formData.collectionAddress ? "Deployed to Movement" : isDeploying ? deploymentStep : "Deploy to Movement"}
                        </span>
                      </div>
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
                            Please connect your Movement wallet to deploy the collection
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onClick={formData.manifestUrl ? handleStorageUpload : handleNext}
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeployClick}
                    disabled={isDeploying || !connected || !!formData.collectionAddress}
                    variant={formData.collectionAddress ? "outline" : "default"}
                    className={!formData.collectionAddress ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  >
                    {isDeploying && !formData.collectionAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {deploymentStep || "Deploying..."}
                      </>
                    ) : formData.collectionAddress ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Deployed
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={isDeploying || !formData.collectionAddress}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isDeploying && formData.collectionAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Finish
                      </>
                    )}
                  </Button>
                </div>
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
              <div className="aspect-square bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
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
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                    Movement
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Standard:</span>
                  <span className="text-xs">Aptos Digital Asset</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Supply:</span>
                  <span>{formData.unlimitedSupply ? "Unlimited" : formData.maxSupply || "0"}</span>
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
    </div>
    </AuthGuard>
  )
}
