import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Coins, Shield, Users, ImageIcon, BarChart3, Zap, Gamepad2, Bitcoin } from "lucide-react"

const features = [
  {
    title: "NFTs Platform",
    description:
      "Complete multi-chain NFT ecosystem - discover, buy, sell, and launch your own NFT collections across Solana, Movement, Casper and more.",
    icon: ImageIcon,
    color: "text-crypto-purple",
    bgColor: "bg-crypto-purple/10",
    image: "/nft-marketplace-digital-art.png",
    link: "/nft/collections",
    highlights: [
      "Multi-chain NFT marketplace",
      "No-code NFT collection creation",
      "Low marketplace fees & creator royalties",
      "Cross-chain NFT bridging & trading",
    ],
  },
  {
    title: "Token Trading Hub",
    description: "Complete token trading ecosystem with launchpad, DEX aggregation, trading bots, and multi-chain support.",
    icon: BarChart3,
    color: "text-crypto-yellow",
    bgColor: "bg-crypto-yellow/10",
    image: "/token-launchpad-charts.png",
    link: "/tokens/launchpad",
    highlights: [
      "Multi-chain token launchpad",
      "DEX aggregation & best price routing",
      "Automated trading bots & strategies",
      "Portfolio tracking & analytics",
    ],
  },
  {
    title: "Play",
    description:
      "Dive into blockchain gaming where your skills are rewarded with real crypto tokens and exclusive NFTs.",
    icon: Gamepad2,
    color: "text-crypto-purple",
    bgColor: "bg-crypto-purple/10",
    image: "/play-hero-banner.png",
    link: "/play",
    highlights: [
      "Play-to-earn blockchain games",
      "Competitive tournaments",
      "Daily rewards and challenges",
      "Exclusive gaming NFTs",
    ],
  },
  {
    title: "Earn",
    description: "Get rewarded with tokens for completing courses, contributing to the community, and more.",
    icon: Coins,
    color: "text-crypto-yellow",
    bgColor: "bg-crypto-yellow/10",
    image: "/crypto-rewards-platform.png",
    link: "/earn",
    highlights: [
      "Learn-to-earn rewards",
      "Staking opportunities",
      "Community contribution rewards",
      "Referral program",
    ],
  },
  {
    title: "Learn",
    description: "Master blockchain technology with comprehensive courses from beginner to advanced levels.",
    icon: BookOpen,
    color: "text-crypto-blue",
    bgColor: "bg-crypto-blue/10",
    image: "/blockchain-education-platform.png",
    link: "/learn",
    highlights: [
      "50+ courses on blockchain technology",
      "Interactive coding exercises",
      "Learn from industry experts",
      "Earn certificates and credentials",
    ],
  },
  {
    title: "Secure",
    description: "Participate in security audits and bounties to help make blockchain projects safer.",
    icon: Shield,
    color: "text-crypto-green",
    bgColor: "bg-crypto-green/10",
    image: "/blockchain-security-audit-platform.png",
    link: "/secure",
    highlights: [
      "High-value security bounties",
      "Smart contract auditing tools",
      "Reputation system for auditors",
      "Security training and certification",
    ],
  },
  {
    title: "Bitcoin Assets",
    description: "Etching, trading, and collecting Bitcoin Runes, Ordinals, and inscriptions on the Bitcoin network.",
    icon: Bitcoin,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    image: "/bitcoin-assets.png",
    link: "/bitcoin/assets",
    highlights: [
      "Bitcoin Ordinals marketplace",
      "Runes etching and trading platform",
      "Inscription creation tools",
      "Rare sats and asset discovery",
    ],
  },
  {
    title: "Connect",
    description: "Join a vibrant community of blockchain enthusiasts, share knowledge, and collaborate.",
    icon: Users,
    color: "text-crypto-pink",
    bgColor: "bg-crypto-pink/10",
    image: "/crypto-forum-blog.png",
    link: "/blog",
    highlights: [
      "Active discussion forums",
      "Community-written blogs",
      "Virtual and in-person events",
      "Networking opportunities",
    ],
  },
  {
    title: "Events & Webinars",
    description: "Attend virtual and in-person events with industry experts to stay updated on the latest trends.",
    icon: Zap,
    color: "text-crypto-green",
    bgColor: "bg-crypto-green/10",
    image: "/crypto-webinar-platform.png",
    link: "/events",
    highlights: ["Live webinars with experts", "Recorded sessions library", "Q&A opportunities", "Networking events"],
  },
]

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 md:text-5xl">Explore Apps</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Discover all the powerful apps available in our comprehensive crypto ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Link key={index} href={feature.link} className="block">
            <div className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg cursor-pointer">
              <div className="relative h-60 w-full overflow-hidden">
                <Image
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className={`inline-flex items-center rounded-full ${feature.bgColor} px-3 py-1`}>
                    <feature.icon className={`mr-1 h-4 w-4 ${feature.color}`} />
                    <span className={`text-sm font-medium ${feature.color}`}>{feature.title}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="mb-2 text-2xl font-bold">{feature.title}</h2>
                <p className="mb-4 text-muted-foreground">{feature.description}</p>
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-medium">Highlights:</h3>
                  <ul className="space-y-1">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start">
                        <div className={`mr-2 mt-1 h-3 w-3 rounded-full ${feature.bgColor}`} />
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full" asChild>
                  <span>
                    Explore {feature.title} <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
