"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Settings, ExternalLink, Rocket } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Collection } from "@/declarations/registry/registry.did"
import AuthGuard from "@/components/auth-guard"

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
      const actor = await getRegistryActor(identity)

      const allCollections = await actor.get_user_collections(0, 100)
      const active = allCollections.filter((c: Collection) => 'Active' in c.status)
      setCollections(active)

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
    return 'Unknown'
  }

  const getStatusVariant = (status: Collection['status']): "default" | "secondary" | "destructive" | "outline" => {
    if ('Draft' in status) return 'secondary'
    if ('Active' in status) return 'default'
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

    const isEthereumDeployed = 'Ethereum' in collection.chain_data &&
                              collection.chain_data.Ethereum.contract_address?.[0]

    if (status === 'Draft' && !hasCandyMachine && !isMovementDeployed && !isEthereumDeployed) {
      if (blockchain === 'Solana') {
        router.push('/nft/launchpad/solana')
      } else if (blockchain === 'ICP') {
        router.push('/nft/launchpad/icp')
      } else if (blockchain === 'Movement') {
        router.push('/nft/launchpad/movement')
      } else if (blockchain === 'Ethereum') {
        router.push('/nft/launchpad/ethereum')
      }
    } else {
      if (blockchain === 'Solana') {
        router.push(`/nft/collections/solana/manage/${collection.slug}`)
      } else if (blockchain === 'ICP') {
        router.push(`/nft/collections/icp/manage/${collection.slug}`)
      } else if (blockchain === 'Movement') {
        router.push(`/nft/collections/movement/manage/${collection.slug}`)
      } else if (blockchain === 'Ethereum') {
        router.push(`/nft/collections/ethereum/manage/${collection.slug}`)
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] relative">
          <img
            src={bannerImage || collection.image_url}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{blockchain}</Badge>
            <Badge variant={getStatusVariant(collection.status)} className="text-xs px-1.5 py-0">{status}</Badge>
          </div>
        </div>
        <CardContent className="p-3">
          <CardTitle className="text-sm font-semibold truncate">{collection.name}</CardTitle>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{collection.symbol}</span>
            <span>{collection.total_supply.toString()} items</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => handleManageCollection(collection)}
            >
              {isDraft ? (
                <>
                  <Rocket className="h-3 w-3 mr-1" />
                  Continue
                </>
              ) : (
                <>
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </>
              )}
            </Button>
            {!isDraft && blockchain === 'Solana' && 'Solana' in collection.chain_data && collection.chain_data.Solana.candy_machine_address?.[0] && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  if ('Solana' in collection.chain_data) {
                    const address = collection.chain_data.Solana.candy_machine_address?.[0]
                    if (address) {
                      window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, '_blank')
                    }
                  }
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            {!isDraft && blockchain === 'Movement' && 'Movement' in collection.chain_data && collection.chain_data.Movement.collection_address?.[0] && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
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
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Collections</h1>
          <p className="text-muted-foreground">
            Manage your NFT collections across different blockchains
          </p>
        </div>
        <Link href="/nft/launchpad">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </Link>
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

      {/* Tabs for Active vs Drafts */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="active">
            Active ({filterByBlockchain(collections).length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({filterByBlockchain(drafts).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {filterByBlockchain(collections).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You don't have any active collections yet
                </p>
                <Link href="/nft/launchpad/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filterByBlockchain(drafts).map((collection) => (
                <CollectionCard key={collection.id} collection={collection} isDraft />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </AuthGuard>
  )
}
