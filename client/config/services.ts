import {
  ImageIcon,
  Bitcoin,
  BarChart3,
  Coins,
  BookOpen,
  Shield,
  Gamepad2,
  TrendingUp,
  Globe,
  Rocket,
  FolderPlus,
  Store,
  Trophy,
  Gift,
  Users,
  LucideIcon,
  Flame,
  Sparkles,
  FileCode,
} from "lucide-react"

export interface ServiceItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface Service {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
  link: string
  items?: ServiceItem[]
}

export const services: Service[] = [
  {
    id: "nfts",
    title: "NFTs",
    description: "Discover, buy, sell, and launch NFT collections across multiple chains.",
    icon: ImageIcon,
    color: "text-crypto-purple",
    bgColor: "bg-crypto-purple/10",
    link: "/nft/discover",
    items: [
      { name: "Discover", href: "/nft/discover", icon: TrendingUp },
      { name: "Collections", href: "/nft/collections", icon: Globe },
      { name: "Launchpad", href: "/nft/launchpad", icon: Rocket },
      { name: "My Collections", href: "/nft/collections/my", icon: FolderPlus },
    ],
  },
  {
    id: "btc-assets",
    title: "BTC Assets",
    description: "Fast Bitcoin Runes trading with 2-second finality on ICP.",
    icon: Bitcoin,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    link: "/btc-assets",
    items: [
      { name: "Discover", href: "/btc-assets", icon: TrendingUp },
      { name: "Runes", href: "/btc-assets/runes", icon: Flame },
      { name: "Ordinals", href: "/btc-assets/ordinals", icon: Sparkles },
      { name: "BRC-20", href: "/btc-assets/brc20", icon: FileCode },
    ],
  },
  {
    id: "tokens",
    title: "Tokens",
    description: "Token launchpad, DEX aggregation, and trading tools.",
    icon: BarChart3,
    color: "text-crypto-yellow",
    bgColor: "bg-crypto-yellow/10",
    link: "/tokens/launchpad",
    items: [
      { name: "Launchpad", href: "/tokens/launchpad", icon: Rocket },
      { name: "Marketplace", href: "/tokens/marketplace", icon: Store },
    ],
  },
  {
    id: "earn",
    title: "Earn",
    description: "Staking, yield farming, and lending/borrowing across chains.",
    icon: Coins,
    color: "text-crypto-yellow",
    bgColor: "bg-crypto-yellow/10",
    link: "/earn",
    items: [
      { name: "Staking", href: "/earn/staking", icon: TrendingUp },
      { name: "Rewards", href: "/earn/rewards", icon: Gift },
    ],
  },
  {
    id: "learn",
    title: "Learn",
    description: "Blockchain courses from beginner to advanced.",
    icon: BookOpen,
    color: "text-crypto-blue",
    bgColor: "bg-crypto-blue/10",
    link: "/learn",
    items: [
      { name: "Courses", href: "/learn", icon: BookOpen },
    ],
  },
  {
    id: "secure",
    title: "Secure",
    description: "Security audits, bounties, and smart contract tools.",
    icon: Shield,
    color: "text-crypto-green",
    bgColor: "bg-crypto-green/10",
    link: "/secure",
    items: [
      { name: "Audits", href: "/secure", icon: Shield },
    ],
  },
  {
    id: "play",
    title: "Play",
    description: "Blockchain games with real crypto rewards and NFTs.",
    icon: Gamepad2,
    color: "text-crypto-purple",
    bgColor: "bg-crypto-purple/10",
    link: "/play",
    items: [
      { name: "Games", href: "/play/games", icon: Gamepad2 },
      { name: "Tournaments", href: "/play/tournaments", icon: Trophy },
    ],
  },
]

// Additional items for the modal that aren't main services
export const accountItems: ServiceItem[] = [
  { name: "Profile", href: "/profile", icon: Users },
]
