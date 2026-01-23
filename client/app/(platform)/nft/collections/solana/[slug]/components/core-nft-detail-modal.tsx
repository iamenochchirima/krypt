"use client"

import { useState } from "react"
import { X, ExternalLink, Copy, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { getSolanaExplorerUrl } from "@/constants/solana"

interface CoreNFT {
  id: string
  name: string
  image: string
  description?: string
  owner: string
  attributes?: Array<{ trait_type: string; value: string }>
}

interface CoreNFTDetailModalProps {
  isOpen: boolean
  onClose: () => void
  nft: CoreNFT
  collectionName: string
  collectionAddress?: string | null
  isOwner: boolean
}

export default function CoreNFTDetailModal({
  isOpen,
  onClose,
  nft,
  collectionName,
  collectionAddress,
  isOwner,
}: CoreNFTDetailModalProps) {
  const [copied, setCopied] = useState(false)

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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">{nft.name}</h2>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                <Sparkles className="h-3 w-3 mr-1" />
                Core
              </Badge>
            </div>
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
                    <Image src={nft.image} alt={nft.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                      {nft.name?.slice(0, 2) || "?"}
                    </div>
                  )}
                  {isOwner && (
                    <div className="absolute top-3 left-3">
                      <Badge>Owned</Badge>
                    </div>
                  )}
                </div>

                {/* Token Address */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Asset:</span>
                  <span className="font-mono truncate flex-1">{nft.id}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(getSolanaExplorerUrl(nft.id), '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Collection Info */}
                {collectionAddress && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Collection:</span>
                    <span className="font-mono truncate flex-1">{collectionAddress}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(getSolanaExplorerUrl(collectionAddress), '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="space-y-6">
                {/* Collection & Owner */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{collectionName}</p>
                  <h1 className="text-2xl font-bold mb-2">{nft.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Owner: <span className="font-mono">{nft.owner ? `${nft.owner.slice(0, 8)}...${nft.owner.slice(-4)}` : "Unknown"}</span>
                    {isOwner && <span className="ml-2 text-primary">(You)</span>}
                  </p>
                </div>

                {/* Trading Section */}
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Marketplace coming soon</p>
                </div>

                {/* Tabs: Details, Traits */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="traits" className="flex-1">Traits</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                    <div className="space-y-4">
                      {nft.description ? (
                        <p className="text-sm text-muted-foreground">{nft.description}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No description available</p>
                      )}

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type</span>
                          <span>Metaplex Core NFT</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Standard</span>
                          <span>MPL Core</span>
                        </div>
                      </div>
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
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
