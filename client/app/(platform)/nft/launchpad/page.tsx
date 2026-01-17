"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, Flame, CheckCircle, Calendar, Plus, ArrowRight } from "lucide-react"
import { getChainById } from "@/types/chains"

type SaleType = "FixedPrice" | "OpenEdition" | "DutchAuction"
type SaleStatus = "upcoming" | "live" | "ended"

interface SaleCollection {
  id: string
  slug: string
  name: string
  description: string
  image: string
  banner: string
  chain: string
  creator: string
  price: number
  priceSymbol: string
  totalSupply: number
  minted: number
  startTime: number
  endTime: number | null
  publicStartTime: number | null
  saleType: SaleType
  status: SaleStatus
  whitelistOnly?: boolean
}

export const MOCK_SALES: SaleCollection[] = [
  {
    id: "1",
    slug: "cosmic-dreamers",
    name: "Cosmic Dreamers",
    description: "A collection of 5,000 unique cosmic beings exploring the universe.",
    image: "https://images.unsplash.com/photo-1634017839464-5c339ez0f4?w=400",
    banner: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800",
    chain: "solana",
    creator: "CosmicArt",
    price: 1.5,
    priceSymbol: "SOL",
    totalSupply: 5000,
    minted: 3247,
    startTime: Date.now() - 3600000,
    endTime: Date.now() + 86400000,
    publicStartTime: Date.now() - 1800000,
    saleType: "FixedPrice",
    status: "live",
  },
  {
    id: "2",
    slug: "neon-punks",
    name: "Neon Punks",
    description: "10,000 cyberpunk characters with neon aesthetics.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    chain: "solana",
    creator: "NeonLabs",
    price: 2.0,
    priceSymbol: "SOL",
    totalSupply: 10000,
    minted: 8921,
    startTime: Date.now() - 7200000,
    endTime: null,
    publicStartTime: Date.now() - 3600000,
    saleType: "FixedPrice",
    status: "live",
  },
  {
    id: "3",
    slug: "abstract-minds",
    name: "Abstract Minds",
    description: "Limited edition abstract art collection.",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400",
    banner: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    chain: "ethereum",
    creator: "AbstractDAO",
    price: 0.08,
    priceSymbol: "ETH",
    totalSupply: 0,
    minted: 1247,
    startTime: Date.now() - 1800000,
    endTime: Date.now() + 43200000,
    publicStartTime: null,
    saleType: "OpenEdition",
    status: "live",
  },
  {
    id: "4",
    slug: "galactic-warriors",
    name: "Galactic Warriors",
    description: "Epic warriors from across the galaxy.",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400",
    banner: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800",
    chain: "solana",
    creator: "GalacticStudios",
    price: 3.0,
    priceSymbol: "SOL",
    totalSupply: 3333,
    minted: 0,
    startTime: Date.now() + 7200000,
    endTime: Date.now() + 172800000,
    publicStartTime: Date.now() + 10800000,
    saleType: "FixedPrice",
    status: "upcoming",
    whitelistOnly: true,
  },
  {
    id: "5",
    slug: "digital-fauna",
    name: "Digital Fauna",
    description: "Rare digital creatures from an alternate dimension.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    banner: "https://images.unsplash.com/photo-1511497584788-876760111969?w=800",
    chain: "movement",
    creator: "FaunaLabs",
    price: 50,
    priceSymbol: "MOVE",
    totalSupply: 7777,
    minted: 0,
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 259200000,
    publicStartTime: Date.now() + 90000000,
    saleType: "FixedPrice",
    status: "upcoming",
  },
  {
    id: "6",
    slug: "pixel-legends",
    name: "Pixel Legends",
    description: "Retro pixel art legends collection.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400",
    banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    chain: "solana",
    creator: "PixelMaster",
    price: 0.5,
    priceSymbol: "SOL",
    totalSupply: 2000,
    minted: 0,
    startTime: Date.now() + 259200000,
    endTime: null,
    publicStartTime: Date.now() + 262800000,
    saleType: "DutchAuction",
    status: "upcoming",
  },
  {
    id: "7",
    slug: "ancient-artifacts",
    name: "Ancient Artifacts",
    description: "Mystical artifacts from ancient civilizations.",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12a74?w=400",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
    chain: "ethereum",
    creator: "ArtifactDAO",
    price: 0.15,
    priceSymbol: "ETH",
    totalSupply: 4444,
    minted: 4444,
    startTime: Date.now() - 172800000,
    endTime: Date.now() - 86400000,
    publicStartTime: null,
    saleType: "FixedPrice",
    status: "ended",
  },
  {
    id: "8",
    slug: "cyber-samurai",
    name: "Cyber Samurai",
    description: "Futuristic samurai warriors.",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400",
    banner: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    chain: "solana",
    creator: "SamuraiLabs",
    price: 2.5,
    priceSymbol: "SOL",
    totalSupply: 8888,
    minted: 8888,
    startTime: Date.now() - 259200000,
    endTime: Date.now() - 172800000,
    publicStartTime: null,
    saleType: "FixedPrice",
    status: "ended",
  },
]

