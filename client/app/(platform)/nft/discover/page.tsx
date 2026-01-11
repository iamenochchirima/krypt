"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Flame,
  Sparkles,
  Clock,
  ArrowRight,
  Verified,
  ExternalLink
} from "lucide-react"

// Hardcoded featured collections
const featuredCollections = [
  {
    id: "1",
    name: "Cosmic Voyagers",
    description: "A journey through the cosmos with 10,000 unique space explorers",
    image: "/placeholder.svg",
    banner: "/placeholder.svg",
    creator: "CosmicArt",
    verified: true,
    floorPrice: "2.5",
    totalVolume: "1,250",
    chain: "Solana",
  },
  {
    id: "2",
    name: "Digital Dreams",
    description: "Surreal digital art collection pushing the boundaries of imagination",
    image: "/placeholder.svg",
    banner: "/placeholder.svg",
    creator: "DreamWeaver",
    verified: true,
    floorPrice: "1.8",
    totalVolume: "890",
    chain: "Movement",
  },
  {
    id: "3",
    name: "Cyber Punks 2099",
    description: "Futuristic cyberpunk characters from the year 2099",
    image: "/placeholder.svg",
    banner: "/placeholder.svg",
    creator: "NeonStudio",
    verified: false,
    floorPrice: "0.5",
    totalVolume: "320",
    chain: "ICP",
  },
]

// Hardcoded new launches
const newLaunches = [
  {
    id: "4",
    name: "Abstract Minds",
    image: "/placeholder.svg",
    creator: "AbstractArt",
    mintPrice: "0.8",
    totalSupply: 5000,
    minted: 1250,
    launchDate: "2 days ago",
    chain: "Solana",
  },
  {
    id: "5",
    name: "Pixel Legends",
    image: "/placeholder.svg",
    creator: "PixelMaster",
    mintPrice: "0.3",
    totalSupply: 10000,
    minted: 4200,
    launchDate: "5 days ago",
    chain: "Movement",
  },
  {
    id: "6",
    name: "Nature Spirits",
    image: "/placeholder.svg",
    creator: "EcoArtist",
    mintPrice: "1.2",
    totalSupply: 3000,
    minted: 890,
    launchDate: "1 week ago",
    chain: "ICP",
  },
  {
    id: "7",
    name: "Metaverse Avatars",
    image: "/placeholder.svg",
    creator: "MetaCreator",
    mintPrice: "0.5",
    totalSupply: 8000,
    minted: 6500,
    launchDate: "3 days ago",
    chain: "Solana",
  },
]

// Hardcoded trending collections
const trendingCollections = [
  {
    id: "8",
    name: "Galactic Warriors",
    image: "/placeholder.svg",
    floorPrice: "3.2",
    change: "+45%",
    volume24h: "125",
    chain: "Solana",
  },
  {
    id: "9",
    name: "Zen Gardens",
    image: "/placeholder.svg",
    floorPrice: "1.5",
    change: "+32%",
    volume24h: "89",
    chain: "Movement",
  },
  {
    id: "10",
    name: "Robot Friends",
    image: "/placeholder.svg",
    floorPrice: "0.8",
    change: "+28%",
    volume24h: "67",
    chain: "ICP",
  },
  {
    id: "11",
    name: "Ocean Depths",
    image: "/placeholder.svg",
    floorPrice: "2.1",
    change: "+22%",
    volume24h: "54",
    chain: "Solana",
  },
  {
    id: "12",
    name: "Ancient Relics",
    image: "/placeholder.svg",
    floorPrice: "4.5",
    change: "+18%",
    volume24h: "230",
    chain: "Movement",
  },
]

function getChainColor(chain: string) {
  switch (chain) {
    case "Solana":
      return "bg-purple-500/10 text-purple-500"
    case "Movement":
      return "bg-blue-500/10 text-blue-500"
    case "ICP":
      return "bg-orange-500/10 text-orange-500"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function NFTDiscoverPage() {
  return (
    <div className="space-y-10">
      {/* Featured Collections */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Featured Collections</h2>
          </div>
          <Link href="/nft/collections">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredCollections.map((collection) => (
            <Link key={collection.id} href={`/nft/collections/${collection.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors group">
                <div className="relative h-32 bg-muted">
                  <Image
                    src={collection.banner}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute -bottom-6 left-4">
                    <div className="relative h-16 w-16 rounded-xl border-4 border-background overflow-hidden">
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
                <CardContent className="pt-8 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {collection.name}
                        </h3>
                        {collection.verified && (
                          <Verified className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">by {collection.creator}</p>
                    </div>
                    <Badge variant="secondary" className={getChainColor(collection.chain)}>
                      {collection.chain}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {collection.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Floor</p>
                      <p className="font-medium">{collection.floorPrice} SOL</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-medium">{collection.totalVolume} SOL</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* New Launches */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">New Launches</h2>
          </div>
          <Link href="/nft/launchpad">
            <Button variant="ghost" size="sm" className="gap-1">
              View Launchpad <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newLaunches.map((launch) => (
            <Link key={launch.id} href={`/nft/collections/${launch.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors group">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={launch.image}
                    alt={launch.name}
                    fill
                    className="object-cover"
                  />
                  <Badge
                    className="absolute top-2 right-2 bg-green-500/90 text-white"
                  >
                    New
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {launch.name}
                    </h3>
                    <Badge variant="secondary" className={getChainColor(launch.chain)}>
                      {launch.chain}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">by {launch.creator}</p>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Minted</span>
                      <span>{Math.round((launch.minted / launch.totalSupply) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(launch.minted / launch.totalSupply) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">{launch.mintPrice} SOL</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">{launch.launchDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Collections */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Trending</h2>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 text-sm text-muted-foreground border-b">
              <span className="w-8">#</span>
              <span>Collection</span>
              <span className="text-right w-20">Floor</span>
              <span className="text-right w-20">24h %</span>
              <span className="text-right w-24">24h Volume</span>
              <span className="w-20">Chain</span>
            </div>
            {trendingCollections.map((collection, index) => (
              <Link
                key={collection.id}
                href={`/nft/collections/${collection.id}`}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 items-center hover:bg-muted/50 transition-colors"
              >
                <span className="w-8 text-muted-foreground font-medium">{index + 1}</span>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium">{collection.name}</span>
                </div>
                <span className="text-right w-20 font-medium">{collection.floorPrice} SOL</span>
                <span className="text-right w-20 text-green-500 font-medium">{collection.change}</span>
                <span className="text-right w-24">{collection.volume24h} SOL</span>
                <Badge variant="secondary" className={`w-20 justify-center ${getChainColor(collection.chain)}`}>
                  {collection.chain}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
