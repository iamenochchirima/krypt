"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Copy } from "lucide-react"

type CollectionType = "drop" | "edition"

interface TypeSelectorProps {
  onSelect: (type: CollectionType) => void
}

export default function TypeSelector({ onSelect }: TypeSelectorProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create EVM Collection</h1>
        <p className="text-muted-foreground">Choose your collection type to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-lg group"
          onClick={() => onSelect("drop")}
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Layers className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">Drop</h3>
                <Badge variant="secondary">ERC-721</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Each NFT is unique with its own artwork and metadata. Best for PFP collections, generative art, and 1/1s.
              </p>
            </div>
            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assets</span>
                <span>Multiple unique images</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supply</span>
                <span>One per token ID</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Use case</span>
                <span>PFPs, Art, Collectibles</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg group"
          onClick={() => onSelect("edition")}
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Copy className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">Edition</h3>
                <Badge variant="secondary">ERC-1155</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Multiple copies of the same artwork. Best for music, open editions, and collectible series.
              </p>
            </div>
            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assets</span>
                <span>Single image per edition</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supply</span>
                <span>Multiple copies</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Use case</span>
                <span>Music, Open Editions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Not sure which to choose? <span className="text-blue-500">Drops</span> for unique items, <span className="text-purple-500">Editions</span> for copies.</p>
      </div>
    </div>
  )
}
