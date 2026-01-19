"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Search,
  LayoutGrid,
  LayoutList,
  ExternalLink,
  Share2,
  Heart,
  Loader2,
  Copy,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { toast } from "sonner"
import type { Collection, EthereumCollectionData } from "@/declarations/registry/registry.did"

interface NFTMetadata {
  name: string
  description?: string
  image: string
  attributes?: Array<{ trait_type: string; value: string }>
}

const getExplorerUrl = (chainId: number, address: string) => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    8453: "https://basescan.org",
    137: "https://polygonscan.com",
    42161: "https://arbiscan.io",
    11155111: "https://sepolia.etherscan.io",
    84532: "https://sepolia.basescan.org",
  }
  return `${explorers[chainId] || "https://etherscan.io"}/address/${address}`
}

const formatEth = (weiValue: bigint) => {
  return (Number(weiValue) / 1e18).toFixed(4)
}

export default function EthereumCollectionPage() {
  const params = useParams()
  const slug = params.slug as string
  const { identity, isAuthenticated } = useAuth()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [nfts, setNfts] = useState<NFTMetadata[]>([])
  const [loadingNfts, setLoadingNfts] = useState(false)

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const ethData = useMemo(() => {
    if (!collection) return null
    return "Ethereum" in collection.chain_data ? collection.chain_data.Ethereum : null
  }, [collection])

  const contractType = useMemo(() => {
    if (!ethData) return null
    return "ERC721" in ethData.contract_type ? "ERC-721" : "ERC-1155"
  }, [ethData])

  useEffect(() => {
    if (slug) {
      fetchCollection()
    }
  }, [slug, identity])

  useEffect(() => {
    if (ethData?.manifest_url?.[0]) {
      fetchNFTsFromManifest(ethData.manifest_url[0])
    }
  }, [ethData])

  const fetchCollection = async () => {
    setLoading(true)
    setError(null)
    try {
      const actor = await getRegistryActor(identity)
      const result = await actor.get_collection_by_slug(slug)

      const collectionData = result[0]
      if (collectionData) {
        setCollection(collectionData)
      } else {
        setError("Collection not found")
      }
    } catch (err) {
      console.error("Error fetching collection:", err)
      setError("Failed to load collection")
    } finally {
      setLoading(false)
    }
  }

  const fetchNFTsFromManifest = async (manifestUrl: string) => {
    setLoadingNfts(true)
    try {
      const res = await fetch(manifestUrl)
      const manifest = await res.json()

      if (manifest.properties?.files) {
        const nftPromises = manifest.properties.files.slice(0, 50).map(async (file: { uri: string }) => {
          try {
            const metaRes = await fetch(file.uri)
            return await metaRes.json()
          } catch {
            return null
          }
        })
        const results = await Promise.all(nftPromises)
        setNfts(results.filter(Boolean))
      }
    } catch (err) {
      console.error("Failed to fetch NFTs from manifest:", err)
    } finally {
      setLoadingNfts(false)
    }
  }

  const copyAddress = () => {
    if (ethData?.contract_address?.[0]) {
      navigator.clipboard.writeText(ethData.contract_address[0])
      setCopied(true)
      toast.success("Address copied")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const filteredNFTs = useMemo(() => {
    if (!searchQuery) return nfts
    return nfts.filter(nft => nft.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [nfts, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error || "Collection not found"}</p>
            <Button asChild>
              <Link href="/nft/collections">Back to Collections</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-48 md:h-64 w-full">
          {collection.banner_url?.[0] ? (
            <Image src={collection.banner_url[0]} alt={collection.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              {collection.image_url ? (
                <Image src={collection.image_url} alt={collection.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{collection.symbol}</span>
                </div>
              )}
            </div>

            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
                    {collection.is_verified && (
                      <Badge variant="secondary" className="text-sm">✓ Verified</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2">{collection.symbol}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {ethData?.chain_name || "Ethereum"}
                    </Badge>
                    {contractType && (
                      <Badge variant="outline">{contractType}</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{collection.royalty_bps / 100}% royalty</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{collection.description}</p>

                  {ethData?.contract_address?.[0] && (
                    <div className="flex items-center gap-2 mt-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {ethData.contract_address[0].slice(0, 6)}...{ethData.contract_address[0].slice(-4)}
                      </code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                        {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open(getExplorerUrl(Number(ethData.chain_id), ethData.contract_address![0]!), "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {ethData?.mint_price_wei?.[0] !== undefined && (
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Mint Price</div>
            <div className="text-2xl font-bold">{formatEth(ethData.mint_price_wei[0])} ETH</div>
          </Card>
        )}
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {contractType === "ERC-1155" ? "Max Supply" : "Total Supply"}
          </div>
          <div className="text-2xl font-bold">
            {ethData?.max_supply === BigInt(0) ? "∞" : Number(ethData?.max_supply || collection.total_supply)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Items</div>
          <div className="text-2xl font-bold">{nfts.length || "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Royalty</div>
          <div className="text-2xl font-bold">{collection.royalty_bps / 100}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="text-xl font-bold">
            {"Active" in collection.status && <span className="text-green-600">Active</span>}
            {"Draft" in collection.status && <span className="text-yellow-600">Draft</span>}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="items" className="mb-8">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {loadingNfts ? "Loading..." : `${filteredNFTs.length} items`}
            </div>
          </div>

          {loadingNfts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredNFTs.length > 0 ? (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "space-y-4"
            )}>
              {filteredNFTs.map((nft, index) => (
                <Card key={index} className="overflow-hidden group">
                  <div className="aspect-square bg-muted relative">
                    {nft.image ? (
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">#{index}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium truncate">{nft.name || `#${index}`}</h3>
                    {nft.attributes && nft.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {nft.attributes.slice(0, 2).map((attr, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No items found</div>
              <p className="text-sm text-muted-foreground">
                {ethData?.manifest_url?.[0] ? "Failed to load NFTs from manifest" : "No manifest URL available"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Activity Coming Soon</div>
            <p className="text-sm text-muted-foreground">View collection trading history and events</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
