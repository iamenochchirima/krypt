"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Sparkles, TreePine } from "lucide-react"

export type SolanaNftStandard = "legacy" | "core" | "compressed"

interface StandardSelectorProps {
  onSelect: (standard: SolanaNftStandard) => void
}

export default function StandardSelector({ onSelect }: StandardSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Solana Collection</h1>
        <p className="text-muted-foreground">Which standard are you using for the NFT Collection?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-lg group"
          onClick={() => onSelect("legacy")}
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Layers className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">NFT (Legacy)</h3>
              </div>
              <Badge variant="secondary" className="mb-2">Candy Machine V3</Badge>
              <p className="text-sm text-muted-foreground">
                Traditional Metaplex Token Metadata standard. Battle-tested and widely supported.
              </p>
            </div>
            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>~0.01 SOL/mint</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best for</span>
                <span>PFPs, 1/1s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support</span>
                <span>All marketplaces</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg group"
          onClick={() => onSelect("core")}
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">Metaplex Core</h3>
              </div>
              <Badge variant="secondary" className="mb-2">New Standard</Badge>
              <p className="text-sm text-muted-foreground">
                Next-gen NFT standard with lower costs and built-in plugins for royalties and more.
              </p>
            </div>
            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>~0.005 SOL/mint</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best for</span>
                <span>New collections</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support</span>
                <span>Major marketplaces</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-green-500 transition-all hover:shadow-lg group"
          onClick={() => onSelect("compressed")}
        >
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <TreePine className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">Compressed NFTs</h3>
              </div>
              <Badge variant="secondary" className="mb-2">cNFTs</Badge>
              <p className="text-sm text-muted-foreground">
                Ultra low-cost NFTs using state compression. Ideal for large-scale drops.
              </p>
            </div>
            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>~0.00005 SOL/mint</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best for</span>
                <span>Large drops (10k+)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support</span>
                <span>Major marketplaces</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          <span className="text-blue-500">Legacy</span> for maximum compatibility, {" "}
          <span className="text-purple-500">Core</span> for modern features, {" "}
          <span className="text-green-500">Compressed</span> for large-scale drops.
        </p>
      </div>
    </div>
  )
}
