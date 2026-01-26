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
import { Upload, Eye, CheckCircle, Info, Rocket, Check, Clock, Loader2, Wallet, ImageIcon } from "lucide-react"
import { saveDraft, loadDraft, deleteDraft, SerializedMintRequest } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getICPMarketplaceActor, getRegistryActor, getICRC7NftActor, getICRC2Actor } from "@/providers/actors/marketplace"
import { uploadAssetWithMetadata } from "@/lib/icp/fileUpload"
import { metadataUrlToICRC3Value, mintNFTBatch } from "@/lib/icp/nftMinting"
import { toast } from "sonner"
import { Principal } from "@dfinity/principal"
import AuthGuard from "@/components/auth-guard"
import { icpCanisterId, marketplaceCanisterId } from "@/constants/canisters-config"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  maxSupply: string
  unlimitedSupply: boolean
  collectionCanisterId?: string
  registryId?: string
}

type SaveStatus = "saving" | "saved" | "idle"

export default function CreateICPCollectionPage() {
  const router = useRouter()
  const { identity, isAuthenticated, principalId } = useAuth()

  const draftId = "icp-draft"
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    symbol: "",
    description: "",
    maxSupply: "10000",
    unlimitedSupply: false,
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [creationFee, setCreationFee] = useState<bigint | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStep, setDeploymentStep] = useState<string>("")
  const debouncedFormData = useDebounce(formData, 1000)

  const [icpBalance, setIcpBalance] = useState<bigint>(BigInt(0))
  const [currentAllowance, setCurrentAllowance] = useState<bigint>(BigInt(0))
  const [isApproving, setIsApproving] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [isMinting, setIsMinting] = useState(false)
  const [mintProgress, setMintProgress] = useState(0)
  const [mintStatus, setMintStatus] = useState("")
  const [pendingMintRequests, setPendingMintRequests] = useState<SerializedMintRequest[]>([])

  useEffect(() => {
    const fetchConfig = async () => {
      if (!identity) return
      try {
        const actor = await getICPMarketplaceActor(identity)
        const config = await actor.get_marketplace_config()
        setCreationFee(config.collection_creation_fee)
      } catch (error) {
        console.error("Failed to fetch marketplace config:", error)
      }
    }
    fetchConfig()
  }, [identity])

  useEffect(() => {
    const autoSave = async () => {
      if (!isLoading && (formData.name || formData.symbol || formData.description)) {
        setSaveStatus("saving")
        try {
          await saveDraft(draftId, formData, undefined, undefined, undefined, {
            currentStep,
            isApproved,
            registryId: formData.registryId,
          })
          setSaveStatus("saved")
          setLastSaved(Date.now())
        } catch (error) {
          console.error("Failed to save draft:", error)
          setSaveStatus("idle")
        }
      }
    }
    autoSave()
  }, [debouncedFormData, draftId, isLoading, currentStep, isApproved])

  useEffect(() => {
    const loadSavedDraft = async () => {
      try {
        const saved = await loadDraft(draftId)
        if (saved) {
          setFormData(saved.formData)
          setLastSaved(saved.lastUpdated)
          setSaveStatus("saved")
          if (saved.currentStep) {
            setCurrentStep(saved.currentStep)
          }
          if (saved.isApproved) {
            setIsApproved(saved.isApproved)
          }
          if (saved.pendingMintRequests && saved.pendingMintRequests.length > 0) {
            setPendingMintRequests(saved.pendingMintRequests)
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

  const fetchBalanceAndAllowance = useCallback(async () => {
    if (!identity || !principalId) return
    try {
      const icpActor = await getICRC2Actor(identity, icpCanisterId)
      const principal = Principal.fromText(principalId)
      const account = { owner: principal, subaccount: [] as [] }

      const balance = await icpActor.icrc1_balance_of(account)
      setIcpBalance(balance)

      const allowance = await icpActor.icrc2_allowance({
        account,
        spender: { owner: Principal.fromText(marketplaceCanisterId), subaccount: [] as [] }
      })
      setCurrentAllowance(allowance.allowance)
      setIsApproved(creationFee ? allowance.allowance >= creationFee : false)
    } catch (error) {
      console.error("Failed to fetch balance/allowance:", error)
    }
  }, [identity, principalId, creationFee])

  useEffect(() => {
    if (currentStep === 2 && identity && principalId) {
      fetchBalanceAndAllowance()
    }
  }, [currentStep, identity, principalId, fetchBalanceAndAllowance])

  const formatICP = (e8s: bigint) => {
    return (Number(e8s) / 100_000_000).toFixed(2)
  }

  const steps = [
    { id: 1, title: "Collection Info", description: "Basic details" },
    { id: 2, title: "Approve Payment", description: "Approve ICP" },
    { id: 3, title: "Deploy", description: "Deploy canister" },
    { id: 4, title: "Upload & Mint", description: "Mint NFTs" },
  ]

  const handleNext = () => {
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

  const handleApprove = async () => {
    if (!identity || !creationFee) return
    setIsApproving(true)
    try {
      const icpActor = await getICRC2Actor(identity, icpCanisterId)
      const approvalAmount = creationFee + BigInt(10_000)

      const result = await icpActor.icrc2_approve({
        spender: { owner: Principal.fromText(marketplaceCanisterId), subaccount: [] as [] },
        amount: approvalAmount,
        fee: [] as [],
        memo: [] as [],
        from_subaccount: [] as [],
        created_at_time: [] as [],
        expected_allowance: [] as [],
        expires_at: [] as [],
      })

      if ('Ok' in result) {
        toast.success("ICP approved successfully!")
        setIsApproved(true)
        setCurrentAllowance(approvalAmount)
        await saveDraft(draftId, formData, undefined, undefined, undefined, {
          currentStep,
          isApproved: true,
        })
      } else {
        throw new Error(Object.keys(result.Err)[0])
      }
    } catch (error) {
      console.error("Approval failed:", error)
      toast.error("Failed to approve ICP")
    } finally {
      setIsApproving(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const maxSupply = formData.unlimitedSupply ? Infinity : parseInt(formData.maxSupply)
      if (files.length > maxSupply) {
        toast.error(`You can only mint up to ${maxSupply} NFTs`)
        return
      }
      setUploadFiles(files)
    }
  }

  const handleMintNFTs = async () => {
    const hasPendingRequests = pendingMintRequests.length > 0
    if (!identity || !formData.collectionCanisterId || (uploadFiles.length === 0 && !hasPendingRequests)) return

    setIsMinting(true)
    setMintProgress(0)
    setMintStatus("Preparing...")

    try {
      const nftActor = await getICRC7NftActor(identity, formData.collectionCanisterId)
      const userPrincipal = identity.getPrincipal()

      const mintRequests: Array<{
        owner: Principal
        metadata: Array<[string, unknown]>
        memo: string
      }> = []

      if (hasPendingRequests) {
        setMintStatus("Resuming from saved uploads...")
        setMintProgress(70)
        toast.info("Resuming mint from previously uploaded files")

        for (const req of pendingMintRequests) {
          mintRequests.push({
            owner: Principal.fromText(req.ownerPrincipal),
            metadata: req.metadata,
            memo: req.memo,
          })
        }
      } else {
        const uploadProgress = 70 / uploadFiles.length
        const serializedRequests: SerializedMintRequest[] = []

        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i]
          const nftNumber = i + 1
          setMintStatus(`Uploading ${file.name} (${i + 1}/${uploadFiles.length})`)

          const { metadataUrl, imageUrl } = await uploadAssetWithMetadata(
            nftActor,
            file,
            `${formData.name} #${nftNumber}`,
            `NFT #${nftNumber} from ${formData.name} collection`,
            formData.collectionCanisterId,
            [
              { trait_type: "Collection", value: formData.name },
              { trait_type: "Number", value: nftNumber },
            ],
            (progress) => {
              setMintProgress(i * uploadProgress + (progress / 100) * uploadProgress)
            }
          )

          const icrc3Metadata = metadataUrlToICRC3Value(metadataUrl, imageUrl)
          mintRequests.push({
            owner: userPrincipal,
            metadata: icrc3Metadata,
            memo: `${formData.name} #${nftNumber}`,
          })

          serializedRequests.push({
            ownerPrincipal: userPrincipal.toText(),
            metadata: icrc3Metadata as Array<[string, Record<string, unknown>]>,
            memo: `${formData.name} #${nftNumber}`,
          })

          setMintProgress((i + 1) * uploadProgress)
        }

        setMintStatus("Saving upload progress...")
        await saveDraft(draftId, formData, undefined, undefined, undefined, {
          currentStep,
          isApproved,
          registryId: formData.registryId,
          pendingMintRequests: serializedRequests,
        })
        setPendingMintRequests(serializedRequests)
      }

      setMintStatus(`Minting ${mintRequests.length} NFTs...`)
      setMintProgress(70)

      await mintNFTBatch(nftActor, mintRequests as Parameters<typeof mintNFTBatch>[1], (current, total) => {
        setMintProgress(70 + (current / total) * 25)
        setMintStatus(`Minting: ${current}/${total}`)
      })

      setMintProgress(95)
      setMintStatus("Activating collection...")

      if (formData.registryId) {
        const registryActor = await getRegistryActor(identity)
        await registryActor.update_collection_status({
          collection_id: formData.registryId,
          status: { Active: null }
        })
      }

      setMintProgress(100)
      setMintStatus("Complete!")
      toast.success(`Successfully minted ${mintRequests.length} NFTs!`)

      setPendingMintRequests([])
      await deleteDraft(draftId)

      setTimeout(() => {
        getRegistryActor(identity).then(async (actor) => {
          if (formData.registryId) {
            const result = await actor.get_collection(formData.registryId)
            if (result[0]?.slug) {
              router.push(`/nft/collections/icp/${result[0].slug}`)
            }
          }
        })
      }, 2000)
    } catch (error) {
      console.error("Minting error:", error)
      toast.error("Failed to mint NFTs. You can retry - uploads are saved.")
      setMintStatus("")
    } finally {
      setIsMinting(false)
    }
  }

  const handleDeployClick = async () => {
    if (!identity || !isAuthenticated) {
      toast.error("Please connect your Internet Identity")
      return
    }

    if (!formData.name || !formData.symbol) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setIsDeploying(true)
      setDeploymentStep("Deploying ICRC7 canister...")

      const actor = await getICPMarketplaceActor(identity)

      const createArgs = {
        collection_name: formData.name,
        collection_symbol: formData.symbol,
        description: formData.description ? [formData.description] : [],
        supply_cap: formData.unlimitedSupply ? [] : [BigInt(formData.maxSupply)],
        logo: [],
        collection_metadata: [],
      }

      const result = await actor.create_collection(createArgs)

      if ('Err' in result) {
        const errorKey = Object.keys(result.Err)[0]
        const errorValue = (result.Err as any)[errorKey]
        throw new Error(errorValue ? `${errorKey}: ${errorValue}` : errorKey)
      }

      const { collection_canister_id } = result.Ok
      const canisterId = collection_canister_id.toString()

      setDeploymentStep("Registering in marketplace...")

      const registryActor = await getRegistryActor(identity)
      const createResult = await registryActor.create_collection({
        blockchain: { ICP: null },
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description || "",
        image_url: "",
        banner_url: [],
        total_supply: formData.unlimitedSupply ? BigInt(0) : BigInt(formData.maxSupply),
        royalty_bps: 0,
        mint_price: [],
        metadata: [],
        socials: [],
        category: [],
        tags: [],
        chain_data: {
          ICP: {
            canister_id: [Principal.fromText(canisterId)],
            deployment_stage: { Deployed: null },
          }
        }
      })

      if ('Err' in createResult) {
        throw new Error(`Registry failed: ${JSON.stringify(createResult.Err)}`)
      }

      const registryId = createResult.Ok
      const updatedFormData = { ...formData, collectionCanisterId: canisterId, registryId }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, undefined, undefined, undefined, {
        currentStep: 4,
        isApproved,
        registryId,
      })

      toast.success("Collection deployed!")
      setDeploymentStep("")
      setCurrentStep(4)
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

  const progress = (currentStep / 4) * 100

  const isStep1Valid = formData.name.length > 0 && formData.symbol.length > 0
  const isStep2Valid = isApproved || (creationFee ? currentAllowance >= creationFee : false)
  const isStep3Valid = !!formData.collectionCanisterId

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

        <h1 className="text-2xl font-bold">Launch on ICP</h1>

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
                {step.id < 4 && (
                  <div className="w-12 h-px bg-muted mx-2 hidden sm:block" />
                )}
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
                          placeholder="My ICP Collection"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol">Symbol *</Label>
                        <Input
                          id="symbol"
                          placeholder="ICPC"
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
                        rows={4}
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="unlimitedSupply"
                          checked={formData.unlimitedSupply}
                          onCheckedChange={(checked) => handleInputChange("unlimitedSupply", checked as boolean)}
                        />
                        <Label htmlFor="unlimitedSupply" className="text-sm font-medium cursor-pointer">
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
                            onChange={(e) => handleInputChange("maxSupply", e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum number of NFTs in this collection
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                            ICP Collection (ICRC7)
                          </div>
                          <div className="text-purple-700 dark:text-purple-200">
                            Your collection will be deployed as an ICRC7 canister on the Internet Computer.
                            Assets are stored on-chain in the canister itself.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your ICP Balance:</span>
                        <span className="font-medium">{formatICP(icpBalance)} ICP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creation Fee:</span>
                        <span className="font-medium">{creationFee ? formatICP(creationFee) : "..."} ICP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Allowance:</span>
                        <span className="font-medium">{formatICP(currentAllowance)} ICP</span>
                      </div>
                    </div>

                    {isApproved ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-900 dark:text-green-100">ICP Approved</span>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleApprove}
                        disabled={isApproving || !creationFee || icpBalance < creationFee}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isApproving ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving...</>
                        ) : (
                          <><Wallet className="mr-2 h-4 w-4" />Approve {creationFee ? formatICP(creationFee) : "..."} ICP</>
                        )}
                      </Button>
                    )}

                    {creationFee && icpBalance < creationFee && (
                      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-red-600 mt-0.5" />
                          <span className="text-sm text-red-700 dark:text-red-300">
                            Insufficient ICP balance. You need at least {formatICP(creationFee)} ICP.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
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
                        <span className="font-medium">{formData.unlimitedSupply ? "Unlimited" : formData.maxSupply}</span>
                      </div>
                    </div>

                    {formData.collectionCanisterId ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-green-900 dark:text-green-100 mb-1">Canister Deployed</div>
                            <p className="font-mono text-xs break-all text-green-700 dark:text-green-300">{formData.collectionCanisterId}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleDeployClick}
                        disabled={isDeploying || !isAuthenticated}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isDeploying ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{deploymentStep || "Deploying..."}</>
                        ) : (
                          <><Rocket className="mr-2 h-4 w-4" />Deploy Collection</>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Upload your NFT images. They will be stored on-chain in your canister.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Select NFT Images</Label>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isMinting}
                        className="cursor-pointer"
                      />
                    </div>

                    {pendingMintRequests.length > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                          {pendingMintRequests.length} uploads ready to mint
                        </h3>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          Previous upload completed. Click below to resume minting.
                        </p>
                      </div>
                    )}

                    {uploadFiles.length > 0 && pendingMintRequests.length === 0 && (
                      <div className="space-y-3">
                        <h3 className="font-medium">Selected Files ({uploadFiles.length})</h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                          {uploadFiles.map((file, index) => (
                            <div key={index} className="border rounded-lg p-1">
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full aspect-square object-cover rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isMinting && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{mintStatus}</span>
                          <span>{Math.round(mintProgress)}%</span>
                        </div>
                        <Progress value={mintProgress} className="h-2" />
                      </div>
                    )}

                    <Button
                      onClick={handleMintNFTs}
                      disabled={(uploadFiles.length === 0 && pendingMintRequests.length === 0) || isMinting}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isMinting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Minting...</>
                      ) : pendingMintRequests.length > 0 ? (
                        <><Rocket className="mr-2 h-4 w-4" />Resume Minting ({pendingMintRequests.length} NFTs)</>
                      ) : (
                        <><ImageIcon className="mr-2 h-4 w-4" />{uploadFiles.length > 0 ? `Mint ${uploadFiles.length} NFTs` : "Select files to mint"}</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isDeploying || isMinting}
              >
                Previous
              </Button>
              {currentStep === 1 && (
                <Button onClick={handleNext} disabled={!isStep1Valid}>Next</Button>
              )}
              {currentStep === 2 && (
                <Button onClick={handleNext} disabled={!isStep2Valid}>Next</Button>
              )}
              {currentStep === 3 && formData.collectionCanisterId && (
                <Button onClick={handleNext}>Next</Button>
              )}
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
                <div className="aspect-square bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <div className="text-white text-4xl font-bold">
                    {formData.symbol || "?"}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">{formData.name || "Collection Name"}</h3>
                  <p className="text-sm text-muted-foreground">{formData.symbol || "SYMBOL"}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {formData.description || "Collection description will appear here..."}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Blockchain:</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                      ICP
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Standard:</span>
                    <span className="text-xs">ICRC7</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Supply:</span>
                    <span>{formData.unlimitedSupply ? "Unlimited" : formData.maxSupply || "0"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage:</span>
                    <span className="text-xs">On-chain</span>
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
