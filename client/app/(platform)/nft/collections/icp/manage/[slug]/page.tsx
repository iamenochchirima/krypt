"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Principal } from "@dfinity/principal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle, Info, RefreshCw, ImageIcon, Loader2, Copy, ExternalLink,
  Plus, Shield, Settings, Grid3X3, X
} from "lucide-react"
import { useAuth } from "@/providers/auth-context"
import { getICPMarketplaceActor, getICRC7NftActor, getRegistryActor } from "@/providers/actors/marketplace"
import { prepareFilesForBatchUpload, batchUploadAssets } from "@/lib/icp/fileUpload"
import { metadataUrlToICRC3Value, mintNFTBatch } from "@/lib/icp/nftMinting"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"
import type { CollectionInfo, CollectionStatus } from "@/declarations/marketplace/marketplace.did"
import type { Collection } from "@/declarations/registry/registry.did"
import type { ICRC3Value, Permission } from "@/canisters/icrc7_nft/core_nft.did"

interface CanisterInfo {
  name: string
  symbol: string
  description: string
  logo: string | null
  totalSupply: bigint
  supplyCap: bigint | null
}

interface NFTToken {
  id: bigint
  imageUrl: string | null
  name: string | null
}

const PERMISSION_OPTIONS: { value: string; label: string }[] = [
  { value: "Minting", label: "Minting" },
  { value: "UpdateMetadata", label: "Update Metadata" },
  { value: "UpdateCollectionMetadata", label: "Update Collection Metadata" },
  { value: "UpdateUploads", label: "Update Uploads" },
  { value: "ManageAuthorities", label: "Manage Authorities" },
  { value: "ReadUploads", label: "Read Uploads" },
]

function permissionToVariant(value: string): Permission {
  switch (value) {
    case "Minting": return { Minting: null }
    case "UpdateMetadata": return { UpdateMetadata: null }
    case "UpdateCollectionMetadata": return { UpdateCollectionMetadata: null }
    case "UpdateUploads": return { UpdateUploads: null }
    case "ManageAuthorities": return { ManageAuthorities: null }
    case "ReadUploads": return { ReadUploads: null }
    default: return { Minting: null }
  }
}

function permissionToString(p: Permission): string {
  if ("Minting" in p) return "Minting"
  if ("UpdateMetadata" in p) return "Update Metadata"
  if ("UpdateCollectionMetadata" in p) return "Update Collection Metadata"
  if ("UpdateUploads" in p) return "Update Uploads"
  if ("ManageAuthorities" in p) return "Manage Authorities"
  if ("ReadUploads" in p) return "Read Uploads"
  return "Unknown"
}

function extractImageUrl(metadata: Array<[string, ICRC3Value]>): string | null {
  for (const [key, value] of metadata) {
    if (key === "icrc7:metadata:uri:image" && "Text" in value) {
      return value.Text
    }
  }
  return null
}

function extractName(metadata: Array<[string, ICRC3Value]>): string | null {
  for (const [key, value] of metadata) {
    if (key === "icrc7:metadata:uri:name" && "Text" in value) {
      return value.Text
    }
  }
  return null
}

