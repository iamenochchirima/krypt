"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Flame,
  Clock,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Rocket,
  Users,
  BarChart3,
  Bitcoin,
  Zap,
} from "lucide-react"

const MOCK_TRENDING = [
  { id: 1, name: "PEPE•RUNE•XXXX•KRYPT", ticker: "PEPE", price: 0.00000234, change24h: 45.2, volume: 2.4, holders: 1234, marketCap: 0.45, logo: "/placeholder.svg" },
  { id: 2, name: "DOGE•MOON•XXXX•KRYPT", ticker: "DOGE", price: 0.00000156, change24h: 23.1, volume: 1.8, holders: 892, marketCap: 0.32, logo: "/placeholder.svg" },
  { id: 3, name: "SATS•ARMY•XXXX•KRYPT", ticker: "SATS", price: 0.00000089, change24h: -5.4, volume: 0.9, holders: 567, marketCap: 0.18, logo: "/placeholder.svg" },
  { id: 4, name: "MOON•BOY•XXXX•KRYPT", ticker: "MOON", price: 0.00000445, change24h: 12.8, volume: 1.2, holders: 445, marketCap: 0.28, logo: "/placeholder.svg" },
  { id: 5, name: "PUMP•IT•XXXX•KRYPT", ticker: "PUMP", price: 0.00000067, change24h: -2.1, volume: 0.5, holders: 234, marketCap: 0.12, logo: "/placeholder.svg" },
]

const MOCK_RECENT = [
  { id: 6, name: "FAST•BTC•XXXX•KRYPT", ticker: "FAST", price: 0.00000012, change24h: 0, volume: 0.1, holders: 12, marketCap: 0.02, logo: "/placeholder.svg", createdAt: Date.now() - 300000 },
  { id: 7, name: "REKT•COIN•XXXX•KRYPT", ticker: "REKT", price: 0.00000008, change24h: 0, volume: 0.05, holders: 8, marketCap: 0.01, logo: "/placeholder.svg", createdAt: Date.now() - 600000 },
  { id: 8, name: "ALPHA•CHAD•XXXX•KRYPT", ticker: "ALPHA", price: 0.00000015, change24h: 0, volume: 0.08, holders: 15, marketCap: 0.03, logo: "/placeholder.svg", createdAt: Date.now() - 900000 },
  { id: 9, name: "BASED•RUNE•XXXX•KRYPT", ticker: "BASED", price: 0.00000020, change24h: 0, volume: 0.12, holders: 22, marketCap: 0.04, logo: "/placeholder.svg", createdAt: Date.now() - 1200000 },
]

const MOCK_ASCENDED = [
  { id: 10, name: "LEGENDARY•XXXX•KRYPT", ticker: "LEGEND", price: 0.00002345, change24h: 8.5, volume: 5.6, holders: 3456, marketCap: 2.1, logo: "/placeholder.svg", ascendedAt: Date.now() - 86400000 },
  { id: 11, name: "DIAMOND•HANDS•KRYPT", ticker: "DIAM", price: 0.00001890, change24h: -3.2, volume: 4.2, holders: 2890, marketCap: 1.8, logo: "/placeholder.svg", ascendedAt: Date.now() - 172800000 },
]

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function TokenRow({ token, showTime }: { token: typeof MOCK_TRENDING[0] & { createdAt?: number; ascendedAt?: number }; showTime?: boolean }) {
  return (
    <Link href={`/btc-assets/runes/${token.id}`}>
      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
        <div className="relative h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm">
            {token.ticker.slice(0, 2)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{token.ticker}</span>
            {showTime && token.createdAt && (
              <span className="text-xs text-muted-foreground">{formatTimeAgo(token.createdAt)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{token.name}</p>
        </div>
        <div className="text-right">
          <div className="font-medium">{token.price.toFixed(8)} BTC</div>
          <div className={`text-sm flex items-center justify-end gap-1 ${token.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
            {token.change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(token.change24h).toFixed(1)}%
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm text-muted-foreground">Vol</div>
          <div className="font-medium">{token.volume} BTC</div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm text-muted-foreground">MCap</div>
          <div className="font-medium">{token.marketCap} BTC</div>
        </div>
      </div>
    </Link>
  )
}

function StatCard({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: React.ElementType; subtitle?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Icon className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </Card>
  )
}

export default function BTCAssetsDiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bitcoin className="h-7 w-7 text-orange-500" />
            BTC Assets
          </h1>
          <p className="text-muted-foreground">Fast Bitcoin Runes trading on ICP</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Link href="/btc-assets/create">
            <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
              <Rocket className="h-4 w-4" />
              Create Token
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Volume (24h)" value="45.6 BTC" icon={BarChart3} subtitle="$2.1M USD" />
        <StatCard title="Active Tokens" value="1,234" icon={Flame} />
        <StatCard title="Total Traders" value="8,567" icon={Users} />
        <StatCard title="Ascended Tokens" value="42" icon={Sparkles} subtitle="Real Bitcoin Runes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Trending
              </h2>
              <Link href="/btc-assets/runes" className="text-sm text-orange-500 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {MOCK_TRENDING.map((token) => (
                <TokenRow key={token.id} token={token} />
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Recently Ascended
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              These tokens have reached the market cap threshold and are now real Bitcoin Runes
            </p>
            <div className="space-y-1">
              {MOCK_ASCENDED.map((token) => (
                <TokenRow key={token.id} token={token} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Just Launched
              </h2>
            </div>
            <div className="space-y-1">
              {MOCK_RECENT.map((token) => (
                <TokenRow key={token.id} token={token} showTime />
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-semibold">Fast Trading</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Trade Bitcoin Runes with 2-second finality. No gas fees. Instant settlement.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>Bonding curve price discovery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>Automatic BTC backing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>Ascend to real Bitcoin Runes</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">How It Works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Create Token</p>
                  <p className="text-muted-foreground">Launch with bonding curve</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Trade Fast</p>
                  <p className="text-muted-foreground">2-second trades on ICP</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Ascend</p>
                  <p className="text-muted-foreground">Become real Bitcoin Rune at 0.5 BTC mcap</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
