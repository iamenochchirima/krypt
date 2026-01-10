"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChainSelector } from "@/components/chain-selector"
import { supportedChains, getChainById } from "@/types/chains"
import { cn } from "@/lib/utils"
import { Search, LayoutGrid, LayoutList, TrendingUp, TrendingDown, Wallet, Plus, ExternalLink, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import type { Collection as CanisterCollection, Blockchain } from "@/declarations/marketplace/marketplace.did"

const blockchainToChain = (blockchain: Blockchain): string => {
  if ('ICP' in blockchain) return 'icp'
  if ('Ethereum' in blockchain) return 'ethereum'
  if ('Solana' in blockchain) return 'solana'
  if ('Bitcoin' in blockchain) return 'bitcoin'
  if ('Movement' in blockchain) return 'movement'
  if ('Casper' in blockchain) return 'casper'
  return 'icp'
}

const getTokenSymbol = (chain: string): string => {
  const symbols: Record<string, string> = {
    'movement': 'MOVE',
    'solana': 'SOL',
    'ethereum': 'ETH',
    'icp': 'ICP',
    'bitcoin': 'BTC',
    'casper': 'CSPR',
  }
  return symbols[chain] || chain.toUpperCase()
}

interface FormattedCollection {
  id: string
  name: string
  creator: string
  items: number
  volume: string
  volumeUSD: number
  floorPrice: string
  floorPriceUSD: number
  marketCap: number
  image: string
  banner: string
  chain: string
  verified: boolean
  change24h: number
  owners: number
  sales24h: number
}

export default function CollectionsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedChains, setSelectedChains] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [collections, setCollections] = useState<FormattedCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      setIsLoading(true)
      const actor = await getMarketplaceActor(null)
      const result = await actor.get_all_collections(0, 100)

      const formatted = result.map((col: CanisterCollection) => {
        const chain = blockchainToChain(col.blockchain)
        const tokenSymbol = getTokenSymbol(chain)
        const floorPriceNum = Number(col.floor_price) / 100000000
        const volumeNum = Number(col.total_volume) / 100000000

        return {
          id: col.id,
          name: col.name,
          creator: col.creator.toText(),
          items: Number(col.total_supply),
          volume: `${volumeNum.toFixed(2)} ${tokenSymbol}`,
          volumeUSD: volumeNum * 10,
          floorPrice: `${floorPriceNum.toFixed(2)} ${tokenSymbol}`,
          floorPriceUSD: floorPriceNum * 10,
          marketCap: volumeNum * 10,
          image: col.image_url,
          banner: col.banner_url[0] || col.image_url,
          chain,
          verified: true,
          change24h: Math.random() * 20 - 10,
          owners: Number(col.owner_count),
          sales24h: Number(col.listed_count),
        }
      })

      setCollections(formatted)
    } catch (error) {
      console.error("Failed to fetch collections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCollections = useMemo(() => {
    let filtered = collections

    if (selectedChains.length > 0) {
      filtered = filtered.filter(collection => selectedChains.includes(collection.chain))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(query) ||
        collection.creator.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [collections, selectedChains, searchQuery])

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Collections</h1>
            <p className="text-lg text-muted-foreground">
              Discover and trade NFT collections across multiple blockchains
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/collections/my">
                <Wallet className="mr-2 h-4 w-4" />
                My Collections
              </Link>
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" asChild>
              <Link href="/nft/create-collection">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>
        </div>

        {/* Featured Collection */}
        <div className="mb-8 rounded-xl overflow-hidden border bg-gradient-to-r from-primary/10 to-purple-600/10">
          <div className="relative h-48 md:h-64">
            <Image src="/placeholder.svg?height=600&width=1200" alt="Featured Collection" fill className="object-cover rounded-t-xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-end gap-4">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-background">
                  <Image
                    src="/placeholder.svg?height=300&width=300"
                    alt="Collection Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">Multi-Chain Genesis</h2>
                    <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                  </div>
                  <p className="text-white/80 text-sm">By CryptoArt Studios • Floor: 0.5 ETH</p>
                </div>
                <Button size="sm" variant="secondary" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ChainSelector
            selectedChains={selectedChains}
            onChainSelect={(chains: string[]) => setSelectedChains(chains)}
            className="min-w-[200px]"
          />

          <div className="flex items-center gap-2 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead className="text-right">Floor Price</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Owners</TableHead>
                <TableHead className="text-right">24h %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.map((collection, index) => {
                const chain = getChainById(collection.chain)

                return (
                  <TableRow key={collection.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Link href={`/collections/${collection.chain}/${collection.id}`} className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={collection.image}
                            alt={collection.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{collection.name}</span>
                            {collection.verified && (
                              <Badge variant="secondary" className="text-xs">✓</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">by {collection.creator}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {chain && (
                        <div className="flex items-center gap-2">
                          <Image src={chain.icon} alt={chain.name} width={20} height={20} className="rounded-full" />
                          <span className="text-sm">{chain.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{collection.floorPrice}</div>
                      <div className="text-xs text-muted-foreground">${collection.floorPriceUSD.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{collection.volume}</div>
                      <div className="text-xs text-muted-foreground">${collection.volumeUSD.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(collection.marketCap / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.items.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.owners.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        collection.change24h > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {collection.change24h > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(collection.change24h).toFixed(1)}%
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCollections.map((collection) => {
            const chain = getChainById(collection.chain)

            return (
              <Card key={collection.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <Link href={`/collections/${collection.chain}/${collection.id}`}>
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={collection.banner}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {chain && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center space-x-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                          <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />
                          <span className="text-xs font-medium">{chain.symbol}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative -mt-8 h-16 w-16 overflow-hidden rounded-xl border-4 border-background flex-shrink-0">
                        <Image
                          src={collection.image}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold truncate">{collection.name}</h3>
                          {collection.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">by {collection.creator}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Floor</div>
                        <div className="font-medium text-sm">{collection.floorPrice}</div>
                        <div className="text-xs text-muted-foreground">${collection.floorPriceUSD}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                        <div className="font-medium text-sm">{collection.volume}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{collection.items.toLocaleString()} items</span>
                      <span className={cn(
                        "font-medium",
                        collection.change24h > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {collection.change24h > 0 ? '+' : ''}{collection.change24h}%
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {filteredCollections.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No collections found</div>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      )}
        </TabsContent>

        <TabsContent value="top" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead className="text-right">Floor Price</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Owners</TableHead>
                <TableHead className="text-right">24h %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.map((collection, index) => {
                const chain = getChainById(collection.chain)

                return (
                  <TableRow key={collection.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Link href={`/collections/${collection.chain}/${collection.id}`} className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={collection.image}
                            alt={collection.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{collection.name}</span>
                            {collection.verified && (
                              <Badge variant="secondary" className="text-xs">✓</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">by {collection.creator}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {chain && (
                        <div className="flex items-center gap-2">
                          <Image src={chain.icon} alt={chain.name} width={20} height={20} className="rounded-full" />
                          <span className="text-sm">{chain.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{collection.floorPrice}</div>
                      <div className="text-xs text-muted-foreground">${collection.floorPriceUSD.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{collection.volume}</div>
                      <div className="text-xs text-muted-foreground">${collection.volumeUSD.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(collection.marketCap / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.items.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.owners.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        collection.change24h > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {collection.change24h > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(collection.change24h).toFixed(1)}%
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCollections.map((collection) => {
            const chain = getChainById(collection.chain)

            return (
              <Card key={collection.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <Link href={`/collections/${collection.chain}/${collection.id}`}>
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={collection.banner}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {chain && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center space-x-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                          <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />
                          <span className="text-xs font-medium">{chain.symbol}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative -mt-8 h-16 w-16 overflow-hidden rounded-xl border-4 border-background flex-shrink-0">
                        <Image
                          src={collection.image}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold truncate">{collection.name}</h3>
                          {collection.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">by {collection.creator}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Floor</div>
                        <div className="font-medium text-sm">{collection.floorPrice}</div>
                        <div className="text-xs text-muted-foreground">${collection.floorPriceUSD}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                        <div className="font-medium text-sm">{collection.volume}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{collection.items.toLocaleString()} items</span>
                      <span className={cn(
                        "font-medium",
                        collection.change24h > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {collection.change24h > 0 ? '+' : ''}{collection.change24h}%
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {filteredCollections.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No collections found</div>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      )}
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">Coming Soon</div>
              <p className="text-sm text-muted-foreground">New collections will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'table' ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead className="text-right">Floor Price</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Owners</TableHead>
                <TableHead className="text-right">24h %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.map((collection, index) => {
                const chain = getChainById(collection.chain)

                return (
                  <TableRow key={collection.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Link href={`/collections/${collection.chain}/${collection.id}`} className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={collection.image}
                            alt={collection.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{collection.name}</span>
                            {collection.verified && (
                              <Badge variant="secondary" className="text-xs">✓</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">by {collection.creator}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {chain && (
                        <div className="flex items-center gap-2">
                          <Image src={chain.icon} alt={chain.name} width={20} height={20} className="rounded-full" />
                          <span className="text-sm">{chain.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{collection.floorPrice}</div>
                      <div className="text-xs text-muted-foreground">${collection.floorPriceUSD.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{collection.volume}</div>
                      <div className="text-xs text-muted-foreground">${collection.volumeUSD.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(collection.marketCap / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.items.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.owners.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        collection.change24h > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {collection.change24h > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(collection.change24h).toFixed(1)}%
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCollections.map((collection) => {
            const chain = getChainById(collection.chain)

            return (
              <Card key={collection.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <Link href={`/collections/${collection.chain}/${collection.id}`}>
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={collection.banner}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {chain && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center space-x-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1">
                          <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-full" />
                          <span className="text-xs font-medium">{chain.symbol}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative -mt-8 h-16 w-16 overflow-hidden rounded-xl border-4 border-background flex-shrink-0">
                        <Image
                          src={collection.image}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold truncate">{collection.name}</h3>
                          {collection.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">by {collection.creator}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Floor</div>
                        <div className="font-medium text-sm">{collection.floorPrice}</div>
                        <div className="text-xs text-muted-foreground">${collection.floorPriceUSD}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                        <div className="font-medium text-sm">{collection.volume}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{collection.items.toLocaleString()} items</span>
                      <span className={cn(
                        "font-medium",
                        collection.change24h > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {collection.change24h > 0 ? '+' : ''}{collection.change24h}%
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {filteredCollections.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No collections found</div>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
