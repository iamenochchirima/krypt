"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Settings } from "lucide-react"
import Link from "next/link"
import RegistrationModal from "./registration/registration-modal"
import LoadingModal from "./loading-modal"
import { useAuth } from "@/providers/auth-context"
import { connectInternetIdentityWallet } from "@/providers/internetidentity"
import { WalletType } from "@/providers/types"

export default function AuthButton() {
  const { isAuthenticated, user, logout, fetchingUser, login } = useAuth()
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Close registration modal if user is found
    if (user) {
      setIsRegistrationModalOpen(false)
      return
    }

    // Reset logout state when user becomes unauthenticated
    if (!isAuthenticated) {
      setIsLoggingOut(false)
      setIsRegistrationModalOpen(false)
      return
    }

    // Only show registration modal if authenticated, no user, not fetching, and not in logout process
    if (isAuthenticated && !user && !fetchingUser && !isLoggingOut) {
      // Small delay to ensure logout process is complete and prevent race conditions
      const timer = setTimeout(() => {
        if (isAuthenticated && !user && !fetchingUser && !isLoggingOut) {
          setIsRegistrationModalOpen(true)
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, fetchingUser, isLoggingOut])

  const handleLogin = () => {
    connectInternetIdentityWallet((success: boolean, walletType: WalletType) => {
      if (success) {
        login(walletType)
      }
    })
  }

  const handleLogout = () => {
    setIsLoggingOut(true)
    setIsRegistrationModalOpen(false) // Immediately close registration modal
    logout()
  }

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false)
  }

  // Show user profile dropdown if authenticated and user exists
  if (isAuthenticated && user && !fetchingUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{user.principal.toString()}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Show login button if not authenticated
  return (
    <>
      <Button onClick={handleLogin}>
        Log in
      </Button>
      
      {/* Loading Modal - shows when fetching user data */}
      <LoadingModal
        isOpen={fetchingUser}
        title="Authenticating..."
        description="Please wait while we verify your authentication."
      />

      {/* Registration Modal - shows automatically when authenticated but no user */}
      <RegistrationModal 
        isOpen={isRegistrationModalOpen} 
        onClose={closeRegistrationModal} 
      />
    </>
  )
}
