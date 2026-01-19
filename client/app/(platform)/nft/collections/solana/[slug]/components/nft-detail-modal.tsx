"use client"

import { useState } from "react"
import { X, ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Bid } from "@/services/solana-marketplace"
import BidsDisplay from "./bids-display"

interface NFTDetailModalProps {
  isOpen: boolean
  onClose: () => void
  nft: {
    id: string
    name: string
    image: string
    description?: string
    collection: string
    owner: string
    attributes?: Array<{ trait_type: string; value: string }>
  }
  listing?: { price: number; seller: string } | null
  bids: Bid[]
  isOwner: boolean
  currentUserWallet?: string
  onList: () => void
  onBuy: () => void
  onPlaceBid: () => void
  onCancelListing: () => void
  onAcceptBid: (bid: Bid) => Promise<void>
  onCancelBid: (bid: Bid) => Promise<void>
  explorerUrl: string
}

export default function NFTDetailModal({
  isOpen,
  onClose,
  nft,
  listing,
  bids,
  isOwner,
  currentUserWallet,
  onList,
  onBuy,
  onPlaceBid,
  onCancelListing,
  onAcceptBid,
  onCancelBid,
  explorerUrl,
}: NFTDetailModalProps) {
  const [copied, setCopied] = useState(false)
  const highestBid = bids[0]
  const userBid = bids.find(b => b.buyer === currentUserWallet)

  const copyAddress = () => {
    navigator.clipboard.writeText(nft.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-4xl max-h-[90vh] bg-background border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold truncate">{nft.name}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left: Image */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                  {nft.image ? (
                    <Image src={nft.image} alt={nft.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}
                  {isOwner && (
                    <div className="absolute top-3 left-3">
                      <Badge>Owned</Badge>
                    </div>
                  )}
                  {listing && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-600">For Sale</Badge>
                    </div>
                  )}
                </div>

                {/* Token Address */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="font-mono truncate flex-1">{nft.id}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(explorerUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right: Details */}
              <div className="space-y-6">
                {/* Collection & Owner */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{nft.collection}</p>
                  <h1 className="text-2xl font-bold mb-2">{nft.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Owner: <span className="font-mono">{nft.owner.slice(0, 8)}...{nft.owner.slice(-4)}</span>
                    {isOwner && <span className="ml-2 text-primary">(You)</span>}
                  </p>
                </div>

                {/* Price Section */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  {listing ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Listed Price</p>
                      <p className="text-3xl font-bold">{listing.price} SOL</p>
                    </div>
                  ) : highestBid ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Highest Bid</p>
                      <p className="text-3xl font-bold">{highestBid.price} SOL</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Not listed</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {isOwner ? (
                      <>
                        {listing ? (
                          <>
                            <Button variant="outline" onClick={onList} className="flex-1">Update Price</Button>
                            <Button variant="destructive" onClick={onCancelListing} className="flex-1">Cancel Listing</Button>
                          </>
                        ) : (
                          <Button onClick={onList} className="flex-1">List for Sale</Button>
                        )}
                      </>
                    ) : (
                      <>
                        {listing && (
                          <Button onClick={onBuy} className="flex-1">Buy Now</Button>
                        )}
                        <Button variant={listing ? "outline" : "default"} onClick={onPlaceBid} className="flex-1">Place Bid</Button>
                      </>
                    )}
                  </div>

                  {/* User's existing bid */}
                  {userBid && !isOwner && (
                    <div className="flex items-center justify-between pt-2 border-t text-sm">
                      <span className="text-muted-foreground">Your bid: <span className="font-semibold">{userBid.price} SOL</span></span>
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onCancelBid(userBid)}>
                        Cancel Bid
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tabs: Description, Traits, Bids */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="traits" className="flex-1">Traits</TabsTrigger>
                    <TabsTrigger value="bids" className="flex-1">Bids ({bids.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                    <div className="space-y-4">
                      {nft.description ? (
                        <p className="text-sm text-muted-foreground">{nft.description}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No description available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="traits" className="mt-4">
                    {nft.attributes && nft.attributes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {nft.attributes.map((attr, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase">{attr.trait_type}</p>
                            <p className="font-semibold truncate">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No traits available</p>
                    )}
                  </TabsContent>

                  <TabsContent value="bids" className="mt-4">
                    <BidsDisplay
                      bids={bids}
                      isOwner={isOwner}
                      currentUserWallet={currentUserWallet}
                      onAcceptBid={onAcceptBid}
                      onCancelBid={onCancelBid}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
