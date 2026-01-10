import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageSquare, Edit, Heart, Share2 } from "lucide-react"

// Mock blog data
const blogs = [
  {
    id: 1,
    title: "Understanding Layer 2 Solutions for Ethereum",
    excerpt: "An in-depth look at various Layer 2 scaling solutions for Ethereum and how they work.",
    author: "CryptoExplorer",
    authorAddress: "0x1234...5678",
    date: "3 days ago",
    tags: ["Ethereum", "Layer 2", "Scaling"],
    likes: 42,
    comments: 15,
    image: "/placeholder.svg?height=200&width=400&query=ethereum layer 2 scaling",
  },
  {
    id: 2,
    title: "The Future of DeFi: Trends to Watch in 2023",
    excerpt: "Exploring emerging trends in decentralized finance and what to expect in the coming year.",
    author: "DeFiGuru",
    authorAddress: "0xabcd...efgh",
    date: "1 week ago",
    tags: ["DeFi", "Trends", "Finance"],
    likes: 78,
    comments: 23,
    image: "/placeholder.svg?height=200&width=400&query=defi trends future",
  },
  {
    id: 3,
    title: "NFTs Beyond Art: Practical Applications",
    excerpt: "Exploring the utility of NFTs beyond digital art, including identity, credentials, and more.",
    author: "TokenMaster",
    authorAddress: "0x9876...5432",
    date: "2 weeks ago",
    tags: ["NFT", "Utility", "Blockchain"],
    likes: 56,
    comments: 19,
    image: "/placeholder.svg?height=200&width=400&query=nft utility applications",
  },
  {
    id: 4,
    title: "Solana Development: A Beginner's Guide",
    excerpt: "A step-by-step guide to getting started with development on the Solana blockchain.",
    author: "SolDeveloper",
    authorAddress: "0xijkl...mnop",
    date: "3 weeks ago",
    tags: ["Solana", "Development", "Tutorial"],
    likes: 34,
    comments: 12,
    image: "/placeholder.svg?height=200&width=400&query=solana development guide",
  },
  {
    id: 5,
    title: "Security Best Practices for Smart Contracts",
    excerpt: "Essential security considerations and best practices when developing smart contracts.",
    author: "SecurityFirst",
    authorAddress: "0x2468...1357",
    date: "1 month ago",
    tags: ["Security", "Smart Contracts", "Development"],
    likes: 91,
    comments: 27,
    image: "/placeholder.svg?height=200&width=400&query=smart contract security",
  },
  {
    id: 6,
    title: "The Role of DAOs in Web3 Governance",
    excerpt: "Examining how Decentralized Autonomous Organizations are shaping governance in Web3.",
    author: "Web3Visionary",
    authorAddress: "0xqrst...uvwx",
    date: "1 month ago",
    tags: ["DAO", "Governance", "Web3"],
    likes: 63,
    comments: 18,
    image: "/placeholder.svg?height=200&width=400&query=dao web3 governance",
  },
]

// Mock forum data
const forumThreads = [
  {
    id: 1,
    title: "What's the best approach to learn Solidity in 2023?",
    category: "Ethereum Development",
    author: "NewDeveloper",
    authorAddress: "0x1234...5678",
    date: "2 days ago",
    replies: 12,
    views: 156,
  },
  {
    id: 2,
    title: "Discussing the recent Ethereum upgrade and its implications",
    category: "Ethereum",
    author: "ETHEnthusiast",
    authorAddress: "0xabcd...efgh",
    date: "4 days ago",
    replies: 28,
    views: 342,
  },
  {
    id: 3,
    title: "Security concerns with cross-chain bridges",
    category: "Security",
    author: "BridgeWatcher",
    authorAddress: "0x9876...5432",
    date: "1 week ago",
    replies: 19,
    views: 231,
  },
  {
    id: 4,
    title: "Solana vs. Avalanche: Performance comparison",
    category: "Layer 1 Blockchains",
    author: "ChainComparer",
    authorAddress: "0xijkl...mnop",
    date: "1 week ago",
    replies: 35,
    views: 412,
  },
  {
    id: 5,
    title: "Best practices for NFT metadata storage",
    category: "NFTs",
    author: "MetadataMaster",
    authorAddress: "0x2468...1357",
    date: "2 weeks ago",
    replies: 14,
    views: 189,
  },
  {
    id: 6,
    title: "How to optimize gas fees for complex smart contracts?",
    category: "Ethereum Development",
    author: "GasOptimizer",
    authorAddress: "0xqrst...uvwx",
    date: "2 weeks ago",
    replies: 22,
    views: 276,
  },
  {
    id: 7,
    title: "DeFi yield farming strategies for bear markets",
    category: "DeFi",
    author: "YieldHunter",
    authorAddress: "0xyzab...cdef",
    date: "3 weeks ago",
    replies: 31,
    views: 405,
  },
  {
    id: 8,
    title: "Implementing zero-knowledge proofs in dApps",
    category: "Privacy",
    author: "ZKExpert",
    authorAddress: "0xghij...klmn",
    date: "3 weeks ago",
    replies: 16,
    views: 198,
  },
]

