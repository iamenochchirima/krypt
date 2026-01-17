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
import { saveDraft, loadDraft, deleteDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import type { Socials, CollectionCategory } from "@/declarations/registry/registry.did"
import { uploadToStorage, StorageProvider } from "@/lib/storage"
import { toast } from "sonner"
import { useAccount, useChainId, useSwitchChain, useWalletClient, usePublicClient } from "wagmi"
import { supportedChains } from "@/providers/eth/wagmi/wagmi.config"

interface DropFormData {
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
  selectedChainId: number
  collectionId?: string
  manifestUrl?: string
  canisterRecordId?: string
  contractAddress?: string
}

type SaveStatus = "saving" | "saved" | "idle"

interface DropCreationFlowProps {
  onBack: () => void
}

export default function DropCreationFlow({ onBack }: DropCreationFlowProps) {
  const router = useRouter()
  const { identity } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const draftId = "ethereum-drop-draft"
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

  const [formData, setFormData] = useState<DropFormData>({
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
    selectedChainId: 11155111,
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
  const [registryUpdateFailed, setRegistryUpdateFailed] = useState(false)
  const debouncedFormData = useDebounce(formData, 1000)

  const selectedChain = supportedChains.find(c => c.id === formData.selectedChainId)

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
          if (saved.formData.contractAddress) {
            setRegistryUpdateFailed(true)
            setCurrentStep(4)
          }
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
    { id: 1, title: "Details", description: "Name & socials" },
    { id: 2, title: "Config", description: "Price & supply" },
    { id: 3, title: "Assets", description: "Upload NFTs" },
    { id: 4, title: "Deploy", description: "Launch" },
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

  const handleInputChange = (field: keyof DropFormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCollectionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCollectionImage(file)
      setFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }))
    }
  }

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerImage(file)
      setFormData((prev) => ({ ...prev, bannerUrl: URL.createObjectURL(file) }))
    }
  }

  const handleNftAssetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setNftAssets(files)
    }
  }

  const handleChainSwitch = async (newChainId: number) => {
    handleInputChange("selectedChainId", newChainId)
    if (isConnected && chainId !== newChainId) {
      try {
        switchChain({ chainId: newChainId })
      } catch (error) {
        console.error("Failed to switch chain:", error)
      }
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

    let manifestUrl = formData.manifestUrl
    if (currentStep === 3 && !manifestUrl) {
      try {
        manifestUrl = await handleStorageUpload()
      } catch (error) {
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
          blockchain: { Ethereum: null },
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image_url: formData.imageUrl,
          banner_url: formData.bannerUrl ? [formData.bannerUrl] : [],
          total_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
          royalty_bps: parseInt(formData.royaltyBps),
          mint_price: [BigInt(Math.floor(parseFloat(formData.mintPrice) * 1e18))],
          metadata: [],
          socials,
          category,
          tags: [],
          chain_data: {
            Ethereum: {
              deployment_stage: { FilesUploading: null },
              contract_type: { ERC721: null },
              contract_address: [],
              chain_id: BigInt(formData.selectedChainId),
              chain_name: selectedChain?.name || "Unknown",
              owner_address: address ? [address] : [],
              manifest_url: [manifestUrl],
              files_uploaded: true,
              mint_price_wei: [BigInt(Math.floor(parseFloat(formData.mintPrice) * 1e18))],
              max_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
            }
          }
        })

        if ('Err' in createResult) {
          throw new Error(createResult.Err)
        }

        const canisterRecordId = createResult.Ok
        const updatedFormData = { ...formData, canisterRecordId, collectionId: canisterRecordId }
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

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDeployClick = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your EVM wallet")
      return
    }
    if (!walletClient) {
      toast.error("Wallet client not available")
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
    if (chainId !== formData.selectedChainId) {
      toast.error(`Please switch to ${selectedChain?.name}`)
      try {
        switchChain({ chainId: formData.selectedChainId })
      } catch (error) {
        console.error("Failed to switch chain:", error)
      }
      return
    }

    try {
      setIsDeploying(true)
      setDeploymentStep("Preparing contract deployment...")

      if (!publicClient) {
        throw new Error("Public client not available")
      }

      setDeploymentStep("Deploying ERC-721 contract...")

      const { NFT_CONTRACT_ABI, NFT_CONTRACT_BYTECODE } = await import("@/lib/contracts/SimpleNFT")
      const hash = await walletClient.deployContract({
        abi: NFT_CONTRACT_ABI,
        bytecode: NFT_CONTRACT_BYTECODE,
        args: [
          formData.name,
          formData.symbol,
          formData.manifestUrl || "",
          BigInt(formData.unlimitedSupply ? 0 : formData.maxSupply),
          BigInt(Math.floor(parseFloat(formData.mintPrice) * 1e18)),
          BigInt(parseInt(formData.royaltyBps)),
          address,
        ],
      })

      setDeploymentStep("Waiting for confirmation...")
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const contractAddress = receipt.contractAddress

      if (!contractAddress) {
        throw new Error("Contract deployment failed - no address returned")
      }

      const updatedFormData = { ...formData, contractAddress }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, collectionImage || undefined, bannerImage || undefined, nftAssets || undefined)

      toast.success("Contract deployed on-chain!", {
        description: `Contract: ${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}`,
      })

      setDeploymentStep("Updating registry...")
      try {
        const actor = await getRegistryActor(identity)

        const updateResult = await actor.update_ethereum_stage({
          collection_id: formData.canisterRecordId,
          stage: { Deployed: null },
          contract_address: [contractAddress],
          owner_address: [address],
          manifest_url: [formData.manifestUrl],
          files_uploaded: [true],
        })

        if ('Err' in updateResult) {
          console.error('Failed to update registry:', updateResult.Err)
          setRegistryUpdateFailed(true)
          toast.error("Registry update failed", { description: "Contract deployed but registry not updated. Click retry." })
        } else {
          await actor.update_collection_status({
            collection_id: formData.canisterRecordId,
            status: { Active: null }
          })
          await deleteDraft(draftId)
          setRegistryUpdateFailed(false)
          toast.success("Collection registered successfully!")
        }
      } catch (registryError) {
        console.error('Registry update error:', registryError)
        setRegistryUpdateFailed(true)
        toast.error("Registry update failed", { description: "Contract deployed but registry not updated. Click retry." })
      }

      toast.success("NFT Collection Deployed!", {
        description: `Contract: ${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}`,
        action: {
          label: "View",
          onClick: () => {
            window.open(getExplorerUrl(formData.selectedChainId, contractAddress), "_blank")
          }
        }
      })
    } catch (error: any) {
      console.error('Deployment failed:', error)
      toast.error("Deployment failed", { description: error?.message || "Check console for details" })
    } finally {
      setIsDeploying(false)
      setDeploymentStep("")
    }
  }

  const handleRetryRegistryUpdate = async () => {
    if (!formData.contractAddress || !address) {
      toast.error("Missing required data for retry")
      return
    }

    setIsDeploying(true)
    setDeploymentStep("Creating collection record...")

    try {
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
        blockchain: { Ethereum: null },
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image_url: formData.imageUrl,
        banner_url: formData.bannerUrl ? [formData.bannerUrl] : [],
        total_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
        royalty_bps: parseInt(formData.royaltyBps),
        mint_price: [BigInt(Math.floor(parseFloat(formData.mintPrice) * 1e18))],
        metadata: [],
        socials,
        category,
        tags: [],
        chain_data: {
          Ethereum: {
            deployment_stage: { Deployed: null },
            contract_type: { ERC721: null },
            contract_address: [formData.contractAddress],
            chain_id: BigInt(formData.selectedChainId),
            chain_name: selectedChain?.name || "Unknown",
            owner_address: [address],
            manifest_url: formData.manifestUrl ? [formData.manifestUrl] : [],
            files_uploaded: true,
            mint_price_wei: [BigInt(Math.floor(parseFloat(formData.mintPrice) * 1e18))],
            max_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
          }
        }
      })

      if ('Err' in createResult) {
        console.error('Failed to create collection:', createResult.Err)
        toast.error("Failed to create collection", { description: createResult.Err })
        return
      }

      const newRecordId = createResult.Ok
      setDeploymentStep("Setting collection active...")

      await actor.update_collection_status({
        collection_id: newRecordId,
        status: { Active: null }
      })

      const updatedFormData = { ...formData, canisterRecordId: newRecordId, collectionId: newRecordId }
      setFormData(updatedFormData)
      await deleteDraft(draftId)
      setRegistryUpdateFailed(false)
      toast.success("Collection registered successfully!")
      router.push(`/nft/collections/ethereum/manage/${newRecordId}`)
    } catch (error: any) {
      console.error('Registry error:', error)
      toast.error("Registry failed", { description: error?.message || "Check console for details" })
    } finally {
      setIsDeploying(false)
      setDeploymentStep("")
    }
  }

  const getExplorerUrl = (chainId: number, address: string) => {
    switch (chainId) {
      case 1: return `https://etherscan.io/address/${address}`
      case 8453: return `https://basescan.org/address/${address}`
      case 137: return `https://polygonscan.com/address/${address}`
      case 42161: return `https://arbiscan.io/address/${address}`
      case 11155111: return `https://sepolia.etherscan.io/address/${address}`
      case 84532: return `https://sepolia.basescan.org/address/${address}`
      default: return `https://etherscan.io/address/${address}`
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
                Saved {lastSaved && ` - ${formatTime(lastSaved)}`}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Drop</h1>
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">ERC-721</Badge>
        <Badge variant="outline">{selectedChain?.name || "Select Chain"}</Badge>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id <= currentStep ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {idx < steps.length - 1 && <div className="w-12 h-px bg-muted mx-4 hidden sm:block" />}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Chain *</Label>
                    <Select value={formData.selectedChainId.toString()} onValueChange={(v) => handleChainSwitch(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Select a chain" /></SelectTrigger>
                      <SelectContent>
                        {supportedChains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.id.toString()}>
                            {chain.name} {chain.testnet && "(Testnet)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {selectedChain?.testnet ? "Testnet - free to deploy" : "Mainnet - requires gas fees"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Collection Name *</Label>
                      <Input placeholder="My Collection" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Symbol *</Label>
                      <Input placeholder="MC" maxLength={10} value={formData.symbol} onChange={(e) => handleInputChange("symbol", e.target.value.toUpperCase())} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe your collection..." rows={3} value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="https://yourwebsite.com" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} />
                      </div>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="https://twitter.com/..." value={formData.twitter} onChange={(e) => handleInputChange("twitter", e.target.value)} />
                      </div>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="https://discord.gg/..." value={formData.discord} onChange={(e) => handleInputChange("discord", e.target.value)} />
                      </div>
                      <div className="relative">
                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="https://t.me/..." value={formData.telegram} onChange={(e) => handleInputChange("telegram", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Supply *</Label>
                      <Input type="number" min="1" placeholder="10000" value={formData.maxSupply} onChange={(e) => handleInputChange("maxSupply", e.target.value)} disabled={formData.unlimitedSupply} />
                      <div className="flex items-center space-x-2">
                        <Checkbox id="unlimited" checked={formData.unlimitedSupply} onCheckedChange={(c) => handleInputChange("unlimitedSupply", c as boolean)} />
                        <Label htmlFor="unlimited" className="cursor-pointer text-sm text-muted-foreground">Unlimited supply</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Mint Price (ETH) *</Label>
                      <Input type="number" step="0.001" min="0" placeholder="0.01" value={formData.mintPrice} onChange={(e) => handleInputChange("mintPrice", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Royalty (%)</Label>
                    <Input type="number" min="0" max="1000" placeholder="500" value={formData.royaltyBps} onChange={(e) => handleInputChange("royaltyBps", e.target.value)} />
                    <p className="text-xs text-muted-foreground">Basis points (500 = 5%)</p>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-medium">Sale Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Input type="date" value={formData.saleStartDate} onChange={(e) => handleInputChange("saleStartDate", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time *</Label>
                        <Input type="time" value={formData.saleStartTime} onChange={(e) => handleInputChange("saleStartTime", e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hasEnd" checked={formData.hasEndTime} onCheckedChange={(c) => handleInputChange("hasEndTime", c as boolean)} />
                      <Label htmlFor="hasEnd" className="cursor-pointer">Set end time</Label>
                    </div>
                    {formData.hasEndTime && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="date" value={formData.saleEndDate} onChange={(e) => handleInputChange("saleEndDate", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input type="time" value={formData.saleEndTime} onChange={(e) => handleInputChange("saleEndTime", e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Storage Provider</Label>
                    <Select value={storageProvider} onValueChange={(v) => setStorageProvider(v as StorageProvider)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nft-storage">Pinata (IPFS) - 1GB Free</SelectItem>
                        <SelectItem value="arweave">Arweave (Irys) - Permanent</SelectItem>
                      </SelectContent>
                    </Select>
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
                            <Button variant="outline" size="sm" onClick={() => { setCollectionImage(null); setFormData(p => ({...p, imageUrl: ""})) }}>Remove</Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">Square logo</p>
                            <input type="file" id="colImg" accept="image/*" className="hidden" onChange={handleCollectionImageChange} />
                            <Button variant="outline" size="sm" onClick={() => document.getElementById("colImg")?.click()}>Choose File</Button>
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
                            <Button variant="outline" size="sm" onClick={() => { setBannerImage(null); setFormData(p => ({...p, bannerUrl: ""})) }}>Remove</Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">Wide banner (3:1)</p>
                            <input type="file" id="banImg" accept="image/*" className="hidden" onChange={handleBannerImageChange} />
                            <Button variant="outline" size="sm" onClick={() => document.getElementById("banImg")?.click()}>Choose File</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>NFT Assets *</Label>
                    <p className="text-sm text-muted-foreground">Upload your unique NFT images. Each file becomes a unique token.</p>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      {nftAssets && nftAssets.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">{nftAssets.length} files selected</p>
                              <p className="text-xs text-muted-foreground">
                                {(Array.from(nftAssets).reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setNftAssets(null)}>Remove</Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">Upload NFT images (0.png, 1.png, ...)</p>
                          <input type="file" id="nftFiles" accept="image/*" multiple className="hidden" onChange={handleNftAssetsChange} />
                          <Button variant="outline" size="sm" onClick={() => document.getElementById("nftFiles")?.click()}>Choose Files</Button>
                        </>
                      )}
                    </div>
                  </div>

                  {formData.manifestUrl && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-green-900 dark:text-green-100 mb-1">Files Uploaded</div>
                          <a href={formData.manifestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline flex items-center gap-1">
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
                        <span className="text-sm font-medium">{uploadProgress}</span>
                      </div>
                      {totalUploadCount > 0 && (
                        <div className="space-y-1">
                          <Progress value={(uploadedCount / totalUploadCount) * 100} className="h-2" />
                          <p className="text-xs text-blue-700 dark:text-blue-300">{uploadedCount} of {totalUploadCount}</p>
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
                      <div className="font-medium">EVM Wallet</div>
                      <div className="text-sm text-muted-foreground">
                        {isConnected ? `${address?.slice(0, 8)}...${address?.slice(-4)}` : "Not connected"}
                      </div>
                    </div>
                    <Badge variant="secondary" className={isConnected ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100" : "bg-yellow-100 text-yellow-900"}>
                      {isConnected ? <><CheckCircle className="h-3 w-3 mr-1" />Connected</> : "Disconnected"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Target Chain</div>
                      <div className="text-sm text-muted-foreground">{selectedChain?.name}</div>
                    </div>
                    <Badge variant="secondary" className={chainId === formData.selectedChainId ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100" : "bg-yellow-100 text-yellow-900"}>
                      {chainId === formData.selectedChainId ? <><CheckCircle className="h-3 w-3 mr-1" />Correct Chain</> : "Switch Required"}
                    </Badge>
                  </div>

                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><Badge>ERC-721 Drop</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{formData.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Symbol:</span><span className="font-medium">{formData.symbol}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Supply:</span><span className="font-medium">{formData.unlimitedSupply ? "Unlimited" : formData.maxSupply}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Mint Price:</span><span className="font-medium">{formData.mintPrice} ETH</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Royalty:</span><span className="font-medium">{Number(formData.royaltyBps) / 100}%</span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Files uploaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Registry record created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.contractAddress ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : isDeploying ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-blue-600" />
                      )}
                      <span className="text-sm font-medium">{isDeploying ? deploymentStep : "Deploy contract"}</span>
                    </div>
                  </div>

                  {formData.contractAddress && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-green-900 dark:text-green-100 mb-1">Deployed!</div>
                          <p className="font-mono text-xs break-all">{formData.contractAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.contractAddress && registryUpdateFailed && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Registry Update Required</div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">Contract deployed. Click retry to update registry.</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={handleRetryRegistryUpdate} disabled={isDeploying}>
                          {isDeploying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry Registry"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isConnected && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg flex items-start gap-3">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm">Connect your EVM wallet to deploy.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isUploading || isDeploying}>Previous</Button>
            <div className="flex gap-2">
              {currentStep === 3 ? (
                <>
                  {formData.manifestUrl && <Button onClick={handleNext} disabled={isUploading}>Next</Button>}
                  <Button onClick={formData.manifestUrl ? handleStorageUpload : handleNext} disabled={isUploading || !collectionImage || !nftAssets} variant={formData.manifestUrl ? "outline" : "default"}>
                    {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : formData.manifestUrl ? <><Upload className="mr-2 h-4 w-4" />Re-upload</> : <><Upload className="mr-2 h-4 w-4" />Upload</>}
                  </Button>
                </>
              ) : currentStep < 4 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleDeployClick} disabled={isDeploying || !isConnected || !!formData.contractAddress} className="bg-blue-600 hover:bg-blue-700">
                  {isDeploying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{deploymentStep}</> : formData.contractAddress ? <><CheckCircle className="mr-2 h-4 w-4" />Deployed</> : <><Rocket className="mr-2 h-4 w-4" />Deploy</>}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                {formData.imageUrl ? <img src={formData.imageUrl} alt="Collection" className="w-full h-full object-cover rounded-lg" /> : <Upload className="h-8 w-8 text-white" />}
              </div>
              <div>
                <h3 className="font-semibold">{formData.name || "Collection Name"}</h3>
                <p className="text-sm text-muted-foreground">{formData.symbol || "SYMBOL"}</p>
              </div>
              <p className="text-sm text-muted-foreground">{formData.description || "Description..."}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge>ERC-721</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Chain</span><Badge variant="secondary">{selectedChain?.name}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Supply</span><span>{formData.unlimitedSupply ? "Unlimited" : formData.maxSupply}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span>{formData.mintPrice} ETH</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
