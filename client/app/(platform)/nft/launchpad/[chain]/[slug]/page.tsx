"use client"

import { useState, useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import { HttpAgent, Actor } from "@dfinity/agent"
import { host, network } from "@/constants/urls"
import { registryCanisterId, registryIDL, REGISTRY_SERVICE } from "@/constants/canisters-config"
import { Loader2 } from "lucide-react"
import {
  Collection,
  LegacyCollectionData,
  CoreCollectionData,
  CompressedCollectionData,
  EthereumCollectionData
} from "@/declarations/registry/registry.did"

import { LegacyMint, CoreMint, CompressedMint, DropMint, EditionMint } from "./components"

type SolanaCollectionType = "Legacy" | "Core" | "Compressed"
type EthereumCollectionType = "Drop" | "Edition"

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

function getEthereumCollectionType(collection: Collection): EthereumCollectionType | null {
  if (!collection.chain_data || !('Ethereum' in collection.chain_data)) {
    return null
  }

  const ethData = collection.chain_data.Ethereum
  if (!ethData.contract_type) return null

  if ('ERC721' in ethData.contract_type) return "Drop"
  if ('ERC1155' in ethData.contract_type) return "Edition"

  return null
}

function getEthereumData(collection: Collection): EthereumCollectionData | null {
  if (!collection.chain_data || !('Ethereum' in collection.chain_data)) {
    return null
  }
  return collection.chain_data.Ethereum
}

async function getPublicRegistryActor() {
  const agent = await HttpAgent.create({ host })

  if (network === "local") {
    await agent.fetchRootKey().catch(console.error)
  }

  return Actor.createActor<REGISTRY_SERVICE>(registryIDL, {
    agent,
    canisterId: registryCanisterId,
  })
}

export default function LaunchpadMintPage() {
  const params = useParams()
  const chain = params.chain as string
  const slug = params.slug as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    loadCollection()
  }, [slug])

  const loadCollection = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const actor = await getPublicRegistryActor()
      const result = await actor.get_collection_by_slug(slug)

      if (!result || result.length === 0) {
        setError("Collection not found")
        return
      }

      setCollection(result[0])
    } catch (err) {
      console.error("Failed to load collection:", err)
      setError("Failed to load collection")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-2">{error || "Collection not found"}</p>
          <a href="/nft/launchpad" className="text-primary hover:underline">
            Back to Launchpad
          </a>
        </div>
      </div>
    )
  }

  // Determine chain and render appropriate component
  if (chain === "solana" && 'Solana' in collection.chain_data) {
    const solanaType = getSolanaCollectionType(collection)
    const solanaData = getSolanaData(collection)

    if (!solanaType || !solanaData) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">Invalid Solana collection data</p>
        </div>
      )
    }

    switch (solanaType) {
      case "Legacy":
        return <LegacyMint collection={collection} solanaData={solanaData as LegacyCollectionData} />
      case "Core":
        return <CoreMint collection={collection} solanaData={solanaData as CoreCollectionData} />
      case "Compressed":
        return <CompressedMint collection={collection} solanaData={solanaData as CompressedCollectionData} />
    }
  }

  if ((chain === "ethereum" || chain === "base" || chain === "base-sepolia") && 'Ethereum' in collection.chain_data) {
    const ethType = getEthereumCollectionType(collection)
    const ethData = getEthereumData(collection)

    if (!ethType || !ethData) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">Invalid Ethereum collection data</p>
        </div>
      )
    }

    switch (ethType) {
      case "Drop":
        return <DropMint collection={collection} ethData={ethData} />
      case "Edition":
        return <EditionMint collection={collection} ethData={ethData} />
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-destructive">Unsupported chain or collection type</p>
    </div>
  )
}