export default function ConnectPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Community Hub</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Connect with the blockchain community, share knowledge, and collaborate with fellow enthusiasts.
        </p>
      </div>

      <Tabs defaultValue="blog" className="mb-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <TabsList>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10" />
            </div>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Write
            </Button>
          </div>
        </div>

        {/* Blog Tab */}
        <TabsContent value="blog" className="mt-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <div key={blog.id} className="crypto-card group">
                <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
                  <Image
                    src={blog.image || "/placeholder.svg"}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mb-2 text-xl font-bold">{blog.title}</h3>
                <p className="mb-4 text-muted-foreground">{blog.excerpt}</p>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">{blog.author.substring(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{blog.author}</div>
                      <div className="text-xs text-muted-foreground">{blog.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="h-3 w-3" />
                      <span>{blog.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{blog.comments}</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link href={`/connect/blog/${blog.id}`}>Read More</Link>
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Forum Tab */}
        <TabsContent value="forum" className="mt-6">
          <div className="rounded-lg border">
            <div className="grid grid-cols-1 divide-y">
              {forumThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <Link
                      href={`/connect/forum/${thread.id}`}
                      className="text-lg font-medium hover:text-primary hover:underline"
                    >
                      {thread.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {thread.category}
                      </span>
                      <span className="text-muted-foreground">Started by {thread.author}</span>
                      <span className="text-muted-foreground">{thread.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-medium">{thread.replies}</span>
                      <span className="text-xs text-muted-foreground">Replies</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-medium">{thread.views}</span>
                      <span className="text-xs text-muted-foreground">Views</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/connect/forum/${thread.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" /> Start a New Thread
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Social Features */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Featured Community Members</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "CryptoExplorer",
              address: "0x1234...5678",
              bio: "Blockchain researcher and educator. Passionate about Layer 2 solutions.",
              followers: 1245,
              contributions: 32,
              image: "/placeholder.svg?height=100&width=100&query=blockchain researcher profile",
            },
            {
              name: "DeFiGuru",
              address: "0xabcd...efgh",
              bio: "DeFi expert and yield farming strategist. Building the future of finance.",
              followers: 892,
              contributions: 28,
              image: "/placeholder.svg?height=100&width=100&query=defi expert profile",
            },
            {
              name: "SecurityFirst",
              address: "0x2468...1357",
              bio: "Smart contract auditor and security researcher. Keeping blockchain safe.",
              followers: 1567,
              contributions: 45,
              image: "/placeholder.svg?height=100&width=100&query=security researcher profile",
            },
            {
              name: "Web3Visionary",
              address: "0xqrst...uvwx",
              bio: "DAO governance specialist and Web3 advocate. Building decentralized communities.",
              followers: 723,
              contributions: 19,
              image: "/placeholder.svg?height=100&width=100&query=web3 specialist profile",
            },
          ].map((member, index) => (
            <div key={index} className="crypto-card">
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full">
                  <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold">{member.name}</h3>
                  <p className="text-xs text-muted-foreground">{member.address}</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{member.bio}</p>
              <div className="mb-4 flex justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold">{member.followers}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{member.contributions}</div>
                  <div className="text-xs text-muted-foreground">Contributions</div>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* X Integration */}
      <div className="rounded-lg border bg-card p-8">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Share Your Achievements</h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Completed a course? Found a vulnerability? Share your achievements with the world and inspire others to join
            the blockchain revolution.
          </p>
          <Button>
            <Share2 className="mr-2 h-4 w-4" /> Share to X
          </Button>
        </div>
      </div>
    </div>
  )
}
