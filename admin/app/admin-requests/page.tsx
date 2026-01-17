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
  RefreshCw,
  UserCheck,
  UserX,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Pause,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react"
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

export default function AdminRequestsPage() {
  const { isAuthenticated, isLoading: authLoading, login, principalId } = useAuth()
  const { usersService, isReady } = useUsersCanister()

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

    if (!confirm("Are you sure you want to remove this admin?")) {
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

  // Get recently added admins (within last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentAdmins = admins.filter(admin => {
    const createdAt = Number(admin.created_at) / 1_000_000
    return createdAt > sevenDaysAgo
  })

  // Get suspended admins
  const suspendedAdmins = admins.filter(admin =>
    Object.keys(admin.status)[0] === "Suspended"
  )

  // Get pending review (recently added and not super admin)
  const pendingReview = recentAdmins.filter(admin =>
    Object.keys(admin.role)[0] !== "SuperAdmin"
  )

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
            <h1 className="text-3xl font-bold">Admin Requests</h1>
            <p className="text-muted-foreground">Review and manage admin approvals</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAdmins} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingReview.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : suspendedAdmins.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : recentAdmins.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Added This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recently Added Admins - Pending Review */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Recently Added (Last 7 Days)
            </CardTitle>
            <CardDescription>
              New admins that may need review or approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingReview.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                <p>No new admins pending review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReview.map((admin) => {
                  const principalText = admin.principal.toText()
                  const roleName = Object.keys(admin.role)[0]
                  const statusName = Object.keys(admin.status)[0]
                  const isCurrentUser = principalText === principalId

                  return (
                    <div
                      key={principalText}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        {admin.image_url && admin.image_url.length > 0 ? (
                          <img
                            src={admin.image_url[0]}
                            alt={admin.username}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{admin.username}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[roleName]}`}>
                              {roleIcons[roleName]}
                              {roleName}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {principalText.slice(0, 15)}...{principalText.slice(-8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(Number(admin.created_at) / 1_000_000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <div className="flex gap-2">
                          {statusName === "Active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspendAdmin(principalText)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateAdmin(principalText)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAdmin(principalText)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspended Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-yellow-500" />
              Suspended Admins
            </CardTitle>
            <CardDescription>
              Admins that have been suspended and may need reactivation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : suspendedAdmins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                <p>No suspended admins</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suspendedAdmins.map((admin) => {
                  const principalText = admin.principal.toText()
                  const roleName = Object.keys(admin.role)[0]
                  const isCurrentUser = principalText === principalId

                  return (
                    <div
                      key={principalText}
                      className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4"
                    >
                      <div className="flex items-center gap-4">
                        {admin.image_url && admin.image_url.length > 0 ? (
                          <img
                            src={admin.image_url[0]}
                            alt={admin.username}
                            className="h-12 w-12 rounded-full object-cover opacity-75"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                            <Shield className="h-5 w-5 text-yellow-500" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{admin.username}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[roleName]}`}>
                              {roleIcons[roleName]}
                              {roleName}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                              <Pause className="h-3 w-3" />
                              Suspended
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {principalText.slice(0, 15)}...{principalText.slice(-8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last updated {new Date(Number(admin.updated_at) / 1_000_000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReactivateAdmin(principalText)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Reactivate
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAdmin(principalText)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
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
