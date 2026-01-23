"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { toast } from "sonner"
import type { Collection as CanisterCollection } from "@/declarations/registry/registry.did"

import SolanaLegacyMarketplace from "./components/SolanaLegacyMarketplace"
import SolanaCoreMarketplace from "./components/SolanaCoreMarketplace"
import SolanaCompressedMarketplace from "./components/SolanaCompressedMarketplace"

type SolanaCollectionType = "Legacy" | "Core" | "Compressed" | null

function getSolanaCollectionType(collection: CanisterCollection): SolanaCollectionType {
  if (!collection || !('Solana' in collection.chain_data)) return null

  const solanaData = collection.chain_data.Solana
  if ('Legacy' in solanaData) return "Legacy"
  if ('Core' in solanaData) return "Core"
  if ('Compressed' in solanaData) return "Compressed"
  return null
}

export default function SolanaCollectionPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [isLoading, setIsLoading] = useState(true)
  const [collection, setCollection] = useState<CanisterCollection | null>(null)
  const [collectionType, setCollectionType] = useState<SolanaCollectionType>(null)

  useEffect(() => {
    if (slug) loadCollectionData()
  }, [slug])

  const loadCollectionData = async () => {
    try {
      setIsLoading(true)
      const actor = await getRegistryActor(null)
      const result = await actor.get_collection_by_slug(slug)
      if (!result || result.length === 0) {
        toast.error("Collection not found")
        return
      }
      const col = result[0]
      setCollection(col)
      setCollectionType(getSolanaCollectionType(col))
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
          <p className="text-muted-foreground mb-6">The collection you're looking for doesn't exist</p>
          <Button asChild><Link href="/nft/collections">Back to Collections</Link></Button>
        </div>
      </div>
    )
  }

  // Render appropriate component based on collection type
  switch (collectionType) {
    case "Legacy":
      return <SolanaLegacyMarketplace collection={collection} />
    case "Core":
      return <SolanaCoreMarketplace collection={collection} />
    case "Compressed":
      return <SolanaCompressedMarketplace collection={collection} />
    default:
      return (
        <div className="container mx-auto px-4 py-24">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Unknown Solana collection type</p>
              <Button asChild>
                <Link href="/nft/collections">Back to Collections</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
  }
}
