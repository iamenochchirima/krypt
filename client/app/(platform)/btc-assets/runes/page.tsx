"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Clock,
  TrendingUp,
  Sparkles,
  Filter,
  LayoutGrid,
  List,
  Rocket,
} from "lucide-react"

const MOCK_TOKENS = [
  { id: 1, name: "PEPE•RUNE•XXXX•KRYPT", ticker: "PEPE", price: 0.00000234, change24h: 45.2, volume: 2.4, holders: 1234, marketCap: 0.45, progress: 90, ascended: false },
  { id: 2, name: "DOGE•MOON•XXXX•KRYPT", ticker: "DOGE", price: 0.00000156, change24h: 23.1, volume: 1.8, holders: 892, marketCap: 0.32, progress: 64, ascended: false },
  { id: 3, name: "SATS•ARMY•XXXX•KRYPT", ticker: "SATS", price: 0.00000089, change24h: -5.4, volume: 0.9, holders: 567, marketCap: 0.18, progress: 36, ascended: false },
  { id: 4, name: "MOON•BOY•XXXX•KRYPT", ticker: "MOON", price: 0.00000445, change24h: 12.8, volume: 1.2, holders: 445, marketCap: 0.28, progress: 56, ascended: false },
  { id: 5, name: "PUMP•IT•XXXX•KRYPT", ticker: "PUMP", price: 0.00000067, change24h: -2.1, volume: 0.5, holders: 234, marketCap: 0.12, progress: 24, ascended: false },
  { id: 6, name: "LEGENDARY•XXXX•KRYPT", ticker: "LEGEND", price: 0.00002345, change24h: 8.5, volume: 5.6, holders: 3456, marketCap: 2.1, progress: 100, ascended: true },
  { id: 7, name: "DIAMOND•HANDS•KRYPT", ticker: "DIAM", price: 0.00001890, change24h: -3.2, volume: 4.2, holders: 2890, marketCap: 1.8, progress: 100, ascended: true },
  { id: 8, name: "FAST•BTC•XXXX•KRYPT", ticker: "FAST", price: 0.00000012, change24h: 5.2, volume: 0.1, holders: 45, marketCap: 0.02, progress: 4, ascended: false },
  { id: 9, name: "REKT•COIN•XXXX•KRYPT", ticker: "REKT", price: 0.00000008, change24h: -12.5, volume: 0.05, holders: 28, marketCap: 0.01, progress: 2, ascended: false },
  { id: 10, name: "ALPHA•CHAD•XXXX•KRYPT", ticker: "ALPHA", price: 0.00000098, change24h: 78.3, volume: 0.8, holders: 156, marketCap: 0.08, progress: 16, ascended: false },
]

function TokenCard({ token }: { token: typeof MOCK_TOKENS[0] }) {
  return (
    <Link href={`/btc-assets/runes/${token.id}`}>
      <Card className="p-4 hover:border-orange-500/50 transition-colors cursor-pointer h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold">
            {token.ticker.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{token.ticker}</span>
              {token.ascended && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Ascended
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{token.name}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{token.price.toFixed(8)}</span>
            <span className={`text-sm flex items-center gap-1 ${token.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
              {token.change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(token.change24h).toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">MCap</p>
              <p className="font-medium">{token.marketCap} BTC</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-medium">{token.volume} BTC</p>
            </div>
            <div>
              <p className="text-muted-foreground">Holders</p>
              <p className="font-medium">{token.holders}</p>
            </div>
          </div>
          {!token.ascended && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress to Ascension</span>
                <span className="text-orange-500">{token.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all"
                  style={{ width: `${token.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

function TokenRow({ token }: { token: typeof MOCK_TOKENS[0] }) {
  return (
    <Link href={`/btc-assets/runes/${token.id}`}>
      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border-b border-border last:border-0">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {token.ticker.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{token.ticker}</span>
            {token.ascended && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Ascended
              </Badge>
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
        <div className="text-right hidden sm:block w-24">
          <div className="text-xs text-muted-foreground">Volume</div>
          <div className="font-medium">{token.volume} BTC</div>
        </div>
        <div className="text-right hidden md:block w-24">
          <div className="text-xs text-muted-foreground">MCap</div>
          <div className="font-medium">{token.marketCap} BTC</div>
        </div>
        <div className="text-right hidden lg:block w-20">
          <div className="text-xs text-muted-foreground">Holders</div>
          <div className="font-medium">{token.holders}</div>
        </div>
        {!token.ascended && (
          <div className="hidden xl:block w-32">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-orange-500">{token.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                style={{ width: `${token.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function RunesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("trending")
  const [filterTab, setFilterTab] = useState("all")

  const filteredTokens = MOCK_TOKENS.filter(token => {
    if (filterTab === "ascended") return token.ascended
    if (filterTab === "bonding") return !token.ascended
    return true
  }).filter(token =>
    token.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Runes
          </h1>
          <p className="text-muted-foreground">Browse and trade fast Bitcoin Runes</p>
        </div>
        <Link href="/btc-assets/create">
          <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
            <Rocket className="h-4 w-4" />
            Create Token
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="marketCap">Market Cap</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="gainers">Top Gainers</SelectItem>
              <SelectItem value="losers">Top Losers</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={filterTab} onValueChange={setFilterTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            All Tokens
          </TabsTrigger>
          <TabsTrigger value="bonding" className="gap-2">
            <Flame className="h-4 w-4" />
            Bonding Curve
          </TabsTrigger>
          <TabsTrigger value="ascended" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Ascended
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterTab} className="mt-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTokens.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          ) : (
            <Card>
              {filteredTokens.map((token) => (
                <TokenRow key={token.id} token={token} />
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {filteredTokens.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tokens found</p>
        </div>
      )}
    </div>
  )
}
