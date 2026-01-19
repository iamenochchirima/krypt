"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

interface BidModalProps {
  isOpen: boolean
  onClose: () => void
  nft: { name: string; image: string; collection: string }
  currentPrice?: number | null
  onPlaceBid: (price: string) => Promise<void>
}

export default function BidModal({ isOpen, onClose, nft, currentPrice, onPlaceBid }: BidModalProps) {
  const [price, setPrice] = useState("")
  const [isPlacing, setIsPlacing] = useState(false)

  const handlePlaceBid = async () => {
    if (!price || parseFloat(price) <= 0) return
    setIsPlacing(true)
    try {
      await onPlaceBid(price)
      onClose()
      setPrice("")
    } catch (error) {
      console.error("Failed to place bid:", error)
    } finally {
      setIsPlacing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-md bg-background border rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="text-lg font-semibold">Place a Bid</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors" disabled={isPlacing}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6 pt-0 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={nft.image} alt={nft.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{nft.name}</p>
                <p className="text-sm text-muted-foreground truncate">{nft.collection}</p>
              </div>
            </div>

            {currentPrice && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">Current listing price: </span>
                <span className="font-semibold">{currentPrice} SOL</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bid-price">Your Bid (SOL)</Label>
              <Input
                id="bid-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isPlacing}
              />
              <p className="text-xs text-muted-foreground">
                This amount will be escrowed until your bid is accepted or cancelled.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isPlacing} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePlaceBid} disabled={!price || parseFloat(price) <= 0 || isPlacing} className="flex-1">
                {isPlacing ? "Placing Bid..." : "Place Bid"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
