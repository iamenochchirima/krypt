"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Clock, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

interface DraftCardProps {
  draft: {
    id: string
    formData: any
    collectionImage?: any
    nftAssets?: any[]
    lastUpdated: number
    blockchain: string
  }
  onDiscard: (draftId: string) => void
}

export function DraftCard({ draft, onDiscard }: DraftCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getBlockchainLink = (blockchain: string) => {
    return `/nft/launchpad/${blockchain.toLowerCase()}`
  }

  const getBlockchainColor = (blockchain: string) => {
    const colors: Record<string, string> = {
      solana: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
      ethereum: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
      bnb: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
      polygon: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
      arbitrum: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
      icp: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100",
    }
    return colors[blockchain.toLowerCase()] || "bg-gray-100 text-gray-900"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={getBlockchainColor(draft.blockchain)}>
                {draft.blockchain}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(draft.lastUpdated)}
              </div>
            </div>

            <h3 className="font-semibold truncate mb-1">
              {draft.formData.name || "Untitled Collection"}
            </h3>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {draft.formData.symbol && (
                <span className="font-mono">{draft.formData.symbol}</span>
              )}
              {draft.collectionImage && (
                <div className="flex items-center">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  <span>Image</span>
                </div>
              )}
              {draft.nftAssets && draft.nftAssets.length > 0 && (
                <span>{draft.nftAssets.length} assets</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="sm" className="whitespace-nowrap">
              <Link href={getBlockchainLink(draft.blockchain)}>
                Continue
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDiscard(draft.id)}
              className="whitespace-nowrap"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