function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTime))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
}

function calculateTimeLeft(targetTime: number) {
  const diff = targetTime - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function CountdownTimer({ targetTime }: { targetTime: number }) {
  const { days, hours, minutes, seconds } = useCountdown(targetTime)

  return (
    <div className="flex gap-2">
      {days > 0 && (
        <div className="text-center">
          <div className="text-2xl font-bold">{days}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      )}
      <div className="text-center">
        <div className="text-2xl font-bold">{String(hours).padStart(2, "0")}</div>
        <div className="text-xs text-muted-foreground">hrs</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{String(minutes).padStart(2, "0")}</div>
        <div className="text-xs text-muted-foreground">min</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{String(seconds).padStart(2, "0")}</div>
        <div className="text-xs text-muted-foreground">sec</div>
      </div>
    </div>
  )
}

export function LiveSaleCard({ sale }: { sale: SaleCollection }) {
  const mintedPercent = sale.totalSupply > 0 ? (sale.minted / sale.totalSupply) * 100 : 0
  const isOpenEdition = sale.saleType === "OpenEdition"
  const chain = getChainById(sale.chain)

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/nft/launchpad/${sale.chain}/${sale.slug}`}>
        <div className="relative h-40 w-full overflow-hidden">
          <Image src={sale.banner} alt={sale.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white">
              <Flame className="w-3 h-3 mr-1" /> LIVE
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
              {chain && <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />}
              <span className="text-xs font-medium">{chain?.name || sale.chain}</span>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-2">
              <div className="relative h-12 w-12 rounded-lg overflow-hidden border-2 border-white">
                <Image src={sale.image} alt={sale.name} fill className="object-cover" />
              </div>
              <div className="text-white">
                <h3 className="font-bold">{sale.name}</h3>
                <p className="text-xs opacity-80">by {sale.creator}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-bold">{sale.price} {sale.priceSymbol}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{isOpenEdition ? "Minted" : "Supply"}</div>
              <div className="font-bold">
                {isOpenEdition ? sale.minted.toLocaleString() : `${sale.minted.toLocaleString()} / ${sale.totalSupply.toLocaleString()}`}
              </div>
            </div>
          </div>
          {!isOpenEdition && (
            <div className="mb-3">
              <Progress value={mintedPercent} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">{mintedPercent.toFixed(1)}% minted</div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="outline">{sale.saleType}</Badge>
            {sale.endTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Ends in {Math.ceil((sale.endTime - Date.now()) / 3600000)}h
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}

export function UpcomingSaleCard({ sale }: { sale: SaleCollection }) {
  const chain = getChainById(sale.chain)

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/nft/launchpad/${sale.chain}/${sale.slug}`}>
        <div className="relative h-48 w-full overflow-hidden">
          <Image src={sale.banner} alt={sale.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" /> UPCOMING
            </Badge>
          </div>
          {sale.whitelistOnly && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-purple-500 text-white">Whitelist</Badge>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-white">
                <Image src={sale.image} alt={sale.name} fill className="object-cover" />
              </div>
              <div className="text-white flex-1">
                <h3 className="font-bold text-lg">{sale.name}</h3>
                <p className="text-sm opacity-80">by {sale.creator}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
                {chain && <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />}
                <span className="text-xs font-medium text-white">{chain?.name || sale.chain}</span>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3">
              <div className="text-xs text-white/70 mb-1">Starts in</div>
              <CountdownTimer targetTime={sale.startTime} />
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sale.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-bold">{sale.price} {sale.priceSymbol}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Supply</div>
              <div className="font-bold">{sale.totalSupply > 0 ? sale.totalSupply.toLocaleString() : "Open"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Type</div>
              <div className="font-bold text-sm">{sale.saleType}</div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

export function PastSaleCard({ sale }: { sale: SaleCollection }) {
  const soldOut = sale.minted >= sale.totalSupply
  const chain = getChainById(sale.chain)

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg opacity-80">
      <Link href={`/nft/collections/${sale.chain}/${sale.slug}`}>
        <div className="relative h-32 w-full overflow-hidden grayscale-[30%]">
          <Image src={sale.banner} alt={sale.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-gray-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" /> ENDED
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            {soldOut && <Badge className="bg-green-600 text-white">Sold Out</Badge>}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden">
              <Image src={sale.image} alt={sale.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{sale.name}</h3>
              <p className="text-xs text-muted-foreground">by {sale.creator}</p>
            </div>
            {chain && <Image src={chain.icon} alt={chain.name} width={20} height={20} className="rounded-full" />}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Mint Price</div>
              <div className="font-medium">{sale.price} {sale.priceSymbol}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Minted</div>
              <div className="font-medium">{sale.minted.toLocaleString()} / {sale.totalSupply.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

function SectionHeader({ title, icon: Icon, count, href }: { title: string; icon: React.ElementType; count: number; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="sm" className="gap-1">
          More <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  )
}

export default function LaunchpadPage() {
  const liveSales = MOCK_SALES.filter(s => s.status === "live")
  const upcomingSales = MOCK_SALES.filter(s => s.status === "upcoming")
  const pastSales = MOCK_SALES.filter(s => s.status === "ended")

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Launchpad</h1>
          <p className="text-muted-foreground">Discover live mints, upcoming drops, and past launches across all chains.</p>
        </div>
        <Link href="/nft/launchpad/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Launch
          </Button>
        </Link>
      </div>

      {/* Live Section */}
      <section>
        <SectionHeader title="Live Now" icon={Flame} count={liveSales.length} href="/nft/launchpad/live" />
        {liveSales.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {liveSales.slice(0, 3).map(sale => (
              <LiveSaleCard key={sale.id} sale={sale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Flame className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No live launches right now</p>
          </div>
        )}
      </section>

      {/* Upcoming Section */}
      <section>
        <SectionHeader title="Upcoming" icon={Calendar} count={upcomingSales.length} href="/nft/launchpad/upcoming" />
        {upcomingSales.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingSales.slice(0, 3).map(sale => (
              <UpcomingSaleCard key={sale.id} sale={sale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No upcoming launches scheduled</p>
          </div>
        )}
      </section>

      {/* Past Section */}
      <section>
        <SectionHeader title="Past Launches" icon={CheckCircle} count={pastSales.length} href="/nft/launchpad/past" />
        {pastSales.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pastSales.slice(0, 4).map(sale => (
              <PastSaleCard key={sale.id} sale={sale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <CheckCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No past launches yet</p>
          </div>
        )}
      </section>
    </div>
  )
}
