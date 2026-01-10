"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ExternalLink, Copy, CheckCircle2, Coins, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Collection } from "@/declarations/marketplace/marketplace.did"
import { useMovementWallet } from "@/connect-wallet/hooks/useMovementWallet"
import { getCollectionAddress, buildMintTokenPayload } from "@/lib/movement/collection"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"
import Link from "next/link"
import Image from "next/image"

const MOVEMENT_NETWORK = (process.env.NEXT_PUBLIC_MOVEMENT_NETWORK === "mainnet"
  ? "mainnet"
  : "testnet") as "testnet" | "mainnet"

const MOVEMENT_GRAPHQL_ENDPOINT = MOVEMENT_NETWORK === "mainnet"
  ? "https://indexer.mainnet.movementnetwork.xyz/v1/graphql"
  : "https://indexer.testnet.movementnetwork.xyz/v1/graphql"

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const graphqlCache = new Map<string, CacheEntry<any>>()

function getCachedData<T>(key: string): T | null {
  const entry = graphqlCache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_DURATION) {
    graphqlCache.delete(key)
    return null
  }

  return entry.data as T
}

function setCachedData<T>(key: string, data: T): void {
  graphqlCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

function NFTCard({ nft, index }: { nft: any; index: number }) {
  const [metadata, setMetadata] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetadata = async () => {
      const uri = nft.current_token_data?.token_uri
      if (!uri) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(uri)
        if (response.ok) {
          const data = await response.json()
          setMetadata(data)
        }
      } catch (error) {
        console.error("Failed to fetch NFT metadata:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [nft])

  return (
    <div className="border rounded-lg overflow-hidden w-32 flex-shrink-0">
      <div className="aspect-square relative bg-muted">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : metadata?.image ? (
          <Image
            src={metadata.image}
            alt={nft.current_token_data?.token_name || `NFT #${index + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <div className="font-medium text-xs truncate">
          {nft.current_token_data?.token_name || `NFT #${index + 1}`}
        </div>
        {nft.current_token_data?.token_uri && (
          <a
            href={nft.current_token_data.token_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            Metadata
            <ExternalLink className="h-2 w-2" />
          </a>
        )}
      </div>
    </div>
  )
}

export default function ManageMovementCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()
  const { account, connected, signAndSubmitTransaction } = useMovementWallet()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [collectionAddress, setCollectionAddress] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  // Mint NFT form state
  const [isMinting, setIsMinting] = useState(false)
  const [mintCount, setMintCount] = useState(1)
  const [manifestData, setManifestData] = useState<any>(null)
  const [currentSupply, setCurrentSupply] = useState<number>(0)
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([])
  const [onChainCollection, setOnChainCollection] = useState<any>(null)
  const [collectionNotFound, setCollectionNotFound] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !collectionId || !identity) {
      return
    }

    loadCollectionData()
  }, [isAuthenticated, collectionId, identity])

  const loadCollectionData = async () => {
    if (!identity) {
      return
    }
    try {
      setIsLoading(true)
      const actor = await getMarketplaceActor(identity)

      const result = await actor.get_collection(collectionId)
      if (!result || result.length === 0) {
        throw new Error("Collection not found")
      }

      const collectionData = result[0]

      if (collectionData.creator.toString() !== identity.getPrincipal().toString()) {
        toast.error("You don't have permission to manage this collection")
        router.push('/collections')
        return
      }

      setCollection(collectionData)

      const movementData = 'Movement' in collectionData.chain_data ? collectionData.chain_data.Movement : null
      const hasManifest = !!movementData?.manifest_url?.[0]
      if ((movementData?.collection_created || hasManifest) && account?.address) {
        const addr = await loadCollectionAddress(collectionData.name, account.address.toString())
        if (addr) {
          verifyCollectionOnChain(account.address.toString())
          fetchMintedNFTs(account.address.toString())
        }
      }

      const manifestUrl = movementData?.manifest_url?.[0]
      if (manifestUrl) {
        loadManifestData(manifestUrl)
      }
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCollectionAddress = async (collectionName: string, creatorAddress: string) => {
    try {
      setIsLoadingAddress(true)
      const address = await getCollectionAddress(creatorAddress, collectionName, MOVEMENT_NETWORK)
      setCollectionAddress(address)
      return address
    } catch (error) {
      console.error("Failed to get collection address:", error)
      return null
    } finally {
      setIsLoadingAddress(false)
    }
  }

  const loadManifestData = async (manifestUrl: string) => {
    try {
      console.log("Loading manifest from:", manifestUrl)
      const response = await fetch(manifestUrl)
      console.log("Manifest response status:", response.status)
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`)
      }
      const data = await response.json()
      console.log("Manifest data loaded:", data)
      const itemsCount = data.items?.length || data.properties?.files?.length || 0
      console.log("Manifest items count:", itemsCount)
      setManifestData(data)
    } catch (error) {
      console.error("Failed to load manifest:", error)
      toast.error("Failed to load collection manifest")
    }
  }

  const verifyCollectionOnChain = async (creatorAddress: string, forceRefresh = false) => {
    try {
      const cacheKey = `collection_${creatorAddress}`

      if (!forceRefresh) {
        const cached = getCachedData<any[]>(cacheKey)
        if (cached) {
          console.log("Using cached collection data")
          processCollectionData(cached)
          return
        }
      }

      const query = `
        query VerifyCollection($creatorAddress: String!) {
          current_collections_v2(
            where: {creator_address: {_eq: $creatorAddress}}
          ) {
            collection_properties
            max_supply
            total_minted_v2
            collection_name
            collection_id
            current_supply
            creator_address
            description
            uri
            last_transaction_timestamp
          }
        }
      `

      const response = await fetch(MOVEMENT_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { creatorAddress }
        })
      })

      const result = await response.json()
      const collections = result.data?.current_collections_v2 || []

      setCachedData(cacheKey, collections)
      processCollectionData(collections)
    } catch (error) {
      console.error("Failed to verify collection on-chain:", error)
    }
  }

  const processCollectionData = (collections: any[]) => {
    if (collections.length === 0) {
      setCollectionNotFound(true)
      console.warn("No collections found on-chain")
      return
    }

    const matchingCollection = collections.find((c: any) =>
      c.collection_id === collectionAddress || c.collection_name === collection?.name
    )

    if (matchingCollection) {
      setOnChainCollection(matchingCollection)
      setCurrentSupply(matchingCollection.total_minted_v2 || 0)
      setCollectionNotFound(false)
      console.log("Collection verified on-chain:", matchingCollection)
    } else {
      setCollectionNotFound(true)
      console.warn("Collection not found on-chain")
    }
  }

  const fetchMintedNFTs = async (ownerAddress: string, forceRefresh = false) => {
    try {
      const cacheKey = `nfts_${ownerAddress}_${collectionAddress || collection?.name}`

      if (!forceRefresh) {
        const cached = getCachedData<any[]>(cacheKey)
        if (cached) {
          console.log("Using cached NFT data")
          setMintedNFTs(cached)
          return
        }
      }

      const query = `
        query FetchNFTs($ownerAddress: String!) {
          current_token_ownerships_v2(
            where: {owner_address: {_eq: $ownerAddress}, amount: {_gt: 0}}
          ) {
            token_data_id
            amount
            current_token_data {
              token_name
              token_uri
              token_properties
              collection_id
              current_collection {
                collection_name
                creator_address
                description
                uri
              }
            }
          }
        }
      `

      const response = await fetch(MOVEMENT_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { ownerAddress }
        })
      })

      const result = await response.json()
      const allNFTs = result.data?.current_token_ownerships_v2 || []

      const collectionNFTs = allNFTs.filter((nft: any) =>
        nft.current_token_data?.collection_id === collectionAddress ||
        nft.current_token_data?.current_collection?.collection_name === collection?.name
      )

      setCachedData(cacheKey, collectionNFTs)
      setMintedNFTs(collectionNFTs)
      console.log("Fetched minted NFTs:", collectionNFTs)
    } catch (error) {
      console.error("Failed to fetch minted NFTs:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const openInExplorer = (txHashOrAddress: string, isTransaction = false) => {
    const network = MOVEMENT_NETWORK === "mainnet" ? "mainnet" : "testnet"
    const type = isTransaction ? "txn" : "account"
    window.open(`https://explorer.movementnetwork.xyz/${type}/${txHashOrAddress}?network=${network}`, '_blank')
  }

  const handleBatchMint = async () => {
    if (!connected || !account) {
      toast.error("Please connect your Movement wallet")
      return
    }

    if (!collection) {
      toast.error("Collection not loaded")
      return
    }

    const items = manifestData?.items || manifestData?.properties?.files

    if (!manifestData || !items) {
      toast.error("Manifest data not loaded")
      console.error("Manifest check failed - manifestData:", manifestData)
      return
    }

    if (mintCount < 1) {
      toast.error("Please enter a valid number of NFTs to mint")
      return
    }

    const actualMinted = onChainCollection?.total_minted_v2 || currentSupply || 0
    const startIndex = actualMinted
    const endIndex = Math.min(startIndex + mintCount, items.length)

    if (startIndex >= items.length) {
      toast.error("All NFTs from this collection have been minted")
      return
    }

    try {
      setIsMinting(true)
      const aptosConfig = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: MOVEMENT_NETWORK === "mainnet"
          ? "https://mainnet.movementnetwork.xyz/v1"
          : "https://testnet.movementnetwork.xyz/v1",
      })
      const aptos = new Aptos(aptosConfig)

      const actualCount = endIndex - startIndex
      toast.info(`Minting ${actualCount} NFT(s) from ${collection.name}...`)

      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i]
        const nftNumber = i + 1
        const name = `${collection.name} #${nftNumber}`
        const description = collection.description || manifestData.description || `NFT #${nftNumber} from ${collection.name}`
        const uri = typeof item === 'string' ? item : item.uri || item.url

        console.log(`Minting NFT #${nftNumber}:`, { name, description, uri })

        const payload = buildMintTokenPayload({
          creatorAddress: account.address.toString(),
          collectionName: collection.name,
          description,
          name,
          uri,
          recipient: account.address.toString(),
        })

        toast.info(`Minting NFT #${nftNumber}... (${i - startIndex + 1}/${actualCount})`)
        const response = await signAndSubmitTransaction(payload)

        // Wait for confirmation
        try {
          await aptos.waitForTransaction({
            transactionHash: response.hash,
          })
          toast.success(`NFT #${nftNumber} minted! ✅`)
        } catch (waitError) {
          console.warn("Could not wait for transaction confirmation:", waitError)
          toast.success(`NFT #${nftNumber} transaction submitted!`)
        }

        // Update current supply
        setCurrentSupply(i + 1)
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <p>Successfully minted {actualCount} NFT(s)!</p>
        </div>,
        { duration: 10000 }
      )

      if (account?.address) {
        verifyCollectionOnChain(account.address.toString(), true)
        fetchMintedNFTs(account.address.toString(), true)
      }
    } catch (error) {
      console.error("Batch mint failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to mint NFTs")
    } finally {
      setIsMinting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Collection not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const movementData = 'Movement' in collection.chain_data ? collection.chain_data.Movement : null
  const manifestUrl = movementData?.manifest_url?.[0] || null
  const isDeployed = movementData?.collection_created || !!manifestUrl

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/collections/my">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Collections
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-6">
        <img
          src={collection.image_url}
          alt={collection.name}
          className="w-32 h-32 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
          <p className="text-muted-foreground mb-4">{collection.description}</p>
          <div className="flex gap-2">
            <Badge variant="secondary">{collection.symbol}</Badge>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
              Movement
            </Badge>
            <Badge variant={isDeployed ? "default" : "secondary"}>
              {isDeployed ? "Deployed" : "Draft"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Collection Address */}
      {isDeployed && (
        <Card>
          <CardHeader>
            <CardTitle>Collection On-Chain</CardTitle>
            <CardDescription>
              Your collection is deployed on Movement {MOVEMENT_NETWORK}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collectionNotFound && (
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <div className="font-medium mb-1">Collection Not Found On-Chain</div>
                    <div>
                      This collection could not be found on the Movement blockchain indexer.
                      The collection may not have been deployed yet or the indexer may not have indexed it.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {collectionAddress && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Collection Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                    {collectionAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(collectionAddress)}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInExplorer(collectionAddress, false)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {onChainCollection && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Minted</label>
                  <p className="text-2xl font-bold">{onChainCollection.total_minted_v2 || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Supply</label>
                  <p className="text-2xl font-bold">{onChainCollection.current_supply || 0}</p>
                </div>
              </div>
            )}
            {isLoadingAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collection address...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mint NFTs */}
      {isDeployed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Mint NFTs from Collection
            </CardTitle>
            <CardDescription>
              Batch mint NFTs from your uploaded collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {manifestData && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total in Collection:</span>
                  <span className="font-medium">{(manifestData.items?.length || manifestData.properties?.files?.length || 0)} NFTs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Minted:</span>
                  <span className="font-medium">{onChainCollection?.total_minted_v2 || currentSupply || 0} NFTs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-emerald-600">
                    {Math.max(0, (manifestData.items?.length || manifestData.properties?.files?.length || 0) - (onChainCollection?.total_minted_v2 || currentSupply || 0))} NFTs
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mint-count">How many NFTs to mint?</Label>
              <Input
                id="mint-count"
                type="number"
                min="1"
                max={manifestData?.items?.length || manifestData?.properties?.files?.length || 100}
                value={mintCount}
                onChange={(e) => setMintCount(parseInt(e.target.value) || 1)}
                placeholder="Enter number of NFTs"
              />
              <p className="text-xs text-muted-foreground">
                Will mint NFTs #{(onChainCollection?.total_minted_v2 || currentSupply || 0) + 1} to #{Math.min((onChainCollection?.total_minted_v2 || currentSupply || 0) + mintCount, manifestData?.items?.length || manifestData?.properties?.files?.length || 0)}
              </p>
            </div>

            {!connected && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                Please connect your Movement wallet to mint NFTs
              </div>
            )}

            {!manifestData && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                Loading collection manifest...
              </div>
            )}

            <Button
              onClick={handleBatchMint}
              disabled={!connected || isMinting || !manifestData}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Minting NFTs...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Mint {mintCount} NFT{mintCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Minted NFTs */}
      {mintedNFTs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Minted NFTs ({mintedNFTs.length})</CardTitle>
            <CardDescription>
              NFTs from this collection in your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {mintedNFTs.map((nft: any, index: number) => (
                <NFTCard key={nft.token_data_id || index} nft={nft} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Collection ID</label>
            <p className="text-sm font-mono">{collection.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Supply</label>
            <p className="text-sm">
              {collection.total_supply.toString() === "0"
                ? "Unlimited"
                : collection.total_supply.toString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Royalty</label>
            <p className="text-sm">{collection.royalty_bps / 100}%</p>
          </div>
          {manifestUrl && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Manifest URL</label>
              <a
                href={manifestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
              >
                {manifestUrl}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Deployment Stage</label>
            <p className="text-sm">
              {!isDeployed && "Not deployed"}
              {isDeployed && "Deployed on-chain"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Features</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" disabled className="w-full justify-start">
            Batch Mint NFTs
          </Button>
          <Button variant="outline" disabled className="w-full justify-start">
            Update Collection Metadata
          </Button>
          <Button variant="outline" disabled className="w-full justify-start">
            Transfer Collection Ownership
          </Button>
          <Button variant="outline" disabled className="w-full justify-start">
            View Collection Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
