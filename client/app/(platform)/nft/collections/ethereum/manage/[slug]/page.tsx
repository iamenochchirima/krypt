"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Collection, EthereumCollectionData } from "@/declarations/registry/registry.did"

import { DropManage, EditionManage } from "./components"

type EthereumContractType = "Drop" | "Edition"

function getContractType(collection: Collection): EthereumContractType | null {
  if (!collection.chain_data || !('Ethereum' in collection.chain_data)) {
    return null
  }

  const ethData = collection.chain_data.Ethereum
  if (!ethData?.contract_type) return null

  return 'ERC721' in ethData.contract_type ? 'Drop' : 'Edition'
}

function getEthereumData(collection: Collection): EthereumCollectionData | null {
  if (!collection.chain_data || !('Ethereum' in collection.chain_data)) {
    return null
  }
  return collection.chain_data.Ethereum
}

export default function ManageEthereumCollectionPage() {
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

      // Check if this is an Ethereum collection
      if (!('Ethereum' in collectionData.chain_data)) {
        toast.error("This is not an Ethereum collection")
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

  const contractType = getContractType(collection)
  const ethData = getEthereumData(collection)

  if (!contractType || !ethData) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Invalid collection type</h2>
          <p className="text-muted-foreground">Unable to determine Ethereum contract type</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      {contractType === "Drop" && (
        <DropManage
          collection={collection}
          ethData={ethData}
        />
      )}
      {contractType === "Edition" && (
        <EditionManage
          collection={collection}
          ethData={ethData}
        />
      )}
    </div>
  )
}
