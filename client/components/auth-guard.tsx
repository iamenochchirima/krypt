"use client"

import { useAuth } from "@/providers/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogIn, Wallet } from "lucide-react"
import { WalletType } from "@/providers/types"
import { connectInternetIdentityWallet } from "@/providers/internetidentity"

interface AuthGuardProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function AuthGuard({
  children,
  title = "Authentication Required",
  description = "Please sign in to continue"
}: AuthGuardProps) {
  const { isAuthenticated, user, fetchingUser, login } = useAuth()

  const handleLogin = () => {
    connectInternetIdentityWallet((success: boolean, walletType: WalletType) => {
      if (success) {
        login(walletType)
      }
    })
  }

  if (fetchingUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={handleLogin}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You need to be signed in to access this page
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
