"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Search, LayoutGrid, LayoutList, ExternalLink, Share2, Heart, MoreHorizontal, Loader2 } from "lucide-react"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { toast } from "sonner"
import { useWallet } from "@solana/wallet-adapter-react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import type { Collection as CanisterCollection } from "@/declarations/registry/registry.did"
import { fetchCollectionNFTs, fetchListings, type NFTAsset, type ListingReceipt } from "@/services/solana-nft-api"
import { listNFT, buyNFT, cancelListing, placeBid, cancelBid, acceptBid, getBidsForNft, Bid } from "@/services/solana-marketplace"
import { Metaplex } from "@metaplex-foundation/js"

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
const AUCTION_HOUSE_ADDRESS = new PublicKey("9iyTqHkzCxiUUiguLpa3otxbRTcj7DhXSmewY9fnSX8n")

function getMetadataAddress(mint: PublicKey): string {
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )
  return metadataAddress.toString()
}
import { getSolanaExplorerUrl } from "@/constants/solana"
import ListingModal from "./components/listing-modal"
import BuyModal from "./components/buy-modal"
import CancelListingModal from "./components/cancel-listing-modal"
import BidModal from "./components/bid-modal"
import BidsDisplay from "./components/bids-display"
import NFTDetailModal from "./components/nft-detail-modal"

