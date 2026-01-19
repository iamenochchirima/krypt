"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Principal } from "@dfinity/principal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, CheckCircle, Info, RefreshCw, ImageIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/providers/auth-context"
import { getICPMarketplaceActor, getICRC7NftActor, getRegistryActor } from "@/providers/actors/marketplace"
import { uploadAssetWithMetadata } from "@/lib/icp/fileUpload"
import { metadataUrlToICRC3Value, mintNFTBatch } from "@/lib/icp/nftMinting"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"
import type { CollectionInfo, CollectionStatus } from "@/declarations/marketplace/marketplace.did"
import type { Collection } from "@/declarations/registry/registry.did"

type MintMode = "batch" | "sequential"

export default function ICPCollectionManagePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { identity, isAuthenticated } = useAuth()

  const [registryCollection, setRegistryCollection] = useState<Collection | null>(null)
  const [collection, setCollection] = useState<CollectionInfo | null>(null)
  const [canisterId, setCanisterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nftActor, setNftActor] = useState<any>(null)
  const [mintedTokens, setMintedTokens] = useState<bigint[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)

  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [minting, setMinting] = useState(false)
  const [mintProgress, setMintProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [mintMode, setMintMode] = useState<MintMode>("batch")

  useEffect(() => {
    if (slug && identity && isAuthenticated) {
      fetchCollectionData()
    }
  }, [slug, identity, isAuthenticated])

  const fetchCollectionData = async () => {
    if (!identity) return

    setLoading(true)
    setError(null)
    try {
      const registryActor = await getRegistryActor(identity)
      const registryResult = await registryActor.get_collection_by_slug(slug)

      if (registryResult.length === 0) {
        setError("Collection not found")
        return
      }

      const regCollection = registryResult[0]
      setRegistryCollection(regCollection)

      const icpData = "ICP" in regCollection.chain_data ? regCollection.chain_data.ICP : null
      if (!icpData?.canister_id?.[0]) {
        setError("Invalid ICP collection data")
        return
      }

      const collectionPrincipal = icpData.canister_id[0]
      const collectionCanisterId = collectionPrincipal.toText()
      setCanisterId(collectionCanisterId)

      const principal = collectionPrincipal
      const marketActor = await getICPMarketplaceActor(identity)
      const result = await marketActor.get_collection_info(principal)

      if ("Ok" in result) {
        setCollection(result.Ok)
        const actor = await getICRC7NftActor(identity, collectionCanisterId)
        setNftActor(actor)
        await fetchMintedTokens(actor)
      } else {
        setError("Collection not found or access denied")
      }
    } catch (err) {
      console.error("Error fetching collection:", err)
      setError("Failed to load collection data")
    } finally {
      setLoading(false)
    }
  }

  const fetchMintedTokens = async (actor: any) => {
    if (!actor) return
    setLoadingTokens(true)
    try {
      const tokens = await actor.icrc7_tokens([], [])
      setMintedTokens(tokens)
    } catch (err) {
      console.error("Error fetching tokens:", err)
    } finally {
      setLoadingTokens(false)
    }
  }

  const getStatusText = (status: CollectionStatus) => {
    if ("AssetsPending" in status) return "Assets Pending"
    if ("Active" in status) return "Active"
    if ("Paused" in status) return "Paused"
    if ("Banned" in status) return "Banned"
    return "Unknown"
  }

  const getStatusColor = (status: CollectionStatus) => {
    if ("AssetsPending" in status) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    if ("Active" in status) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if ("Paused" in status) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    if ("Banned" in status) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    return "bg-gray-100 text-gray-800"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const supplyCap = collection?.supply_cap?.[0] ? Number(collection.supply_cap[0]) : null
      const currentSupply = Number(collection?.total_supply || 0)
      const remainingSupply = supplyCap !== null ? supplyCap - currentSupply : Infinity

      if (supplyCap !== null && files.length > remainingSupply) {
        toast.error(`You can only mint ${remainingSupply} more NFTs`)
        return
      }
      setUploadFiles(files)
    }
  }

  const handleMintNFTs = async () => {
    if (!nftActor || uploadFiles.length === 0 || !identity || !collection) return

    const userPrincipal = identity.getPrincipal()

    setMinting(true)
    setMintProgress(0)
    setStatusMessage("Preparing to mint...")

    try {
      if (mintMode === "batch") {
        const uploadProgress = 50 / uploadFiles.length
        const mintRequests = []

        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i]
          const nftNumber = mintedTokens.length + i + 1

          setStatusMessage(`Uploading ${file.name} (${i + 1}/${uploadFiles.length})`)

          const { metadataUrl, imageUrl } = await uploadAssetWithMetadata(
            nftActor,
            file,
            `${collection.name} #${nftNumber}`,
            `NFT #${nftNumber} from ${collection.name} collection`,
            canisterId!,
            [
              { trait_type: "Collection", value: collection.name },
              { trait_type: "Number", value: nftNumber },
              { trait_type: "File Name", value: file.name },
            ],
            (progress, status) => {
              const currentProgress = i * uploadProgress + (progress / 100) * uploadProgress
              setMintProgress(currentProgress)
            }
          )

          const icrc3Metadata = metadataUrlToICRC3Value(metadataUrl, imageUrl)
          mintRequests.push({
            owner: userPrincipal,
            metadata: icrc3Metadata,
            memo: `Minted ${collection.name} #${nftNumber}`,
          })

          setMintProgress(((i + 1) / uploadFiles.length) * 50)
        }

        setStatusMessage(`Minting ${uploadFiles.length} NFTs...`)
        setMintProgress(50)

        await mintNFTBatch(nftActor, mintRequests, (current, total) => {
          const mintProgressValue = (current / total) * 50
          setMintProgress(50 + mintProgressValue)
          setStatusMessage(`Minting: ${current}/${total} NFTs`)
        })
      } else {
        const progressPerNFT = 100 / uploadFiles.length

        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i]
          const nftNumber = mintedTokens.length + i + 1

          setStatusMessage(`[${i + 1}/${uploadFiles.length}] Uploading ${file.name}...`)

          const { metadataUrl, imageUrl } = await uploadAssetWithMetadata(
            nftActor,
            file,
            `${collection.name} #${nftNumber}`,
            `NFT #${nftNumber} from ${collection.name} collection`,
            canisterId!,
            [
              { trait_type: "Collection", value: collection.name },
              { trait_type: "Number", value: nftNumber },
              { trait_type: "File Name", value: file.name },
            ],
            (progress) => {
              const baseProgress = i * progressPerNFT
              const uploadProgressValue = (progress / 100) * (progressPerNFT * 0.7)
              setMintProgress(baseProgress + uploadProgressValue)
            }
          )

          setStatusMessage(`[${i + 1}/${uploadFiles.length}] Minting NFT...`)

          const icrc3Metadata = metadataUrlToICRC3Value(metadataUrl, imageUrl)

          const mintArgs = {
            mint_requests: [
              {
                token_owner: { owner: userPrincipal, subaccount: [] },
                memo: [Array.from(new TextEncoder().encode(`Minted ${collection.name} #${nftNumber}`))],
                metadata: icrc3Metadata,
              },
            ],
          }

          const result = await nftActor.mint(mintArgs)

          if ("Err" in result) {
            throw new Error(`Mint failed: ${JSON.stringify(result.Err)}`)
          }

          setMintProgress((i + 1) * progressPerNFT)

          if (i < uploadFiles.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }
      }

      setMintProgress(100)
      setStatusMessage(`Successfully minted ${uploadFiles.length} NFTs!`)

      toast.success(`Successfully minted ${uploadFiles.length} NFTs!`)

      await fetchMintedTokens(nftActor)
      await fetchCollectionData()

      setTimeout(() => {
        setUploadFiles([])
        setStatusMessage("")
        setMintProgress(0)
      }, 3000)
    } catch (err) {
      console.error("Minting error:", err)
      const errorStr = err instanceof Error ? err.message : String(err)

      let errorMsg = "Failed to mint NFTs"
      if (errorStr.includes("ExceedMaxAllowedSupplyCap")) {
        errorMsg = "Cannot mint: Supply cap would be exceeded"
      } else if (errorStr.includes("StorageCanisterError")) {
        errorMsg = "Storage error occurred. Please try again."
      } else if (errorStr.includes("ConcurrentManagementCall")) {
        errorMsg = "Another operation is in progress. Please wait."
      }

      toast.error(errorMsg)
    } finally {
      setMinting(false)
    }
  }

  const handleActivateCollection = async () => {
    if (!identity || !collection) return

    try {
      const marketActor = await getICPMarketplaceActor(identity)
      const result = await marketActor.activate_collection(collection.id)

      if ("Ok" in result) {
        toast.success("Collection activated successfully!")
        await fetchCollectionData()
      } else {
        const errorKey = Object.keys(result.Err)[0]
        toast.error(`Failed to activate: ${errorKey}`)
      }
    } catch (err) {
      console.error("Activation error:", err)
      toast.error("Failed to activate collection")
    }
  }

  const formatICP = (e8s: bigint) => {
    return (Number(e8s) / 100_000_000).toFixed(4)
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AuthGuard>
    )
  }

  if (error || !collection) {
    return (
      <AuthGuard>
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error || "Collection not found"}</p>
              <Button variant="outline" onClick={() => router.push("/nft/collections/my")}>
                Back to My Collections
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                {collection.logo?.[0] ? (
                  <img src={collection.logo[0]} alt={collection.name} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{collection.symbol}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold mb-1">{collection.name}</h1>
                  <p className="text-muted-foreground">{collection.symbol}</p>
                  {collection.description?.[0] && (
                    <p className="text-sm text-muted-foreground mt-2">{collection.description[0]}</p>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(collection.status)}>{getStatusText(collection.status)}</Badge>
            </div>

            <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Minted</p>
                <p className="text-xl font-semibold">
                  {loadingTokens ? "..." : mintedTokens.length} / {Number(collection.total_supply)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supply Cap</p>
                <p className="text-xl font-semibold">
                  {collection.supply_cap?.[0] ? Number(collection.supply_cap[0]) : "Unlimited"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Floor Price</p>
                <p className="text-xl font-semibold">
                  {collection.floor_price?.[0] ? `${formatICP(collection.floor_price[0])} ICP` : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl font-semibold">{formatICP(collection.total_volume)} ICP</p>
              </div>
            </div>

            {mintedTokens.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Minted NFTs ({mintedTokens.length})</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchMintedTokens(nftActor)}
                    disabled={loadingTokens}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingTokens ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {mintedTokens.map((tokenId) => (
                    <Badge key={tokenId.toString()} variant="secondary">
                      #{tokenId.toString()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {"AssetsPending" in collection.status && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Assets & Mint NFTs</CardTitle>
              <CardDescription>
                Upload your NFT images to the canister and mint them. Assets are stored on-chain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    All files are uploaded directly to your collection canister. No external storage required.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minting Mode</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMintMode("batch")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      mintMode === "batch"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">🚀</div>
                    <h3 className={`font-semibold ${mintMode === "batch" ? "text-purple-700 dark:text-purple-300" : ""}`}>
                      Batch Minting
                    </h3>
                    <p className="text-xs text-muted-foreground">Upload all, then mint in batches. Faster.</p>
                  </button>
                  <button
                    onClick={() => setMintMode("sequential")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      mintMode === "sequential"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">🔄</div>
                    <h3 className={`font-semibold ${mintMode === "sequential" ? "text-purple-700 dark:text-purple-300" : ""}`}>
                      Sequential
                    </h3>
                    <p className="text-xs text-muted-foreground">Upload and mint one by one. Slower but observable.</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select NFT Images</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={minting}
                  className="cursor-pointer"
                />
              </div>

              {uploadFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Selected Files ({uploadFiles.length})</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="border rounded-lg p-1">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full aspect-square object-cover rounded"
                        />
                        <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {minting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{statusMessage}</span>
                    <span>{Math.round(mintProgress)}%</span>
                  </div>
                  <Progress value={mintProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleMintNFTs}
                disabled={uploadFiles.length === 0 || minting}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {minting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadFiles.length > 0
                      ? `${mintMode === "batch" ? "Batch" : "Sequential"} Mint ${uploadFiles.length} NFTs`
                      : "Select files to mint"}
                  </>
                )}
              </Button>

              {mintedTokens.length > 0 && (
                <div className="pt-4 border-t">
                  <Button onClick={handleActivateCollection} variant="outline" className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate Collection for Trading
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {"Active" in collection.status && (
          <Card>
            <CardHeader>
              <CardTitle>Collection Active</CardTitle>
              <CardDescription>Your collection is live and available for trading on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => router.push(`/nft/collections/icp/${slug}`)}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  View Collection
                </Button>
                <Button variant="outline" className="bg-green-50 hover:bg-green-100 dark:bg-green-950/20">
                  Mint More NFTs
                </Button>
                <Button variant="outline" className="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20">
                  Pause Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {"Paused" in collection.status && (
          <Card className="border-gray-300 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Collection Paused</CardTitle>
              <CardDescription>Trading is disabled until you reactivate the collection.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleActivateCollection} className="bg-green-600 hover:bg-green-700">
                Reactivate Collection
              </Button>
            </CardContent>
          </Card>
        )}

        {"Banned" in collection.status && (
          <Card className="border-red-300 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600">Collection Banned</CardTitle>
              <CardDescription className="text-red-500">
                Your collection has been banned. Contact support for more information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">Contact Support</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}
