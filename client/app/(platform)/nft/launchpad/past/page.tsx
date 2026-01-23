"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowLeft, Plus, Loader2 } from "lucide-react"
import { PastSaleCard } from "../page"
import { getRegistryActor } from "@/providers/actors/marketplace"
import type { Collection, Blockchain, InitialSale } from "@/declarations/registry/registry.did"

type SaleType = "FixedPrice" | "OpenEdition" | "DutchAuction"

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
  status: "ended"
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

const transformCollection = (col: Collection): SaleCollection => {
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
    status: "ended",
    whitelistOnly: false,
  }
}

export default function PastLaunchesPage() {
  const [pastSales, setPastSales] = useState<SaleCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPastSales()
  }, [])

  const fetchPastSales = async () => {
    try {
      setIsLoading(true)
      const actor = await getRegistryActor(null)
      const result = await actor.get_ended_sales(0, 50)
      setPastSales(result.map((col: Collection) => transformCollection(col)))
    } catch (error) {
      console.error("Failed to fetch past sales:", error)
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/nft/launchpad">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-gray-500" />
              <h1 className="text-3xl font-bold">Past Launches</h1>
            </div>
            <p className="text-muted-foreground mt-1">Completed mints across all chains</p>
          </div>
        </div>
        <Link href="/nft/launchpad/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Launch
          </Button>
        </Link>
      </div>

      {pastSales.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pastSales.map(sale => (
            <PastSaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No past launches yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Completed launches will appear here once they end.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/nft/launchpad/live">
              <Button variant="outline">View Live</Button>
            </Link>
            <Link href="/nft/launchpad/upcoming">
              <Button variant="outline">View Upcoming</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
