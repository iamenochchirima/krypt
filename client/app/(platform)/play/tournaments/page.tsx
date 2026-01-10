import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Calendar } from "lucide-react"

export default function TournamentsPage() {
  // Sample tournaments data
  const tournaments = [
    {
      id: "crypto-racer-championship",
      title: "Crypto Racer Championship",
      game: "Crypto Racer",
      image: "/crypto-racer-game.png",
      prizePool: "10,000 CDFN",
      participants: "1,245 / 2,000",
      endsIn: "2 days 14 hours",
      status: "active",
      startDate: "May 10, 2025",
      endDate: "May 15, 2025",
      description:
        "Compete against the best racers for a prize pool of 10,000 CDFN tokens. Top 50 players will receive rewards.",
    },
    {
      id: "defi-defender-league",
      title: "DeFi Defender League",
      game: "DeFi Defender",
      image: "/defi-defender-game.png",
      prizePool: "5,000 CDFN + NFTs",
      participants: "876 / 1,000",
      endsIn: "5 days 8 hours",
      status: "active",
      startDate: "May 8, 2025",
      endDate: "May 18, 2025",
      description:
        "Build the ultimate defense strategy and win exclusive NFTs and tokens. Weekly challenges with bonus rewards.",
    },
    {
      id: "blockchain-battle-royale",
      title: "Blockchain Battle Royale",
      game: "Blockchain Battles",
      image: "/blockchain-battles-game.png",
      prizePool: "15,000 CDFN",
      participants: "1,876 / 2,500",
      endsIn: "1 day 22 hours",
      status: "active",
      startDate: "May 12, 2025",
      endDate: "May 14, 2025",
      description:
        "Last player standing wins the ultimate crypto prize package. Daily elimination rounds with increasing rewards.",
    },
    {
      id: "nft-hunter-expedition",
      title: "NFT Hunter Expedition",
      game: "NFT Hunter",
      image: "/nft-hunter-game.png",
      prizePool: "3,000 CDFN + Legendary NFTs",
      participants: "1,120 / 1,500",
      endsIn: "3 days 10 hours",
      status: "active",
      startDate: "May 11, 2025",
      endDate: "May 16, 2025",
      description:
        "Explore virtual worlds to discover and collect rare NFTs with real value. Special expedition with unique rewards.",
    },
    {
      id: "crypto-masters-invitational",
      title: "Crypto Masters Invitational",
      game: "Multiple Games",
      image: "/crypto-masters-tournament.png",
      prizePool: "25,000 CDFN",
      participants: "500 / 500",
      status: "upcoming",
      startDate: "May 20, 2025",
      endDate: "May 30, 2025",
      description:
        "Invitation-only tournament featuring the top players across all games. The ultimate test of skill and strategy.",
    },
    {
      id: "defi-summer-games",
      title: "DeFi Summer Games",
      game: "Multiple Games",
      image: "/defi-summer-games.png",
      prizePool: "20,000 CDFN + NFTs",
      participants: "0 / 5,000",
      status: "upcoming",
      startDate: "June 1, 2025",
      endDate: "June 30, 2025",
      description:
        "Month-long celebration of blockchain gaming with daily tournaments, challenges, and massive rewards.",
    },
    {
      id: "crypto-speedrun-challenge",
      title: "Crypto Speedrun Challenge",
      game: "Crypto Racer",
      image: "/crypto-racer-game.png",
      prizePool: "8,000 CDFN",
      participants: "1,500 / 1,500",
      status: "completed",
      startDate: "April 15, 2025",
      endDate: "April 20, 2025",
      description: "Complete the track in record time to win. Time-based competition with graduated rewards.",
      winners: ["CryptoKing", "BlockchainRacer", "TokenSpeeder"],
    },
    {
      id: "nft-treasure-hunt",
      title: "NFT Treasure Hunt",
      game: "NFT Hunter",
      image: "/nft-hunter-game.png",
      prizePool: "5,000 CDFN + Exclusive NFTs",
      participants: "2,000 / 2,000",
      status: "completed",
      startDate: "April 10, 2025",
      endDate: "April 25, 2025",
      description: "Find hidden treasures across multiple virtual worlds. Collaborative and competitive elements.",
      winners: ["NFTCollector", "DigitalExplorer", "CryptoHunter"],
    },
  ]

  const activeTournaments = tournaments.filter((t) => t.status === "active")
  const upcomingTournaments = tournaments.filter((t) => t.status === "upcoming")
  const completedTournaments = tournaments.filter((t) => t.status === "completed")

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Tournaments</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Compete in blockchain gaming tournaments to win crypto tokens, exclusive NFTs, and climb the global
          leaderboards.
        </p>
      </div>

      <Tabs defaultValue="active" className="mb-12">
        <TabsList className="mb-8 grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Tournaments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-6 text-2xl font-bold">How Tournaments Work</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-accent p-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Join Tournaments</h3>
            <p className="text-muted-foreground">
              Browse active tournaments, check the requirements, and join the ones that match your skills and interests.
            </p>
          </div>
          <div className="rounded-lg bg-accent p-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Compete & Climb</h3>
            <p className="text-muted-foreground">
              Play against other participants, complete challenges, and climb the leaderboard to increase your rewards.
            </p>
          </div>
          <div className="rounded-lg bg-accent p-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Win Rewards</h3>
            <p className="text-muted-foreground">
              Top performers win crypto tokens, exclusive NFTs, and gain reputation in the CryptoDotFun community.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TournamentCard({ tournament }: { tournament: any }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-video">
        <Image src={tournament.image || "/placeholder.svg"} alt={tournament.title} fill className="object-cover" />
        <Badge
          className="absolute right-2 top-2"
          variant={
            tournament.status === "active" ? "default" : tournament.status === "upcoming" ? "secondary" : "outline"
          }
        >
          {tournament.status === "active" ? "Active" : tournament.status === "upcoming" ? "Upcoming" : "Completed"}
        </Badge>
      </div>
      <CardHeader>
        <CardTitle>{tournament.title}</CardTitle>
        <CardDescription>{tournament.game}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Prize Pool</span>
            <span className="font-semibold">{tournament.prizePool}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Participants</span>
            <span className="font-semibold">{tournament.participants}</span>
          </div>

          {tournament.endsIn && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ends in</span>
              <span className="font-semibold">{tournament.endsIn}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              <Calendar className="mr-1 inline-block h-4 w-4" />
            </span>
            <span className="font-semibold">
              {tournament.startDate} - {tournament.endDate}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{tournament.description}</p>

        {tournament.winners && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium">Winners:</p>
            <div className="flex flex-wrap gap-1">
              {tournament.winners.map((winner: string, index: number) => (
                <Badge key={index} variant="outline">
                  {winner}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={tournament.status === "completed"}>
          {tournament.status === "active"
            ? "Join Tournament"
            : tournament.status === "upcoming"
              ? "Remind Me"
              : "View Results"}
        </Button>
      </CardFooter>
    </Card>
  )
}
