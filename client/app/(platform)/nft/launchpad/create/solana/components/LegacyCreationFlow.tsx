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
import { Upload, Eye, CheckCircle, Info, Rocket, Check, Clock, Loader2, ExternalLink, Globe, Twitter, MessageCircle, Send, ArrowLeft } from "lucide-react"
import { saveDraft, loadDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import type { Socials, CollectionCategory } from "@/declarations/registry/registry.did"
import { uploadToStorage, StorageProvider } from "@/lib/storage"
import { toast } from "sonner"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  createNft,
  mplTokenMetadata,
  TokenStandard,
  fetchDigitalAsset,
} from "@metaplex-foundation/mpl-token-metadata"
import {
  create,
  addConfigLines,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine"
import {
  generateSigner,
  percentAmount,
  some,
  sol,
  dateTime,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi"
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
  // Social links
  website: string
  twitter: string
  discord: string
  telegram: string
  // Sale configuration
  saleStartDate: string
  saleStartTime: string
  saleEndDate: string
  saleEndTime: string
  hasEndTime: boolean
  publicStartDate: string
  publicStartTime: string
  hasWhitelistPhase: boolean
  // Internal state
  collectionId?: string
  manifestUrl?: string
  canisterRecordId?: string
  candyMachineAddress?: string
  collectionMintAddress?: string
}

type SaveStatus = "saving" | "saved" | "idle"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

interface LegacyCreationFlowProps {
  onBack: () => void
}

export default function LegacyCreationFlow({ onBack }: LegacyCreationFlowProps) {
  const router = useRouter()
  const { identity } = useAuth()
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet()

  const draftId = "solana-legacy-draft"
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
    mintPrice: "0.01",
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
    publicStartDate: "",
    publicStartTime: "",
    hasWhitelistPhase: false,
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
  }, [debouncedFormData, collectionImage, bannerImage, nftAssets, draftId, isLoading])

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
    { id: 1, title: "Collection", description: "Basic details & socials" },
    { id: 2, title: "Sale Config", description: "Pricing & timing" },
    { id: 3, title: "Assets", description: "Upload artwork" },
    { id: 4, title: "Deploy", description: "Deploy to Solana" },
  ]

  const CATEGORIES = [
    { value: "Art", label: "Art" },
    { value: "PFP", label: "PFP" },
    { value: "Gaming", label: "Gaming" },
    { value: "Music", label: "Music" },
    { value: "Photography", label: "Photography" },
    { value: "Utility", label: "Utility" },
    { value: "Metaverse", label: "Metaverse" },
    { value: "Other", label: "Other" },
  ]

  const validateSaleConfig = (): string | null => {
    if (!formData.saleStartDate || !formData.saleStartTime) {
      return "Sale start date and time are required"
    }

    const startTime = new Date(`${formData.saleStartDate}T${formData.saleStartTime}`).getTime()
    const now = Date.now()

    if (startTime < now) {
      return "Sale start time must be in the future"
    }

    if (formData.hasEndTime) {
      if (!formData.saleEndDate || !formData.saleEndTime) {
        return "End date and time are required when end time is enabled"
      }
      const endTime = new Date(`${formData.saleEndDate}T${formData.saleEndTime}`).getTime()
      if (endTime <= startTime) {
        return "End time must be after start time"
      }
    }

    if (formData.hasWhitelistPhase) {
      if (!formData.publicStartDate || !formData.publicStartTime) {
        return "Public start date and time are required when whitelist phase is enabled"
      }
      const publicTime = new Date(`${formData.publicStartDate}T${formData.publicStartTime}`).getTime()
      if (publicTime <= startTime) {
        return "Public start time must be after whitelist start time"
      }
      if (formData.hasEndTime) {
        const endTime = new Date(`${formData.saleEndDate}T${formData.saleEndTime}`).getTime()
        if (publicTime >= endTime) {
          return "Public start time must be before end time"
        }
      }
    }

    if (!formData.unlimitedSupply && (!formData.maxSupply || parseInt(formData.maxSupply) < 1)) {
      return "Supply must be at least 1"
    }

    if (!formData.mintPrice || parseFloat(formData.mintPrice) < 0) {
      return "Mint price must be 0 or greater"
    }

    return null
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        toast.error("Collection name is required")
        return
      }
      if (!formData.symbol.trim()) {
        toast.error("Symbol is required")
        return
      }
    }

    if (currentStep === 2) {
      const validationError = validateSaleConfig()
      if (validationError) {
        toast.error(validationError)
        return
      }
    }

    let manifestUrl = formData.manifestUrl
    if (currentStep === 3 && !manifestUrl) {
      try {
        manifestUrl = await handleStorageUpload()
      } catch (error) {
        console.error("Failed to upload:", error)
        return
      }
    }

    if (currentStep === 3 && manifestUrl && !formData.canisterRecordId) {
      try {
        setIsUploading(true)
        setUploadProgress("Creating collection record...")

        const actor = await getRegistryActor(identity)

        const socials: [] | [Socials] = (formData.website || formData.twitter || formData.discord || formData.telegram) ? [{
          website: formData.website ? [formData.website] : [],
          twitter: formData.twitter ? [formData.twitter] : [],
          discord: formData.discord ? [formData.discord] : [],
          telegram: formData.telegram ? [formData.telegram] : [],
        }] : []

        const category: [] | [CollectionCategory] = formData.category
          ? [{ [formData.category]: null } as CollectionCategory]
          : []

        const createResult = await actor.create_collection({
          blockchain: { Solana: null },
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image_url: formData.imageUrl,
          banner_url: formData.bannerUrl ? [formData.bannerUrl] : [],
          total_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
          royalty_bps: parseInt(formData.royaltyBps),
          mint_price: [BigInt(Math.floor(parseFloat(formData.mintPrice) * 1_000_000_000))],
          metadata: [],
          socials,
          category,
          tags: [],
          chain_data: {
            Solana: {
              deployment_stage: { FilesUploading: null },
              candy_machine_address: [],
              collection_mint: [],
              manifest_url: [manifestUrl],
              files_uploaded: true,
              metadata_created: false,
              candy_machine_items_uploaded: false,
              candy_machine_authority: [],
              candy_machine_config: [],
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

        await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)

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

    if (currentStep < 4) {
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

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerImage(file)
      const bannerUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, bannerUrl }))
    }
  }

  const handleDeployClick = async () => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) {
      toast.error("Please connect your Solana wallet")
      return
    }

    if (!formData.manifestUrl) {
      toast.error("Please upload assets first")
      return
    }

    if (!formData.canisterRecordId) {
      toast.error("Collection creation failed")
      return
    }

    try {
      setIsDeploying(true)

      // Step 1: Create UMI instance
      setDeploymentStep("Initializing...")
      const umi = createUmi(SOLANA_RPC_URL)
        .use(walletAdapterIdentity({ publicKey, signTransaction, signAllTransactions }))
        .use(mplTokenMetadata())
        .use(mplCandyMachine())

      const finalizedOptions = {
        send: { commitment: 'finalized' as const },
        confirm: { commitment: 'finalized' as const },
      }

      const confirmOptions = {
        send: { commitment: 'confirmed' as const },
        confirm: { commitment: 'confirmed' as const },
      }

      // Step 2: Generate signers
      setDeploymentStep("Generating keypairs...")
      const candyMachine = generateSigner(umi)
      const collectionMint = generateSigner(umi)

      console.log('Candy Machine:', candyMachine.publicKey.toString())
      console.log('Collection Mint:', collectionMint.publicKey.toString())

      // Step 3: Create Collection NFT
      setDeploymentStep("Creating Collection NFT...")
      await createNft(umi, {
        mint: collectionMint,
        authority: umi.identity,
        name: formData.name,
        uri: formData.manifestUrl,
        sellerFeeBasisPoints: percentAmount(parseFloat(formData.royaltyBps) / 100, 2),
        isCollection: true,
        collectionDetails: {
          __kind: 'V1',
          size: 0,
        },
      }).sendAndConfirm(umi, finalizedOptions)

      // Step 4: Verify collection exists
      setDeploymentStep("Verifying collection...")
      let retries = 5
      let collectionVerified = false
      while (retries > 0 && !collectionVerified) {
        try {
          await fetchDigitalAsset(umi, collectionMint.publicKey)
          collectionVerified = true
        } catch {
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }

      if (!collectionVerified) {
        throw new Error('Failed to verify collection NFT')
      }

      // Step 5: Create Candy Machine
      setDeploymentStep("Creating Candy Machine...")
      const itemsAvailable = Math.max(1, parseInt(formData.maxSupply || '1'))

      // Build start date for guards
      let startDateForGuard: Date
      if (formData.saleStartDate && formData.saleStartTime) {
        const parsed = new Date(`${formData.saleStartDate}T${formData.saleStartTime}`)
        startDateForGuard = isNaN(parsed.getTime()) ? new Date() : parsed
      } else {
        startDateForGuard = new Date()
      }

      // Build end date for guards (if configured)
      let endDateForGuard: Date | null = null
      if (formData.hasEndTime && formData.saleEndDate && formData.saleEndTime) {
        const parsed = new Date(`${formData.saleEndDate}T${formData.saleEndTime}`)
        if (!isNaN(parsed.getTime()) && parsed > startDateForGuard) {
          endDateForGuard = parsed
        }
      }

      console.log('Guard dates:', {
        startDate: startDateForGuard.toISOString(),
        endDate: endDateForGuard?.toISOString() || 'none',
      })

      const createBuilder = await create(umi, {
        candyMachine,
        collectionMint: collectionMint.publicKey,
        collectionUpdateAuthority: umi.identity,
        tokenStandard: TokenStandard.NonFungible,
        sellerFeeBasisPoints: percentAmount(parseFloat(formData.royaltyBps) / 100, 2),
        itemsAvailable: itemsAvailable,
        symbol: formData.symbol,
        maxEditionSupply: 0,
        isMutable: true,
        creators: [
          {
            address: umi.identity.publicKey,
            verified: true,
            percentageShare: 100,
          },
        ],
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
          ...(endDateForGuard ? {
            endDate: some({ date: dateTime(endDateForGuard.toISOString()) }),
          } : {}),
        },
      })

      const createResult = await createBuilder.sendAndConfirm(umi, confirmOptions)
      console.log('Candy Machine creation result:', createResult)
      console.log('Candy Machine created:', candyMachine.publicKey.toString())

      // Verify Candy Machine exists by fetching it
      setDeploymentStep("Verifying Candy Machine...")
      let verified = false
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const { fetchCandyMachine } = await import('@metaplex-foundation/mpl-candy-machine')
          const cmAccount = await fetchCandyMachine(umi, candyMachine.publicKey)
          console.log('Candy Machine verified:', cmAccount.publicKey.toString())
          verified = true
          break
        } catch (e) {
          console.log(`Attempt ${attempt + 1}: Candy Machine not ready yet...`)
        }
      }

      if (!verified) {
        throw new Error('Failed to verify Candy Machine creation after multiple attempts')
      }

      // Step 6: Insert config lines from manifest
      setDeploymentStep("Fetching NFT metadata...")
      const manifestResponse = await fetch(formData.manifestUrl)
      const manifestData = await manifestResponse.json()
      const files = manifestData.properties?.files || []

      if (files.length > 0) {
        setDeploymentStep("Inserting NFT items...")
        const items = files.map((file: any, index: number) => ({
          name: `${index}`,
          uri: file.uri,
        }))

        const BATCH_SIZE = 6
        const batches = []
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          batches.push(items.slice(i, i + BATCH_SIZE))
        }

        let currentIndex = 0
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]
          setDeploymentStep(`Inserting items ${currentIndex + 1}-${currentIndex + batch.length} of ${items.length}...`)

          const configLinesBuilder = addConfigLines(umi, {
            candyMachine: candyMachine.publicKey,
            index: currentIndex,
            configLines: batch,
          })

          await configLinesBuilder.sendAndConfirm(umi, confirmOptions)

          currentIndex += batch.length
        }
      }

      // Step 7: Update registry
      setDeploymentStep("Updating registry...")
      const actor = await getRegistryActor(identity)

      console.log('Updating registry with canisterRecordId:', formData.canisterRecordId)

      if (formData.canisterRecordId) {
        const goLiveDate = new Date(`${formData.saleStartDate}T${formData.saleStartTime}`)
        const goLiveDateMs = isNaN(goLiveDate.getTime()) ? Date.now() : goLiveDate.getTime()

        console.log('Registry update payload:', {
          collection_id: formData.canisterRecordId,
          candy_machine_address: candyMachine.publicKey.toString(),
          collection_mint: collectionMint.publicKey.toString(),
          go_live_date: goLiveDateMs,
        })

        const updateResult = await actor.update_solana_stage({
          collection_id: formData.canisterRecordId,
          stage: { Deployed: null },
          candy_machine_address: [candyMachine.publicKey.toString()],
          collection_mint: [collectionMint.publicKey.toString()],
          manifest_url: [formData.manifestUrl],
          files_uploaded: [true],
          metadata_created: [true],
          candy_machine_authority: [publicKey.toString()],
          candy_machine_config: [{
            price: BigInt(Math.floor(parseFloat(formData.mintPrice) * 1_000_000_000)),
            go_live_date: [BigInt(goLiveDateMs)],
            items_available: BigInt(itemsAvailable),
            seller_fee_basis_points: parseInt(formData.royaltyBps),
            symbol: formData.symbol,
          }],
        })

        console.log('Registry update result:', updateResult)

        if ('Err' in updateResult) {
          console.error('Failed to update registry:', updateResult.Err)
          toast.error('Failed to update registry', { description: updateResult.Err })
        } else {
          await actor.update_collection_status({
            collection_id: formData.canisterRecordId,
            status: { Active: null }
          })
        }
      } else {
        console.warn('No canisterRecordId found, skipping registry update')
      }

      // Save to form data
      const updatedFormData = {
        ...formData,
        candyMachineAddress: candyMachine.publicKey.toString(),
        collectionMintAddress: collectionMint.publicKey.toString(),
      }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)

      toast.success("Collection deployed successfully!", {
        description: `Candy Machine: ${candyMachine.publicKey.toString().slice(0, 8)}...`,
      })

      // Redirect to manage page
      router.push(`/nft/collections/solana/manage/${formData.canisterRecordId}`)

    } catch (error: any) {
      console.error('Deployment failed:', error)
      toast.error("Deployment failed", {
        description: error?.message || "Check console for details",
      })
    } finally {
      setIsDeploying(false)
      setDeploymentStep("")
    }
  }

  const handleStorageUpload = async () => {
    if (!collectionImage || !nftAssets) {
      toast.error("Please select collection image and NFT assets")
      return
    }

    try {
      setIsUploading(true)
      const totalFiles = nftAssets.length + 1
      setTotalUploadCount(totalFiles)
      setUploadedCount(0)
      setUploadProgress("Uploading collection image...")

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
        (uploaded: number, total: number) => {
          setUploadedCount(uploaded)
          setTotalUploadCount(total)
          setUploadProgress(`Uploading file ${uploaded} of ${total}...`)
        },
        storageProvider === "nft-storage" ? process.env.NEXT_PUBLIC_PINATA_JWT : undefined,
        bannerImage || undefined
      )

      const { collectionImageUrl, bannerImageUrl, manifestUrl } = result

      const updatedFormData = {
        ...formData,
        imageUrl: collectionImageUrl,
        bannerUrl: bannerImageUrl || formData.bannerUrl,
        manifestUrl: manifestUrl
      }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)

      setUploadedCount(totalFiles)
      setUploadProgress("Upload complete!")
      toast.success(`${totalFiles} files uploaded successfully`)
      return manifestUrl
    } catch (error) {
      console.error("Storage upload failed:", error)
      toast.error("Upload failed", { description: error instanceof Error ? error.message : "Please try again" })
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress("")
      setUploadedCount(0)
      setTotalUploadCount(0)
    }
  }

  const progress = (currentStep / 4) * 100

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
        <div>
          <h1 className="text-2xl font-bold">NFT (Legacy)</h1>
          <p className="text-sm text-muted-foreground">Candy Machine V3 + Token Metadata</p>
        </div>
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
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Solana Collection"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="MSC"
                        maxLength={10}
                        value={formData.symbol}
                        onChange={(e) => handleInputChange("symbol", e.target.value.toUpperCase())}
                      />
                      <p className="text-xs text-muted-foreground">Max 10 characters</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your NFT collection..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>Social Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://yourwebsite.com"
                            className="pl-10"
                            value={formData.website}
                            onChange={(e) => handleInputChange("website", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://twitter.com/username"
                            className="pl-10"
                            value={formData.twitter}
                            onChange={(e) => handleInputChange("twitter", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://discord.gg/invite"
                            className="pl-10"
                            value={formData.discord}
                            onChange={(e) => handleInputChange("discord", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://t.me/groupname"
                            className="pl-10"
                            value={formData.telegram}
                            onChange={(e) => handleInputChange("telegram", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxSupply">Supply *</Label>
                      <Input
                        id="maxSupply"
                        type="number"
                        min="1"
                        placeholder="10000"
                        value={formData.maxSupply}
                        onChange={(e) => handleInputChange("maxSupply", e.target.value)}
                        disabled={formData.unlimitedSupply}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="unlimitedSupply"
                          checked={formData.unlimitedSupply}
                          onCheckedChange={(checked) => handleInputChange("unlimitedSupply", checked as boolean)}
                        />
                        <Label htmlFor="unlimitedSupply" className="cursor-pointer text-sm text-muted-foreground">Unlimited supply</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mintPrice">Mint Price (SOL) *</Label>
                      <Input
                        id="mintPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.01"
                        value={formData.mintPrice}
                        onChange={(e) => handleInputChange("mintPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="royaltyBps">Royalty Percentage</Label>
                      <Input
                        id="royaltyBps"
                        type="number"
                        min="0"
                        max="1000"
                        placeholder="500"
                        value={formData.royaltyBps}
                        onChange={(e) => handleInputChange("royaltyBps", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Basis points (500 = 5%)</p>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-medium">Sale Schedule</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Input
                          type="date"
                          value={formData.saleStartDate}
                          onChange={(e) => handleInputChange("saleStartDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time *</Label>
                        <Input
                          type="time"
                          value={formData.saleStartTime}
                          onChange={(e) => handleInputChange("saleStartTime", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasEndTime"
                        checked={formData.hasEndTime}
                        onCheckedChange={(checked) => handleInputChange("hasEndTime", checked as boolean)}
                      />
                      <Label htmlFor="hasEndTime" className="cursor-pointer">Set end time</Label>
                    </div>

                    {formData.hasEndTime && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={formData.saleEndDate}
                            onChange={(e) => handleInputChange("saleEndDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={formData.saleEndTime}
                            onChange={(e) => handleInputChange("saleEndTime", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasWhitelistPhase"
                        checked={formData.hasWhitelistPhase}
                        onCheckedChange={(checked) => handleInputChange("hasWhitelistPhase", checked as boolean)}
                      />
                      <Label htmlFor="hasWhitelistPhase" className="cursor-pointer">Enable whitelist phase</Label>
                    </div>

                    {formData.hasWhitelistPhase && (
                      <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Whitelist starts at the sale start time. Set when public minting begins:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Public Start Date</Label>
                            <Input
                              type="date"
                              value={formData.publicStartDate}
                              onChange={(e) => handleInputChange("publicStartDate", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Public Start Time</Label>
                            <Input
                              type="time"
                              value={formData.publicStartTime}
                              onChange={(e) => handleInputChange("publicStartTime", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Collection Image *</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        {collectionImage ? (
                          <div className="space-y-2">
                            <div className="mx-auto w-32 h-32 rounded-lg overflow-hidden">
                              <img src={formData.imageUrl} alt="Collection" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-xs truncate">{collectionImage.name}</p>
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
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">Square logo</p>
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
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Banner Image</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        {bannerImage ? (
                          <div className="space-y-2">
                            <div className="mx-auto w-full h-20 rounded-lg overflow-hidden">
                              <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-xs truncate">{bannerImage.name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBannerImage(null)
                                setFormData((prev) => ({ ...prev, bannerUrl: "" }))
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">Wide banner (3:1)</p>
                            <input
                              type="file"
                              id="bannerImage"
                              accept="image/png,image/jpeg,image/gif"
                              className="hidden"
                              onChange={handleBannerImageChange}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById("bannerImage")?.click()}
                            >
                              Choose File
                            </Button>
                          </>
                        )}
                      </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNftAssets(null)}
                          >
                            Remove
                          </Button>
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
                            Files Uploaded
                          </div>
                          <div className="text-green-700 dark:text-green-200 mb-2">
                            Your collection files have been uploaded to IPFS.
                          </div>
                          <a
                            href={formData.manifestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline break-all flex items-center gap-1"
                          >
                            View Manifest <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {uploadProgress}
                        </div>
                      </div>
                      {totalUploadCount > 0 && (
                        <div className="space-y-1">
                          <Progress value={(uploadedCount / totalUploadCount) * 100} className="h-2" />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {uploadedCount} of {totalUploadCount} files uploaded
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Solana Wallet</div>
                      <div className="text-sm text-muted-foreground">
                        {connected
                          ? `Connected: ${publicKey?.toString().slice(0, 8)}...${publicKey?.toString().slice(-4)}`
                          : "Not connected"}
                      </div>
                    </div>
                    {connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
                        Disconnected
                      </Badge>
                    )}
                  </div>

                  {/* Collection Summary */}
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
                        <span className="text-muted-foreground">Mint Price:</span>
                        <span className="font-medium">{formData.mintPrice} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Royalty:</span>
                        <span className="font-medium">
                          {Number(formData.royaltyBps) / 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deployment Progress */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Deployment Steps</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Files uploaded to IPFS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Registry record created</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.candyMachineAddress ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isDeploying ? (
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-purple-600" />
                        )}
                        <span className="text-sm font-medium">
                          {isDeploying ? deploymentStep : "Deploy Candy Machine"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {formData.candyMachineAddress && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-green-900 dark:text-green-100 mb-2">
                            Deployed Successfully!
                          </div>
                          <div className="space-y-1 text-green-700 dark:text-green-200">
                            <p className="font-mono text-xs break-all">
                              Candy Machine: {formData.candyMachineAddress}
                            </p>
                            <p className="font-mono text-xs break-all">
                              Collection: {formData.collectionMintAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!connected && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-900 dark:text-yellow-100">
                          Please connect your Solana wallet using the wallet button in the navigation bar to deploy your collection.
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
              disabled={currentStep === 1 || isUploading || isDeploying}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {currentStep === 3 ? (
                <>
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
                </>
              ) : currentStep < 4 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button
                  onClick={handleDeployClick}
                  disabled={isDeploying || !connected || !!formData.candyMachineAddress}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {deploymentStep || "Deploying..."}
                    </>
                  ) : formData.candyMachineAddress ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Deployed
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
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
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

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blockchain</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                    Solana
                  </Badge>
                </div>
                {formData.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{formData.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supply</span>
                  <span>{formData.unlimitedSupply ? "Unlimited" : formData.maxSupply || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mint Price</span>
                  <span>{formData.mintPrice || "0"} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Royalty</span>
                  <span>{Number(formData.royaltyBps) / 100 || "0"}%</span>
                </div>
                {formData.saleStartDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts</span>
                    <span>{new Date(`${formData.saleStartDate}T${formData.saleStartTime}`).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {(formData.website || formData.twitter || formData.discord || formData.telegram) && (
                <div className="flex gap-2 pt-2 border-t">
                  {formData.website && (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                  {formData.twitter && (
                    <a href={formData.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80">
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {formData.discord && (
                    <a href={formData.discord} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                  {formData.telegram && (
                    <a href={formData.telegram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-muted/80">
                      <Send className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
