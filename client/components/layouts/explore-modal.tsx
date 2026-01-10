"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Image as ImageIcon,
  Coins,
  Gamepad2,
  PiggyBank,
  BookOpen,
  Shield,
  LayoutGrid,
  Store,
  Rocket,
  FolderPlus,
  Trophy,
  Gift,
  TrendingUp,
  Users,
  Newspaper,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const exploreCategories = [
  {
    name: "NFTs",
    icon: ImageIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    items: [
      { name: "Browse Collections", href: "/nft/collections", icon: Globe },
      { name: "Marketplace", href: "/nft/marketplace", icon: Store },
      { name: "Launchpad", href: "/nft/launchpad", icon: Rocket },
      { name: "Create Collection", href: "/nft/launchpad/create", icon: FolderPlus },
    ],
  },
  {
    name: "Tokens",
    icon: Coins,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    items: [
      { name: "Token Launchpad", href: "/tokens/launchpad", icon: Rocket },
      { name: "Token Marketplace", href: "/tokens/marketplace", icon: Store },
    ],
  },
  {
    name: "Play",
    icon: Gamepad2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    items: [
      { name: "Games", href: "/play/games", icon: Gamepad2 },
      { name: "Tournaments", href: "/play/tournaments", icon: Trophy },
    ],
  },
  {
    name: "Earn",
    icon: PiggyBank,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    items: [
      { name: "Staking", href: "/earn/staking", icon: TrendingUp },
      { name: "Rewards", href: "/earn/rewards", icon: Gift },
    ],
  },
  {
    name: "Learn",
    icon: BookOpen,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    items: [
      { name: "Courses", href: "/learn", icon: BookOpen },
    ],
  },
  {
    name: "Secure",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    items: [
      { name: "Security Audits", href: "/secure", icon: Shield },
    ],
  },
  {
    name: "Community",
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    items: [
      { name: "Blog", href: "/blog", icon: Newspaper },
      { name: "Pulse", href: "/pulse", icon: TrendingUp },
    ],
  },
  {
    name: "Account",
    icon: Users,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    items: [
      { name: "Profile", href: "/profile", icon: Users },
    ],
  },
]

interface ExploreModalProps {
  children?: React.ReactNode
}

export function ExploreModal({ children }: ExploreModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative">
            <LayoutGrid className="h-5 w-5" />
            <span className="sr-only">Explore</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Explore CryptoDotFun
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
          {exploreCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className={`p-1.5 rounded-lg ${category.bgColor}`}>
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                </div>
                <h3 className="font-semibold text-sm">{category.name}</h3>
              </div>

              {/* Category Items */}
              <div className="space-y-1">
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </DialogContent>
    </Dialog>
  )
}
