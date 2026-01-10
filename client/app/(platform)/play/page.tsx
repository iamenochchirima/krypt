import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Trophy, Users, Zap, ArrowRight } from "lucide-react"

export default function PlayPage() {
  // Sample games data
  const featuredGames = [
    {
      id: "crypto-racer",
      title: "Crypto Racer",
      description: "Race to collect tokens and avoid obstacles in this fast-paced blockchain game.",
      image: "/crypto-racer-game.png",
      category: "Racing",
      players: "10,245",
      rewards: "Up to 50 CDFN tokens daily",
      difficulty: "Easy",
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
    },
  ]

  // Game categories
  const categories = [
    { name: "Action", icon: Zap, count: 24 },
    { name: "Strategy", icon: Trophy, count: 18 },
    { name: "Adventure", icon: Gamepad2, count: 15 },
    { name: "Puzzle", icon: Users, count: 12 },
  ]

  return (
    <div className="container mx-auto px-4 py-24">
      {/* Hero Section */}
      <div className="relative mb-16 overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <Image src="/play-hero-banner.png" alt="Play to earn games" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
        </div>
        <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
          <h1 className="mb-4 max-w-2xl text-4xl font-bold md:text-5xl lg:text-6xl">
            Play, Compete, and <span className="text-primary">Earn</span>
          </h1>
          <p className="mb-8 max-w-xl text-lg text-muted-foreground md:text-xl">
            Dive into blockchain gaming where your skills are rewarded with real crypto tokens and exclusive NFTs.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href="/play/games">
                Browse Games <Gamepad2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/play/tournaments">
                Join Tournaments <Trophy className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Games */}
      <section className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Featured Games</h2>
          <Button variant="ghost" asChild>
            <Link href="/play/games">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featuredGames.map((game) => (
            <Card key={game.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="relative aspect-video">
                <Image src={game.image || "/placeholder.svg"} alt={game.title} fill className="object-cover" />
                <Badge className="absolute right-2 top-2">{game.category}</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle>{game.title}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Players</p>
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
                  <Link href={`/play/games/${game.id}`}>Play Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-bold">Game Categories</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/play/categories/${category.name.toLowerCase()}`}
              className="group flex flex-col items-center rounded-lg border bg-card p-6 text-center transition-colors hover:bg-accent"
            >
              <category.icon className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-1 text-xl font-semibold">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.count} Games</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Tournaments */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Live Tournaments</h2>
          <Button variant="ghost" asChild>
            <Link href="/play/tournaments">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-accent p-4">
              <h3 className="mb-2 text-xl font-bold">Crypto Racer Championship</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Compete against the best racers for a prize pool of 10,000 CDFN tokens
              </p>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prize Pool</span>
                <span className="font-semibold">10,000 CDFN</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Participants</span>
                <span className="font-semibold">1,245 / 2,000</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ends in</span>
                <span className="font-semibold">2 days 14 hours</span>
              </div>
              <Button className="w-full">Join Tournament</Button>
            </div>
            <div className="rounded-lg bg-accent p-4">
              <h3 className="mb-2 text-xl font-bold">DeFi Defender League</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Build the ultimate defense strategy and win exclusive NFTs and tokens
              </p>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prize Pool</span>
                <span className="font-semibold">5,000 CDFN + NFTs</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Participants</span>
                <span className="font-semibold">876 / 1,000</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ends in</span>
                <span className="font-semibold">5 days 8 hours</span>
              </div>
              <Button className="w-full">Join Tournament</Button>
            </div>
            <div className="rounded-lg bg-accent p-4">
              <h3 className="mb-2 text-xl font-bold">Blockchain Battle Royale</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Last player standing wins the ultimate crypto prize package
              </p>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prize Pool</span>
                <span className="font-semibold">15,000 CDFN</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Participants</span>
                <span className="font-semibold">1,876 / 2,500</span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ends in</span>
                <span className="font-semibold">1 day 22 hours</span>
              </div>
              <Button className="w-full">Join Tournament</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
