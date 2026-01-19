"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Collection, LegacyCollectionData, CoreCollectionData, CompressedCollectionData } from "@/declarations/registry/registry.did"

import LegacyManage from "./components/LegacyManage"
import CoreManage from "./components/CoreManage"
import CompressedManage from "./components/CompressedManage"

type SolanaCollectionType = "Legacy" | "Core" | "Compressed"

function getSolanaCollectionType(collection: Collection): SolanaCollectionType | null {
  if (!collection.chain_data || !('Solana' in collection.chain_data)) {
    return null
  }

  const solanaData = collection.chain_data.Solana
  if ('Legacy' in solanaData) return "Legacy"
  if ('Core' in solanaData) return "Core"
  if ('Compressed' in solanaData) return "Compressed"

  return null
}

function getSolanaData(collection: Collection): LegacyCollectionData | CoreCollectionData | CompressedCollectionData | null {
  if (!collection.chain_data || !('Solana' in collection.chain_data)) {
    return null
  }

  const solanaData = collection.chain_data.Solana
  if ('Legacy' in solanaData) return solanaData.Legacy
  if ('Core' in solanaData) return solanaData.Core
  if ('Compressed' in solanaData) return solanaData.Compressed

  return null
}

export default function ManageSolanaCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()
  const slug = params.slug as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !slug || !identity) return
    loadCollectionData()
  }, [isAuthenticated, slug, identity])

  const loadCollectionData = async () => {
    if (!identity) return
    try {
      setIsLoading(true)
      setError(null)

      const actor = await getRegistryActor(identity)
      const result = await actor.get_collection_by_slug(slug)

      if (!result || result.length === 0) {
        throw new Error("Collection not found")
      }

      const collectionData = result[0]

      // Check if this is a Solana collection
      if (!('Solana' in collectionData.chain_data)) {
        toast.error("This is not a Solana collection")
        router.push('/nft/collections')
        return
      }

      // Check ownership
      if (collectionData.creator.toString() !== identity.getPrincipal().toString()) {
        toast.error("You don't have permission to manage this collection")
        router.push('/nft/collections')
        return
      }

      setCollection(collectionData)
    } catch (err) {
      console.error("Failed to load collection:", err)
      setError(err instanceof Error ? err.message : "Failed to load collection")
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Collection not found</h2>
          <p className="text-muted-foreground">{error || "Unable to load collection data"}</p>
        </div>
      </div>
    )
  }

  const collectionType = getSolanaCollectionType(collection)
  const solanaData = getSolanaData(collection)

  if (!collectionType || !solanaData) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Invalid collection type</h2>
          <p className="text-muted-foreground">Unable to determine Solana collection type</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      {collectionType === "Legacy" && (
        <LegacyManage
          collection={collection}
          solanaData={solanaData as LegacyCollectionData}
        />
      )}
      {collectionType === "Core" && (
        <CoreManage
          collection={collection}
          solanaData={solanaData as CoreCollectionData}
        />
      )}
      {collectionType === "Compressed" && (
        <CompressedManage
          collection={collection}
          solanaData={solanaData as CompressedCollectionData}
        />
      )}
    </div>
  )
}
