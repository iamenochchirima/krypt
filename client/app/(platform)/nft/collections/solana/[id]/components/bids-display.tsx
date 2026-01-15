"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bid } from "@/services/solana-marketplace"

interface BidsDisplayProps {
  bids: Bid[]
  isOwner: boolean
  currentUserWallet?: string
  onAcceptBid: (bid: Bid) => Promise<void>
  onCancelBid: (bid: Bid) => Promise<void>
}

export default function BidsDisplay({ bids, isOwner, currentUserWallet, onAcceptBid, onCancelBid }: BidsDisplayProps) {
  const [processingBid, setProcessingBid] = useState<string | null>(null)

  const handleAccept = async (bid: Bid) => {
    setProcessingBid(bid.tradeState)
    try {
      await onAcceptBid(bid)
    } catch (error) {
      console.error("Failed to accept bid:", error)
    } finally {
      setProcessingBid(null)
    }
  }

  const handleCancel = async (bid: Bid) => {
    setProcessingBid(bid.tradeState)
    try {
      await onCancelBid(bid)
    } catch (error) {
      console.error("Failed to cancel bid:", error)
    } finally {
      setProcessingBid(null)
    }
  }

  if (bids.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No bids yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{bids.length} Bid{bids.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {bids.map((bid) => {
          const isMyBid = currentUserWallet && bid.buyer === currentUserWallet
          const isProcessing = processingBid === bid.tradeState

          return (
            <div key={bid.tradeState} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
              <div>
                <p className="font-semibold">{bid.price.toFixed(4)} SOL</p>
                <p className="text-xs text-muted-foreground">
                  {bid.buyer.slice(0, 6)}...{bid.buyer.slice(-4)}
                  {isMyBid && <span className="ml-1 text-primary">(You)</span>}
                </p>
              </div>
              <div>
                {isOwner && !isMyBid && (
                  <Button size="sm" onClick={() => handleAccept(bid)} disabled={isProcessing}>
                    {isProcessing ? "Accepting..." : "Accept"}
                  </Button>
                )}
                {isMyBid && (
                  <Button size="sm" variant="outline" onClick={() => handleCancel(bid)} disabled={isProcessing}>
                    {isProcessing ? "Cancelling..." : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
