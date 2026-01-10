"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Store, Search, Filter } from "lucide-react"

export default function NFTMarketplacePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Buy, sell, and trade NFTs across multiple blockchains.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search NFTs..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dashed col-span-full">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No NFTs Listed</h3>
            <p className="text-sm text-muted-foreground">
              The marketplace is empty. Be the first to list an NFT!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
