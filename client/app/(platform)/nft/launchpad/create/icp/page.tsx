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
import { Upload, Eye, CheckCircle, Info, Rocket, Check, Clock, Loader2 } from "lucide-react"
import { saveDraft, loadDraft, deleteDraft } from "@/lib/storage/draftStorage"
import { useDebounce } from "@/hooks/useDebounce"
import { useAuth } from "@/providers/auth-context"
import { getICPMarketplaceActor, getRegistryActor } from "@/providers/actors/marketplace"
import { toast } from "sonner"
import { Principal } from "@dfinity/principal"
import AuthGuard from "@/components/auth-guard"

interface CollectionFormData {
  name: string
  symbol: string
  description: string
  maxSupply: string
  unlimitedSupply: boolean
  collectionCanisterId?: string
}

type SaveStatus = "saving" | "saved" | "idle"

export default function CreateICPCollectionPage() {
  const router = useRouter()
  const { identity, isAuthenticated } = useAuth()

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
          await saveDraft(draftId, formData, undefined, undefined)
          setSaveStatus("saved")
          setLastSaved(Date.now())
        } catch (error) {
          console.error("Failed to save draft:", error)
          setSaveStatus("idle")
        }
      }
    }
    autoSave()
  }, [debouncedFormData, draftId, isLoading])

  useEffect(() => {
    const loadSavedDraft = async () => {
      try {
        const saved = await loadDraft(draftId)
        if (saved) {
          setFormData(saved.formData)
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

  const formatICP = (e8s: bigint) => {
    return (Number(e8s) / 100_000_000).toFixed(2)
  }

  const steps = [
    { id: 1, title: "Collection Info", description: "Basic details" },
    { id: 2, title: "Review & Deploy", description: "Deploy canister" },
  ]

  const handleNext = () => {
    if (currentStep < 2) {
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
      setDeploymentStep("Creating collection canister...")

      const actor = await getICPMarketplaceActor(identity)

      const createArgs = {
        collection_name: formData.name,
        collection_symbol: formData.symbol,
        description: formData.description ? [formData.description] : [],
        supply_cap: formData.unlimitedSupply ? [] : [BigInt(formData.maxSupply)],
        logo: [],
        collection_metadata: [],
      }

      setDeploymentStep("Deploying ICRC7 canister...")
      const result = await actor.create_collection(createArgs)

      if ('Err' in result) {
        const errorKey = Object.keys(result.Err)[0]
        const errorValue = (result.Err as any)[errorKey]
        throw new Error(errorValue ? `${errorKey}: ${errorValue}` : errorKey)
      }

      const { collection_canister_id } = result.Ok
      const canisterId = collection_canister_id.toString()

      const updatedFormData = { ...formData, collectionCanisterId: canisterId }
      setFormData(updatedFormData)
      await saveDraft(draftId, updatedFormData, undefined, undefined)

      toast.success("Collection canister deployed!")
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
    if (!formData.collectionCanisterId) {
      toast.error("Missing canister ID")
      return
    }

    setIsDeploying(true)
    setDeploymentStep("Registering collection...")

    try {
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
            canister_id: [Principal.fromText(formData.collectionCanisterId)],
            deployment_stage: { Deployed: null },
          }
        }
      })

      if ('Err' in createResult) {
        throw new Error(`Registry registration failed: ${createResult.Err}`)
      }

      const registryId = createResult.Ok

      setDeploymentStep("Activating collection...")
      await registryActor.update_collection_status({
        collection_id: registryId,
        status: { Active: null }
      })

      await deleteDraft(draftId)
      toast.success("Collection published!")

      const collectionResult = await registryActor.get_collection(registryId)
      if (!collectionResult[0]?.slug) {
        throw new Error("Failed to retrieve collection slug")
      }
      router.push(`/nft/collections/icp/manage/${collectionResult[0].slug}`)
    } catch (error: any) {
      console.error("Finish failed:", error)
      toast.error(`Failed to publish: ${error.message || 'Unknown error'}`)
      setDeploymentStep("")
    } finally {
      setIsDeploying(false)
    }
  }

  const progress = (currentStep / 2) * 100

  const isStep1Valid = formData.name.length > 0 && formData.symbol.length > 0

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
                {step.id < 2 && (
                  <div className="w-24 h-px bg-muted mx-4 hidden sm:block" />
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
                        {creationFee && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Creation Fee:</span>
                            <span className="font-medium">{formatICP(creationFee)} ICP</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.collectionCanisterId && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-green-900 dark:text-green-100 mb-1">
                              Canister Deployed
                            </div>
                            <p className="font-mono text-xs break-all text-green-700 dark:text-green-300">
                              {formData.collectionCanisterId}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h4 className="font-semibold">Deployment Steps</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {formData.collectionCanisterId ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : isDeploying ? (
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-purple-600" />
                          )}
                          <span className="text-sm">
                            {formData.collectionCanisterId ? "ICRC7 canister deployed" : isDeploying ? deploymentStep : "Deploy ICRC7 canister"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            On-Chain Storage
                          </div>
                          <div className="text-blue-700 dark:text-blue-200">
                            After deployment, you&apos;ll upload your NFT images and metadata directly to the
                            collection canister. No external storage (IPFS/Arweave) required.
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isAuthenticated && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                              Not Connected
                            </div>
                            <div className="text-yellow-700 dark:text-yellow-200">
                              Please connect your Internet Identity to deploy the collection
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
                disabled={currentStep === 1 || isDeploying}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {currentStep < 2 ? (
                  <Button onClick={handleNext} disabled={!isStep1Valid}>
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleDeployClick}
                      disabled={isDeploying || !isAuthenticated || !!formData.collectionCanisterId}
                      variant={formData.collectionCanisterId ? "outline" : "default"}
                      className={!formData.collectionCanisterId ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                      {isDeploying && !formData.collectionCanisterId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {deploymentStep || "Deploying..."}
                        </>
                      ) : formData.collectionCanisterId ? (
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
                      disabled={isDeploying || !formData.collectionCanisterId}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isDeploying && formData.collectionCanisterId ? (
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
                  </>
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
