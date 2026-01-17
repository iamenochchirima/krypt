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
  RefreshCw,
  UserPlus,
  UserX,
  UserCheck,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Pause,
  Play,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AdminUser, AdminRole } from "@/constants/canisters-config"
import { toast } from "sonner"

const roleColors: Record<string, string> = {
  SuperAdmin: "bg-yellow-500/10 text-yellow-500",
  Admin: "bg-blue-500/10 text-blue-500",
  Moderator: "bg-green-500/10 text-green-500",
  Support: "bg-gray-500/10 text-gray-400",
}

const roleIcons: Record<string, React.ReactNode> = {
  SuperAdmin: <Crown className="h-3 w-3" />,
  Admin: <ShieldCheck className="h-3 w-3" />,
  Moderator: <Shield className="h-3 w-3" />,
  Support: <ShieldAlert className="h-3 w-3" />,
}

export default function AdminsPage() {
  const { isAuthenticated, isLoading: authLoading, login, principalId } = useAuth()
  const { usersService, isReady } = useUsersCanister()

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAdminPrincipal, setNewAdminPrincipal] = useState("")
  const [newAdminUsername, setNewAdminUsername] = useState("")
  const [newAdminRole, setNewAdminRole] = useState<string>("Moderator")
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)

  const fetchAdmins = useCallback(async () => {
    if (!usersService) return

    setIsLoading(true)
    try {
      const result = await usersService.getAllAdmins()
      setAdmins(result)
    } catch (error) {
      console.error("Error fetching admins:", error)
      toast.error("Failed to fetch admins")
    } finally {
      setIsLoading(false)
    }
  }, [usersService])

  useEffect(() => {
    if (isReady) {
      fetchAdmins()
    }
  }, [isReady, fetchAdmins])

  const handleAddAdmin = async () => {
    if (!usersService || !newAdminPrincipal || !newAdminUsername) return

    setIsAddingAdmin(true)
    try {
      const { Principal } = await import("@dfinity/principal")
      const role: AdminRole = { [newAdminRole]: null } as AdminRole
      await usersService.addAdmin(
        Principal.fromText(newAdminPrincipal),
        newAdminUsername,
        role
      )
      toast.success("Admin added successfully")
      setIsAddDialogOpen(false)
      setNewAdminPrincipal("")
      setNewAdminUsername("")
      setNewAdminRole("Moderator")
      fetchAdmins()
    } catch (error) {
      console.error("Error adding admin:", error)
      toast.error("Failed to add admin")
    } finally {
      setIsAddingAdmin(false)
    }
  }

  const handleSuspendAdmin = async (principal: string) => {
    if (!usersService) return

    try {
      const { Principal } = await import("@dfinity/principal")
      await usersService.suspendAdmin(Principal.fromText(principal))
      toast.success("Admin suspended")
      fetchAdmins()
    } catch (error) {
      console.error("Error suspending admin:", error)
      toast.error("Failed to suspend admin")
    }
  }

  const handleReactivateAdmin = async (principal: string) => {
    if (!usersService) return

    try {
      const { Principal } = await import("@dfinity/principal")
      await usersService.reactivateAdmin(Principal.fromText(principal))
      toast.success("Admin reactivated")
      fetchAdmins()
    } catch (error) {
      console.error("Error reactivating admin:", error)
      toast.error("Failed to reactivate admin")
    }
  }

  const handleRemoveAdmin = async (principal: string) => {
    if (!usersService) return

    if (!confirm("Are you sure you want to remove this admin? This action cannot be undone.")) {
      return
    }

    try {
      const { Principal } = await import("@dfinity/principal")
      await usersService.removeAdmin(Principal.fromText(principal))
      toast.success("Admin removed")
      fetchAdmins()
    } catch (error) {
      console.error("Error removing admin:", error)
      toast.error("Failed to remove admin")
    }
  }

  const handleUpdateRole = async (principal: string, newRole: string) => {
    if (!usersService) return

    try {
      const { Principal } = await import("@dfinity/principal")
      const role: AdminRole = { [newRole]: null } as AdminRole
      await usersService.updateAdminRole(Principal.fromText(principal), role)
      toast.success("Role updated")
      fetchAdmins()
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role")
    }
  }

  const filteredAdmins = admins.filter((admin) => {
    const principalText = admin.principal.toText()
    const matchesSearch =
      principalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchQuery.toLowerCase())
    const statusName = Object.keys(admin.status)[0]

    if (statusFilter === "active") return matchesSearch && statusName === "Active"
    if (statusFilter === "suspended") return matchesSearch && statusName === "Suspended"
    return matchesSearch
  })

  const activeCount = admins.filter(a => Object.keys(a.status)[0] === "Active").length
  const suspendedCount = admins.filter(a => Object.keys(a.status)[0] === "Suspended").length
  const superAdminCount = admins.filter(a => Object.keys(a.role)[0] === "SuperAdmin").length

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
            <h1 className="text-3xl font-bold">Admins</h1>
            <p className="text-muted-foreground">Manage platform administrators</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Admin</DialogTitle>
                  <DialogDescription>
                    Add a new administrator to the platform
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="principal">Principal ID</Label>
                    <Input
                      id="principal"
                      placeholder="Enter principal ID"
                      value={newAdminPrincipal}
                      onChange={(e) => setNewAdminPrincipal(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Moderator">Moderator</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAdmin} disabled={isAddingAdmin || !newAdminPrincipal || !newAdminUsername}>
                    {isAddingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Admin
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchAdmins} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
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
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : admins.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : suspendedCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : superAdminCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Super Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Admins</CardTitle>
            <CardDescription>
              Showing {filteredAdmins.length} of {admins.length} admins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !admins.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Admin</th>
                      <th className="pb-3 font-medium">Principal ID</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Added</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((admin) => {
                      const principalText = admin.principal.toText()
                      const roleName = Object.keys(admin.role)[0]
                      const statusName = Object.keys(admin.status)[0]
                      const isSuperAdmin = roleName === "SuperAdmin"
                      const isCurrentUser = principalText === principalId

                      return (
                        <tr key={principalText} className="border-b last:border-0">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              {admin.image_url && admin.image_url.length > 0 ? (
                                <img
                                  src={admin.image_url[0]}
                                  alt={admin.username}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <Shield className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{admin.username}</p>
                                {isCurrentUser && (
                                  <p className="text-xs text-muted-foreground">(You)</p>
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
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${roleColors[roleName]}`}>
                              {roleIcons[roleName]}
                              {roleName}
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                statusName === "Active"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-yellow-500/10 text-yellow-500"
                              }`}
                            >
                              {statusName === "Active" ? (
                                <UserCheck className="h-3 w-3" />
                              ) : (
                                <Pause className="h-3 w-3" />
                              )}
                              {statusName}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {new Date(Number(admin.created_at) / 1_000_000).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            {!isSuperAdmin && !isCurrentUser && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleUpdateRole(principalText, "Admin")}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateRole(principalText, "Moderator")}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Make Moderator
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateRole(principalText, "Support")}>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Make Support
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {statusName === "Active" ? (
                                    <DropdownMenuItem onClick={() => handleSuspendAdmin(principalText)}>
                                      <Pause className="mr-2 h-4 w-4" />
                                      Suspend Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleReactivateAdmin(principalText)}>
                                      <Play className="mr-2 h-4 w-4" />
                                      Reactivate Admin
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveAdmin(principalText)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
