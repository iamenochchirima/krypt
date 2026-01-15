"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Loader2, Shield, Search, MoreHorizontal, UserCheck, UserX, Users, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"

// Mock users data
const mockUsers = [
  {
    id: "1",
    principal: "abc12-xyz89-def34-uvw67-qrs12",
    wallets: { solana: "0x1234...5678", evm: "0xabcd...efgh" },
    collections: 3,
    nftsOwned: 45,
    totalVolume: "12.5 SOL",
    status: "active",
    joinedAt: "2024-01-15",
  },
  {
    id: "2",
    principal: "ghi56-jkl90-mno23-pqr78-stu45",
    wallets: { solana: "0x9876...5432", icp: "xyz..." },
    collections: 1,
    nftsOwned: 128,
    totalVolume: "45.2 ICP",
    status: "active",
    joinedAt: "2024-01-12",
  },
  {
    id: "3",
    principal: "vwx89-yza12-bcd34-efg56-hij78",
    wallets: { evm: "0x5555...6666" },
    collections: 0,
    nftsOwned: 12,
    totalVolume: "0.8 ETH",
    status: "suspended",
    joinedAt: "2024-01-10",
  },
  {
    id: "4",
    principal: "klm01-nop23-qrs45-tuv67-wxy89",
    wallets: { solana: "0x7777...8888", movement: "0xaaaa...bbbb" },
    collections: 5,
    nftsOwned: 234,
    totalVolume: "89.3 SOL",
    status: "active",
    joinedAt: "2024-01-08",
  },
  {
    id: "5",
    principal: "zab12-cde34-fgh56-ijk78-lmn90",
    wallets: { icp: "abc..." },
    collections: 2,
    nftsOwned: 67,
    totalVolume: "23.1 ICP",
    status: "active",
    joinedAt: "2024-01-05",
  },
]

export default function UsersPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.principal.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || user.status === statusFilter
    return matchesSearch && matchesStatus
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
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage platform users and their accounts</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by principal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "suspended" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("suspended")}
            >
              Suspended
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{mockUsers.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {mockUsers.filter((u) => u.status === "active").length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">
                  {mockUsers.filter((u) => u.status === "suspended").length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {mockUsers.filter((u) => u.collections > 0).length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Creators</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>{filteredUsers.length} users found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Principal ID</th>
                    <th className="pb-3 font-medium">Connected Wallets</th>
                    <th className="pb-3 font-medium">Collections</th>
                    <th className="pb-3 font-medium">NFTs Owned</th>
                    <th className="pb-3 font-medium">Total Volume</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-mono text-sm">{user.principal.slice(0, 15)}...</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-1">
                          {Object.keys(user.wallets).map((wallet) => (
                            <span
                              key={wallet}
                              className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize"
                            >
                              {wallet}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-sm">{user.collections}</td>
                      <td className="py-4 text-sm">{user.nftsOwned}</td>
                      <td className="py-4 text-sm">{user.totalVolume}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            user.status === "active"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {user.status === "active" ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{user.joinedAt}</td>
                      <td className="py-4">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
