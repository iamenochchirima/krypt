"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useRegistryCanister } from "@/hooks/useRegistryCanister"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import {
  Loader2,
  Shield,
  Search,
  MoreHorizontal,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Star,
  StarOff,
  ShieldCheck,
  ShieldX,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collection, Blockchain } from "@/constants/canisters-config"
import { toast } from "sonner"

const COLLECTIONS_PER_PAGE = 10

const blockchainColors: Record<string, string> = {
  Solana: "bg-purple-500/10 text-purple-500",
  ICP: "bg-blue-500/10 text-blue-500",
  Movement: "bg-orange-500/10 text-orange-500",
  Ethereum: "bg-gray-500/10 text-gray-400",
}

export default function CollectionsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()
  const { registryService, isReady } = useRegistryCanister()

  const [collections, setCollections] = useState<Collection[]>([])
  const [totalCollections, setTotalCollections] = useState<bigint>(BigInt(0))
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [featuredCount, setFeaturedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBlockchain, setSelectedBlockchain] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchCollections = useCallback(async () => {
    if (!registryService) return

    setIsLoading(true)
    try {
      const [result, verified, featured, drafts] = await Promise.all([
        registryService.getCollectionsPaginated(
          BigInt(currentPage * COLLECTIONS_PER_PAGE),
          BigInt(COLLECTIONS_PER_PAGE)
        ),
        registryService.getVerifiedCollections(0, 1000),
        registryService.getFeaturedCollections(0, 1000),
        registryService.getAllDraftCollections(0, 1000),
      ])

      setCollections(result.collections)
      setTotalCollections(result.total)
      setVerifiedCount(verified.length)
      setFeaturedCount(featured.length)
      setPendingCount(drafts.length)
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast.error("Failed to fetch collections")
    } finally {
      setIsLoading(false)
    }
  }, [registryService, currentPage])

  useEffect(() => {
    if (isReady) {
      fetchCollections()
    }
  }, [isReady, fetchCollections])

  const handleSetVerified = async (collectionId: string, isVerified: boolean) => {
    if (!registryService) return

    try {
      await registryService.setVerified({ collection_id: collectionId, is_verified: isVerified })
      toast.success(isVerified ? "Collection verified" : "Collection unverified")
      fetchCollections()
    } catch (error) {
      console.error("Error updating verification:", error)
      toast.error("Failed to update verification status")
    }
  }

  const handleSetFeatured = async (collectionId: string, isFeatured: boolean) => {
    if (!registryService) return

    try {
      await registryService.setFeatured({ collection_id: collectionId, is_featured: isFeatured })
      toast.success(isFeatured ? "Collection featured" : "Collection unfeatured")
      fetchCollections()
    } catch (error) {
      console.error("Error updating featured status:", error)
      toast.error("Failed to update featured status")
    }
  }

  const handleRemoveCollection = async (collectionId: string) => {
    if (!registryService) return

    if (!confirm("Are you sure you want to remove this collection? This action cannot be undone.")) {
      return
    }

    try {
      await registryService.removeCollection(collectionId)
      toast.success("Collection removed")
      fetchCollections()
    } catch (error) {
      console.error("Error removing collection:", error)
      toast.error("Failed to remove collection")
    }
  }

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const blockchainName = Object.keys(collection.blockchain)[0]
    const matchesBlockchain = !selectedBlockchain || blockchainName === selectedBlockchain
    return matchesSearch && matchesBlockchain
  })

  const totalPages = Math.ceil(Number(totalCollections) / COLLECTIONS_PER_PAGE)
  const totalItems = collections.reduce((acc, c) => acc + Number(c.total_supply), 0)

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Sign in with Internet Identity to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={login}>
              Sign in with Internet Identity
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground">Manage NFT collections across all blockchains</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCollections} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedBlockchain === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBlockchain(null)}
            >
              All
            </Button>
            {["Solana", "ICP", "Movement", "Ethereum"].map((chain) => (
              <Button
                key={chain}
                variant={selectedBlockchain === chain ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBlockchain(chain)}
              >
                {chain}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCollections.toString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Collections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : verifiedCount}
              </div>
              <p className="text-xs text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : featuredCount}
              </div>
              <p className="text-xs text-muted-foreground">Featured</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
        </div>

        {/* Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Collections</CardTitle>
            <CardDescription>
              Showing {filteredCollections.length} of {totalCollections.toString()} collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !collections.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Collection</th>
                        <th className="pb-3 font-medium">Blockchain</th>
                        <th className="pb-3 font-medium">Creator</th>
                        <th className="pb-3 font-medium">Items</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Created</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCollections.map((collection) => {
                        const blockchainName = Object.keys(collection.blockchain)[0]
                        const statusName = Object.keys(collection.status)[0]
                        const creatorText = collection.creator.toText()

                        return (
                          <tr key={collection.id} className="border-b last:border-0">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {collection.image_url ? (
                                  <img
                                    src={collection.image_url}
                                    alt={collection.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-muted" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{collection.name}</span>
                                    {collection.is_verified && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    {collection.is_featured && (
                                      <Star className="h-4 w-4 text-yellow-500" />
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{collection.slug}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${blockchainColors[blockchainName]}`}>
                                {blockchainName}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="font-mono text-sm text-muted-foreground">
                                {creatorText.slice(0, 8)}...{creatorText.slice(-5)}
                              </span>
                            </td>
                            <td className="py-4 text-sm">{collection.total_supply.toString()}</td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                statusName === "Active"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-yellow-500/10 text-yellow-500"
                              }`}>
                                {statusName === "Active" ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                {statusName}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {new Date(Number(collection.created_at) / 1_000_000).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {collection.is_verified ? (
                                    <DropdownMenuItem onClick={() => handleSetVerified(collection.id, false)}>
                                      <ShieldX className="mr-2 h-4 w-4" />
                                      Remove Verification
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleSetVerified(collection.id, true)}>
                                      <ShieldCheck className="mr-2 h-4 w-4" />
                                      Verify Collection
                                    </DropdownMenuItem>
                                  )}
                                  {collection.is_featured ? (
                                    <DropdownMenuItem onClick={() => handleSetFeatured(collection.id, false)}>
                                      <StarOff className="mr-2 h-4 w-4" />
                                      Remove from Featured
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleSetFeatured(collection.id, true)}>
                                      <Star className="mr-2 h-4 w-4" />
                                      Add to Featured
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveCollection(collection.id)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Collection
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
