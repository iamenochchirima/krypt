"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import {
  Loader2,
  Shield,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Image,
  UserPlus,
  Verified,
  Repeat,
  ExternalLink,
} from "lucide-react"
import { Input } from "@/components/ui/input"

type ActivityType = "mint" | "transfer" | "sale" | "listing" | "collection_created" | "user_registered" | "verification"

// Mock activity data
const mockActivities = [
  {
    id: "1",
    type: "sale" as ActivityType,
    title: "NFT Sold",
    description: "Cosmic Ape #1234 sold for 2.5 SOL",
    user: "0x1234...5678",
    blockchain: "Solana",
    timestamp: "2 min ago",
    txHash: "abc123...",
  },
  {
    id: "2",
    type: "mint" as ActivityType,
    title: "NFT Minted",
    description: "Pixel Warrior #42 minted",
    user: "abc12-xyz89...",
    blockchain: "ICP",
    timestamp: "5 min ago",
    txHash: "def456...",
  },
  {
    id: "3",
    type: "user_registered" as ActivityType,
    title: "New User",
    description: "New user registered via Internet Identity",
    user: "ghi56-jkl90...",
    blockchain: "ICP",
    timestamp: "12 min ago",
    txHash: null,
  },
  {
    id: "4",
    type: "collection_created" as ActivityType,
    title: "Collection Created",
    description: "Digital Dreams collection created with 5,000 items",
    user: "0x9876...5432",
    blockchain: "Solana",
    timestamp: "18 min ago",
    txHash: "ghi789...",
  },
  {
    id: "5",
    type: "transfer" as ActivityType,
    title: "NFT Transferred",
    description: "Abstract Art #789 transferred",
    user: "0x5555...6666",
    blockchain: "Ethereum",
    timestamp: "25 min ago",
    txHash: "jkl012...",
  },
  {
    id: "6",
    type: "listing" as ActivityType,
    title: "NFT Listed",
    description: "Neon Night #567 listed for 1.2 SOL",
    user: "0x7777...8888",
    blockchain: "Solana",
    timestamp: "32 min ago",
    txHash: "mno345...",
  },
  {
    id: "7",
    type: "verification" as ActivityType,
    title: "Collection Verified",
    description: "Cyber Punks collection verified by admin",
    user: "admin",
    blockchain: "Movement",
    timestamp: "45 min ago",
    txHash: null,
  },
  {
    id: "8",
    type: "sale" as ActivityType,
    title: "NFT Sold",
    description: "Digital Dream #100 sold for 8.5 ICP",
    user: "klm01-nop23...",
    blockchain: "ICP",
    timestamp: "1 hour ago",
    txHash: "pqr678...",
  },
]

const activityIcons: Record<ActivityType, React.ReactNode> = {
  mint: <Image className="h-4 w-4" />,
  transfer: <Repeat className="h-4 w-4" />,
  sale: <ArrowUpRight className="h-4 w-4" />,
  listing: <ArrowDownLeft className="h-4 w-4" />,
  collection_created: <Image className="h-4 w-4" />,
  user_registered: <UserPlus className="h-4 w-4" />,
  verification: <Verified className="h-4 w-4" />,
}

const activityColors: Record<ActivityType, string> = {
  mint: "bg-purple-500/10 text-purple-500",
  transfer: "bg-blue-500/10 text-blue-500",
  sale: "bg-green-500/10 text-green-500",
  listing: "bg-yellow-500/10 text-yellow-500",
  collection_created: "bg-pink-500/10 text-pink-500",
  user_registered: "bg-cyan-500/10 text-cyan-500",
  verification: "bg-emerald-500/10 text-emerald-500",
}

const blockchainColors: Record<string, string> = {
  Solana: "bg-purple-500/10 text-purple-500",
  ICP: "bg-blue-500/10 text-blue-500",
  Movement: "bg-orange-500/10 text-orange-500",
  Ethereum: "bg-gray-500/10 text-gray-400",
}

export default function ActivityPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<ActivityType | null>(null)

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !typeFilter || activity.type === typeFilter
    return matchesSearch && matchesType
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
          <h1 className="text-3xl font-bold">Activity</h1>
          <p className="text-muted-foreground">Platform-wide activity and transaction history</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={typeFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(null)}
            >
              All
            </Button>
            <Button
              variant={typeFilter === "sale" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("sale")}
            >
              Sales
            </Button>
            <Button
              variant={typeFilter === "mint" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("mint")}
            >
              Mints
            </Button>
            <Button
              variant={typeFilter === "transfer" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("transfer")}
            >
              Transfers
            </Button>
            <Button
              variant={typeFilter === "listing" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("listing")}
            >
              Listings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{mockActivities.length}</div>
              <p className="text-xs text-muted-foreground">Total Events (24h)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {mockActivities.filter((a) => a.type === "sale").length}
              </div>
              <p className="text-xs text-muted-foreground">Sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {mockActivities.filter((a) => a.type === "mint").length}
              </div>
              <p className="text-xs text-muted-foreground">Mints</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {mockActivities.filter((a) => a.type === "user_registered").length}
              </div>
              <p className="text-xs text-muted-foreground">New Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>{filteredActivities.length} events found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${activityColors[activity.type]}`}
                    >
                      {activityIcons[activity.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.title}</p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${blockchainColors[activity.blockchain]}`}
                        >
                          {activity.blockchain}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                    {activity.txHash && (
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
