"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft, Plus, Rocket } from "lucide-react"
import { MOCK_SALES, UpcomingSaleCard } from "../page"

export default function UpcomingLaunchesPage() {
  const upcomingSales = MOCK_SALES.filter(s => s.status === "upcoming")

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
              <Calendar className="w-6 h-6 text-blue-500" />
              <h1 className="text-3xl font-bold">Upcoming Launches</h1>
            </div>
            <p className="text-muted-foreground mt-1">Drops coming soon across all chains</p>
          </div>
        </div>
        <Link href="/nft/launchpad/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Launch
          </Button>
        </Link>
      </div>

      {upcomingSales.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingSales.map(sale => (
            <UpcomingSaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No upcoming launches</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Be the first to schedule your NFT launch on our platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/nft/launchpad/live">
              <Button variant="outline">View Live</Button>
            </Link>
            <Link href="/nft/launchpad/create">
              <Button className="gap-2">
                <Rocket className="w-4 h-4" />
                Schedule Your Launch
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
