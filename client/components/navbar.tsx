"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Search, X, Wallet, ChevronDown, Image as ImageIcon, Coins, Gamepad2, PiggyBank, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import AuthButton from "@/components/auth-button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/providers/auth-context"
import { useWalletConnection, WalletModal } from "@/connect-wallet"
import WalletInfoModal from "@/components/wallet-info-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
]

const platformLinks = [
  {
    name: "NFTs",
    icon: ImageIcon,
    items: [
      { name: "Browse Collections", href: "/nft/collections" },
      { name: "Marketplace", href: "/nft/marketplace" },
      { name: "Launchpad", href: "/nft/launchpad" },
      { name: "Create Collection", href: "/nft/launchpad/create" },
      { name: "My Collections", href: "/nft/collections/my" },
    ],
  },
  {
    name: "Tokens",
    icon: Coins,
    items: [
      { name: "Launchpad", href: "/tokens/launchpad" },
      { name: "Marketplace", href: "/tokens/marketplace" },
    ],
  },
  {
    name: "Play",
    icon: Gamepad2,
    items: [
      { name: "Games", href: "/play/games" },
      { name: "Tournaments", href: "/play/tournaments" },
    ],
  },
  {
    name: "Earn",
    icon: PiggyBank,
    items: [
      { name: "Staking", href: "/earn/staking" },
      { name: "Rewards", href: "/earn/rewards" },
    ],
  },
]

export default function Navbar() {
  const { isAuthenticated, fetchingUser } = useAuth();
  const { walletState, disconnectWallet } = useWalletConnection();
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false)
  const pathname = usePathname()

  const handleWalletButtonClick = () => {
    if (walletState.isConnected) {
      // Open wallet info modal to show details and disconnect option
      setWalletInfoModalOpen(true);
    } else {
      // Open modal to connect
      setWalletModalOpen(true);
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

          {/* Platform Dropdown Menus */}
          {platformLinks.map((section) => (
            <DropdownMenu key={section.name}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname.startsWith(`/${section.name.toLowerCase()}`)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.name}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {section.items.map((item, index) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {/* Dashboard link for authenticated users */}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <AuthButton />

          {/* New Standalone Wallet Connection Button - Only shown after authentication */}
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
        <div className="md:hidden">
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

            {/* Platform Links for Mobile */}
            {platformLinks.map((section) => (
              <div key={section.name} className="py-2">
                <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-foreground">
                  <section.icon className="h-4 w-4" />
                  {section.name}
                </div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-6 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}

            {/* Dashboard link for mobile */}
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium",
                  pathname === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}

            <div className="pt-2 space-y-2 border-t mt-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {isAuthenticated && (
                <>
                  {walletState.isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWalletInfoModalOpen(true);
                        setIsOpen(false);
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
                        setWalletModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      {/* Wallet Info Modal */}
      <WalletInfoModal
        isOpen={walletInfoModalOpen}
        onClose={() => setWalletInfoModalOpen(false)}
      />
    </header>
  )
}
