"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface CancelListingModalProps {
  isOpen: boolean
  onClose: () => void
  nft: { name: string; image: string; collection: string }
  price: string
  onConfirm: () => Promise<void>
}

export default function CancelListingModal({ isOpen, onClose, nft, price, onConfirm }: CancelListingModalProps) {
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Failed to cancel listing:", error)
    } finally {
      setIsCancelling(false)
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
            <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors" disabled={isCancelling}>
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
                <p className="text-sm font-medium text-purple-600">{price} SOL</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Are you sure?</p>
                <p>This will remove your NFT from the marketplace. You can list it again at any time.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isCancelling} className="flex-1">Keep Listed</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isCancelling} className="flex-1">
                {isCancelling ? "Cancelling..." : "Cancel Listing"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
