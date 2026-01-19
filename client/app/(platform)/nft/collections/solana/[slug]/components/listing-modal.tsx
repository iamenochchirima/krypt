"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

interface ListingModalProps {
  isOpen: boolean
  onClose: () => void
  nft: { name: string; image: string; collection: string }
  existingListing?: { price: number; seller: string } | null
  onList: (price: string) => Promise<void>
  onCancelExisting?: () => Promise<void>
}

export default function ListingModal({ isOpen, onClose, nft, existingListing, onList, onCancelExisting }: ListingModalProps) {
  const [price, setPrice] = useState("")
  const [isListing, setIsListing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleList = async () => {
    if (!price || parseFloat(price) <= 0) return
    setIsListing(true)
    try {
      await onList(price)
      onClose()
      setPrice("")
    } catch (error) {
      console.error("Failed to list NFT:", error)
    } finally {
      setIsListing(false)
    }
  }

  const handleCancelAndList = async () => {
    if (!onCancelExisting || !price || parseFloat(price) <= 0) return
    setIsCancelling(true)
    try {
      await onCancelExisting()
      setIsCancelling(false)
      await handleList()
    } catch (error) {
      console.error("Failed to cancel existing listing:", error)
      setIsCancelling(false)
    }
  }

  if (!isOpen) return null

  const platformFee = parseFloat(price || "0") * 0.02
  const royalty = parseFloat(price || "0") * 0.05
  const youReceive = parseFloat(price || "0") - platformFee - royalty
  const isProcessing = isListing || isCancelling

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-md bg-background border rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="text-lg font-semibold">{existingListing ? "Update Listing" : "List NFT for Sale"}</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors" disabled={isProcessing}>
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

            {existingListing && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Already Listed</p>
                  <p>This NFT is currently listed at <span className="font-semibold">{existingListing.price} SOL</span>. To change the price, the existing listing will be cancelled first.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="price">{existingListing ? "New Price (SOL)" : "Price (SOL)"}</Label>
              <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isProcessing} />
            </div>
            {price && parseFloat(price) > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (2%)</span>
                  <span>{platformFee.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Royalty (5%)</span>
                  <span>{royalty.toFixed(4)} SOL</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-semibold">
                  <span>You receive</span>
                  <span>{youReceive.toFixed(4)} SOL</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1">Cancel</Button>
              {existingListing ? (
                <Button onClick={handleCancelAndList} disabled={!price || parseFloat(price) <= 0 || isProcessing} className="flex-1">
                  {isCancelling ? "Cancelling..." : isListing ? "Listing..." : "Update Price"}
                </Button>
              ) : (
                <Button onClick={handleList} disabled={!price || parseFloat(price) <= 0 || isProcessing} className="flex-1">
                  {isListing ? "Listing..." : "List NFT"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
