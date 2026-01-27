"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
  LayoutGrid,
  LayoutList,
  ExternalLink,
  Share2,
  Heart,
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tag,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/providers/auth-context"
import {
  getICPMarketplaceActor,
  getICRC7NftActor,
  getRegistryActor,
  getICRC2Actor,
} from "@/providers/actors/marketplace"
import { marketplaceCanisterId, icpCanisterId } from "@/constants/canisters-config"
import { toast } from "sonner"
import type { CollectionInfo, ListingInfo } from "@/declarations/marketplace/marketplace.did"
import type { Collection } from "@/declarations/registry/registry.did"
import type { ICRC3Value } from "@/canisters/icrc7_nft/core_nft.did"
import {
  approveAndListNFT,
  buyNFT,
  cancelListing,
  formatPriceICP,
} from "@/lib/icp/listing"

interface NFTData {
  tokenId: bigint
  name: string
  image: string
  metadata: Array<[string, ICRC3Value]>
  owner: string
  listing?: ListingInfo
}

const ITEMS_PER_PAGE = 20

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
  const [currentPage, setCurrentPage] = useState(0)

  const [selectedNft, setSelectedNft] = useState<NFTData | null>(null)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [buying, setBuying] = useState(false)

  const [listModalOpen, setListModalOpen] = useState(false)
  const [listPrice, setListPrice] = useState("")
  const [listDuration, setListDuration] = useState("")
  const [listing, setListing] = useState(false)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const userPrincipal = identity?.getPrincipal()?.toString()

  const fetchCollectionData = useCallback(async () => {
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

      const marketActor = await getICPMarketplaceActor(identity)

      const collectionResult = await marketActor.get_collection_info(collectionPrincipal)
      if ("Ok" in collectionResult) {
        setCollection(collectionResult.Ok)
      } else {
        setError("Collection not found in marketplace")
        return
      }

      const listingsResult = await marketActor.get_listings_by_collection(collectionPrincipal, [], [BigInt(1000)])
      const activeListings = listingsResult.listings?.filter((l: ListingInfo) => "Active" in l.status) || []
      setListings(activeListings)

      await fetchNFTs(collectionCanisterId, activeListings, collectionResult.Ok)
    } catch (err) {
      console.error("Error fetching collection:", err)
      setError("Failed to load collection")
    } finally {
      setLoading(false)
    }
  }, [slug, identity])

  useEffect(() => {
    if (slug) {
      fetchCollectionData()
    }
  }, [slug, identity, fetchCollectionData])

  const fetchNFTs = async (
    nftCanisterId: string,
    activeListings: ListingInfo[],
    collectionInfo: CollectionInfo
  ) => {
    setLoadingNfts(true)
    try {
      const nftActor = await getICRC7NftActor(identity, nftCanisterId)

      const allTokenIds: bigint[] = []
      let prev: [] | [bigint] = []
      const pageSize = BigInt(100)
      while (true) {
        const batch = await nftActor.icrc7_tokens(prev, [pageSize])
        if (batch.length === 0) break
        allTokenIds.push(...batch)
        if (batch.length < Number(pageSize)) break
        prev = [batch[batch.length - 1]]
      }

      if (allTokenIds.length === 0) {
        setNfts([])
        return
      }

      const listingsByToken = new Map<string, ListingInfo>()
      for (const l of activeListings) {
        listingsByToken.set(l.token_id.toString(), l)
      }

      const nftData: NFTData[] = []
      const batchSize = 100
      for (let b = 0; b < allTokenIds.length; b += batchSize) {
        const batchIds = allTokenIds.slice(b, b + batchSize)
        const [metadataResults, ownerResults] = await Promise.all([
          nftActor.icrc7_token_metadata(batchIds),
          nftActor.icrc7_owner_of(batchIds),
        ])

        for (let i = 0; i < batchIds.length; i++) {
          const tokenId = batchIds[i]
          const metadata = metadataResults[i]?.[0] || []
          const owner = ownerResults[i]?.[0]

          let name = `#${tokenId.toString()}`
          let image = ""

          for (const [key, value] of metadata) {
            if (key === "icrc7:metadata:uri:image" && "Text" in value) {
              image = value.Text
            }
          }

          nftData.push({
            tokenId,
            name: `${collectionInfo.name} ${name}`,
            image,
            metadata,
            owner: owner ? owner.owner.toString() : "Unknown",
            listing: listingsByToken.get(tokenId.toString()),
          })
        }
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
      const icpActor = await getICRC2Actor(identity, icpCanisterId)

      await buyNFT(
        icpActor,
        marketActor,
        nft.listing.listing_id,
        nft.listing.price,
        marketplaceCanisterId
      )

      toast.success("NFT purchased successfully!")
      setBuyModalOpen(false)
      setSelectedNft(null)
      await fetchCollectionData()
    } catch (err: any) {
      console.error("Buy error:", err)
      toast.error(err?.message || "Failed to purchase NFT")
    } finally {
      setBuying(false)
    }
  }

  const handleListNFT = async () => {
    if (!selectedNft || !identity || !isAuthenticated || !canisterId) return

    const price = parseFloat(listPrice)
    if (isNaN(price) || price <= 0) {
      toast.error("Enter a valid price")
      return
    }

    setListing(true)
    try {
      const nftActor = await getICRC7NftActor(identity, canisterId)
      const marketActor = await getICPMarketplaceActor(identity)

      const durationDays = listDuration ? parseInt(listDuration) : undefined

      await approveAndListNFT(
        nftActor,
        marketActor,
        canisterId,
        selectedNft.tokenId,
        price,
        marketplaceCanisterId,
        durationDays
      )

      toast.success("NFT listed successfully!")
      setListModalOpen(false)
      setSelectedNft(null)
      setListPrice("")
      setListDuration("")
      await fetchCollectionData()
    } catch (err: any) {
      console.error("List error:", err)
      toast.error(err?.message || "Failed to list NFT")
    } finally {
      setListing(false)
    }
  }

  const handleCancelListing = async () => {
    if (!selectedNft?.listing || !identity || !isAuthenticated) return

    setCancelling(true)
    try {
      const marketActor = await getICPMarketplaceActor(identity)
      await cancelListing(marketActor, selectedNft.listing.listing_id)

      toast.success("Listing cancelled")
      setCancelModalOpen(false)
      setSelectedNft(null)
      await fetchCollectionData()
    } catch (err: any) {
      console.error("Cancel error:", err)
      toast.error(err?.message || "Failed to cancel listing")
    } finally {
      setCancelling(false)
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

  const ownedNFTs = useMemo(() => {
    if (!userPrincipal) return []
    return nfts.filter((nft) => nft.owner === userPrincipal)
  }, [nfts, userPrincipal])

  const totalPages = Math.ceil(filteredNFTs.length / ITEMS_PER_PAGE)
  const paginatedNFTs = filteredNFTs.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  )

  const ownedTotalPages = Math.ceil(ownedNFTs.length / ITEMS_PER_PAGE)
  const [ownedPage, setOwnedPage] = useState(0)
  const paginatedOwned = ownedNFTs.slice(
    ownedPage * ITEMS_PER_PAGE,
    (ownedPage + 1) * ITEMS_PER_PAGE
  )

  const isOwner =
    collection && identity && collection.creator.toString() === identity.getPrincipal().toString()

  const isOwnedByUser = (nft: NFTData) => userPrincipal && nft.owner === userPrincipal
  const isListedByUser = (nft: NFTData) =>
    nft.listing && userPrincipal && nft.listing.seller.toString() === userPrincipal

  const renderNFTCard = (nft: NFTData) => (
    <Card key={nft.tokenId.toString()} className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <span className="text-4xl font-bold text-primary">#{nft.tokenId.toString()}</span>
          </div>
        )}
        {nft.listing && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary text-primary-foreground">
              {formatPriceICP(nft.listing.price)} ICP
            </Badge>
          </div>
        )}
        {isOwnedByUser(nft) && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">Owned</Badge>
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

        {isListedByUser(nft) ? (
          <Button
            className="w-full"
            variant="destructive"
            size="sm"
            onClick={() => {
              setSelectedNft(nft)
              setCancelModalOpen(true)
            }}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Listing
          </Button>
        ) : isOwnedByUser(nft) && !nft.listing ? (
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            onClick={() => {
              setSelectedNft(nft)
              setListModalOpen(true)
            }}
          >
            <Tag className="mr-2 h-4 w-4" />
            List for Sale
          </Button>
        ) : nft.listing ? (
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            onClick={() => {
              setSelectedNft(nft)
              setBuyModalOpen(true)
            }}
            disabled={isOwnedByUser(nft) === true}
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
  )

  const renderPagination = (page: number, total: number, setPage: (p: number) => void) => {
    if (total <= 1) return null
    return (
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {total}
        </span>
        <Button variant="outline" size="sm" disabled={page >= total - 1} onClick={() => setPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <div className="relative h-48 md:h-64 w-full bg-gradient-to-br from-primary to-primary/70">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              {collection.logo?.[0] ? (
                <Image src={collection.logo[0]} alt={collection.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
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
                    <Badge variant="outline" className="bg-primary/10 text-primary">
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
            {"Active" in collection.status && <span className="text-primary">Active</span>}
            {"AssetsPending" in collection.status && <span className="text-yellow-600">Pending</span>}
            {"Paused" in collection.status && <span className="text-gray-600">Paused</span>}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="items" className="mb-8">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="owned">
            Owned {ownedNFTs.length > 0 && `(${ownedNFTs.length})`}
          </TabsTrigger>
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
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0) }}
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(0) }}>
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
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "space-y-4"
                )}
              >
                {paginatedNFTs.map(renderNFTCard)}
              </div>
              {renderPagination(currentPage, totalPages, setCurrentPage)}
            </>
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

        <TabsContent value="owned" className="mt-6">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">Connect your wallet</div>
              <p className="text-sm text-muted-foreground">Connect to see NFTs you own in this collection</p>
            </div>
          ) : ownedNFTs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No NFTs owned</div>
              <p className="text-sm text-muted-foreground">You don&apos;t own any NFTs in this collection</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">{ownedNFTs.length} owned</div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedOwned.map(renderNFTCard)}
              </div>
              {renderPagination(ownedPage, ownedTotalPages, setOwnedPage)}
            </>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Activity Coming Soon</div>
            <p className="text-sm text-muted-foreground">View collection trading history and events</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Buy Modal */}
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
                  <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">#{selectedNft.tokenId.toString()}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{selectedNft.name}</h3>
                  <p className="text-2xl font-bold text-primary">{formatICP(selectedNft.listing.price)} ICP</p>
                  <p className="text-xs text-muted-foreground">+ 0.0001 ICP transfer fee</p>
                </div>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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

      {/* List Modal */}
      <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>Set a price to list {selectedNft?.name} on the marketplace</DialogDescription>
          </DialogHeader>
          {selectedNft && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedNft.image ? (
                  <img src={selectedNft.image} alt={selectedNft.name} className="w-24 h-24 rounded-lg object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">#{selectedNft.tokenId.toString()}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{selectedNft.name}</h3>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Price (ICP)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Duration (days, optional)</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="No expiry"
                  value={listDuration}
                  onChange={(e) => setListDuration(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleListNFT}
                disabled={listing || !listPrice}
              >
                {listing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listing...
                  </>
                ) : (
                  "List for Sale"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Listing Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Listing</DialogTitle>
            <DialogDescription>Are you sure you want to cancel the listing for {selectedNft?.name}?</DialogDescription>
          </DialogHeader>
          {selectedNft?.listing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedNft.image ? (
                  <img src={selectedNft.image} alt={selectedNft.name} className="w-24 h-24 rounded-lg object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">#{selectedNft.tokenId.toString()}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{selectedNft.name}</h3>
                  <p className="text-muted-foreground">Listed at {formatICP(selectedNft.listing.price)} ICP</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setCancelModalOpen(false)}>
                  Keep Listed
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelListing}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Listing"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
