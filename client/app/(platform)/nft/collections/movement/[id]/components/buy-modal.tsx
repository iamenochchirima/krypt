"use client"

import { useState } from "react"
import { X, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    name: string
    image: string
    collection: string
  }
  price: string
  isWalletConnected: boolean
  onConfirm: () => Promise<void>
}

export default function BuyModal({ isOpen, onClose, nft, price, isWalletConnected, onConfirm }: BuyModalProps) {
  const [isBuying, setIsBuying] = useState(false)

  const handleBuy = async () => {
    setIsBuying(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Failed to buy NFT:", error)
    } finally {
      setIsBuying(false)
    }
  }

  if (!isOpen) return null

  const priceNum = parseFloat(price)
  const platformFee = priceNum * 0.025
  const total = priceNum

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-md bg-background border rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="text-lg font-semibold">Confirm Purchase</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors" disabled={isBuying}>
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

            {!isWalletConnected ? (
              <>
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold mb-1">Wallet Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Please connect your Movement wallet to purchase this NFT
                    </p>
                  </div>
                </div>

                <Button variant="outline" onClick={onClose} className="w-full">
                  Close
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">{price} MOVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (2.5%)</span>
                    <span>{platformFee.toFixed(4)} MOVE</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>You pay</span>
                    <span>{total.toFixed(4)} MOVE</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Once confirmed, this transaction cannot be reversed. Make sure you have enough MOVE in your wallet.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} disabled={isBuying} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleBuy} disabled={isBuying} className="flex-1">
                    {isBuying ? "Processing..." : `Buy for ${price} MOVE`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
