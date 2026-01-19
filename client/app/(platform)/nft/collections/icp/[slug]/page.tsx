"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Principal } from "@dfinity/principal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  LayoutList,
  ExternalLink,
  Share2,
  Heart,
  MoreHorizontal,
  Loader2,
  Settings,
} from "lucide-react"
import { useAuth } from "@/providers/auth-context"
import { getICPMarketplaceActor, getICRC7NftActor, getRegistryActor } from "@/providers/actors/marketplace"
import { toast } from "sonner"
import type { CollectionInfo, ListingInfo } from "@/declarations/marketplace/marketplace.did"
import type { Collection } from "@/declarations/registry/registry.did"
import type { ICRC3Value } from "@/declarations/icrc7_nft/core_nft.did"

interface NFTData {
  tokenId: bigint
  name: string
  image: string
  metadata: Array<[string, ICRC3Value]>
  owner: string
  listing?: ListingInfo
}

export default function ICPCollectionPage() {
  const params = useParams()
  const slug = params.slug as string
  const { identity, isAuthenticated } = useAuth()

  const [registryCollection, setRegistryCollection] = useState<Collection | null>(null)
  const [collection, setCollection] = useState<CollectionInfo | null>(null)
  const [canisterId, setCanisterId] = useState<string | null>(null)
  const [nfts, setNfts] = useState<NFTData[]>([])
  const [listings, setListings] = useState<ListingInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingNfts, setLoadingNfts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("price-low")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedNft, setSelectedNft] = useState<NFTData | null>(null)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchCollectionData()
    }
  }, [slug, identity])

  const fetchCollectionData = async () => {
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

      const collectionResult = await marketActor.get_collection_info(principal)
      if ("Ok" in collectionResult) {
        setCollection(collectionResult.Ok)
      } else {
        setError("Collection not found in marketplace")
        return
      }

      const listingsResult = await marketActor.get_listings_by_collection(principal, [], [])
      if (listingsResult.listings) {
        setListings(listingsResult.listings.filter((l) => "Active" in l.status))
      }

      await fetchNFTs(collectionCanisterId)
    } catch (err) {
      console.error("Error fetching collection:", err)
      setError("Failed to load collection")
    } finally {
      setLoading(false)
    }
  }

  const fetchNFTs = async (nftCanisterId: string) => {
    setLoadingNfts(true)
    try {
      const nftActor = await getICRC7NftActor(identity, nftCanisterId)

      const tokenIds = await nftActor.icrc7_tokens([], [BigInt(100)])
      if (tokenIds.length === 0) {
        setNfts([])
        return
      }

      const metadataResults = await nftActor.icrc7_token_metadata(tokenIds)
      const ownerResults = await nftActor.icrc7_owner_of(tokenIds)

      const nftData: NFTData[] = []

      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i]
        const metadata = metadataResults[i]?.[0] || []
        const owner = ownerResults[i]?.[0]

        let name = `#${tokenId.toString()}`
        let image = ""

        for (const [key, value] of metadata) {
          if (key === "icrc7:metadata:uri:image" && "Text" in value) {
            image = value.Text
          }
          if (key === "icrc7:token:metadata" && "Text" in value) {
            try {
              const metadataUrl = value.Text
              if (metadataUrl.startsWith("http")) {
                image = image || metadataUrl
              }
            } catch {}
          }
        }

        const listing = listings.find(
          (l) => l.token_id === tokenId && l.collection_id.toString() === canisterId
        )

        nftData.push({
          tokenId,
          name: collection ? `${collection.name} ${name}` : name,
          image,
          metadata,
          owner: owner ? owner.owner.toString() : "Unknown",
          listing,
        })
      }

      setNfts(nftData)
    } catch (err) {
      console.error("Error fetching NFTs:", err)
    } finally {
      setLoadingNfts(false)
    }
  }

  const handleBuyNFT = async (nft: NFTData) => {
    if (!nft.listing || !identity || !isAuthenticated) {
      toast.error("Please connect your wallet")
      return
    }

    setBuying(true)
    try {
      const marketActor = await getICPMarketplaceActor(identity)
      const result = await marketActor.buy_nft({ listing_id: nft.listing.listing_id })

      if ("Ok" in result) {
        toast.success("NFT purchased successfully!")
        setBuyModalOpen(false)
        await fetchCollectionData()
      } else {
        const errorKey = Object.keys(result.Err)[0]
        toast.error(`Purchase failed: ${errorKey}`)
      }
    } catch (err) {
      console.error("Buy error:", err)
      toast.error("Failed to purchase NFT")
    } finally {
      setBuying(false)
    }
  }

  const formatICP = (e8s: bigint) => {
    return (Number(e8s) / 100_000_000).toFixed(4)
  }

  const filteredNFTs = useMemo(() => {
    let filtered = nfts

    if (statusFilter === "listed") {
      filtered = filtered.filter((nft) => nft.listing)
    } else if (statusFilter === "unlisted") {
      filtered = filtered.filter((nft) => !nft.listing)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((nft) => nft.name.toLowerCase().includes(query))
    }

    if (sortBy === "price-low") {
      filtered = [...filtered].sort((a, b) => {
        const priceA = a.listing ? Number(a.listing.price) : Infinity
        const priceB = b.listing ? Number(b.listing.price) : Infinity
        return priceA - priceB
      })
    } else if (sortBy === "price-high") {
      filtered = [...filtered].sort((a, b) => {
        const priceA = a.listing ? Number(a.listing.price) : 0
        const priceB = b.listing ? Number(b.listing.price) : 0
        return priceB - priceA
      })
    }

    return filtered
  }, [nfts, searchQuery, statusFilter, sortBy])

  const isOwner = collection && identity && collection.creator.toString() === identity.getPrincipal().toString()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild>
          <Link href="/nft/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>

        {isOwner && (
          <Button variant="outline" asChild>
            <Link href={`/nft/collections/icp/manage/${slug}`}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Collection
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-48 md:h-64 w-full bg-gradient-to-br from-purple-500 to-indigo-600">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              {collection.logo?.[0] ? (
                <Image src={collection.logo[0]} alt={collection.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{collection.symbol}</span>
                </div>
              )}
            </div>

            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
                  </div>
                  <p className="text-muted-foreground mb-2">{collection.symbol}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      ICP
                    </Badge>
                    <Badge variant="outline">ICRC7</Badge>
                  </div>
                  {collection.description?.[0] && (
                    <p className="text-muted-foreground max-w-2xl">{collection.description[0]}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Floor Price</div>
          <div className="text-2xl font-bold">
            {collection.floor_price?.[0] ? `${formatICP(collection.floor_price[0])} ICP` : "--"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Volume</div>
          <div className="text-2xl font-bold">{formatICP(collection.total_volume)} ICP</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Items</div>
          <div className="text-2xl font-bold">{Number(collection.total_supply)}</div>
          <div className="text-xs text-muted-foreground">{listings.length} listed</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Supply Cap</div>
          <div className="text-2xl font-bold">
            {collection.supply_cap?.[0] ? Number(collection.supply_cap[0]) : "Unlimited"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="text-xl font-bold">
            {"Active" in collection.status && <span className="text-green-600">Active</span>}
            {"AssetsPending" in collection.status && <span className="text-yellow-600">Pending</span>}
            {"Paused" in collection.status && <span className="text-gray-600">Paused</span>}
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="unlisted">Not Listed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

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
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "space-y-4"
              )}
            >
              {filteredNFTs.map((nft) => (
                <Card key={nft.tokenId.toString()} className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {nft.image ? (
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900">
                        <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                          #{nft.tokenId.toString()}
                        </span>
                      </div>
                    )}
                    {nft.listing && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-green-500">Listed</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">Owner: {nft.owner.slice(0, 10)}...</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{nft.listing ? "Price" : "Not Listed"}</div>
                        <div className="font-bold">
                          {nft.listing ? `${formatICP(nft.listing.price)} ICP` : "--"}
                        </div>
                      </div>
                    </div>

                    {nft.listing ? (
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="sm"
                        onClick={() => {
                          setSelectedNft(nft)
                          setBuyModalOpen(true)
                        }}
                      >
                        Buy Now
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" size="sm" disabled>
                        Not Listed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loadingNfts && filteredNFTs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No items found</div>
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

      <Dialog open={buyModalOpen} onOpenChange={setBuyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy NFT</DialogTitle>
            <DialogDescription>Confirm your purchase of {selectedNft?.name}</DialogDescription>
          </DialogHeader>
          {selectedNft?.listing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedNft.image ? (
                  <img src={selectedNft.image} alt={selectedNft.name} className="w-24 h-24 rounded-lg object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <span className="text-xl font-bold">#{selectedNft.tokenId.toString()}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{selectedNft.name}</h3>
                  <p className="text-2xl font-bold text-purple-600">{formatICP(selectedNft.listing.price)} ICP</p>
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleBuyNFT(selectedNft)}
                disabled={buying}
              >
                {buying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
