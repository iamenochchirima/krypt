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
import {
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  LayoutGrid,
  LayoutList,
  ExternalLink,
  Share2,
  Heart,
  MoreHorizontal,
  Loader2
} from "lucide-react"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { getCollectionAddress } from "@/lib/movement/collection"
import { getCollectionByAddress, getNFTsByCollection } from "@/lib/movement/graphql"
import type { Collection as CanisterCollection } from "@/declarations/registry/registry.did"
import { toast } from "sonner"
import { useWalletConnection } from "@/connect-wallet"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { getModuleId, MOVEMENT_NETWORK, getCurrentNetwork } from "@/constants/movement"
import ListingModal from "./components/listing-modal"
import BuyModal from "./components/buy-modal"
import CancelListingModal from "./components/cancel-listing-modal"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"
import { getAllListings, buildBuyTransaction, buildCancelListingTransaction, verifyListingExists, verifyAccountExists, type ListingData } from "@/lib/movement/marketplace"

export default function MovementCollectionPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { walletState } = useWalletConnection()
  const { signAndSubmitTransaction } = useWallet()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("price-low")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isLoading, setIsLoading] = useState(true)
  const [collection, setCollection] = useState<CanisterCollection | null>(null)
  const [collectionAddress, setCollectionAddress] = useState<string>("")
  const [onChainData, setOnChainData] = useState<any>(null)
  const [nfts, setNfts] = useState<any[]>([])
  const [nftMetadata, setNftMetadata] = useState<Map<string, any>>(new Map())
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [isListingModalOpen, setIsListingModalOpen] = useState(false)
  const [listings, setListings] = useState<Map<string, ListingData>>(new Map())
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [selectedBuyNFT, setSelectedBuyNFT] = useState<any>(null)
  const [selectedBuyListing, setSelectedBuyListing] = useState<ListingData | null>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [selectedCancelNFT, setSelectedCancelNFT] = useState<any>(null)
  const [selectedCancelListing, setSelectedCancelListing] = useState<ListingData | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  useEffect(() => {
    if (slug) {
      loadCollectionData()
    }
  }, [slug])

  const fetchListings = async (currentNfts?: any[]) => {
    if (!collectionAddress) return

    const nftsToMatch = currentNfts || nfts
    if (nftsToMatch.length === 0) return

    setIsLoadingListings(true)
    try {
      const listingData = await getAllListings(collectionAddress, getCurrentNetwork())

      const listingsMap = new Map<string, ListingData>()

      for (const listing of listingData) {
        const matchedNFT = nftsToMatch.find(nft =>
          nft.owner_address?.toLowerCase() === listing.listing_address?.toLowerCase()
        )

        if (matchedNFT) {
          listingsMap.set(matchedNFT.token_data_id, {
            ...listing,
            token_data_id: matchedNFT.token_data_id,
          })
        }
      }

      setListings(listingsMap)
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    } finally {
      setIsLoadingListings(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [collectionAddress, nfts])

  const loadCollectionData = async () => {
    try {
      setIsLoading(true)

      const actor = await getRegistryActor(null)
      const result = await actor.get_collection_by_slug(slug)

      if (!result || result.length === 0) {
        toast.error("Collection not found")
        return
      }

      const collectionData = result[0]
      setCollection(collectionData)

      const movementData = 'Movement' in collectionData.chain_data
        ? collectionData.chain_data.Movement
        : null

      if (!movementData) {
        toast.error("This is not a Movement collection")
        return
      }

      const collectionAddr = movementData.collection_address?.[0]

      if (collectionAddr) {
        setCollectionAddress(collectionAddr)
        await fetchOnChainData(collectionAddr)
        await fetchNFTs(collectionAddr)
      } else {
        const creatorAddr = movementData.collection_created
          ? collectionData.creator.toText()
          : null

        if (creatorAddr) {
          try {
            const addr = await getCollectionAddress(
              creatorAddr,
              collectionData.name,
              getCurrentNetwork()
            )
            setCollectionAddress(addr)
            await fetchOnChainData(addr)
            await fetchNFTs(addr)
          } catch (error) {
            console.error("Failed to get collection address:", error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOnChainData = async (address: string) => {
    try {
      const data = await getCollectionByAddress(address, getCurrentNetwork())
      setOnChainData(data)
    } catch (error) {
      console.error("Failed to fetch on-chain data:", error)
    }
  }

  const fetchNFTs = async (address: string, useCache = true) => {
    try {
      const nftData = await getNFTsByCollection(address, getCurrentNetwork(), useCache)
      setNfts(nftData)

      nftData.forEach((nft: any) => {
        fetchNFTMetadata(nft)
      })
    } catch (error) {
      console.error("Failed to fetch NFTs:", error)
    }
  }

  const fetchNFTMetadata = async (nft: any) => {
    const uri = nft.current_token_data?.token_uri
    if (!uri) return

    try {
      const response = await fetch(uri)
      if (response.ok) {
        const metadata = await response.json()
        setNftMetadata(prev => new Map(prev).set(nft.token_data_id, metadata))
      }
    } catch (error) {
      console.error("Failed to fetch NFT metadata:", error)
    }
  }

  const handleListNFT = (nft: any) => {
    setSelectedNFT(nft)
    setIsListingModalOpen(true)
  }

  const handleListSubmit = async (price: string, duration: string) => {
    if (!selectedNFT || !walletState.address || !signAndSubmitTransaction) return

    try {
      toast.info("Listing NFT on Movement...")

      const priceInOctas = Math.floor(parseFloat(price) * 100000000)

      const transaction = {
        data: {
          function: `${getModuleId("marketplace", getCurrentNetwork())}::list_with_fixed_price`,
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [
            selectedNFT.token_data_id,
            priceInOctas.toString()
          ],
        },
      }

      const response = await signAndSubmitTransaction(transaction)

      toast.info("Transaction submitted. Waiting for confirmation...")

      const aptosConfig = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: MOVEMENT_NETWORK[getCurrentNetwork()].rpcUrl,
      })
      const aptos = new Aptos(aptosConfig)

      try {
        await aptos.waitForTransaction({
          transactionHash: response.hash,
        })
      } catch (waitError) {
        console.warn("Could not wait for transaction confirmation:", waitError)
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <p>NFT listed successfully!</p>
          <p className="text-sm">{selectedNFT.current_token_data?.token_name || "NFT"} • {price} MOVE</p>
          <a
            href={`${MOVEMENT_NETWORK[getCurrentNetwork()].explorerUrl}/txn/${response.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:no-underline"
          >
            View on Explorer →
          </a>
        </div>,
        { duration: 10000 }
      )

      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        const nftData = await getNFTsByCollection(collectionAddress, getCurrentNetwork(), false)
        setNfts(nftData)
        nftData.forEach((nft: any) => {
          fetchNFTMetadata(nft)
        })

        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchListings(nftData)
      } catch (error) {
        console.error("Failed to refresh data:", error)
      }
    } catch (error) {
      console.error("Failed to list NFT:", error)
      toast.error("Failed to list NFT")
      throw error
    }
  }

  const handleCancelListing = async (nft: any, listingData: ListingData) => {
    const listingStillExists = await verifyListingExists(listingData.listing_address, getCurrentNetwork())

    if (!listingStillExists) {
      toast.error("This listing is no longer valid. It may have already been sold or cancelled.")

      const updatedListings = new Map(listings)
      updatedListings.delete(nft.token_data_id)
      setListings(updatedListings)

      await fetchNFTs(collectionAddress)

      return
    }

    setSelectedCancelNFT(nft)
    setSelectedCancelListing(listingData)
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!selectedCancelNFT || !selectedCancelListing || !walletState.address || !signAndSubmitTransaction) return

    try {
      toast.info("Cancelling listing...")

      const transaction = buildCancelListingTransaction(
        selectedCancelListing.listing_address,
        getCurrentNetwork()
      )

      const response = await signAndSubmitTransaction(transaction)

      toast.info("Transaction submitted. Waiting for confirmation...")

      const aptosConfig = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: MOVEMENT_NETWORK[getCurrentNetwork()].rpcUrl,
      })
      const aptos = new Aptos(aptosConfig)

      try {
        await aptos.waitForTransaction({
          transactionHash: response.hash,
        })
      } catch (waitError) {
        console.warn("Could not wait for confirmation:", waitError)
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <p>Listing cancelled successfully!</p>
          <p className="text-sm">{selectedCancelNFT.current_token_data?.token_name || "NFT"}</p>
          <a
            href={`${MOVEMENT_NETWORK[getCurrentNetwork()].explorerUrl}/txn/${response.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:no-underline"
          >
            View on Explorer →
          </a>
        </div>,
        { duration: 10000 }
      )

      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        const nftData = await getNFTsByCollection(collectionAddress, getCurrentNetwork(), false)
        setNfts(nftData)
        nftData.forEach((nft: any) => {
          fetchNFTMetadata(nft)
        })

        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchListings(nftData)
      } catch (error) {
        console.error("Failed to refresh data:", error)
      }
    } catch (error: any) {
      console.error("Failed to cancel listing:", error)

      let errorMessage = "Failed to cancel listing"

      if (error?.message) {
        if (error.message.includes("Account not found")) {
          errorMessage = "This listing is no longer valid. It may have already been sold or cancelled."

          const updatedListings = new Map(listings)
          updatedListings.delete(selectedCancelNFT.token_data_id)
          setListings(updatedListings)
        } else if (error.message.includes("rejected") || error.message.includes("declined")) {
          errorMessage = "Transaction was rejected by user"
        } else {
          errorMessage = `Cancel failed: ${error.message}`
        }
      }

      toast.error(errorMessage)
      throw error
    }
  }

  const handleOpenBuyModal = async (nft: any, listingData: ListingData) => {
    const listingStillExists = await verifyListingExists(listingData.listing_address, getCurrentNetwork())

    if (!listingStillExists) {
      toast.error("This NFT is no longer available for purchase. It may have been sold or delisted.")

      const updatedListings = new Map(listings)
      updatedListings.delete(nft.token_data_id)
      setListings(updatedListings)

      await fetchNFTs(collectionAddress)

      return
    }

    setSelectedBuyNFT(nft)
    setSelectedBuyListing(listingData)
    setIsBuyModalOpen(true)
  }

  const handleConfirmBuy = async () => {
    if (!selectedBuyNFT || !selectedBuyListing || !walletState.address || !signAndSubmitTransaction) return

    try {
      const priceInMove = (Number(selectedBuyListing.price) / 100000000).toFixed(2)

      toast.info("Verifying listing...")

      const listingExists = await verifyListingExists(selectedBuyListing.listing_address, getCurrentNetwork())

      if (!listingExists) {
        toast.error("This NFT is no longer available for purchase. It may have been sold or delisted.")

        const updatedListings = new Map(listings)
        updatedListings.delete(selectedBuyNFT.token_data_id)
        setListings(updatedListings)

        await fetchNFTs(collectionAddress)

        return
      }

      toast.info("Verifying account...")

      const accountExists = await verifyAccountExists(walletState.address, getCurrentNetwork())

      if (!accountExists) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Account Not Found On-Chain</p>
            <p className="text-sm">Your wallet address is new and needs to be initialized. Please add some MOVE tokens to your account first.</p>
            <a
              href="https://faucet.movementnetwork.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline hover:no-underline"
            >
              Get MOVE from Faucet →
            </a>
          </div>,
          { duration: 10000 }
        )
        return
      }

      toast.info(`Purchasing ${selectedBuyNFT.current_token_data?.token_name || "NFT"} for ${priceInMove} MOVE...`)

      const transaction = buildBuyTransaction(
        selectedBuyListing.listing_address,
        selectedBuyListing.price.toString(),
        getCurrentNetwork()
      )

      const response = await signAndSubmitTransaction(transaction)

      toast.info("Transaction submitted. Waiting for confirmation...")

      const aptosConfig = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: MOVEMENT_NETWORK[getCurrentNetwork()].rpcUrl,
      })
      const aptos = new Aptos(aptosConfig)

      try {
        await aptos.waitForTransaction({
          transactionHash: response.hash,
        })
      } catch (waitError) {
        console.warn("Could not wait for confirmation:", waitError)
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <p>Purchase successful!</p>
          <p className="text-sm">{selectedBuyNFT.current_token_data?.token_name || "NFT"} • {priceInMove} MOVE</p>
          <a
            href={`${MOVEMENT_NETWORK[getCurrentNetwork()].explorerUrl}/txn/${response.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:no-underline"
          >
            View on Explorer →
          </a>
        </div>,
        { duration: 10000 }
      )

      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        const nftData = await getNFTsByCollection(collectionAddress, getCurrentNetwork(), false)
        setNfts(nftData)
        nftData.forEach((nft: any) => {
          fetchNFTMetadata(nft)
        })

        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchListings(nftData)
      } catch (error) {
        console.error("Failed to refresh data:", error)
      }
    } catch (error: any) {
      console.error("Failed to purchase NFT:", error)

      let errorMessage = "Failed to purchase NFT"

      if (error?.message) {
        if (error.message.includes("INSUFFICIENT_BALANCE") || error.message.includes("insufficient")) {
          errorMessage = "Insufficient balance. Please add more MOVE to your wallet."
        } else if (error.message.includes("Account not found")) {
          toast.error(
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Account Not Found On-Chain</p>
              <p className="text-sm">Your wallet address is new and needs to be initialized. Please add some MOVE tokens to your account first.</p>
              <a
                href="https://faucet.movementnetwork.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                Get MOVE from Faucet →
              </a>
            </div>,
            { duration: 10000 }
          )
          throw error
        } else if (error.message.includes("rejected") || error.message.includes("declined")) {
          errorMessage = "Transaction was rejected by user"
        } else {
          errorMessage = `Purchase failed: ${error.message}`
        }
      }

      toast.error(errorMessage)
      throw error
    }
  }

  const filteredNFTs = useMemo(() => {
    let filtered = nfts

    if (statusFilter === "listed") {
      filtered = filtered.filter(nft => listings.has(nft.token_data_id))
    } else if (statusFilter === "unlisted") {
      filtered = filtered.filter(nft => !listings.has(nft.token_data_id))
    } else if (statusFilter === "owned") {
      if (walletState.isConnected && walletState.chain === "movement" && walletState.address) {
        filtered = filtered.filter(nft =>
          nft.owner_address?.toLowerCase() === walletState.address?.toLowerCase()
        )
      } else {
        filtered = []
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft =>
        nft.current_token_data?.token_name?.toLowerCase().includes(query)
      )
    }

    if (sortBy === "price-low" || sortBy === "price-high") {
      filtered = [...filtered].sort((a, b) => {
        const priceA = listings.get(a.token_data_id)?.price || BigInt(0)
        const priceB = listings.get(b.token_data_id)?.price || BigInt(0)

        if (sortBy === "price-low") {
          return Number(priceA - priceB)
        } else {
          return Number(priceB - priceA)
        }
      })
    }

    return filtered
  }, [nfts, searchQuery, statusFilter, sortBy, walletState.isConnected, walletState.chain, walletState.address, listings])

  const floorPrice = useMemo(() => {
    if (listings.size === 0) return "0.00 MOVE"

    const prices = Array.from(listings.values()).map(l => Number(l.price))
    const minPrice = Math.min(...prices)
    return `${(minPrice / 100000000).toFixed(2)} MOVE`
  }, [listings])

  const listedCount = listings.size
  const totalVolume = onChainData?.total_minted_v2 || 0
  const items = onChainData?.current_supply || Number(collection?.total_supply || 0)
  const maxSupply = onChainData?.max_supply || Number(collection?.total_supply || 0)
  const uniqueOwners = new Set(nfts.map(nft => nft.owner_address)).size

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
          <Button asChild>
            <Link href="/collections">Back to Collections</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/collections">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Link>
      </Button>

      {/* Collection Banner */}
      <div className="mb-8 rounded-xl overflow-hidden border">
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={collection.banner_url?.[0] || collection.image_url}
            alt={collection.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              <Image
                src={collection.image_url}
                alt={collection.name}
                fill
                className="object-cover"
              />
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
                    <Badge variant="outline" className="capitalize">Movement</Badge>
                    <span className="text-sm text-muted-foreground">{(Number(collection.royalty_bps) / 100).toFixed(1)}% royalty</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
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
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
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
          <div className="text-xs text-muted-foreground">$0.00</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Minted</div>
          <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">NFTs</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Items</div>
          <div className="text-2xl font-bold">{items.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{maxSupply ? `/ ${maxSupply.toLocaleString()}` : 'supply'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Owners</div>
          <div className="text-2xl font-bold">{uniqueOwners.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{items > 0 ? Math.round((uniqueOwners / items) * 100) : 0}% unique</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Listed</div>
          <div className="text-2xl font-bold">{listedCount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">for sale</div>
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
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or traits..."
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
                  <SelectItem value="owned">Owned by Me</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                  <SelectItem value="newest">Recently Listed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredNFTs.length} items
            </div>
          </div>

          {/* NFT Grid */}
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "space-y-4"
          )}>
            {filteredNFTs.map((nft) => {
              const metadata = nftMetadata.get(nft.token_data_id)
              const tokenName = nft.current_token_data?.token_name || "Unnamed NFT"
              const imageUrl = metadata?.image || metadata?.image_url || "/placeholder.svg?height=300&width=300"
              const traits = metadata?.attributes?.length || 0

              const listingData = listings.get(nft.token_data_id)
              const isListed = !!listingData
              const listingPrice = listingData?.price
                ? (Number(listingData.price) / 100000000).toFixed(2)
                : null

              const isOwnedByUser = walletState.isConnected &&
                walletState.chain === "movement" &&
                walletState.address &&
                (
                  nft.owner_address?.toLowerCase() === walletState.address.toLowerCase() ||
                  (isListed && listingData.seller_address?.toLowerCase() === walletState.address.toLowerCase())
                )

              return (
                <Card key={nft.token_data_id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={tokenName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=300&width=300"
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    {isOwnedByUser && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="text-xs">Owned</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-lg truncate">{tokenName}</h3>
                      <p className="text-sm text-muted-foreground">{traits} traits</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {isListed ? "Price" : "Owner"}
                        </div>
                        <div className="font-bold">
                          {isListed ? (
                            `${listingPrice} MOVE`
                          ) : (
                            <span className="text-xs font-mono">
                              {nft.owner_address.substring(0, 6)}...{nft.owner_address.substring(nft.owner_address.length - 4)}
                            </span>
                          )}
                        </div>
                      </div>
                      {isListed && (
                        <Badge variant="default" className="bg-green-600">
                          For Sale
                        </Badge>
                      )}
                    </div>

                    {isOwnedByUser ? (
                      isListed ? (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelListing(nft, listingData)}
                            className="flex-1"
                          >
                            Cancel Listing
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleListNFT(nft)} className="w-full">
                          List for Sale
                        </Button>
                      )
                    ) : (
                      isListed ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenBuyModal(nft, listingData)}
                          className="w-full"
                        >
                          Buy Now • {listingPrice} MOVE
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      )
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
          onClose={() => {
            setIsListingModalOpen(false)
            setSelectedNFT(null)
          }}
          nft={{
            name: selectedNFT.current_token_data?.token_name || "Unnamed NFT",
            image: nftMetadata.get(selectedNFT.token_data_id)?.image || "/placeholder.svg",
            collection: collection?.name || "Collection"
          }}
          onList={handleListSubmit}
        />
      )}

      {selectedBuyNFT && selectedBuyListing && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => {
            setIsBuyModalOpen(false)
            setSelectedBuyNFT(null)
            setSelectedBuyListing(null)
          }}
          nft={{
            name: selectedBuyNFT.current_token_data?.token_name || "Unnamed NFT",
            image: nftMetadata.get(selectedBuyNFT.token_data_id)?.image || "/placeholder.svg",
            collection: collection?.name || "Collection"
          }}
          price={(Number(selectedBuyListing.price) / 100000000).toFixed(2)}
          isWalletConnected={walletState.isConnected && walletState.chain === "movement"}
          onConfirm={handleConfirmBuy}
        />
      )}

      {selectedCancelNFT && selectedCancelListing && (
        <CancelListingModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false)
            setSelectedCancelNFT(null)
            setSelectedCancelListing(null)
          }}
          nft={{
            name: selectedCancelNFT.current_token_data?.token_name || "Unnamed NFT",
            image: nftMetadata.get(selectedCancelNFT.token_data_id)?.image || "/placeholder.svg",
            collection: collection?.name || "Collection"
          }}
          price={(Number(selectedCancelListing.price) / 100000000).toFixed(2)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  )
}
