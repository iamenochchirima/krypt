"use client"

import { useState, useMemo } from "react"
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
  MoreHorizontal
} from "lucide-react"

const collectionData = {
  id: "1",
  name: "Cosmic Voyagers",
  description: "A premium NFT collection on Ethereum featuring stunning space-themed artwork and exclusive holder utilities.",
  creator: "ArtisticMind",
  creatorAddress: "0x1234...abcd",
  banner: "/placeholder.svg?height=400&width=1200",
  image: "/placeholder.svg?height=300&width=300",
  verified: true,
  chain: "ethereum",
  floorPrice: "0.3 ETH",
  floorPriceUSD: 750,
  totalVolume: "45.5 ETH",
  totalVolumeUSD: 113750,
  items: 100,
  owners: 87,
  listed: 15,
  change24h: 12.5,
  royalty: 5,
}

const nfts = [
  {
    id: 1,
    name: "Voyager #42",
    image: "/placeholder.svg?height=300&width=300",
    price: "0.3 ETH",
    priceUSD: 750,
    rarity: "Rare",
    traits: 5,
    listed: true,
    lastSale: "0.28 ETH",
  },
  {
    id: 2,
    name: "Voyager #7",
    image: "/placeholder.svg?height=300&width=300",
    price: "0.5 ETH",
    priceUSD: 1250,
    rarity: "Epic",
    traits: 7,
    listed: true,
    lastSale: "0.45 ETH",
  },
  {
    id: 3,
    name: "Voyager #89",
    image: "/placeholder.svg?height=300&width=300",
    price: "Not Listed",
    priceUSD: 0,
    rarity: "Common",
    traits: 3,
    listed: false,
    lastSale: "0.25 ETH",
  },
  {
    id: 4,
    name: "Voyager #1",
    image: "/placeholder.svg?height=300&width=300",
    price: "1.0 ETH",
    priceUSD: 2500,
    rarity: "Legendary",
    traits: 10,
    listed: true,
    lastSale: "0.9 ETH",
  },
  {
    id: 5,
    name: "Voyager #56",
    image: "/placeholder.svg?height=300&width=300",
    price: "0.35 ETH",
    priceUSD: 875,
    rarity: "Rare",
    traits: 6,
    listed: true,
    lastSale: "0.32 ETH",
  },
  {
    id: 6,
    name: "Voyager #23",
    image: "/placeholder.svg?height=300&width=300",
    price: "Not Listed",
    priceUSD: 0,
    rarity: "Uncommon",
    traits: 4,
    listed: false,
    lastSale: "0.27 ETH",
  },
]

export default function EthereumCollectionPage({ params }: { params: { id: string } }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("price-low")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredNFTs = useMemo(() => {
    let filtered = nfts

    if (statusFilter === "listed") {
      filtered = filtered.filter(nft => nft.listed)
    } else if (statusFilter === "unlisted") {
      filtered = filtered.filter(nft => !nft.listed)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft =>
        nft.name.toLowerCase().includes(query) ||
        nft.rarity.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [searchQuery, statusFilter])

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
            src={collectionData.banner}
            alt={collectionData.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background flex-shrink-0 bg-background">
              <Image
                src={collectionData.image}
                alt={collectionData.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{collectionData.name}</h1>
                    {collectionData.verified && (
                      <Badge variant="secondary" className="text-sm">✓ Verified</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2">
                    by <Link href={`/profile/${collectionData.creator}`} className="hover:underline font-medium">{collectionData.creator}</Link>
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">{collectionData.chain}</Badge>
                    <span className="text-sm text-muted-foreground">{collectionData.royalty}% royalty</span>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">{collectionData.description}</p>
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
          <div className="text-2xl font-bold">{collectionData.floorPrice}</div>
          <div className="text-xs text-muted-foreground">${collectionData.floorPriceUSD.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Volume</div>
          <div className="text-2xl font-bold">{collectionData.totalVolume}</div>
          <div className="text-xs text-muted-foreground">${collectionData.totalVolumeUSD.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Items</div>
          <div className="text-2xl font-bold">{collectionData.items.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{collectionData.listed} listed</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Owners</div>
          <div className="text-2xl font-bold">{collectionData.owners.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{Math.round((collectionData.owners / collectionData.items) * 100)}% unique</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">24h Change</div>
          <div className={cn(
            "text-2xl font-bold flex items-center gap-1",
            collectionData.change24h > 0 ? "text-green-500" : "text-red-500"
          )}>
            {collectionData.change24h > 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            {Math.abs(collectionData.change24h)}%
          </div>
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
            {filteredNFTs.map((nft) => (
              <Card key={nft.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={nft.image}
                    alt={nft.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                  <div className="absolute bottom-2 left-2">
                    <Badge className="text-xs">{nft.rarity}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                    <p className="text-sm text-muted-foreground">{nft.traits} traits</p>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {nft.listed ? "Price" : "Last Sale"}
                      </div>
                      <div className="font-bold">
                        {nft.listed ? nft.price : nft.lastSale}
                      </div>
                    </div>
                    {nft.listed && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">USD</div>
                        <div className="text-sm">${nft.priceUSD}</div>
                      </div>
                    )}
                  </div>

                  {nft.listed ? (
                    <Button className="w-full" size="sm">
                      Buy Now
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" size="sm">
                      Make Offer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
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
    </div>
  )
}