export default function ICPCollectionManagePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { identity, isAuthenticated } = useAuth()

  const [registryCollection, setRegistryCollection] = useState<Collection | null>(null)
  const [marketplace, setMarketplace] = useState<CollectionInfo | null>(null)
  const [canisterId, setCanisterId] = useState<string | null>(null)
  const [registryId, setRegistryId] = useState<string | null>(null)
  const [canisterInfo, setCanisterInfo] = useState<CanisterInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nftActor, setNftActor] = useState<any>(null)

  const [tokens, setTokens] = useState<NFTToken[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [tokenPage, setTokenPage] = useState(0)
  const TOKENS_PER_PAGE = 20

  const [copied, setCopied] = useState<string | null>(null)

  // Mint modal
  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [minting, setMinting] = useState(false)
  const [mintProgress, setMintProgress] = useState(0)
  const [mintStatus, setMintStatus] = useState("")

  // Permissions
  const [permPrincipal, setPermPrincipal] = useState("")
  const [permType, setPermType] = useState("Minting")
  const [grantingPerm, setGrantingPerm] = useState(false)
  const [revokingPerm, setRevokingPerm] = useState(false)
  const [lookupPrincipal, setLookupPrincipal] = useState("")
  const [lookupPermissions, setLookupPermissions] = useState<Permission[] | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

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
      setRegistryId(regCollection.id)

      const icpData = "ICP" in regCollection.chain_data ? regCollection.chain_data.ICP : null
      if (!icpData?.canister_id?.[0]) {
        setError("Invalid ICP collection data")
        return
      }

      const collectionPrincipal = icpData.canister_id[0]
      const collectionCanisterId = collectionPrincipal.toText()
      setCanisterId(collectionCanisterId)

      // Fetch marketplace info (for status, floor price, volume)
      const marketActor = await getICPMarketplaceActor(identity)
      const marketResult = await marketActor.get_collection_info(collectionPrincipal)
      if ("Ok" in marketResult) {
        setMarketplace(marketResult.Ok)
      }

      // Fetch real data from the collection canister
      const actor = await getICRC7NftActor(identity, collectionCanisterId)
      setNftActor(actor)

      const [name, symbol, description, logo, totalSupply, supplyCap] = await Promise.all([
        actor.icrc7_name(),
        actor.icrc7_symbol(),
        actor.icrc7_description(),
        actor.icrc7_logo(),
        actor.icrc7_total_supply(),
        actor.icrc7_supply_cap(),
      ])

      setCanisterInfo({
        name,
        symbol,
        description: description?.[0] || "",
        logo: logo?.[0] || null,
        totalSupply,
        supplyCap: supplyCap?.[0] ?? null,
      })

      await fetchTokens(actor)
    } catch (err) {
      console.error("Error fetching collection:", err)
      setError("Failed to load collection data")
    } finally {
      setLoading(false)
    }
  }

  const fetchTokens = async (actor: any) => {
    if (!actor) return
    setLoadingTokens(true)
    try {
      // Paginate through all token IDs (default take is only 10)
      const pageSize = BigInt(100)
      const allTokenIds: bigint[] = []
      let prev: [] | [bigint] = []

      while (true) {
        const batch: bigint[] = await actor.icrc7_tokens(prev, [pageSize])
        if (batch.length === 0) break
        allTokenIds.push(...batch)
        prev = [batch[batch.length - 1]]
        if (batch.length < Number(pageSize)) break
      }

      if (allTokenIds.length === 0) {
        setTokens([])
        return
      }

      // Fetch metadata in batches of 100
      const allTokens: NFTToken[] = []
      for (let i = 0; i < allTokenIds.length; i += 100) {
        const batch = allTokenIds.slice(i, i + 100)
        const metadataResults: Array<[] | [Array<[string, ICRC3Value]>]> = await actor.icrc7_token_metadata(batch)

        for (let j = 0; j < batch.length; j++) {
          const meta = metadataResults[j]
          const metadata = meta && meta.length > 0 ? meta[0] : null
          allTokens.push({
            id: batch[j],
            imageUrl: metadata ? extractImageUrl(metadata) : null,
            name: metadata ? extractName(metadata) : null,
          })
        }
      }

      setTokens(allTokens)
      setTokenPage(0)
    } catch (err) {
      console.error("Error fetching tokens:", err)
    } finally {
      setLoadingTokens(false)
    }
  }

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied`)
    setTimeout(() => setCopied(null), 2000)
  }, [])

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

  const formatICP = (e8s: bigint) => (Number(e8s) / 100_000_000).toFixed(4)

  // --- Mint Modal ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files)
    setUploadFiles(prev => {
      const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`))
      const unique = newFiles.filter(f => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`))
      return [...prev, ...unique]
    })
    e.target.value = ""
  }

  const handleMint = async () => {
    if (!nftActor || !identity || !canisterInfo || uploadFiles.length === 0) return

    setMinting(true)
    setMintProgress(0)
    setMintStatus("Preparing files...")

    try {
      const userPrincipal = identity.getPrincipal()

      const preparedFiles = await prepareFilesForBatchUpload(
        uploadFiles,
        canisterInfo.name,
        (index) => [
          { trait_type: "Collection", value: canisterInfo.name },
          { trait_type: "Number", value: Number(canisterInfo.totalSupply) + index + 1 },
        ]
      )

      const uploadResults = await batchUploadAssets(
        nftActor,
        preparedFiles,
        (current, total, status) => {
          setMintProgress((current / total) * 70)
          setMintStatus(status)
        }
      )

      const mintRequests = uploadResults.map(({ metadataUrl, imageUrl, name }) => ({
        owner: userPrincipal,
        metadata: metadataUrlToICRC3Value(metadataUrl, imageUrl),
        memo: name,
      }))

      setMintStatus(`Minting ${mintRequests.length} NFTs...`)
      setMintProgress(70)

      await mintNFTBatch(nftActor, mintRequests, (current, total) => {
        setMintProgress(70 + (current / total) * 30)
        setMintStatus(`Minting: ${current}/${total}`)
      })

      setMintProgress(100)
      setMintStatus("Complete!")
      toast.success(`Minted ${uploadFiles.length} NFTs!`)

      setUploadFiles([])
      setMintModalOpen(false)
      setMintProgress(0)
      setMintStatus("")

      // Refresh data
      await fetchCollectionData()
    } catch (err) {
      console.error("Minting error:", err)
      toast.error("Failed to mint NFTs. You can retry.")
      setMintStatus("")
    } finally {
      setMinting(false)
    }
  }

  // --- Permissions ---
  const handleGrantPermission = async () => {
    if (!nftActor || !permPrincipal.trim()) return
    setGrantingPerm(true)
    try {
      const principal = Principal.fromText(permPrincipal.trim())
      const permission = permissionToVariant(permType)
      const result = await nftActor.grant_permission({ principal, permission })
      if ("Ok" in result) {
        toast.success(`Granted ${permType} permission`)
        setPermPrincipal("")
      } else {
        toast.error(`Failed: ${JSON.stringify(result.Err)}`)
      }
    } catch (err) {
      toast.error("Invalid principal or request failed")
    } finally {
      setGrantingPerm(false)
    }
  }

  const handleRevokePermission = async () => {
    if (!nftActor || !permPrincipal.trim()) return
    setRevokingPerm(true)
    try {
      const principal = Principal.fromText(permPrincipal.trim())
      const permission = permissionToVariant(permType)
      const result = await nftActor.revoke_permission({ principal, permission })
      if ("Ok" in result) {
        toast.success(`Revoked ${permType} permission`)
        setPermPrincipal("")
      } else {
        toast.error(`Failed: ${JSON.stringify(result.Err)}`)
      }
    } catch (err) {
      toast.error("Invalid principal or request failed")
    } finally {
      setRevokingPerm(false)
    }
  }

  const handleLookupPermissions = async () => {
    if (!nftActor || !lookupPrincipal.trim()) return
    setLookingUp(true)
    setLookupPermissions(null)
    try {
      const principal = Principal.fromText(lookupPrincipal.trim())
      const result = await nftActor.get_user_permissions({ principal })
      if ("Ok" in result) {
        setLookupPermissions(result.Ok)
      } else {
        toast.error("Failed to fetch permissions")
      }
    } catch (err) {
      toast.error("Invalid principal")
    } finally {
      setLookingUp(false)
    }
  }

  // --- Activate ---
  const handleActivateCollection = async () => {
    if (!identity || !marketplace) return
    try {
      const marketActor = await getICPMarketplaceActor(identity)
      const result = await marketActor.activate_collection(marketplace.id)
      if ("Ok" in result) {
        toast.success("Collection activated!")
        await fetchCollectionData()
      } else {
        toast.error(`Failed: ${Object.keys(result.Err)[0]}`)
      }
    } catch (err) {
      console.error("Activation error:", err)
      toast.error("Failed to activate collection")
    }
  }

  // --- Loading / Error states ---
  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    )
  }

  if (error || !canisterInfo) {
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
        {/* Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                {canisterInfo.logo ? (
                  <img src={canisterInfo.logo} alt={canisterInfo.name} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{canisterInfo.symbol}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold">{canisterInfo.name}</h1>
                    <Badge variant="secondary">{canisterInfo.symbol}</Badge>
                  </div>
                  {canisterInfo.description && (
                    <p className="text-sm text-muted-foreground mt-1 max-w-lg">{canisterInfo.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {marketplace && (
                  <Badge className={getStatusColor(marketplace.status)}>
                    {getStatusText(marketplace.status)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Button onClick={() => setMintModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Mint NFTs
              </Button>
              <Button variant="outline" onClick={() => router.push(`/nft/collections/icp/${slug}`)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Collection
              </Button>
              <Button variant="outline" onClick={fetchCollectionData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {marketplace && "AssetsPending" in marketplace.status && tokens.length > 0 && (
                <Button onClick={handleActivateCollection} variant="outline" className="ml-auto border-primary/50 text-primary hover:bg-primary/10">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate for Trading
                </Button>
              )}
              {marketplace && "Paused" in marketplace.status && (
                <Button onClick={handleActivateCollection} className="ml-auto bg-green-600 hover:bg-green-700">
                  Reactivate Collection
                </Button>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Minted</p>
                <p className="text-xl font-semibold">{canisterInfo.totalSupply.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supply Cap</p>
                <p className="text-xl font-semibold">
                  {canisterInfo.supplyCap !== null ? canisterInfo.supplyCap.toString() : "Unlimited"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Floor Price</p>
                <p className="text-xl font-semibold">
                  {marketplace?.floor_price?.[0] ? `${formatICP(marketplace.floor_price[0])} ICP` : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl font-semibold">
                  {marketplace ? `${formatICP(marketplace.total_volume)} ICP` : "--"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banned notice */}
        {marketplace && "Banned" in marketplace.status && (
          <Card className="border-red-300 dark:border-red-800">
            <CardContent className="p-6">
              <p className="text-red-600 dark:text-red-400">
                This collection has been banned. Contact support for more information.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="nfts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              NFTs ({tokens.length})
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* NFTs Tab */}
          <TabsContent value="nfts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Minted NFTs</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => nftActor && fetchTokens(nftActor)}
                    disabled={loadingTokens}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingTokens ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTokens ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No NFTs minted yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => setMintModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Mint your first NFTs
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {tokens.slice(tokenPage * TOKENS_PER_PAGE, (tokenPage + 1) * TOKENS_PER_PAGE).map((token) => (
                        <div key={token.id.toString()} className="border rounded-lg overflow-hidden group hover:border-primary transition-colors">
                          {token.imageUrl ? (
                            <img
                              src={token.imageUrl}
                              alt={token.name || `#${token.id.toString()}`}
                              className="w-full aspect-square object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-muted flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">
                              {token.name || `${canisterInfo.name} #${token.id.toString()}`}
                            </p>
                            <p className="text-xs text-muted-foreground">Token #{token.id.toString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {tokens.length > TOKENS_PER_PAGE && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {tokenPage * TOKENS_PER_PAGE + 1}–{Math.min((tokenPage + 1) * TOKENS_PER_PAGE, tokens.length)} of {tokens.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={tokenPage === 0}
                            onClick={() => setTokenPage(p => p - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={(tokenPage + 1) * TOKENS_PER_PAGE >= tokens.length}
                            onClick={() => setTokenPage(p => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Manage Permissions</CardTitle>
                <CardDescription>
                  Grant or revoke permissions for other principals on this collection canister.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grant / Revoke */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Grant or Revoke Permission</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Principal ID</Label>
                      <Input
                        placeholder="e.g. aaaaa-aa"
                        value={permPrincipal}
                        onChange={(e) => setPermPrincipal(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Permission</Label>
                      <Select value={permType} onValueChange={setPermType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERMISSION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGrantPermission}
                      disabled={!permPrincipal.trim() || grantingPerm}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {grantingPerm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Grant
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRevokePermission}
                      disabled={!permPrincipal.trim() || revokingPerm}
                    >
                      {revokingPerm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                      Revoke
                    </Button>
                  </div>
                </div>

                {/* Lookup */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Lookup Permissions</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter principal to look up"
                      value={lookupPrincipal}
                      onChange={(e) => setLookupPrincipal(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleLookupPermissions} disabled={!lookupPrincipal.trim() || lookingUp} variant="outline">
                      {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                    </Button>
                  </div>
                  {lookupPermissions !== null && (
                    <div className="mt-3">
                      {lookupPermissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No permissions found for this principal.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {lookupPermissions.map((perm, i) => (
                            <Badge key={i} variant="secondary">
                              {permissionToString(perm)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Granting <strong>Minting</strong> permission allows a principal to mint new NFTs.
                      <strong> ManageAuthorities</strong> allows them to grant/revoke permissions for others.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Collection Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <DetailRow
                    label="Canister ID"
                    value={canisterId || ""}
                    copyable
                    onCopy={() => canisterId && handleCopy(canisterId, "Canister ID")}
                    copied={copied === "Canister ID"}
                  />
                  {registryId && (
                    <DetailRow
                      label="Registry ID"
                      value={registryId}
                      copyable
                      onCopy={() => handleCopy(registryId, "Registry ID")}
                      copied={copied === "Registry ID"}
                    />
                  )}
                  <DetailRow label="Standard" value="ICRC7 / ICRC37" />
                  <DetailRow label="Name" value={canisterInfo.name} />
                  <DetailRow label="Symbol" value={canisterInfo.symbol} />
                  <DetailRow
                    label="Supply"
                    value={`${canisterInfo.totalSupply.toString()} / ${canisterInfo.supplyCap !== null ? canisterInfo.supplyCap.toString() : "Unlimited"}`}
                  />
                  <DetailRow
                    label="Status"
                    value={marketplace ? getStatusText(marketplace.status) : "Unknown"}
                  />
                  <DetailRow label="Storage" value="On-chain (canister)" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mint Modal */}
        <Dialog open={mintModalOpen} onOpenChange={(open) => { if (!minting) setMintModalOpen(open) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Mint NFTs</DialogTitle>
              <DialogDescription>
                Upload images and mint them as NFTs. Files are stored on-chain in the collection canister.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Images</Label>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{uploadFiles.length} file(s) selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setUploadFiles([])} disabled={minting}>
                      Clear
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                    {uploadFiles.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="border rounded p-1">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full aspect-square object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {minting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{mintStatus}</span>
                    <span>{Math.round(mintProgress)}%</span>
                  </div>
                  <Progress value={mintProgress} className="h-2" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setMintModalOpen(false)} disabled={minting}>
                Cancel
              </Button>
              <Button
                onClick={handleMint}
                disabled={uploadFiles.length === 0 || minting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {minting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Minting...</>
                ) : (
                  `Mint ${uploadFiles.length} NFTs`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}

function DetailRow({
  label,
  value,
  copyable,
  onCopy,
  copied,
}: {
  label: string
  value: string
  copyable?: boolean
  onCopy?: () => void
  copied?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">{value}</span>
        {copyable && onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