export default function SolanaCollectionPage() {
  const params = useParams()
  const collectionId = params?.id as string
  const wallet = useWallet()
  const { publicKey, connected, signTransaction } = wallet
  const { connection } = useConnection()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("price-low")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isLoading, setIsLoading] = useState(true)
  const [collection, setCollection] = useState<CanisterCollection | null>(null)
  const [nfts, setNfts] = useState<NFTAsset[]>([])
  const [totalNFTs, setTotalNFTs] = useState(0)
  const [nftImages, setNftImages] = useState<Record<string, string>>({})
  const [manifest, setManifest] = useState<any>(null)

  // Listings from blockchain
  const [listings, setListings] = useState<Map<string, { price: number; seller: string; tradeState: string; createdAt: number }>>(new Map())
  const [listingsLoading, setListingsLoading] = useState(false)

  // Bids state
  const [nftBids, setNftBids] = useState<Map<string, Bid[]>>(new Map())
  const [bidsLoading, setBidsLoading] = useState(false)

  // Modal state
  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null)
  const [isListingModalOpen, setIsListingModalOpen] = useState(false)
  const [selectedBuyNFT, setSelectedBuyNFT] = useState<NFTAsset | null>(null)
  const [selectedBuyPrice, setSelectedBuyPrice] = useState<string>("")
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [selectedCancelNFT, setSelectedCancelNFT] = useState<NFTAsset | null>(null)
  const [selectedCancelPrice, setSelectedCancelPrice] = useState<string>("")
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [selectedBidNFT, setSelectedBidNFT] = useState<NFTAsset | null>(null)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  const [selectedDetailNFT, setSelectedDetailNFT] = useState<NFTAsset | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const solanaData = collection && 'Solana' in collection.chain_data ? collection.chain_data.Solana : null
  const collectionMint = solanaData?.collection_mint?.[0] || null
  const manifestUrl = solanaData?.manifest_url?.[0] || null

  useEffect(() => {
    if (collectionId) loadCollectionData()
  }, [collectionId])

  useEffect(() => {
    if (collectionMint) loadNFTs()
  }, [collectionMint])

  useEffect(() => {
    if (nfts.length > 0) {
      loadListings(nfts)
      loadBids(nfts)
    }
  }, [nfts])

  useEffect(() => {
    if (manifestUrl && !manifest) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(async data => {
          setManifest(data)
          if (data.properties?.files) {
            const imagePromises = data.properties.files.map(async (file: { uri: string }, index: number) => {
              try {
                const res = await fetch(file.uri)
                const metadata = await res.json()
                return { index: String(index), name: metadata.name, image: metadata.image }
              } catch { return null }
            })
            const results = await Promise.all(imagePromises)
            const images: Record<string, string> = {}
            results.forEach(r => {
              if (r?.image) {
                images[r.index] = r.image
                if (r.name) images[r.name] = r.image
              }
            })
            setNftImages(images)
          }
        })
        .catch(err => console.error('Failed to fetch manifest:', err))
    }
  }, [manifestUrl])

  const loadCollectionData = async () => {
    try {
      setIsLoading(true)
      const actor = await getRegistryActor(null)
      const result = await actor.get_collection(collectionId)
      if (!result || result.length === 0) {
        toast.error("Collection not found")
        return
      }
      setCollection(result[0])
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadNFTs = async (refresh = false) => {
    if (!collectionMint) return
    try {
      const data = await fetchCollectionNFTs(collectionMint, 1, 100, refresh)
      setNfts(data.items || [])
      setTotalNFTs(data.total || 0)
    } catch (error) {
      console.error("Failed to fetch NFTs:", error)
    }
  }

  const loadListings = async (nftList: NFTAsset[], refresh = false) => {
    setListingsLoading(true)
    try {
      const metaplex = Metaplex.make(connection)
      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: AUCTION_HOUSE_ADDRESS })
      const allListings = await metaplex.auctionHouse().findListings({ auctionHouse })

      // Build mapping of metadata address to mint and current owner
      const metadataToNft = new Map<string, { mint: string; owner: string }>()
      nftList.forEach(nft => {
        try {
          const metadataAddr = getMetadataAddress(new PublicKey(nft.id))
          metadataToNft.set(metadataAddr, {
            mint: nft.id,
            owner: nft.ownership?.owner || ""
          })
        } catch {}
      })

      const listingsMap = new Map<string, { price: number; seller: string; tradeState: string; createdAt: number }>()
      allListings.forEach((listing: any) => {
        // Skip cancelled listings
        if (listing.canceledAt) return
        // Skip sold listings (have purchase receipt)
        if (listing.purchaseReceiptAddress) return

        const metadataAddr = listing.metadataAddress?.toString()
        const nftData = metadataToNft.get(metadataAddr)
        if (!nftData) return

        // Skip if seller no longer owns the NFT (orphaned listing)
        const sellerAddr = listing.sellerAddress.toString()
        if (nftData.owner !== sellerAddr) return

        const priceInSol = Number(listing.price.basisPoints) / 1e9
        const createdAt = Number(listing.createdAt || 0)
        const existing = listingsMap.get(nftData.mint)
        // Keep the latest listing (most recent createdAt)
        if (!existing || createdAt > existing.createdAt) {
          listingsMap.set(nftData.mint, {
            price: priceInSol,
            seller: sellerAddr,
            tradeState: listing.tradeStateAddress.toString(),
            createdAt,
          })
        }
      })
      setListings(listingsMap)
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    } finally {
      setListingsLoading(false)
    }
  }

  const loadBids = async (nftList: NFTAsset[]) => {
    setBidsLoading(true)
    try {
      const bidsMap = new Map<string, Bid[]>()
      for (const nft of nftList) {
        try {
          const bids = await getBidsForNft(connection, new PublicKey(nft.id))
          if (bids.length > 0) {
            bidsMap.set(nft.id, bids)
          }
        } catch {}
      }
      setNftBids(bidsMap)
    } catch (error) {
      console.error("Failed to fetch bids:", error)
    } finally {
      setBidsLoading(false)
    }
  }

  const handleListNFT = (nft: NFTAsset) => {
    setSelectedNFT(nft)
    setIsListingModalOpen(true)
  }

  const handleListSubmit = async (price: string) => {
    if (!selectedNFT || !publicKey || !signTransaction) return
    try {
      toast.info("Listing NFT...")
      const signature = await listNFT({
        connection,
        seller: publicKey,
        nftMint: new PublicKey(selectedNFT.id),
        priceInSol: parseFloat(price),
        signTransaction,
      })
      toast.success(
        <div className="flex flex-col gap-2">
          <p>NFT listed successfully!</p>
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer →
          </a>
        </div>,
        { duration: 10000 }
      )
      setTimeout(() => loadListings(nfts, true), 2000)
    } catch (error: any) {
      console.error("Failed to list NFT:", error)
      toast.error(error?.message || "Failed to list NFT")
      throw error
    }
  }

  const handleOpenBuyModal = (nft: NFTAsset, price: number) => {
    setSelectedBuyNFT(nft)
    setSelectedBuyPrice(price.toString())
    setIsBuyModalOpen(true)
  }

  const handleConfirmBuy = async () => {
    if (!selectedBuyNFT || !publicKey || !connected) return
    const listing = listings.get(selectedBuyNFT.id)
    if (!listing) return
    try {
      toast.info("Purchasing NFT...")
      const signature = await buyNFT({
        connection,
        buyer: publicKey,
        nftMint: new PublicKey(selectedBuyNFT.id),
        seller: new PublicKey(listing.seller),
        priceInSol: listing.price,
        wallet,
      })
      toast.success(
        <div className="flex flex-col gap-2">
          <p>Purchase successful!</p>
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer →
          </a>
        </div>,
        { duration: 10000 }
      )
      loadNFTs(true)
      setTimeout(() => loadListings(nfts, true), 2000)
    } catch (error: any) {
      console.error("Failed to buy NFT:", error)
      toast.error(error?.message || "Failed to buy NFT")
      throw error
    }
  }

  const handleCancelListing = (nft: NFTAsset, price: number) => {
    setSelectedCancelNFT(nft)
    setSelectedCancelPrice(price.toString())
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!selectedCancelNFT || !publicKey || !signTransaction) return
    const listing = listings.get(selectedCancelNFT.id)
    if (!listing) return
    try {
      toast.info("Cancelling listing...")
      const signature = await cancelListing({
        connection,
        seller: publicKey,
        nftMint: new PublicKey(selectedCancelNFT.id),
        priceInSol: listing.price,
        signTransaction,
      })
      toast.success(
        <div className="flex flex-col gap-2">
          <p>Listing cancelled!</p>
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer →
          </a>
        </div>,
        { duration: 10000 }
      )
      setTimeout(() => loadListings(nfts, true), 2000)
    } catch (error: any) {
      console.error("Failed to cancel listing:", error)
      toast.error(error?.message || "Failed to cancel listing")
      throw error
    }
  }

  const handleOpenBidModal = (nft: NFTAsset) => {
    setSelectedBidNFT(nft)
    setIsBidModalOpen(true)
  }

  const handleOpenDetail = (nft: NFTAsset) => {
    setSelectedDetailNFT(nft)
    setIsDetailModalOpen(true)
  }

  const handlePlaceBid = async (price: string) => {
    if (!selectedBidNFT || !publicKey || !connected) return
    try {
      toast.info("Placing bid...")
      const signature = await placeBid({
        connection,
        buyer: publicKey,
        nftMint: new PublicKey(selectedBidNFT.id),
        priceInSol: parseFloat(price),
        wallet,
      })
      toast.success(
        <div className="flex flex-col gap-2">
          <p>Bid placed successfully!</p>
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer
          </a>
        </div>,
        { duration: 10000 }
      )
      setTimeout(() => loadBids(nfts), 2000)
    } catch (error: any) {
      console.error("Failed to place bid:", error)
      toast.error(error?.message || "Failed to place bid")
      throw error
    }
  }

  const handleAcceptBid = async (nftId: string, bid: Bid) => {
    if (!publicKey || !connected) return
    try {
      toast.info("Accepting bid...")
      const signature = await acceptBid({
        connection,
        seller: publicKey,
        nftMint: new PublicKey(nftId),
        buyer: new PublicKey(bid.buyer),
        priceInSol: bid.price,
        wallet,
      })
      toast.success(
        <div className="flex flex-col gap-2">
          <p>Bid accepted! NFT sold.</p>
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer
          </a>
        </div>,
        { duration: 10000 }
      )
      loadNFTs(true)
      setTimeout(() => {
        loadListings(nfts, true)
        loadBids(nfts)
      }, 2000)
    } catch (error: any) {
      console.error("Failed to accept bid:", error)
      toast.error(error?.message || "Failed to accept bid")
    }
  }

  const handleCancelBid = async (nftId: string, bid: Bid) => {
    if (!publicKey || !connected) return
    try {
      toast.info("Cancelling bid...")
      const signature = await cancelBid({
        connection,
        buyer: publicKey,
        nftMint: new PublicKey(nftId),
        priceInSol: bid.price,
        wallet,
      })
      toast.success(
        <div className="flex flex-col gap-2">
          <p>Bid cancelled!</p>
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer
          </a>
        </div>,
        { duration: 10000 }
      )
      setTimeout(() => loadBids(nfts), 2000)
    } catch (error: any) {
      console.error("Failed to cancel bid:", error)
      toast.error(error?.message || "Failed to cancel bid")
    }
  }

  const filteredNFTs = useMemo(() => {
    let filtered = nfts
    if (statusFilter === "listed") filtered = filtered.filter(nft => listings.has(nft.id))
    else if (statusFilter === "unlisted") filtered = filtered.filter(nft => !listings.has(nft.id))
    else if (statusFilter === "owned" && publicKey) {
      filtered = filtered.filter(nft => nft.ownership?.owner === publicKey.toString())
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft => nft.content?.metadata?.name?.toLowerCase().includes(query))
    }
    return filtered
  }, [nfts, searchQuery, statusFilter, listings, publicKey])

  const floorPrice = useMemo(() => {
    if (listings.size === 0) return "-- SOL"
    const prices = Array.from(listings.values()).map(l => l.price)
    return `${Math.min(...prices).toFixed(2)} SOL`
  }, [listings])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
          <p className="text-muted-foreground mb-6">The collection you're looking for doesn't exist</p>
          <Button asChild><Link href="/nft/collections">Back to Collections</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-8 pb-16">
      {/* Collection Banner */}
      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-64 md:h-80 w-full">
          <Image src={collection.banner_url?.[0] || collection.image_url} alt={collection.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              <Image src={manifest?.image || collection.image_url} alt={collection.name} fill className="object-cover" />
            </div>
            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
                    <Badge variant="secondary" className="text-sm">✓ Verified</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    by <Link href={`/profile/${collection.creator.toText()}`} className="hover:underline font-medium">{collection.creator.toText().substring(0, 8)}...</Link>
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Solana</Badge>
                    <span className="text-sm text-muted-foreground">{(Number(collection.royalty_bps) / 100).toFixed(1)}% royalty</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => collectionMint && window.open(getSolanaExplorerUrl(collectionMint), '_blank')}>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Floor Price</div>
          <div className="text-2xl font-bold">{floorPrice}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Minted</div>
          <div className="text-2xl font-bold">{totalNFTs}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Items</div>
          <div className="text-2xl font-bold">{nfts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Owners</div>
          <div className="text-2xl font-bold">{new Set(nfts.map(n => n.ownership?.owner)).size}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Listed</div>
          <div className="text-2xl font-bold">{listings.size}</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="mb-8">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="unlisted">Not Listed</SelectItem>
                  <SelectItem value="owned">Owned by Me</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Recently Listed</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}><LayoutList className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{filteredNFTs.length} items</div>
          </div>

          <div className={cn(viewMode === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "space-y-4")}>
            {filteredNFTs.map((nft) => {
              const nftName = nft.content?.metadata?.name || 'Unnamed'
              const imageUrl = nft.content?.links?.image || nftImages[nftName] || nftImages[nftName.replace(/\D/g, '')]
              const listing = listings.get(nft.id)
              const bids = nftBids.get(nft.id) || []
              const highestBid = bids[0]
              const isListed = !!listing
              const isOwnedByUser = connected && publicKey && nft.ownership?.owner === publicKey.toString()

              return (
                <Card key={nft.id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => handleOpenDetail(nft)}>
                    {imageUrl ? (
                      <Image src={imageUrl} alt={nftName} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    {isOwnedByUser && <div className="absolute bottom-2 left-2"><Badge className="text-xs">Owned</Badge></div>}
                    {bids.length > 0 && <div className="absolute bottom-2 right-2"><Badge variant="secondary" className="text-xs">{bids.length} Bid{bids.length !== 1 ? 's' : ''}</Badge></div>}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-lg truncate">{nftName}</h3>
                      <p className="text-sm text-muted-foreground truncate">{nft.id.slice(0, 8)}...{nft.id.slice(-4)}</p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">{isListed ? "Price" : highestBid ? "Top Bid" : "Owner"}</div>
                        <div className="font-bold">
                          {isListed ? `${listing.price} SOL` : highestBid ? `${highestBid.price} SOL` : <span className="text-xs font-mono">{nft.ownership?.owner?.slice(0, 6)}...</span>}
                        </div>
                      </div>
                      {isListed && <Badge variant="default" className="bg-green-600">For Sale</Badge>}
                    </div>

                    {/* Bids section for owner */}
                    {isOwnedByUser && bids.length > 0 && (
                      <div className="mb-3 border-t pt-3">
                        <BidsDisplay
                          bids={bids}
                          isOwner={true}
                          currentUserWallet={publicKey?.toString()}
                          onAcceptBid={(bid) => handleAcceptBid(nft.id, bid)}
                          onCancelBid={(bid) => handleCancelBid(nft.id, bid)}
                        />
                      </div>
                    )}

                    {isOwnedByUser ? (
                      isListed ? (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleListNFT(nft)} className="flex-1">Update Price</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleCancelListing(nft, listing.price)} className="flex-1">Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleListNFT(nft)} className="w-full">List for Sale</Button>
                      )
                    ) : (
                      <div className="space-y-2">
                        {isListed && (
                          <Button size="sm" onClick={() => handleOpenBuyModal(nft, listing.price)} className="w-full">Buy Now • {listing.price} SOL</Button>
                        )}
                        <Button variant={isListed ? "outline" : "default"} size="sm" onClick={() => handleOpenBidModal(nft)} className="w-full">
                          Place Bid {highestBid && !isListed ? `(Top: ${highestBid.price} SOL)` : ''}
                        </Button>
                        {/* Show user's bid if they have one */}
                        {bids.some(b => b.buyer === publicKey?.toString()) && (
                          <div className="text-xs text-center text-muted-foreground">
                            Your bid: {bids.find(b => b.buyer === publicKey?.toString())?.price} SOL
                            <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-xs" onClick={() => handleCancelBid(nft.id, bids.find(b => b.buyer === publicKey?.toString())!)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredNFTs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No items found</div>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Activity Coming Soon</div>
            <p className="text-sm text-muted-foreground">View collection trading history and events</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">Analytics Coming Soon</div>
            <p className="text-sm text-muted-foreground">View price charts, holder distribution, and more</p>
          </div>
        </TabsContent>
      </Tabs>

      {selectedNFT && (
        <ListingModal
          isOpen={isListingModalOpen}
          onClose={() => { setIsListingModalOpen(false); setSelectedNFT(null) }}
          nft={{ name: selectedNFT.content?.metadata?.name || "NFT", image: nftImages[selectedNFT.content?.metadata?.name || ""] || "/placeholder.svg", collection: collection?.name || "" }}
          existingListing={listings.get(selectedNFT.id) || null}
          onList={handleListSubmit}
          onCancelExisting={async () => {
            const listing = listings.get(selectedNFT.id)
            if (!listing || !publicKey || !signTransaction) return
            await cancelListing({
              connection,
              seller: publicKey,
              nftMint: new PublicKey(selectedNFT.id),
              priceInSol: listing.price,
              signTransaction,
            })
          }}
        />
      )}

      {selectedBuyNFT && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => { setIsBuyModalOpen(false); setSelectedBuyNFT(null) }}
          nft={{ name: selectedBuyNFT.content?.metadata?.name || "NFT", image: nftImages[selectedBuyNFT.content?.metadata?.name || ""] || "/placeholder.svg", collection: collection?.name || "" }}
          price={selectedBuyPrice}
          isWalletConnected={connected}
          onConfirm={handleConfirmBuy}
        />
      )}

      {selectedCancelNFT && (
        <CancelListingModal
          isOpen={isCancelModalOpen}
          onClose={() => { setIsCancelModalOpen(false); setSelectedCancelNFT(null) }}
          nft={{ name: selectedCancelNFT.content?.metadata?.name || "NFT", image: nftImages[selectedCancelNFT.content?.metadata?.name || ""] || "/placeholder.svg", collection: collection?.name || "" }}
          price={selectedCancelPrice}
          onConfirm={handleConfirmCancel}
        />
      )}

      {selectedBidNFT && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => { setIsBidModalOpen(false); setSelectedBidNFT(null) }}
          nft={{ name: selectedBidNFT.content?.metadata?.name || "NFT", image: nftImages[selectedBidNFT.content?.metadata?.name || ""] || "/placeholder.svg", collection: collection?.name || "" }}
          currentPrice={listings.get(selectedBidNFT.id)?.price || null}
          onPlaceBid={handlePlaceBid}
        />
      )}

      {selectedDetailNFT && (
        <NFTDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedDetailNFT(null) }}
          nft={{
            id: selectedDetailNFT.id,
            name: selectedDetailNFT.content?.metadata?.name || "NFT",
            image: selectedDetailNFT.content?.links?.image || nftImages[selectedDetailNFT.content?.metadata?.name || ""] || "",
            description: selectedDetailNFT.content?.metadata?.description,
            collection: collection?.name || "",
            owner: selectedDetailNFT.ownership?.owner || "",
            attributes: selectedDetailNFT.content?.metadata?.attributes,
          }}
          listing={listings.get(selectedDetailNFT.id) || null}
          bids={nftBids.get(selectedDetailNFT.id) || []}
          isOwner={connected && publicKey?.toString() === selectedDetailNFT.ownership?.owner}
          currentUserWallet={publicKey?.toString()}
          onList={() => { setIsDetailModalOpen(false); handleListNFT(selectedDetailNFT) }}
          onBuy={() => { setIsDetailModalOpen(false); handleOpenBuyModal(selectedDetailNFT, listings.get(selectedDetailNFT.id)?.price || 0) }}
          onPlaceBid={() => { setIsDetailModalOpen(false); handleOpenBidModal(selectedDetailNFT) }}
          onCancelListing={() => { setIsDetailModalOpen(false); handleCancelListing(selectedDetailNFT, listings.get(selectedDetailNFT.id)?.price || 0) }}
          onAcceptBid={(bid) => handleAcceptBid(selectedDetailNFT.id, bid)}
          onCancelBid={(bid) => handleCancelBid(selectedDetailNFT.id, bid)}
          explorerUrl={getSolanaExplorerUrl(selectedDetailNFT.id)}
        />
      )}
    </div>
  )
}
