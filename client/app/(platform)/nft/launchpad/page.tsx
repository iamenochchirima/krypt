"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Rocket, Plus } from "lucide-react"

export default function NFTLaunchpadPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NFT Launchpad</h1>
          <p className="text-muted-foreground mt-2">
            Discover and participate in NFT collection launches across multiple chains.
          </p>
        </div>
        <Link href="/nft/launchpad/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Active Launches</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to launch your NFT collection!
            </p>
            <Link href="/nft/launchpad/create">
              <Button variant="outline">Create Collection</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
