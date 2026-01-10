import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

// Mock course data
const courses = [
  {
    id: 1,
    title: "Introduction to Blockchain",
    description: "Learn the fundamentals of blockchain technology and its applications.",
    difficulty: "Beginner",
    chain: "Multi-chain",
    duration: "4 hours",
    image: "/placeholder.svg?height=200&width=400&query=blockchain introduction course",
  },
  {
    id: 2,
    title: "Solidity for Ethereum",
    description: "Master Solidity programming language for Ethereum smart contracts.",
    difficulty: "Intermediate",
    chain: "Ethereum",
    duration: "6 hours",
    image: "/placeholder.svg?height=200&width=400&query=solidity ethereum development course",
  },
  {
    id: 3,
    title: "DeFi Protocols Explained",
    description: "Understand decentralized finance protocols and their mechanisms.",
    difficulty: "Advanced",
    chain: "Multi-chain",
    duration: "8 hours",
    image: "/placeholder.svg?height=200&width=400&query=defi protocols blockchain course",
  },
  {
    id: 4,
    title: "NFT Creation and Trading",
    description: "Learn how to create, mint, and trade non-fungible tokens.",
    difficulty: "Intermediate",
    chain: "Ethereum",
    duration: "5 hours",
    image: "/placeholder.svg?height=200&width=400&query=nft creation trading course",
  },
  {
    id: 5,
    title: "Solana Development",
    description: "Build high-performance applications on the Solana blockchain.",
    difficulty: "Advanced",
    chain: "Solana",
    duration: "10 hours",
    image: "/placeholder.svg?height=200&width=400&query=solana development course",
  },
  {
    id: 6,
    title: "Crypto Security Fundamentals",
    description: "Learn essential security practices for protecting your crypto assets.",
    difficulty: "Beginner",
    chain: "Multi-chain",
    duration: "3 hours",
    image: "/placeholder.svg?height=200&width=400&query=crypto security course",
  },
]

export default function LearnPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Education Hub</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Explore our comprehensive courses on blockchain technology, from beginner to advanced levels.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-12 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search courses..." className="pl-10" />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="polkadot">Polkadot</SelectItem>
                <SelectItem value="multi">Multi-chain</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
                <SelectItem value="nft">NFTs</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="crypto-card group">
            <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
              <Image
                src={course.image || "/placeholder.svg"}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {course.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {course.chain}
              </span>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {course.duration}
              </span>
            </div>
            <h3 className="mb-2 text-xl font-bold">{course.title}</h3>
            <p className="mb-4 text-muted-foreground">{course.description}</p>
            <Button className="w-full" asChild>
              <Link href={`/learn/${course.id}`}>Start Course</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
