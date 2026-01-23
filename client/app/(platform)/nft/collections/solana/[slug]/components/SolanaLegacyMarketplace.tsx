"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Search, LayoutGrid, LayoutList, ExternalLink, Share2, Heart, MoreHorizontal, Loader2, Flame, Clock, Rocket, Calendar, Users } from "lucide-react"
import { toast } from "sonner"
import { useWallet } from "@solana/wallet-adapter-react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import type { Collection as CanisterCollection } from "@/declarations/registry/registry.did"
import { fetchCollectionNFTs, type NFTAsset } from "@/services/solana-nft-api"
import { listNFT, buyNFT, cancelListing, placeBid, cancelBid, acceptBid, getBidsForNft, Bid } from "@/services/solana-marketplace"
import { Metaplex } from "@metaplex-foundation/js"
import { getSolanaExplorerUrl } from "@/constants/solana"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { fetchCandyMachine, fetchCandyGuard, mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine"
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi"
import ListingModal from "./listing-modal"
import BuyModal from "./buy-modal"
import CancelListingModal from "./cancel-listing-modal"
import BidModal from "./bid-modal"
import BidsDisplay from "./bids-display"
import NFTDetailModal from "./nft-detail-modal"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

interface CandyMachineState {
  itemsLoaded: number
  itemsRedeemed: number
  mintPrice: number
  startTime: number | null
  endTime: number | null
  isActive: boolean
  hasAllowList: boolean
}

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
const AUCTION_HOUSE_ADDRESS = new PublicKey("9iyTqHkzCxiUUiguLpa3otxbRTcj7DhXSmewY9fnSX8n")

function getMetadataAddress(mint: PublicKey): string {
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )
  return metadataAddress.toString()
}

interface Props {
  collection: CanisterCollection
}

const getValidImageUrl = (url: string | undefined | null): string | null => {
  if (!url || url.trim() === '') return null
  if (url.startsWith('http') || url.startsWith('ipfs://') || url.startsWith('ar://')) return url
  return null
}

