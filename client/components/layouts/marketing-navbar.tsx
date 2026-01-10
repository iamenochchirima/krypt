"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import AuthButton from "@/components/auth-button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/providers/auth-context"
import { useWalletConnection, WalletModal } from "@/connect-wallet"
import WalletInfoModal from "@/components/wallet-info-modal"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
]

export function MarketingNavbar() {
  const { isAuthenticated } = useAuth()
  const { walletState } = useWalletConnection()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false)
  const pathname = usePathname()

  const handleWalletButtonClick = () => {
    if (walletState.isConnected) {
      setWalletInfoModalOpen(true)
    } else {
      setWalletModalOpen(true)
    }
  }

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return <header className="fixed top-0 z-50 w-full h-16" />
  }

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 border-b border-border",
        isScrolled ? "bg-background/80 backdrop-blur-md" : "bg-background",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="CryptoDotFun Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-xl font-bold text-white">CryptoDotFun</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AuthButton />

          {isAuthenticated && (
            <>
              {walletState.isConnected ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWalletButtonClick}
                  className="hidden md:flex"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="sr-only">Wallet Info</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleWalletButtonClick}
                  className="hidden md:flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </>
          )}

          {isAuthenticated && <NotificationDropdown />}

          <ModeToggle />

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated && (
              <div className="pt-2 space-y-2 border-t mt-2">
                {walletState.isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setWalletInfoModalOpen(true)
                      setIsOpen(false)
                    }}
                    className="w-full justify-start"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet Info
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setWalletModalOpen(true)
                      setIsOpen(false)
                    }}
                    className="w-full justify-start"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            )}
          </div>
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
