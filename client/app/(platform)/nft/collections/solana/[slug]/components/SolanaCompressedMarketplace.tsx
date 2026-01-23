"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Search, LayoutGrid, LayoutList, ExternalLink, Share2, Heart, MoreHorizontal, Loader2, TreePine, Flame, Rocket } from "lucide-react"
import { toast } from "sonner"
import { useWallet } from "@solana/wallet-adapter-react"
import { useConnection } from "@solana/wallet-adapter-react"
import type { Collection as CanisterCollection } from "@/declarations/registry/registry.did"
import { getSolanaExplorerUrl } from "@/constants/solana"
import CompressedNFTDetailModal from "./compressed-nft-detail-modal"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface CompressedNFT {
  id: string
  name: string
  image: string
  description?: string
  owner: string
  attributes?: Array<{ trait_type: string; value: string }>
  compression?: {
    compressed: boolean
    tree: string
    leafIndex: number
  }
}

interface Props {
  collection: CanisterCollection
}

const getValidImageUrl = (url: string | undefined | null): string | null => {
  if (!url || url.trim() === '') return null
  if (url.startsWith('http') || url.startsWith('ipfs://') || url.startsWith('ar://')) return url
  return null
}

export default function SolanaCompressedMarketplace({ collection }: Props) {
  const wallet = useWallet()
  const { publicKey, connected } = wallet
  const { connection } = useConnection()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [nfts, setNfts] = useState<CompressedNFT[]>([])
  const [isLoadingNfts, setIsLoadingNfts] = useState(true)
  const [selectedDetailNFT, setSelectedDetailNFT] = useState<CompressedNFT | null>(null)
  const [totalMinted, setTotalMinted] = useState(0)
  const [isLoadingMintStatus, setIsLoadingMintStatus] = useState(true)
  const [manifest, setManifest] = useState<any>(null)

  const collectionImageUrl = getValidImageUrl(collection.image_url) || getValidImageUrl(manifest?.image)
  const bannerImageUrl = getValidImageUrl(collection.banner_url?.[0]) || getValidImageUrl(manifest?.banner) || collectionImageUrl

  const solanaData = 'Solana' in collection.chain_data && 'Compressed' in collection.chain_data.Solana
    ? collection.chain_data.Solana.Compressed
    : null
  const collectionMint = solanaData?.collection_mint?.[0] || null
  const merkleTree = solanaData?.merkle_tree_address?.[0] || null
  const manifestUrl = solanaData?.manifest_url?.[0] || null

  const totalSupply = Number(collection.total_supply) || 0
  const mintPrice = Number(collection.mint_price?.[0] || 0) / 1e9

  const fetchMintedCount = async () => {
    setIsLoadingMintStatus(true)
    if (!collectionMint) {
      setIsLoadingMintStatus(false)
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=1&limit=1&compressed=true`)
      if (response.ok) {
        const data = await response.json()
        setTotalMinted(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch minted count:", error)
    } finally {
      setIsLoadingMintStatus(false)
    }
  }

  const getMintStatus = (): "live" | "sold_out" => {
    if (totalSupply > 0 && totalMinted >= totalSupply) return "sold_out"
    return "live"
  }

  useEffect(() => {
    if (collectionMint || merkleTree) {
      loadNFTs()
    } else {
      setIsLoadingMintStatus(false)
    }
    if (manifestUrl) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(data => setManifest(data))
        .catch(err => console.error("Failed to fetch manifest:", err))
    }
  }, [collectionMint, merkleTree, manifestUrl])

  const loadNFTs = async () => {
    try {
      setIsLoadingNfts(true)
      setIsLoadingMintStatus(true)

      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

      // Try to fetch by collection first
      if (collectionMint) {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "get-assets",
            method: "getAssetsByGroup",
            params: {
              groupKey: "collection",
              groupValue: collectionMint,
              page: 1,
              limit: 100,
            },
          }),
        })

        const data = await response.json()
        const items = data.result?.items || []
        const rpcTotal = data.result?.total || items.length

        if (items.length > 0) {
          setTotalMinted(rpcTotal)
          const compressedNfts = await Promise.all(
            items.map(async (item: any) => {
              let image = item.content?.links?.image || item.content?.files?.[0]?.uri || ""
              const jsonUri = item.content?.json_uri || ""

              if (!image && jsonUri) {
                try {
                  const metaRes = await fetch(jsonUri)
                  const meta = await metaRes.json()
                  image = meta.image || ""
                } catch (e) {}
              }

              return {
                id: item.id,
                name: item.content?.metadata?.name || "Unnamed",
                image,
                description: item.content?.metadata?.description,
                owner: item.ownership?.owner || "",
                attributes: item.content?.metadata?.attributes,
                compression: item.compression ? {
                  compressed: item.compression.compressed,
                  tree: item.compression.tree,
                  leafIndex: item.compression.leaf_id,
                } : undefined,
              }
            })
          )
          setNfts(compressedNfts)
          return
        }
      }

      // Fallback: try to load from manifest
      if (manifestUrl) {
        const res = await fetch(manifestUrl)
        const manifest = await res.json()
        if (manifest.properties?.files) {
          const nftPromises = manifest.properties.files.slice(0, 100).map(async (file: { uri: string }, index: number) => {
            try {
              const metaRes = await fetch(file.uri)
              const meta = await metaRes.json()
              return {
                id: `${merkleTree || collectionMint}-${index}`,
                name: meta.name || `#${index + 1}`,
                image: meta.image || "",
                description: meta.description,
                owner: "",
                attributes: meta.attributes,
              }
            } catch { return null }
          })
          const results = await Promise.all(nftPromises)
          setNfts(results.filter(Boolean) as CompressedNFT[])
        }
      }
    } catch (error) {
      console.error("Failed to fetch compressed NFTs:", error)
    } finally {
      setIsLoadingNfts(false)
      setIsLoadingMintStatus(false)
    }
  }

  const filteredNFTs = useMemo(() => {
    let filtered = nfts
    if (statusFilter === "owned" && publicKey) {
      filtered = filtered.filter(nft => nft.owner === publicKey.toString())
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft => nft.name?.toLowerCase().includes(query))
    }
    return filtered
  }, [nfts, searchQuery, statusFilter, publicKey])

  return (
    <div className="container mx-auto px-4 pt-8 pb-16">
      {/* Collection Banner */}
      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-64 md:h-80 w-full">
          {bannerImageUrl ? (
            <Image src={bannerImageUrl} alt={collection.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              {collectionImageUrl ? (
                <Image src={collectionImageUrl} alt={collection.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {collection.symbol?.slice(0, 2) || collection.name?.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
                    {collection.is_verified && <Badge variant="secondary" className="text-sm">✓ Verified</Badge>}
                  </div>
                  <p className="text-muted-foreground mb-2">
                    by <Link href={`/profile/${collection.creator.toText()}`} className="hover:underline font-medium">{collection.creator.toText().substring(0, 8)}...</Link>
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Solana</Badge>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      <TreePine className="h-3 w-3 mr-1" />
                      Compressed
                    </Badge>
                    <span className="text-sm text-muted-foreground">{(Number(collection.royalty_bps) / 100).toFixed(1)}% royalty</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => merkleTree && window.open(getSolanaExplorerUrl(merkleTree), '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
          <div className="text-2xl font-bold">{Number(collection.total_supply) || nfts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Minted</div>
          <div className="text-2xl font-bold">{totalMinted > 0 ? totalMinted : nfts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Owners</div>
          <div className="text-2xl font-bold">{new Set(nfts.map(n => n.owner).filter(Boolean)).size}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Mint Cost</div>
          <div className="text-2xl font-bold text-green-600">~0.00005 SOL</div>
        </Card>
      </div>

      {/* Mint Status Card */}
      {!isLoadingMintStatus && getMintStatus() === "live" && (
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Flame className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">Minting Live</h3>
                    <Badge className="bg-orange-500 text-white">
                      <Flame className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalSupply > 0 ? `${totalSupply - totalMinted} remaining` : "Open edition"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{mintPrice > 0 ? `${mintPrice} SOL` : "~0.00005 SOL"}</div>
                  <div className="text-sm text-muted-foreground">per NFT</div>
                </div>
                <Link href={`/nft/launchpad/solana/${collection.slug}`}>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <Rocket className="h-4 w-4 mr-2" />
                    Mint Now
                  </Button>
                </Link>
              </div>
            </div>

            {totalSupply > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Mint Progress</span>
                  <span className="font-medium">{totalMinted} / {totalSupply}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${(totalMinted / totalSupply) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}


      {/* Tabs */}
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
                <Input placeholder="Search by name..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="owned">Owned by Me</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}><LayoutList className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{isLoadingNfts ? "Loading..." : `${filteredNFTs.length} items`}</div>
          </div>

          {isLoadingNfts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className={cn(viewMode === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "space-y-4")}>
              {filteredNFTs.map((nft) => {
                const isOwnedByUser = connected && publicKey && nft.owner === publicKey.toString()

                return (
                  <Card key={nft.id} className="group overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedDetailNFT(nft)}>
                      {nft.image ? (
                        <Image src={nft.image} alt={nft.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">
                          {nft.name?.slice(0, 2) || "?"}
                        </div>
                      )}
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700 dark:text-green-300">
                          <TreePine className="h-3 w-3 mr-1" />
                          cNFT
                        </Badge>
                      </div>
                      {isOwnedByUser && <div className="absolute bottom-2 left-2"><Badge className="text-xs">Owned</Badge></div>}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{nft.id.slice(0, 8)}...{nft.id.slice(-4)}</p>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Owner</div>
                          <div className="font-bold text-sm">
                            {nft.owner ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}` : "Unknown"}
                          </div>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!isLoadingNfts && filteredNFTs.length === 0 && (
            <div className="text-center py-12">
              <TreePine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="text-muted-foreground mb-2">No compressed NFTs found</div>
              <p className="text-sm text-muted-foreground">
                {nfts.length === 0 ? "No NFTs have been minted yet" : "Try adjusting your filters"}
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

      {/* Detail Modal */}
      {selectedDetailNFT && (
        <CompressedNFTDetailModal
          isOpen={!!selectedDetailNFT}
          onClose={() => setSelectedDetailNFT(null)}
          nft={selectedDetailNFT}
          collectionName={collection.name}
          isOwner={connected && publicKey ? selectedDetailNFT.owner === publicKey.toString() : false}
        />
      )}
    </div>
  )
}
