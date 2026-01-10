"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Zap, Shield, Coins, FileText } from "lucide-react"
import { getAllDrafts, deleteDraft } from "@/lib/storage/draftStorage"
import { DraftCard } from "@/components/nft/DraftCard"

export default function SelectBlockchainPage() {
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const allDrafts = await getAllDrafts()
        setDrafts(allDrafts)
      } catch (error) {
        console.error("Failed to load drafts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDrafts()
  }, [])

  const handleDiscardDraft = async (draftId: string) => {
    try {
      await deleteDraft(draftId)
      setDrafts(drafts.filter((draft) => draft.id !== draftId))
    } catch (error) {
      console.error("Failed to delete draft:", error)
    }
  }
  const blockchains = [
    {
      id: "movement",
      name: "Movement",
      description: "Move-based NFTs with Aptos Digital Asset standard",
      icon: "⚡",
      color: "from-emerald-500 to-green-600",
      features: [
        "Move smart contract language",
        "Low fees on testnet",
        "Aptos Digital Asset standard",
        "Fast transaction finality",
      ],
      href: "/nft/create-collection/movement",
    },
    {
      id: "solana",
      name: "Solana",
      description: "Fast, low-cost NFTs with Metaplex standard",
      icon: "🟣",
      color: "from-purple-500 to-pink-500",
      features: [
        "Low transaction fees (~$0.00025)",
        "Permanent storage on Arweave",
        "Metaplex Token Metadata",
        "Fast deployment (~400ms)",
      ],
      href: "/nft/create-collection/solana",
    },
    {
      id: "ethereum",
      name: "Ethereum",
      description: "Industry standard with ERC-721/1155",
      icon: "⟠",
      color: "from-blue-600 to-indigo-600",
      features: [
        "Most established NFT ecosystem",
        "ERC-721 & ERC-1155 standards",
        "Maximum liquidity & marketplaces",
        "Strong developer tooling",
      ],
      href: "/nft/create-collection/ethereum",
    },
    {
      id: "icp",
      name: "ICP (Internet Computer)",
      description: "Fully on-chain NFTs with canister storage",
      icon: "🌐",
      color: "from-cyan-500 to-teal-500",
      features: [
        "100% on-chain storage",
        "Reverse gas model",
        "Canister smart contracts",
        "Web-speed performance",
      ],
      href: "/nft/create-collection/icp",
    },
    {
      id: "bitcoin",
      name: "Bitcoin",
      description: "Ordinals & Inscriptions on the Bitcoin blockchain",
      icon: "₿",
      color: "from-orange-500 to-amber-600",
      features: [
        "Bitcoin Ordinals protocol",
        "Permanent inscription storage",
        "Native Bitcoin security",
        "Digital artifacts on-chain",
      ],
      href: "/nft/create-collection/bitcoin",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Header */}
      <div className="mb-12">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-4">Create NFT Collection</h1>
        <p className="text-lg text-muted-foreground">
          Choose your blockchain to get started with launching your NFT collection
        </p>
      </div>

      {/* Saved Drafts */}
      {!loading && drafts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Continue Your Drafts</h2>
            <Badge variant="secondary" className="ml-2">
              {drafts.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onDiscard={handleDiscardDraft}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blockchain Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {blockchains.map((blockchain) => (
          <Card
            key={blockchain.id}
            className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="text-4xl">{blockchain.icon}</div>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">
                    {blockchain.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {blockchain.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-2.5">
                {blockchain.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {index === 0 && (
                        <Coins className="h-4 w-4 text-green-600" />
                      )}
                      {index === 1 && (
                        <Shield className="h-4 w-4 text-blue-600" />
                      )}
                      {index === 2 && <Zap className="h-4 w-4 text-purple-600" />}
                      {index === 3 && <Zap className="h-4 w-4 text-orange-600" />}
                    </div>
                    <span className="text-sm leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                asChild
                className={`w-full bg-gradient-to-r ${blockchain.color} hover:opacity-90 text-white`}
              >
                <Link href={blockchain.href}>
                  Create on {blockchain.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Quick Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Lowest Fees:</h3>
                <p className="text-sm text-muted-foreground">Solana, Movement</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Maximum Liquidity:</h3>
                <p className="text-sm text-muted-foreground">Ethereum, Bitcoin</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fastest Deployment:</h3>
                <p className="text-sm text-muted-foreground">Solana, Movement</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fully On-Chain:</h3>
                <p className="text-sm text-muted-foreground">ICP, Bitcoin (Ordinals)</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Move Language:</h3>
                <p className="text-sm text-muted-foreground">Movement (Aptos-based)</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Most Secure:</h3>
                <p className="text-sm text-muted-foreground">Bitcoin, Ethereum</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
