"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Wallet, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import AuthButton from "@/components/auth-button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/providers/auth-context"
import { useWalletConnection, WalletModal } from "@/connect-wallet"
import WalletInfoModal from "@/components/wallet-info-modal"
import { ExploreModal } from "./explore-modal"

export function PlatformNavbar() {
  const { isAuthenticated } = useAuth()
  const { walletState } = useWalletConnection()
  const [mounted, setMounted] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleWalletButtonClick = () => {
    if (walletState.isConnected) {
      setWalletInfoModalOpen(true)
    } else {
      setWalletModalOpen(true)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <header className="fixed top-0 z-50 w-full h-16" />
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-background border-b border-border">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Logo and Explore */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="CryptoDotFun Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-xl font-bold text-white hidden sm:inline">CryptoDotFun</span>
          </Link>

          {/* Explore Button with Modal */}
          <ExploreModal>
            <Button variant="outline" size="sm" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span className="hidden sm:inline">Explore</span>
            </Button>
          </ExploreModal>
        </div>

        {/* Center - Search Bar (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-muted/50 border-border focus:bg-background"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <AuthButton />

          {isAuthenticated && (
            <>
              {walletState.isConnected ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWalletButtonClick}
                  className="hidden sm:flex"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="sr-only">Wallet Info</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleWalletButtonClick}
                  className="hidden sm:flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden lg:inline">Connect Wallet</span>
                </Button>
              )}
            </>
          )}

          {isAuthenticated && <NotificationDropdown />}

          <ModeToggle />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-background border-b border-border p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" />
          </div>

          {isAuthenticated && !walletState.isConnected && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setWalletModalOpen(true)
                setMobileMenuOpen(false)
              }}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}

          {isAuthenticated && walletState.isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWalletInfoModalOpen(true)
                setMobileMenuOpen(false)
              }}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Wallet Info
            </Button>
          )}
        </div>
      )}

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <WalletInfoModal
        isOpen={walletInfoModalOpen}
        onClose={() => setWalletInfoModalOpen(false)}
      />
    </header>
  )
}
