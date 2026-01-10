import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Bitcoin,
  Image as ImageIcon,
  Coins,
  TrendingUp,
  Gamepad2,
  GraduationCap,
  Shield,
  Zap,
  Globe,
  ChevronRight,
} from "lucide-react"

const services = [
  {
    title: "Bitcoin Assets",
    description: "Runes, BRC-20, and Ordinals in one place",
    icon: Bitcoin,
    href: "/bitcoin/assets",
    badge: "Popular",
    badgeClass: "badge-popular",
  },
  {
    title: "NFTs",
    description: "Create, collect, and trade digital art",
    icon: ImageIcon,
    href: "/nft/collections",
  },
  {
    title: "Tokens",
    description: "Manage your multi-chain portfolio",
    icon: Coins,
    href: "/tokens/launchpad",
  },
  {
    title: "Trading",
    description: "Advanced tools for smart trading",
    icon: TrendingUp,
    href: "/tokens/marketplace",
    badge: "Pro",
    badgeClass: "badge-pro",
  },
  {
    title: "Gaming",
    description: "Play-to-earn blockchain games",
    icon: Gamepad2,
    href: "/play",
    badge: "New",
    badgeClass: "badge-new",
  },
  {
    title: "Learning",
    description: "Master crypto with expert guides",
    icon: GraduationCap,
    href: "/learn",
  },
]

const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Multi-signature wallets and cold storage protect your assets 24/7",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Execute trades in milliseconds with our optimized infrastructure",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Available in 190+ countries with localized support",
  },
]

const stats = [
  { value: "$2.4B+", label: "Trading Volume" },
  { value: "150K+", label: "Active Users" },
  { value: "50+", label: "Chains Supported" },
  { value: "99.9%", label: "Uptime" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient pt-16">
        <div className="container mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 mb-8">
            <span className="h-2 w-2 rounded-full bg-crypto-green animate-pulse" />
            <span className="text-sm text-muted-foreground">Now supporting 50+ blockchain networks</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            Your Gateway to
            <br />
            <span className="crypto-gradient-text">Everything Crypto</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Trade, collect, learn, and play — all in one powerful platform.
            <br />
            Experience the future of crypto with CryptoDotFun.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/explore">
              <Button size="lg" className="btn-primary gap-2">
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#services">
              <Button size="lg" variant="outline" className="btn-secondary">
                Explore Features
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-primary/20 border-2 border-background"
                />
              ))}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-primary">Join 150,000+ users</p>
              <p className="text-xs text-muted-foreground">Trusted by traders worldwide</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#services" className="block">
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-2.5 bg-muted-foreground/50 rounded-full animate-scroll" />
            </div>
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="section-label mb-4">OUR SERVICES</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete ecosystem for all your crypto needs, from trading to gaming
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link key={service.title} href={service.href}>
                <div className="crypto-card group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="icon-container">
                      <service.icon className="h-6 w-6" />
                    </div>
                    {service.badge && (
                      <span className={service.badgeClass}>{service.badge}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Learn more
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/explore">
              <Button size="lg" className="btn-primary gap-2">
                Explore More
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <p className="section-label mb-4">WHY CRYPTODOTFUN</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Built for the
                <br />
                <span className="crypto-gradient-text">Next Generation</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg">
                We&apos;ve reimagined what a crypto platform should be. Secure, fast,
                and accessible to everyone — from beginners to institutional traders.
              </p>

              <div className="space-y-6">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="icon-container shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Portfolio Card */}
            <div className="portfolio-card glow-orange">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-muted-foreground">Portfolio Value</span>
                <span className="text-sm font-medium text-crypto-green">+12.4%</span>
              </div>
              <p className="text-4xl md:text-5xl font-bold crypto-gradient-text mb-8">
                $127,450.32
              </p>

              <div className="space-y-4">
                {[
                  { symbol: "BTC", name: "Bitcoin", value: "$67,234", change: "+2.3%" },
                  { symbol: "ETH", name: "Ethereum", value: "$32,156", change: "+4.1%" },
                  { symbol: "ORD", name: "Ordinals", value: "$28,060", change: "+8.7%" },
                ].map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between py-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{asset.value}</p>
                      <p className="text-xs text-crypto-green">{asset.change}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Commented out for now
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="stats-value">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="crypto-card text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your
              <br />
              <span className="crypto-gradient-text">Crypto Journey?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of traders who trust CryptoDotFun for their digital
              asset needs. Get started in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="btn-primary">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="btn-secondary">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
