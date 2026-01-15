"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Loader2, Shield, Search, Filter, MoreHorizontal, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

// Mock collections data
const mockCollections = [
  {
    id: "1",
    name: "Cosmic Apes",
    blockchain: "Solana",
    creator: "0x1234...5678",
    items: 10000,
    volume: "2,450 SOL",
    status: "verified",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Digital Dreams",
    blockchain: "ICP",
    creator: "abc12-xyz89...qrs",
    items: 5000,
    volume: "1,200 ICP",
    status: "verified",
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    name: "Pixel Warriors",
    blockchain: "Movement",
    creator: "0xabcd...efgh",
    items: 8000,
    volume: "850 MOVE",
    status: "pending",
    createdAt: "2024-01-10",
  },
  {
    id: "4",
    name: "Abstract Art",
    blockchain: "Ethereum",
    creator: "0x9876...5432",
    items: 3000,
    volume: "45 ETH",
    status: "verified",
    createdAt: "2024-01-08",
  },
  {
    id: "5",
    name: "Neon Nights",
    blockchain: "Solana",
    creator: "0x5555...6666",
    items: 6000,
    volume: "980 SOL",
    status: "rejected",
    createdAt: "2024-01-05",
  },
  {
    id: "6",
    name: "Cyber Punks",
    blockchain: "ICP",
    creator: "def34-uvw67...mno",
    items: 7500,
    volume: "650 ICP",
    status: "pending",
    createdAt: "2024-01-03",
  },
]

const blockchainColors: Record<string, string> = {
  Solana: "bg-purple-500/10 text-purple-500",
  ICP: "bg-blue-500/10 text-blue-500",
  Movement: "bg-orange-500/10 text-orange-500",
  Ethereum: "bg-gray-500/10 text-gray-400",
}

const statusIcons: Record<string, React.ReactNode> = {
  verified: <CheckCircle className="h-4 w-4 text-green-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
}

export default function CollectionsPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBlockchain, setSelectedBlockchain] = useState<string | null>(null)

  const filteredCollections = mockCollections.filter((collection) => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBlockchain = !selectedBlockchain || collection.blockchain === selectedBlockchain
    return matchesSearch && matchesBlockchain
  })

  if (isLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground">Manage NFT collections across all blockchains</p>
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
              <div className="text-2xl font-bold">{mockCollections.length}</div>
              <p className="text-xs text-muted-foreground">Total Collections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {mockCollections.filter((c) => c.status === "verified").length}
              </div>
              <p className="text-xs text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {mockCollections.filter((c) => c.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {mockCollections.reduce((acc, c) => acc + c.items, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
        </div>

        {/* Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Collections</CardTitle>
            <CardDescription>{filteredCollections.length} collections found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Collection</th>
                    <th className="pb-3 font-medium">Blockchain</th>
                    <th className="pb-3 font-medium">Creator</th>
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Volume</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollections.map((collection) => (
                    <tr key={collection.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted" />
                          <span className="font-medium">{collection.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${blockchainColors[collection.blockchain]}`}>
                          {collection.blockchain}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{collection.creator}</td>
                      <td className="py-4 text-sm">{collection.items.toLocaleString()}</td>
                      <td className="py-4 text-sm">{collection.volume}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {statusIcons[collection.status]}
                          <span className="text-sm capitalize">{collection.status}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{collection.createdAt}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
