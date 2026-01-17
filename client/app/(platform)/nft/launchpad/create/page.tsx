"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileText } from "lucide-react"
import { getAllDrafts, deleteDraft } from "@/lib/storage/draftStorage"
import { DraftCard } from "@/components/nft/DraftCard"

export default function CreateLaunchPage() {
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
      icon: "/chains/movement.jpeg",
      href: "/nft/launchpad/create/movement",
    },
    {
      id: "solana",
      name: "Solana",
      icon: "/chains/sol.svg",
      href: "/nft/launchpad/create/solana",
    },
    {
      id: "ethereum",
      name: "Ethereum",
      icon: "/chains/eth.svg",
      href: "/nft/launchpad/create/ethereum",
    },
    {
      id: "icp",
      name: "ICP",
      icon: "/chains/icp.svg",
      href: "/nft/launchpad/create/icp",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create a Launch</h1>
        <p className="text-muted-foreground">Choose a blockchain to launch your NFT collection.</p>
      </div>

      {/* Saved Drafts */}
      {!loading && drafts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Continue Your Drafts</h2>
            <Badge variant="secondary" className="ml-2">
              {drafts.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {blockchains.map((blockchain) => (
          <Link key={blockchain.id} href={blockchain.href}>
            <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative h-12 w-12 mb-4">
                  <Image
                    src={blockchain.icon}
                    alt={blockchain.name}
                    fill
                    className="object-contain rounded-full"
                  />
                </div>
                <h3 className="font-semibold mb-2">{blockchain.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Create
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
