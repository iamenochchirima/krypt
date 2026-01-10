import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Calendar, Gamepad2, BookOpen, Trophy, Bell, ArrowRight } from "lucide-react"

export default function PulsePage() {
  // Sample news and activities data
  const newsItems = [
    {
      id: "new-game-launch",
      title: "New Game Launch: Crypto Defenders",
      description:
        "Exciting new tower defense game where you can earn tokens by protecting blockchain networks from attacks.",
      image: "/news/crypto-defenders-launch.png",
      category: "Game Launch",
      date: "2 hours ago",
      link: "/play/games/crypto-defenders",
    },
    {
      id: "tournament-winners",
      title: "Blockchain Battle Royale Tournament Winners Announced",
      description: "Congratulations to the top players who shared a prize pool of 15,000 CDFN tokens!",
      image: "/news/tournament-winners.png",
      category: "Tournament",
      date: "5 hours ago",
      link: "/play/tournaments/blockchain-battle-royale/results",
    },
    {
      id: "new-course-release",
      title: "New Course: Advanced DeFi Strategies",
      description: "Learn sophisticated yield farming techniques and risk management in our latest educational course.",
      image: "/news/defi-course-release.png",
      category: "Education",
      date: "8 hours ago",
      link: "/learn/courses/advanced-defi-strategies",
    },
    {
      id: "platform-update",
      title: "Platform Update: Enhanced Security Features",
      description:
        "We've added new security features to protect your assets and improve your experience on CryptoDotFun.",
      image: "/news/security-update.png",
      category: "Platform Update",
      date: "1 day ago",
      link: "/blog/platform-security-update-may-2025",
    },
    {
      id: "community-milestone",
      title: "Community Milestone: 100,000 Active Users!",
      description:
        "We're celebrating reaching 100,000 active users with special rewards and events throughout the month.",
      image: "/news/community-milestone.png",
      category: "Community",
      date: "1 day ago",
      link: "/blog/celebrating-100k-users",
    },
  ]

  const upcomingEvents = [
    {
      id: "defi-webinar",
      title: "DeFi Masterclass Webinar",
      description: "Join top DeFi experts for an in-depth discussion on the latest protocols and strategies.",
      image: "/events/defi-webinar.png",
      date: "May 15, 2025",
      time: "2:00 PM UTC",
      category: "Webinar",
      link: "/events/defi-masterclass-webinar",
    },
    {
      id: "nft-art-competition",
      title: "NFT Art Competition",
      description:
        "Submit your digital artwork for a chance to win prizes and have your NFT featured on our marketplace.",
      image: "/events/nft-art-competition.png",
      date: "May 18-25, 2025",
      category: "Competition",
      link: "/events/nft-art-competition",
    },
    {
      id: "crypto-gaming-tournament",
      title: "Crypto Gaming Championship",
      description: "Our biggest tournament of the year with a massive prize pool of 50,000 CDFN tokens.",
      image: "/events/gaming-championship.png",
      date: "May 20-30, 2025",
      category: "Tournament",
      link: "/play/tournaments/crypto-gaming-championship",
    },
  ]

  const userActivities = [
    {
      id: "course-completion",
      title: "You completed the Blockchain Fundamentals course",
      description: "You've earned 50 CDFN tokens and a course completion certificate.",
      icon: BookOpen,
      iconColor: "text-green-500",
      iconBg: "bg-green-100",
      date: "Yesterday",
      link: "/learn/certificates/blockchain-fundamentals",
    },
    {
      id: "tournament-participation",
      title: "You joined the Crypto Racer Championship",
      description: "The tournament starts in 2 days. Practice now to improve your chances!",
      icon: Trophy,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-100",
      date: "2 days ago",
      link: "/play/tournaments/crypto-racer-championship",
    },
    {
      id: "game-achievement",
      title: "New achievement unlocked in DeFi Defender",
      description: "Master Strategist: Successfully defend against 10 consecutive attacks.",
      icon: Gamepad2,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      date: "3 days ago",
      link: "/play/games/defi-defender/achievements",
    },
    {
      id: "reward-claim",
      title: "You claimed 75 CDFN tokens",
      description: "Weekly rewards for your participation in platform activities.",
      icon: Bell,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-100",
      date: "4 days ago",
      link: "/earn/rewards-history",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Pulse</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Stay updated with the latest news, events, and activities happening across CryptoDotFun.
        </p>
      </div>

      <Tabs defaultValue="news" className="mb-12">
        <TabsList className="mb-8 grid w-full grid-cols-3">
          <TabsTrigger value="news">Latest News</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          <TabsTrigger value="activity">Your Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-video">
                  <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                  <Badge className="absolute right-2 top-2">{item.category}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{item.date}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-muted-foreground">{item.description}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href={item.link}>Read More</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/pulse/news">
                View All News <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-video">
                  <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                  <Badge className="absolute right-2 top-2">{event.category}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>{event.date}</span>
                    {event.time && <span className="ml-2">• {event.time}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-muted-foreground">{event.description}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href={event.link}>Learn More</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/pulse/events">
                View All Events <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-xl border bg-card">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Your Recent Activity</h2>
              <div className="space-y-4">
                {userActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-accent"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activity.iconBg}`}
                    >
                      <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t p-4 text-center">
              <Button variant="ghost" asChild>
                <Link href="/profile/activity">
                  View All Activity <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Platform Stats */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-6 text-2xl font-bold">Platform Stats</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-accent p-4 text-center">
            <h3 className="text-4xl font-bold">100K+</h3>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div className="rounded-lg bg-accent p-4 text-center">
            <h3 className="text-4xl font-bold">50+</h3>
            <p className="text-sm text-muted-foreground">Games</p>
          </div>
          <div className="rounded-lg bg-accent p-4 text-center">
            <h3 className="text-4xl font-bold">1.2M</h3>
            <p className="text-sm text-muted-foreground">CDFN Tokens Distributed</p>
          </div>
          <div className="rounded-lg bg-accent p-4 text-center">
            <h3 className="text-4xl font-bold">200+</h3>
            <p className="text-sm text-muted-foreground">Courses Completed</p>
          </div>
        </div>
      </section>
    </div>
  )
}
