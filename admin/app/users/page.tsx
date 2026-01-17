"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useUsersCanister } from "@/hooks/useUsersCanister"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import {
  Loader2,
  Shield,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Users,
  TrendingUp,
  RefreshCw,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, BannedUser } from "@/constants/canisters-config"
import { toast } from "sonner"

const USERS_PER_PAGE = 10

export default function UsersPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()
  const { usersService, isReady } = useUsersCanister()

  const [users, setUsers] = useState<User[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [totalUsers, setTotalUsers] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all")
  const [currentPage, setCurrentPage] = useState(0)

  const fetchUsers = useCallback(async () => {
    if (!usersService) return

    setIsLoading(true)
    try {
      const [usersResult, bannedResult, total] = await Promise.all([
        usersService.getUsersPaginated(
          BigInt(currentPage * USERS_PER_PAGE),
          BigInt(USERS_PER_PAGE)
        ),
        usersService.getAllBannedUsers(),
        usersService.getTotalUsers(),
      ])

      setUsers(usersResult.users)
      setBannedUsers(bannedResult)
      setTotalUsers(total)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }, [usersService, currentPage])

  useEffect(() => {
    if (isReady) {
      fetchUsers()
    }
  }, [isReady, fetchUsers])

  const handleBanUser = async (principal: string) => {
    if (!usersService) return

    const reason = prompt("Enter ban reason:")
    if (!reason) return

    try {
      const { Principal } = await import("@dfinity/principal")
      await usersService.banUser(Principal.fromText(principal), reason)
      toast.success("User banned successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error banning user:", error)
      toast.error("Failed to ban user")
    }
  }

  const handleUnbanUser = async (principal: string) => {
    if (!usersService) return

    try {
      const { Principal } = await import("@dfinity/principal")
      await usersService.unbanUser(Principal.fromText(principal))
      toast.success("User unbanned successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast.error("Failed to unban user")
    }
  }

  const bannedPrincipals = new Set(bannedUsers.map((u) => u.principal.toText()))

  const filteredUsers = users.filter((user) => {
    const principalText = user.principal.toText()
    const matchesSearch =
      principalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    const isBanned = bannedPrincipals.has(principalText)

    if (statusFilter === "active") return matchesSearch && !isBanned
    if (statusFilter === "banned") return matchesSearch && isBanned
    return matchesSearch
  })

  const totalPages = Math.ceil(Number(totalUsers) / USERS_PER_PAGE)

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
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage platform users and their accounts</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by principal or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
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
              variant={statusFilter === "banned" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("banned")}
            >
              Banned
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{totalUsers.toString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {(Number(totalUsers) - bannedUsers.length).toString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold">{bannedUsers.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Banned Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">This Page</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {totalUsers.toString()} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !users.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Principal ID</th>
                        <th className="pb-3 font-medium">Chain</th>
                        <th className="pb-3 font-medium">Wallet</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Joined</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const principalText = user.principal.toText()
                        const isBanned = bannedPrincipals.has(principalText)
                        const chainName = Object.keys(user.chain_data.chain)[0]

                        return (
                          <tr key={principalText} className="border-b last:border-0">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {user.image_url && user.image_url.length > 0 ? (
                                  <img
                                    src={user.image_url[0]}
                                    alt={user.username}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Users className="h-4 w-4 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  {user.email && user.email.length > 0 && (
                                    <p className="text-xs text-muted-foreground">{user.email[0]}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="font-mono text-sm">
                                {principalText.slice(0, 10)}...{principalText.slice(-5)}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
                                {chainName}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="font-mono text-xs text-muted-foreground">
                                {user.chain_data.wallet_address.slice(0, 8)}...
                                {user.chain_data.wallet_address.slice(-6)}
                              </span>
                            </td>
                            <td className="py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                  isBanned
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-green-500/10 text-green-500"
                                }`}
                              >
                                {isBanned ? (
                                  <>
                                    <Ban className="h-3 w-3" />
                                    Banned
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3 w-3" />
                                    Active
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {new Date(Number(user.created_at) / 1_000_000).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {isBanned ? (
                                    <DropdownMenuItem onClick={() => handleUnbanUser(principalText)}>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Unban User
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleBanUser(principalText)}
                                      className="text-red-500"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Ban User
                                    </DropdownMenuItem>
                                  )}
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
