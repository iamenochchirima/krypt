"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowLeft, Plus } from "lucide-react"
import { MOCK_SALES, PastSaleCard } from "../page"

export default function PastLaunchesPage() {
  const pastSales = MOCK_SALES.filter(s => s.status === "ended")

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
