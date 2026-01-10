import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Clock, ArrowRight, BookOpen } from "lucide-react"

export default function BlogPage() {
  // Sample blog posts data
  const featuredPosts = [
    {
      id: "blockchain-gaming-future",
      title: "The Future of Blockchain Gaming in 2025",
      excerpt:
        "Explore how blockchain technology is revolutionizing the gaming industry with play-to-earn models, true ownership, and interoperability.",
      image: "/blockchain-gaming-future.png",
      category: "Gaming",
      author: "Alex Johnson",
      authorAvatar: "/authors/alex-johnson.png",
      date: "May 10, 2025",
      readTime: "8 min read",
      featured: true,
    },
    {
      id: "defi-beginners-guide",
      title: "DeFi for Beginners: Getting Started with Decentralized Finance",
      excerpt:
        "A comprehensive guide to understanding DeFi protocols, yield farming, liquidity pools, and how to participate safely.",
      image: "/defi-beginners-guide.png",
      category: "DeFi",
      author: "Sarah Chen",
      authorAvatar: "/authors/sarah-chen.png",
      date: "May 8, 2025",
      readTime: "12 min read",
      featured: true,
    },
    {
      id: "nft-art-revolution",
      title: "How NFTs Are Transforming Digital Art and Collectibles",
      excerpt:
        "Discover how non-fungible tokens are creating new opportunities for artists and collectors in the digital realm.",
      image: "/nft-art-revolution.png",
      category: "NFTs",
      author: "Michael Rivera",
      authorAvatar: "/authors/michael-rivera.png",
      date: "May 5, 2025",
      readTime: "10 min read",
      featured: true,
    },
  ]

  const recentPosts = [
    {
      id: "crypto-security-tips",
      title: "10 Essential Security Tips for Crypto Holders",
      excerpt: "Protect your digital assets with these crucial security practices every crypto holder should know.",
      image: "/crypto-security-tips.png",
      category: "Security",
      author: "Emma Wilson",
      authorAvatar: "/authors/emma-wilson.png",
      date: "May 12, 2025",
      readTime: "6 min read",
    },
    {
      id: "layer2-solutions-explained",
      title: "Layer 2 Solutions Explained: Scaling Blockchain for Mass Adoption",
      excerpt:
        "Understanding the various Layer 2 scaling solutions and how they're addressing blockchain's scalability challenges.",
      image: "/layer2-solutions-explained.png",
      category: "Technology",
      author: "David Kim",
      authorAvatar: "/authors/david-kim.png",
      date: "May 11, 2025",
      readTime: "9 min read",
    },
    {
      id: "dao-governance-models",
      title: "Exploring Different DAO Governance Models",
      excerpt:
        "A deep dive into various governance structures for Decentralized Autonomous Organizations and their effectiveness.",
      image: "/dao-governance-models.png",
      category: "DAOs",
      author: "Sophia Martinez",
      authorAvatar: "/authors/sophia-martinez.png",
      date: "May 9, 2025",
      readTime: "11 min read",
    },
    {
      id: "crypto-tax-guide-2025",
      title: "Crypto Tax Guide for 2025: What You Need to Know",
      excerpt:
        "Navigate the complex world of cryptocurrency taxation with this comprehensive guide for the 2025 tax year.",
      image: "/crypto-tax-guide-2025.png",
      category: "Finance",
      author: "James Wilson",
      authorAvatar: "/authors/james-wilson.png",
      date: "May 7, 2025",
      readTime: "14 min read",
    },
    {
      id: "metaverse-development",
      title: "The Evolution of the Metaverse: Building Digital Worlds",
      excerpt:
        "Tracking the development of metaverse technologies and how they're creating immersive digital experiences.",
      image: "/metaverse-development.png",
      category: "Metaverse",
      author: "Olivia Chen",
      authorAvatar: "/authors/olivia-chen.png",
      date: "May 6, 2025",
      readTime: "8 min read",
    },
    {
      id: "defi-yield-strategies",
      title: "Advanced DeFi Yield Strategies for 2025",
      excerpt: "Explore sophisticated yield farming strategies to maximize returns in the evolving DeFi landscape.",
      image: "/defi-yield-strategies.png",
      category: "DeFi",
      author: "Ryan Thompson",
      authorAvatar: "/authors/ryan-thompson.png",
      date: "May 4, 2025",
      readTime: "13 min read",
    },
  ]

  const categories = [
    "All",
    "Blockchain",
    "DeFi",
    "NFTs",
    "Gaming",
    "Security",
    "Technology",
    "Tutorials",
    "Market Analysis",
    "DAOs",
    "Metaverse",
  ]

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">CryptoDotFun Blog</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Insights, tutorials, and news from the world of blockchain, crypto, and web3.
        </p>
      </div>

      {/* Search */}
      <div className="mb-12 flex justify-center">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search articles..." className="pl-10" />
        </div>
      </div>

      {/* Featured Posts */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Featured Articles</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="relative aspect-video">
                <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                <Badge className="absolute right-2 top-2">{post.category}</Badge>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <div className="relative h-6 w-6 overflow-hidden rounded-full">
                    <Image
                      src={post.authorAvatar || "/placeholder.svg"}
                      alt={post.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{post.author}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-muted-foreground">{post.excerpt}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
                <div className="text-sm text-muted-foreground">{post.date}</div>
              </CardFooter>
              <CardFooter className="pt-0">
                <Button className="w-full" asChild>
                  <Link href={`/blog/${post.id}`}>Read Article</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories and Recent Posts */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Recent Articles</h2>
          <Button variant="ghost" asChild>
            <Link href="/blog/archive">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button key={category} variant={category === "All" ? "default" : "outline"} size="sm">
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="relative aspect-video">
                <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                <Badge className="absolute right-2 top-2">{post.category}</Badge>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <div className="relative h-6 w-6 overflow-hidden rounded-full">
                    <Image
                      src={post.authorAvatar || "/placeholder.svg"}
                      alt={post.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{post.author}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-muted-foreground">{post.excerpt}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
                <div className="text-sm text-muted-foreground">{post.date}</div>
              </CardFooter>
              <CardFooter className="pt-0">
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/blog/${post.id}`}>Read Article</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-16 rounded-xl border bg-card p-8">
        <div className="mx-auto max-w-2xl text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-4 text-2xl font-bold">Subscribe to Our Newsletter</h2>
          <p className="mb-6 text-muted-foreground">
            Get the latest articles, tutorials, and updates from CryptoDotFun delivered straight to your inbox.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input placeholder="Enter your email" type="email" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
