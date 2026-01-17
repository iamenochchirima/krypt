"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WatchlistPage() {
  // TODO: Fetch user's watchlist from backend
  const watchlist: any[] = []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Watchlist</h1>
        <p className="text-muted-foreground">Collections and drops you're keeping an eye on.</p>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Watchlist items will be rendered here */}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start adding collections and upcoming drops to your watchlist to track them here.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/nft/collections">
              <Button variant="outline">Browse Collections</Button>
            </Link>
            <Link href="/nft/launchpad">
              <Button>Explore Launchpad</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
