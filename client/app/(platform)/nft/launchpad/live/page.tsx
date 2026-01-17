"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Flame, ArrowLeft, Plus, Rocket } from "lucide-react"
import { MOCK_SALES, LiveSaleCard } from "../page"

export default function LiveLaunchesPage() {
  const liveSales = MOCK_SALES.filter(s => s.status === "live")

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
              <Flame className="w-6 h-6 text-green-500" />
              <h1 className="text-3xl font-bold">Live Launches</h1>
            </div>
            <p className="text-muted-foreground mt-1">Minting now across all chains</p>
          </div>
        </div>
        <Link href="/nft/launchpad/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Launch
          </Button>
        </Link>
      </div>

      {liveSales.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {liveSales.map(sale => (
            <LiveSaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Flame className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No live launches right now</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Check back soon or browse upcoming launches to see what's coming next.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/nft/launchpad/upcoming">
              <Button variant="outline">View Upcoming</Button>
            </Link>
            <Link href="/nft/launchpad/create">
              <Button className="gap-2">
                <Rocket className="w-4 h-4" />
                Create Your Own
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
