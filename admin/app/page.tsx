"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useUsersCanister } from "@/hooks/useUsersCanister"
import { useRegistryCanister } from "@/hooks/useRegistryCanister"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Loader2, Shield, Grid3X3, Users, Activity, DollarSign, TrendingUp, TrendingDown, AlertCircle, RefreshCw, UserCheck, ShieldCheck } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Collection } from "@/constants/canisters-config"

export default function AdminDashboard() {
  const { isAuthenticated, isBackendAuthenticated, isLoading, isAuthenticating, login, error, clearError } = useAuth()
  const { usersService, isReady: usersReady } = useUsersCanister()
  const { registryService, isReady: registryReady } = useRegistryCanister()

  const [totalUsers, setTotalUsers] = useState<bigint>(BigInt(0))
  const [totalCollections, setTotalCollections] = useState<bigint>(BigInt(0))
  const [verifiedCollections, setVerifiedCollections] = useState<number>(0)
  const [totalAdmins, setTotalAdmins] = useState<number>(0)
  const [activeUsers, setActiveUsers] = useState<number>(0)
  const [bannedUsers, setBannedUsers] = useState<number>(0)
  const [collectionsData, setCollectionsData] = useState<{ name: string; collections: number }[]>([])
  const [recentCollections, setRecentCollections] = useState<Collection[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!usersService || !registryService) return

    setIsDataLoading(true)
    try {
      // Fetch users data
      const [total, banned, admins] = await Promise.all([
        usersService.getTotalUsers(),
        usersService.getAllBannedUsers(),
        usersService.getAllAdmins(),
      ])

      setTotalUsers(total)
      setBannedUsers(banned.length)
      setActiveUsers(Number(total) - banned.length)
      setTotalAdmins(admins.length)

      // Fetch collections data
      const [collectionsTotal, verified, featured, latest] = await Promise.all([
        registryService.getTotalCollections(),
        registryService.getVerifiedCollections(0, 1000),
        registryService.getFeaturedCollections(0, 1000),
        registryService.getLatestCollections(BigInt(5)),
      ])

      setTotalCollections(collectionsTotal)
      setVerifiedCollections(verified.length)
      setRecentCollections(latest.collections)

      // Fetch blockchain distribution
      const blockchainCounts = await registryService.getBlockchainCounts()
      setCollectionsData([
        { name: "Solana", collections: blockchainCounts.Solana || 0 },
        { name: "ICP", collections: blockchainCounts.ICP || 0 },
        { name: "Movement", collections: blockchainCounts.Movement || 0 },
        { name: "Ethereum", collections: blockchainCounts.Ethereum || 0 },
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsDataLoading(false)
    }
  }, [usersService, registryService])

  useEffect(() => {
    if (usersReady && registryReady) {
      fetchDashboardData()
    }
  }, [usersReady, registryReady, fetchDashboardData])

  const userTypeData = [
    { name: "Active", value: activeUsers, color: "#82ca9d" },
    { name: "Banned", value: bannedUsers, color: "#ef4444" },
  ]

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
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
                <Button variant="ghost" size="sm" className="ml-auto h-auto p-1" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            )}
            <Button className="w-full" onClick={login}>
              Sign in with Internet Identity
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show authenticating state while server auth is in progress
  if (isAuthenticating || !isBackendAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <CardTitle>Authenticating</CardTitle>
            <CardDescription>Verifying your identity with the server...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
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
            <h1 className="text-3xl font-bold">Overview</h1>
            <p className="text-muted-foreground">Platform statistics and analytics</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isDataLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isDataLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isDataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCollections.toString()}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-green-500" />
                <span className="text-green-500">{verifiedCollections}</span> verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isDataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers.toString()}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-green-500" />
                <span className="text-green-500">{activeUsers}</span> active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isDataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAdmins}
              </div>
              <p className="text-xs text-muted-foreground">Platform administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isDataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : bannedUsers}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {bannedUsers > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Requires attention</span>
                  </>
                ) : (
                  <span>No banned users</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Collections by Blockchain</CardTitle>
              <CardDescription>Distribution of collections across chains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isDataLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="collections" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Status</CardTitle>
              <CardDescription>Active vs Banned users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {isDataLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {userTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 flex justify-center gap-4">
                {userTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Collections */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Collections</CardTitle>
            <CardDescription>Latest collections added to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentCollections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No collections yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentCollections.map((collection) => {
                  const blockchainName = Object.keys(collection.blockchain)[0]
                  return (
                    <div key={collection.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
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
                          <p className="text-sm font-medium">{collection.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {collection.total_supply.toString()} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          blockchainName === "Solana" ? "bg-purple-500/10 text-purple-500" :
                          blockchainName === "ICP" ? "bg-blue-500/10 text-blue-500" :
                          blockchainName === "Movement" ? "bg-orange-500/10 text-orange-500" :
                          "bg-gray-500/10 text-gray-400"
                        }`}>
                          {blockchainName}
                        </span>
                        {collection.is_verified && (
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(Number(collection.created_at) / 1_000_000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
