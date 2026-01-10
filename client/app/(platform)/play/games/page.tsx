import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gamepad2, Search, Users, Star } from "lucide-react"

export default function GamesPage() {
  // Sample games data
  const games = [
    {
      id: "crypto-racer",
      title: "Crypto Racer",
      description: "Race to collect tokens and avoid obstacles in this fast-paced blockchain game.",
      image: "/crypto-racer-game.png",
      category: "Racing",
      players: "10,245",
      rewards: "Up to 50 CDFN tokens daily",
      difficulty: "Easy",
      rating: 4.8,
    },
    {
      id: "defi-defender",
      title: "DeFi Defender",
      description: "Protect your assets from hackers in this strategic tower defense game.",
      image: "/defi-defender-game.png",
      category: "Strategy",
      players: "8,732",
      rewards: "Up to 75 CDFN tokens daily",
      difficulty: "Medium",
      rating: 4.6,
    },
    {
      id: "nft-hunter",
      title: "NFT Hunter",
      description: "Explore virtual worlds to discover and collect rare NFTs with real value.",
      image: "/nft-hunter-game.png",
      category: "Adventure",
      players: "15,621",
      rewards: "Exclusive NFTs + tokens",
      difficulty: "Medium",
      rating: 4.7,
    },
    {
      id: "blockchain-battles",
      title: "Blockchain Battles",
      description: "Build your crypto army and battle other players in this turn-based strategy game.",
      image: "/blockchain-battles-game.png",
      category: "Strategy",
      players: "12,389",
      rewards: "Tournament prizes + daily tokens",
      difficulty: "Hard",
      rating: 4.5,
    },
    {
      id: "token-tycoon",
      title: "Token Tycoon",
      description: "Build and manage your own crypto empire in this economic simulation game.",
      image: "/token-tycoon-game.png",
      category: "Simulation",
      players: "7,654",
      rewards: "Daily yield based on performance",
      difficulty: "Medium",
      rating: 4.4,
    },
    {
      id: "crypto-puzzler",
      title: "Crypto Puzzler",
      description: "Solve blockchain-themed puzzles to earn tokens and unlock new challenges.",
      image: "/crypto-puzzler-game.png",
      category: "Puzzle",
      players: "9,876",
      rewards: "10-30 CDFN tokens per puzzle",
      difficulty: "Easy to Hard",
      rating: 4.3,
    },
    {
      id: "nft-artisan",
      title: "NFT Artisan",
      description: "Create, customize, and sell your own NFTs in this creative game.",
      image: "/nft-artisan-game.png",
      category: "Creative",
      players: "6,543",
      rewards: "Sell your creations for real crypto",
      difficulty: "Easy",
      rating: 4.6,
    },
    {
      id: "defi-dash",
      title: "DeFi Dash",
      description: "Race against time to collect yield and avoid liquidation in this fast-paced game.",
      image: "/defi-dash-game.png",
      category: "Action",
      players: "11,234",
      rewards: "Up to 60 CDFN tokens daily",
      difficulty: "Medium",
      rating: 4.5,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Games Library</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Discover blockchain games where you can play, compete, and earn real crypto rewards.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search games..." className="pl-9" />
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="action">Action</SelectItem>
              <SelectItem value="adventure">Adventure</SelectItem>
              <SelectItem value="puzzle">Puzzle</SelectItem>
              <SelectItem value="racing">Racing</SelectItem>
              <SelectItem value="simulation">Simulation</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="popular">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="highest-rewards">Highest Rewards</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden transition-all hover:shadow-lg">
            <div className="relative aspect-video">
              <Image src={game.image || "/placeholder.svg"} alt={game.title} fill className="object-cover" />
              <Badge className="absolute right-2 top-2">{game.category}</Badge>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{game.title}</CardTitle>
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">{game.rating}</span>
                </div>
              </div>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{game.players}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Difficulty</p>
                  <p className="font-medium">{game.difficulty}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Rewards</p>
                  <p className="font-medium">{game.rewards}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/play/games/${game.id}`}>
                  <Gamepad2 className="mr-2 h-4 w-4" /> Play Now
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
