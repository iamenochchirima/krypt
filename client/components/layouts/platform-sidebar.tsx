"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Image as ImageIcon,
  Rocket,
  Store,
  FolderOpen,
  Coins,
  Briefcase,
  Gamepad2,
  Trophy,
  PiggyBank,
  TrendingUp,
  Gift,
  User,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Heart,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: NavItem[]
}

interface NavSection {
  title: string
  basePath: string
  items: NavItem[]
}

const navigationConfig: Record<string, NavSection> = {
  nft: {
    title: "NFTs",
    basePath: "/nft",
    items: [
      { label: "Discover", href: "/nft/discover", icon: TrendingUp },
      { label: "Collections", href: "/nft/collections", icon: FolderOpen },
      { label: "Launchpad", href: "/nft/launchpad", icon: Rocket },
      { label: "Watchlist", href: "/nft/watchlist", icon: Heart },
      { label: "My Collections", href: "/nft/collections/my", icon: User },
    ],
  },
  tokens: {
    title: "Tokens",
    basePath: "/tokens",
    items: [
      {
        label: "Launchpad",
        href: "/tokens/launchpad",
        icon: Rocket,
        children: [
          { label: "Browse", href: "/tokens/launchpad", icon: ChevronRight },
          { label: "Create Token", href: "/tokens/launchpad/create", icon: ChevronRight },
        ],
      },
      { label: "Marketplace", href: "/tokens/marketplace", icon: Store },
      { label: "Portfolio", href: "/tokens/portfolio", icon: Briefcase },
    ],
  },
  play: {
    title: "Play",
    basePath: "/play",
    items: [
      { label: "Games", href: "/play/games", icon: Gamepad2 },
      { label: "Tournaments", href: "/play/tournaments", icon: Trophy },
      { label: "Leaderboard", href: "/play/leaderboard", icon: TrendingUp },
    ],
  },
  earn: {
    title: "Earn",
    basePath: "/earn",
    items: [
      { label: "Overview", href: "/earn", icon: TrendingUp },
      { label: "Staking", href: "/earn/staking", icon: PiggyBank },
      { label: "Rewards", href: "/earn/rewards", icon: Gift },
      { label: "Referrals", href: "/earn/referrals", icon: User },
    ],
  },
  profile: {
    title: "Profile",
    basePath: "/profile",
    items: [
      { label: "My Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/profile/settings", icon: LayoutDashboard },
    ],
  },
}

function getActiveSection(pathname: string): NavSection | null {
  for (const [key, section] of Object.entries(navigationConfig)) {
    if (pathname.startsWith(section.basePath)) {
      return section
    }
  }
  return null
}

interface SidebarNavItemProps {
  item: NavItem
  pathname: string
  depth?: number
  collapsed?: boolean
}

function SidebarNavItem({ item, pathname, depth = 0, collapsed = false }: SidebarNavItemProps) {
  const isActive = pathname === item.href ||
    (item.children && item.children.some(child => pathname === child.href))
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = hasChildren &&
    (pathname.startsWith(item.href) || item.children?.some(c => pathname === c.href))

  if (collapsed && depth === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (collapsed) return null

  return (
    <div>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          depth > 0 && "ml-4 text-xs",
          isActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <item.icon className={cn("h-4 w-4", depth > 0 && "h-3 w-3")} />
        {item.label}
      </Link>
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarNavItem
              key={child.href}
              item={child}
              pathname={pathname}
              depth={depth + 1}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlatformSidebar() {
  const pathname = usePathname()
  const activeSection = getActiveSection(pathname)
  const [collapsed, setCollapsed] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newValue = !collapsed
    setCollapsed(newValue)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newValue))
    // Dispatch custom event so navbar and layout can respond
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: newValue } }))
  }

  const handleSidebarClick = (e: React.MouseEvent) => {
    // Only expand if collapsed and clicking on the sidebar background (not on links/buttons)
    if (collapsed && e.target === e.currentTarget) {
      toggleCollapsed()
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "border-r bg-card min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300",
          collapsed ? "w-16 cursor-pointer" : "w-64"
        )}
        onClick={handleSidebarClick}
      >
        {/* Logo Section */}
        <div className={cn(
          "h-16 flex items-center",
          collapsed ? "justify-center px-2" : "px-3"
        )}>
          <Link href="/" className="flex items-center space-x-2 overflow-hidden">
            <Image
              src="/logo.png"
              alt="CryptoDotFun Logo"
              width={32}
              height={32}
              className="rounded-md flex-shrink-0"
            />
            {!collapsed && (
              <span className="text-lg font-bold text-white whitespace-nowrap">CryptoDotFun</span>
            )}
          </Link>
        </div>

        {/* Toggle button - tab on edge */}
        <button
          className="absolute top-1/2 -translate-y-1/2 -right-3 h-12 w-3 bg-card border border-l-0 border-border rounded-r-md shadow-sm z-50 flex items-center justify-center hover:bg-muted transition-colors"
          onClick={toggleCollapsed}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Navigation Section */}
        <div
          className="flex-1 p-2 overflow-y-auto"
          onClick={collapsed ? toggleCollapsed : undefined}
        >
          {activeSection ? (
            <div onClick={(e) => e.stopPropagation()}>
              {!collapsed && (
                <div className="mb-3 px-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">{activeSection.title}</h2>
                </div>
              )}
              <nav className="space-y-1">
                {activeSection.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ))}
              </nav>

              {/* Create Button - Only show in NFT section */}
              {activeSection.basePath === "/nft" && (
                <div className={cn("mt-4", collapsed ? "px-1" : "px-2")}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/nft/launchpad/create">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="w-full"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Create
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link href="/nft/launchpad/create">
                      <Button variant="secondary" className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Create
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            !collapsed && (
              <div className="text-sm text-muted-foreground px-2">
                Select a section from the Explore menu
              </div>
            )
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setCollapsed(JSON.parse(saved))
    }

    const handleToggle = (e: CustomEvent) => {
      setCollapsed(e.detail.collapsed)
    }

    window.addEventListener("sidebar-toggle", handleToggle as EventListener)
    return () => window.removeEventListener("sidebar-toggle", handleToggle as EventListener)
  }, [])

  return collapsed
}
