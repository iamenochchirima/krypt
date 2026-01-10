"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Image,
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
} from "lucide-react"

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
  dashboard: {
    title: "Dashboard",
    basePath: "/dashboard",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "My NFTs", href: "/dashboard/nfts", icon: Image },
      { label: "My Tokens", href: "/dashboard/tokens", icon: Coins },
      { label: "Activity", href: "/dashboard/activity", icon: TrendingUp },
    ],
  },
  nft: {
    title: "NFTs",
    basePath: "/nft",
    items: [
      {
        label: "Launchpad",
        href: "/nft/launchpad",
        icon: Rocket,
        children: [
          { label: "Browse", href: "/nft/launchpad", icon: ChevronRight },
          { label: "Create Collection", href: "/nft/launchpad/create", icon: ChevronRight },
        ],
      },
      { label: "Marketplace", href: "/nft/marketplace", icon: Store },
      {
        label: "Collections",
        href: "/nft/collections",
        icon: FolderOpen,
        children: [
          { label: "Browse All", href: "/nft/collections", icon: ChevronRight },
          { label: "My Collections", href: "/nft/collections/my", icon: ChevronRight },
        ],
      },
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
  return navigationConfig.dashboard
}

interface SidebarNavItemProps {
  item: NavItem
  pathname: string
  depth?: number
}

function SidebarNavItem({ item, pathname, depth = 0 }: SidebarNavItemProps) {
  const isActive = pathname === item.href ||
    (item.children && item.children.some(child => pathname === child.href))
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = hasChildren &&
    (pathname.startsWith(item.href) || item.children?.some(c => pathname === c.href))

  return (
    <div>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          depth > 0 && "ml-4 text-xs",
          isActive
            ? "bg-primary text-primary-foreground"
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

  if (!activeSection) return null

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 sticky top-16">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{activeSection.title}</h2>
      </div>
      <nav className="space-y-2">
        {activeSection.items.map((item) => (
          <SidebarNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  )
}
