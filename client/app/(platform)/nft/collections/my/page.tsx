"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Settings, ExternalLink, Rocket } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Collection } from "@/declarations/marketplace/marketplace.did"

type Blockchain = "ICP" | "Solana" | "Ethereum" | "Bitcoin" | "Movement"

export default function MyCollectionsPage() {
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()

  const [collections, setCollections] = useState<Collection[]>([])
  const [drafts, setDrafts] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState<Blockchain | "All">("All")

  useEffect(() => {
    if (!isAuthenticated || !identity) {
      console.log("Not authenticated")
      return
    }

    loadCollections()
  }, [isAuthenticated, identity])

  const loadCollections = async () => {
    try {
      setIsLoading(true)
      const actor = await getMarketplaceActor(identity)

      const collectionsResult = await actor.get_user_collections(0, 100)
      setCollections(collectionsResult)

      const draftsResult = await actor.get_my_draft_collections()
      console.log({draftsResult})
      setDrafts(draftsResult)
    } catch (error) {
      console.error("Failed to load collections:", error)
      toast.error("Failed to load collections")
    } finally {
      setIsLoading(false)
    }
  }

  const getBlockchainName = (blockchain: Collection['blockchain']): Blockchain => {
    if ('ICP' in blockchain) return 'ICP'
    if ('Solana' in blockchain) return 'Solana'
    if ('Ethereum' in blockchain) return 'Ethereum'
    if ('Bitcoin' in blockchain) return 'Bitcoin'
    if ('Movement' in blockchain) return 'Movement'
    return 'ICP'
  }

  const getStatusLabel = (status: Collection['status']): string => {
    if ('Draft' in status) return 'Draft'
    if ('Active' in status) return 'Active'
    if ('Minting' in status) return 'Minting'
    if ('Paused' in status) return 'Paused'
    if ('Completed' in status) return 'Completed'
    return 'Unknown'
  }

  const getStatusVariant = (status: Collection['status']): "default" | "secondary" | "destructive" | "outline" => {
    if ('Draft' in status) return 'secondary'
    if ('Active' in status) return 'default'
    if ('Minting' in status) return 'default'
    if ('Paused' in status) return 'outline'
    if ('Completed' in status) return 'outline'
    return 'secondary'
  }

  const filterByBlockchain = (items: Collection[]) => {
    if (selectedChain === "All") return items
    return items.filter(item => getBlockchainName(item.blockchain) === selectedChain)
  }

  const handleManageCollection = (collection: Collection) => {
    const blockchain = getBlockchainName(collection.blockchain)
    const status = getStatusLabel(collection.status)

    const hasCandyMachine = 'Solana' in collection.chain_data &&
                           collection.chain_data.Solana.candy_machine_address?.[0]

    const isMovementDeployed = 'Movement' in collection.chain_data &&
                              collection.chain_data.Movement.collection_created

    if (status === 'Draft' && !hasCandyMachine && !isMovementDeployed) {
      if (blockchain === 'Solana') {
        router.push('/nft/create-collection/solana')
      } else if (blockchain === 'ICP') {
        router.push('/nft/create-collection/icp')
      } else if (blockchain === 'Movement') {
        router.push('/nft/create-collection/movement')
      }
    } else {
      if (blockchain === 'Solana') {
        router.push(`/collections/solana/manage/${collection.id}`)
      } else if (blockchain === 'ICP') {
        router.push(`/collections/icp/manage/${collection.id}`)
      } else if (blockchain === 'Movement') {
        router.push(`/collections/movement/manage/${collection.id}`)
      }
    }
  }

  const CollectionCard = ({ collection, isDraft }: { collection: Collection; isDraft?: boolean }) => {
    const blockchain = getBlockchainName(collection.blockchain)
    const status = getStatusLabel(collection.status)
    const [bannerImage, setBannerImage] = useState<string | null>(null)

    useEffect(() => {
      const fetchManifest = async () => {
        if (!('Solana' in collection.chain_data)) return

        const manifestUrl = collection.chain_data.Solana.manifest_url?.[0]
        if (!manifestUrl) return

        try {
          const response = await fetch(manifestUrl)
          const manifest = await response.json()
          if (manifest.image) {
            setBannerImage(manifest.image)
          }
        } catch (error) {
          console.error('Failed to fetch manifest:', error)
        }
      }

      if (blockchain === 'Solana') {
        fetchManifest()
      }
    }, [collection, blockchain])

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative">
          <img
            src={bannerImage || collection.image_url}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge variant="secondary">{blockchain}</Badge>
            <Badge variant={getStatusVariant(collection.status)}>{status}</Badge>
          </div>
        </div>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {collection.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Supply</p>
              <p className="text-lg font-semibold">{collection.total_supply.toString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Symbol</p>
              <p className="text-lg font-semibold">{collection.symbol}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => handleManageCollection(collection)}
            >
              {isDraft ? (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Continue
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </>
              )}
            </Button>
            {!isDraft && blockchain === 'Solana' && 'Solana' in collection.chain_data && collection.chain_data.Solana.candy_machine_address?.[0] && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if ('Solana' in collection.chain_data) {
                    const address = collection.chain_data.Solana.candy_machine_address?.[0]
                    if (address) {
                      window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, '_blank')
                    }
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {!isDraft && blockchain === 'Movement' && 'Movement' in collection.chain_data && collection.chain_data.Movement.collection_address?.[0] && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if ('Movement' in collection.chain_data) {
                    const address = collection.chain_data.Movement.collection_address?.[0]
                    if (address) {
                      const network = process.env.NEXT_PUBLIC_MOVEMENT_NETWORK === "mainnet" ? "mainnet" : "testnet"
                      window.open(`https://explorer.movementnetwork.xyz/account/${address}?network=${network}`, '_blank')
                    }
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Collections</h1>
          <p className="text-muted-foreground">
            Manage your NFT collections across different blockchains
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/nft/create-collection/movement">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Movement Collection
            </Button>
          </Link>
          <Link href="/nft/create-collection/solana">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Solana Collection
            </Button>
          </Link>
          <Link href="/nft/create-collection/icp">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create ICP Collection
            </Button>
          </Link>
        </div>
      </div>

      {/* Blockchain Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Blockchain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedChain === "All" ? "default" : "outline"}
              onClick={() => setSelectedChain("All")}
            >
              All
            </Button>
            <Button
              variant={selectedChain === "Movement" ? "default" : "outline"}
              onClick={() => setSelectedChain("Movement")}
            >
              Movement
            </Button>
            <Button
              variant={selectedChain === "Solana" ? "default" : "outline"}
              onClick={() => setSelectedChain("Solana")}
            >
              Solana
            </Button>
            <Button
              variant={selectedChain === "ICP" ? "default" : "outline"}
              onClick={() => setSelectedChain("ICP")}
            >
              ICP
            </Button>
            <Button
              variant={selectedChain === "Ethereum" ? "default" : "outline"}
              onClick={() => setSelectedChain("Ethereum")}
            >
              Ethereum
            </Button>
            <Button
              variant={selectedChain === "Bitcoin" ? "default" : "outline"}
              onClick={() => setSelectedChain("Bitcoin")}
            >
              Bitcoin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Deployed vs Drafts */}
      <Tabs defaultValue="deployed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="deployed">
            Deployed ({filterByBlockchain(collections).length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({filterByBlockchain(drafts).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deployed" className="mt-6">
          {filterByBlockchain(collections).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't deployed any collections yet
                </p>
                <Link href="/nft/create-collection/solana">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterByBlockchain(collections).map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          {filterByBlockchain(drafts).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No draft collections</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterByBlockchain(drafts).map((collection) => (
                <CollectionCard key={collection.id} collection={collection} isDraft />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
