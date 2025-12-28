"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface CancelListingModalProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    name: string
    image: string
    collection: string
  }
  price: string
  onConfirm: () => Promise<void>
}

export default function CancelListingModal({ isOpen, onClose, nft, price, onConfirm }: CancelListingModalProps) {
  const [isCanceling, setIsCanceling] = useState(false)

  const handleCancel = async () => {
    setIsCanceling(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Failed to cancel listing:", error)
    } finally {
      setIsCanceling(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-md bg-background border rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="text-lg font-semibold">Cancel Listing</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors" disabled={isCanceling}>
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

            <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-semibold">{price} MOVE</span>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Remove from marketplace
                </p>
                <p className="text-sm text-orange-900 dark:text-orange-100">
                  This will remove your NFT from the marketplace and return it to your wallet. You can list it again anytime.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isCanceling} className="flex-1">
                Keep Listed
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCanceling}
                className="flex-1"
              >
                {isCanceling ? "Canceling..." : "Cancel Listing"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