export default function SolanaLegacyMarketplace({ collection }: Props) {
  const wallet = useWallet()
  const { publicKey, connected, signTransaction } = wallet
  const { connection } = useConnection()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("price-low")
  const [statusFilter, setStatusFilter] = useState("all")

  const [nfts, setNfts] = useState<NFTAsset[]>([])
  const [totalNFTs, setTotalNFTs] = useState(0)
  const [nftImages, setNftImages] = useState<Record<string, string>>({})
  const [manifest, setManifest] = useState<any>(null)
  const [isLoadingNfts, setIsLoadingNfts] = useState(true)

  const collectionImageUrl = getValidImageUrl(collection.image_url) || getValidImageUrl(manifest?.image)
  const bannerImageUrl = getValidImageUrl(collection.banner_url?.[0]) || getValidImageUrl(manifest?.banner) || collectionImageUrl

  const [listings, setListings] = useState<Map<string, { price: number; seller: string; tradeState: string; createdAt: number }>>(new Map())
  const [listingsLoading, setListingsLoading] = useState(false)

  const [nftBids, setNftBids] = useState<Map<string, Bid[]>>(new Map())
  const [bidsLoading, setBidsLoading] = useState(false)

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

  const solanaData = 'Solana' in collection.chain_data && 'Legacy' in collection.chain_data.Solana
    ? collection.chain_data.Solana.Legacy
    : null
  const collectionMint = solanaData?.collection_mint?.[0] || null
  const manifestUrl = solanaData?.manifest_url?.[0] || null
  const candyMachineAddress = solanaData?.candy_machine_address?.[0] || null

  const [cmState, setCmState] = useState<CandyMachineState | null>(null)
  const [isLoadingCm, setIsLoadingCm] = useState(false)

  const fetchCandyMachineState = useCallback(async () => {
    if (!candyMachineAddress) return
    try {
      setIsLoadingCm(true)
      const umi = createUmi(SOLANA_RPC_URL).use(mplCandyMachine()).use(mplTokenMetadata())
      const cmPubkey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, cmPubkey)

      let mintPrice = 0
      let startTime: number | null = null
      let endTime: number | null = null
      let isActive = true
      let hasAllowList = false

      try {
        const guard = await fetchCandyGuard(umi, cm.mintAuthority)
        if (guard.guards.solPayment.__option === 'Some') {
          mintPrice = Number(guard.guards.solPayment.value.lamports.basisPoints) / 1e9
        }
        if (guard.guards.startDate.__option === 'Some') {
          startTime = Number(guard.guards.startDate.value.date) * 1000
          isActive = Date.now() >= startTime
        }
        if (guard.guards.endDate.__option === 'Some') {
          endTime = Number(guard.guards.endDate.value.date) * 1000
          if (Date.now() > endTime) isActive = false
        }
        if (guard.guards.allowList.__option === 'Some') {
          hasAllowList = true
        }
      } catch (e) {
        console.log('No candy guard found')
      }

      if (Number(cm.itemsRedeemed) >= Number(cm.itemsLoaded)) {
        isActive = false
      }

      setCmState({
        itemsLoaded: Number(cm.itemsLoaded),
        itemsRedeemed: Number(cm.itemsRedeemed),
        mintPrice,
        startTime,
        endTime,
        isActive,
        hasAllowList,
      })
    } catch (error) {
      console.error("Failed to fetch candy machine:", error)
    } finally {
      setIsLoadingCm(false)
    }
  }, [candyMachineAddress])

  useEffect(() => {
    if (candyMachineAddress) fetchCandyMachineState()
  }, [candyMachineAddress, fetchCandyMachineState])

  const getMintStatus = () => {
    if (!cmState) return null
    if (cmState.startTime && Date.now() < cmState.startTime) return "upcoming"
    if (cmState.endTime && Date.now() > cmState.endTime) return "ended"
    if (cmState.itemsRedeemed >= cmState.itemsLoaded) return "sold_out"
    if (cmState.isActive) return "live"
    return "ended"
  }

  const mintStatus = getMintStatus()

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

  const loadNFTs = async (refresh = false) => {
    if (!collectionMint) return
    try {
      setIsLoadingNfts(true)
      const data = await fetchCollectionNFTs(collectionMint, 1, 100, refresh)
      setNfts(data.items || [])
      setTotalNFTs(data.total || 0)
    } catch (error) {
      console.error("Failed to fetch NFTs:", error)
    } finally {
      setIsLoadingNfts(false)
    }
  }

  const loadListings = async (nftList: NFTAsset[], refresh = false) => {
    setListingsLoading(true)
    try {
      const metaplex = Metaplex.make(connection)
      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: AUCTION_HOUSE_ADDRESS })
      const allListings = await metaplex.auctionHouse().findListings({ auctionHouse })

      const metadataToNft = new Map<string, { mint: string; owner: string }>()
      nftList.forEach(nft => {
        try {
          const metadataAddr = getMetadataAddress(new PublicKey(nft.id))
          metadataToNft.set(metadataAddr, { mint: nft.id, owner: nft.ownership?.owner || "" })
        } catch {}
      })

      const listingsMap = new Map<string, { price: number; seller: string; tradeState: string; createdAt: number }>()
      allListings.forEach((listing: any) => {
        if (listing.canceledAt) return
        if (listing.purchaseReceiptAddress) return

        const metadataAddr = listing.metadataAddress?.toString()
        const nftData = metadataToNft.get(metadataAddr)
        if (!nftData) return

        const sellerAddr = listing.sellerAddress.toString()
        if (nftData.owner !== sellerAddr) return

        const priceInSol = Number(listing.price.basisPoints) / 1e9
        const createdAt = Number(listing.createdAt || 0)
        const existing = listingsMap.get(nftData.mint)
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
          if (bids.length > 0) bidsMap.set(nft.id, bids)
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
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">View on Explorer →</a>
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
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">View on Explorer →</a>
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
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">View on Explorer →</a>
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
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">View on Explorer</a>
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
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">View on Explorer</a>
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
          <a href={getSolanaExplorerUrl(signature, "tx")} target="_blank" rel="noopener noreferrer" className="text-xs underline">View on Explorer</a>
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

  return (
    <div className="container mx-auto px-4 pt-8 pb-16">
      {/* Collection Banner */}
      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-64 md:h-80 w-full">
          {bannerImageUrl ? (
            <Image src={bannerImageUrl} alt={collection.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              {collectionImageUrl ? (
                <Image src={collectionImageUrl} alt={collection.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
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
                    <Badge variant="outline">Legacy</Badge>
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

      {/* Mint Status Card - Show if candy machine exists and minting is active */}
      {candyMachineAddress && cmState && (mintStatus === "live" || mintStatus === "upcoming") && (
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-orange-600/10 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-full",
                  mintStatus === "live" ? "bg-green-500/20" : "bg-amber-500/20"
                )}>
                  {mintStatus === "live" ? (
                    <Flame className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">
                      {mintStatus === "live" ? "Minting Now" : "Upcoming Mint"}
                    </h3>
                    {mintStatus === "live" && (
                      <Badge className="bg-green-500 text-white">Live</Badge>
                    )}
                    {mintStatus === "upcoming" && (
                      <Badge variant="secondary">
                        <Calendar className="w-3 h-3 mr-1" />
                        Upcoming
                      </Badge>
                    )}
                    {cmState.hasAllowList && (
                      <Badge variant="outline" className="border-purple-500/50 text-purple-500">
                        <Users className="w-3 h-3 mr-1" />
                        Allowlist
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mintStatus === "live"
                      ? `${cmState.itemsLoaded - cmState.itemsRedeemed} remaining at ${cmState.mintPrice} SOL each`
                      : cmState.startTime
                        ? `Starts ${new Date(cmState.startTime).toLocaleDateString()} at ${new Date(cmState.startTime).toLocaleTimeString()}`
                        : "Starting soon"
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {mintStatus === "live" && (
                  <div className="text-right mr-4">
                    <div className="text-2xl font-bold">{cmState.mintPrice} SOL</div>
                    <div className="text-sm text-muted-foreground">per NFT</div>
                  </div>
                )}
                <Link href={`/nft/launchpad/solana/${collection.slug}`}>
                  <Button size="lg" className={cn(
                    mintStatus === "live"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : ""
                  )}>
                    <Rocket className="w-4 h-4 mr-2" />
                    {mintStatus === "live" ? "Mint Now" : "View Mint"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress bar */}
            {cmState.itemsLoaded > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Mint Progress</span>
                  <span className="font-medium">
                    {cmState.itemsRedeemed.toLocaleString()} / {cmState.itemsLoaded.toLocaleString()} ({((cmState.itemsRedeemed / cmState.itemsLoaded) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={(cmState.itemsRedeemed / cmState.itemsLoaded) * 100}
                  className="h-2"
                />
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
            <div className="text-sm text-muted-foreground">{isLoadingNfts ? "Loading..." : `${filteredNFTs.length} items`}</div>
          </div>

          {isLoadingNfts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
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
          )}

          {!isLoadingNfts && filteredNFTs.length === 0 && (
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

      {/* Modals */}
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
