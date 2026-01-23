"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, Flame, CheckCircle, Calendar, Plus, ArrowRight, Loader2 } from "lucide-react"
import { getChainById } from "@/types/chains"
import { getRegistryActor } from "@/providers/actors/marketplace"
import type { Collection, Blockchain, InitialSale } from "@/declarations/registry/registry.did"

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

const blockchainToChain = (blockchain: Blockchain): string => {
  if ('ICP' in blockchain) return 'icp'
  if ('Ethereum' in blockchain) return 'ethereum'
  if ('Solana' in blockchain) return 'solana'
  if ('Movement' in blockchain) return 'movement'
  return 'icp'
}

const getTokenSymbol = (chain: string): string => {
  const symbols: Record<string, string> = {
    'movement': 'MOVE',
    'solana': 'SOL',
    'ethereum': 'ETH',
    'icp': 'ICP',
  }
  return symbols[chain] || chain.toUpperCase()
}

const getSaleType = (sale: InitialSale | undefined, blockchain: Blockchain): SaleType => {
  if (!sale) return "FixedPrice"
  const config = sale.config

  if ('Solana' in config) {
    const saleType = config.Solana.sale_type
    if ('OpenEdition' in saleType) return "OpenEdition"
    if ('DutchAuction' in saleType) return "DutchAuction"
    return "FixedPrice"
  }
  if ('Ethereum' in config) {
    const saleType = config.Ethereum.sale_type
    if ('OpenEdition' in saleType) return "OpenEdition"
    if ('DutchAuction' in saleType) return "DutchAuction"
    return "FixedPrice"
  }
  if ('ICP' in config) {
    const saleType = config.ICP.sale_type
    if ('OpenEdition' in saleType) return "OpenEdition"
    return "FixedPrice"
  }
  if ('Movement' in config) {
    const saleType = config.Movement.sale_type
    if ('OpenEdition' in saleType) return "OpenEdition"
    return "FixedPrice"
  }
  return "FixedPrice"
}

const transformCollection = (col: Collection, status: SaleStatus): SaleCollection => {
  const chain = blockchainToChain(col.blockchain)
  const tokenSymbol = getTokenSymbol(chain)
  const sale = col.initial_sale[0]

  let priceNum = 0
  if (col.mint_price[0]) {
    if (chain === 'ethereum') {
      priceNum = Number(col.mint_price[0]) / 1e18
    } else {
      priceNum = Number(col.mint_price[0]) / 1e8
    }
  }

  return {
    id: col.id,
    slug: col.slug,
    name: col.name,
    description: col.description,
    image: col.image_url,
    banner: col.banner_url[0] || col.image_url,
    chain,
    creator: col.creator.toText().slice(0, 8) + '...',
    price: priceNum,
    priceSymbol: tokenSymbol,
    totalSupply: Number(col.total_supply),
    minted: 0,
    startTime: sale ? Number(sale.start_time) / 1000000 : Date.now(),
    endTime: sale?.end_time[0] ? Number(sale.end_time[0]) / 1000000 : null,
    publicStartTime: sale?.public_start_time[0] ? Number(sale.public_start_time[0]) / 1000000 : null,
    saleType: getSaleType(sale, col.blockchain),
    status,
    whitelistOnly: sale?.public_start_time[0] ? Number(sale.public_start_time[0]) > Date.now() * 1000000 : false,
  }
}

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
          {!isOpenEdition && sale.totalSupply > 0 && (
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
  const soldOut = sale.totalSupply > 0 && sale.minted >= sale.totalSupply
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
              <div className="font-medium">
                {sale.totalSupply > 0
                  ? `${sale.minted.toLocaleString()} / ${sale.totalSupply.toLocaleString()}`
                  : sale.minted.toLocaleString()
                }
              </div>
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
  const [liveSales, setLiveSales] = useState<SaleCollection[]>([])
  const [upcomingSales, setUpcomingSales] = useState<SaleCollection[]>([])
  const [pastSales, setPastSales] = useState<SaleCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setIsLoading(true)
      const actor = await getRegistryActor(null)

      const [live, upcoming, ended] = await Promise.all([
        actor.get_live_sales(0, 10),
        actor.get_upcoming_sales(0, 10),
        actor.get_ended_sales(0, 10),
      ])

      setLiveSales(live.map((col: Collection) => transformCollection(col, "live")))
      setUpcomingSales(upcoming.map((col: Collection) => transformCollection(col, "upcoming")))
      setPastSales(ended.map((col: Collection) => transformCollection(col, "ended")))
    } catch (error) {
      console.error("Failed to fetch sales:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
