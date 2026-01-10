import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { BookOpen, Edit, Gift, Coins } from "lucide-react"

export default function EarnPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Learn & Earn</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Earn $CDF tokens by learning, contributing, and participating in the CryptoDotFun ecosystem.
        </p>
      </div>

      {/* Rewards Dashboard */}
      <div className="mb-12 rounded-xl bg-gradient-to-r from-crypto-blue/20 via-crypto-purple/20 to-crypto-pink/20 p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-background/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crypto-blue/20 text-crypto-blue">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">Learning Rewards</h3>
            </div>
            <p className="mb-4 text-muted-foreground">
              Complete courses and quizzes to earn $CDF tokens. The more you learn, the more you earn.
            </p>
            <div className="mb-4 rounded-lg border border-dashed p-3 text-center">
              <p className="text-sm text-muted-foreground">Up to</p>
              <p className="text-2xl font-bold">20 $CDF</p>
              <p className="text-sm text-muted-foreground">per course</p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/learn">Start Learning</Link>
            </Button>
          </div>

          <div className="rounded-lg bg-background/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crypto-purple/20 text-crypto-purple">
                <Edit className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">Contribution Rewards</h3>
            </div>
            <p className="mb-4 text-muted-foreground">
              Write blog posts, participate in bounties, and contribute to the community to earn $CDF tokens.
            </p>
            <div className="mb-4 rounded-lg border border-dashed p-3 text-center">
              <p className="text-sm text-muted-foreground">Up to</p>
              <p className="text-2xl font-bold">50 $CDF</p>
              <p className="text-sm text-muted-foreground">per contribution</p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/connect">Start Contributing</Link>
            </Button>
          </div>

          <div className="rounded-lg bg-background/80 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crypto-pink/20 text-crypto-pink">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">Referral Rewards</h3>
            </div>
            <p className="mb-4 text-muted-foreground">
              Invite friends to join CryptoDotFun and earn $CDF tokens for each successful referral.
            </p>
            <div className="mb-4 rounded-lg border border-dashed p-3 text-center">
              <p className="text-sm text-muted-foreground">Earn</p>
              <p className="text-2xl font-bold">5 $CDF</p>
              <p className="text-sm text-muted-foreground">per signup</p>
            </div>
            <Button className="w-full">Invite Friends</Button>
          </div>
        </div>
      </div>

      {/* Learning Rewards */}
      <div className="mb-12">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h2 className="text-2xl font-bold">Learning Rewards</h2>
          <Button asChild>
            <Link href="/learn">View All Courses</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Blockchain Fundamentals",
              reward: 20,
              image: "/blockchain-fundamentals-concept.png",
            },
            {
              title: "Solidity for Ethereum",
              reward: 25,
              image: "/placeholder.svg?height=200&width=400&query=solidity ethereum development course",
            },
            {
              title: "DeFi Protocols Explained",
              reward: 30,
              image: "/placeholder.svg?height=200&width=400&query=defi protocols blockchain course",
            },
          ].map((course, index) => (
            <div key={index} className="crypto-card group">
              <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg">
                <Image
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-bold">
                  {course.reward} $CDF
                </div>
              </div>
              <h3 className="mb-4 text-xl font-bold">{course.title}</h3>
              <Button className="w-full" asChild>
                <Link href={`/learn/${index + 1}`}>Start Course</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Staking UI */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Stake $CDF</h2>
        <div className="rounded-lg border bg-card p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-xl font-bold">Staking Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Coins className="h-3 w-3" />
                  </div>
                  <span>Unlock premium courses and content</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Coins className="h-3 w-3" />
                  </div>
                  <span>Earn higher rewards for contributions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Coins className="h-3 w-3" />
                  </div>
                  <span>Participate in governance decisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Coins className="h-3 w-3" />
                  </div>
                  <span>Access exclusive community events</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-between rounded-lg border p-6">
              <div>
                <h3 className="mb-4 text-xl font-bold">Stake Your Tokens</h3>
                <p className="mb-4 text-muted-foreground">
                  Lock your $CDF tokens to unlock premium features and earn additional rewards.
                </p>
                <div className="mb-4 rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">Minimum Stake</p>
                  <p className="text-2xl font-bold">50 $CDF</p>
                </div>
              </div>
              <Button size="lg">Stake $CDF</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Governance UI */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Governance</h2>
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-6 text-center">
            <h3 className="mb-2 text-xl font-bold">Vote on Platform Features</h3>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Use your $CDF tokens to vote on proposals and help shape the future of CryptoDotFun.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Increase Bounty Rewards?",
                description: "Should we increase the reward pool for security bounties by 20%?",
                votes: 1245,
                status: "Active",
              },
              {
                title: "Add New Course Categories",
                description: "Add new course categories for ZK-proofs and Layer 2 solutions.",
                votes: 892,
                status: "Active",
              },
              {
                title: "Community Events Budget",
                description: "Allocate 10% of treasury for monthly community events and hackathons.",
                votes: 567,
                status: "Active",
              },
            ].map((proposal, index) => (
              <div key={index} className="crypto-card">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      proposal.status === "Active"
                        ? "bg-crypto-green/20 text-crypto-green"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {proposal.status}
                  </span>
                  <span className="text-sm text-muted-foreground">{proposal.votes} votes</span>
                </div>
                <h3 className="mb-2 text-xl font-bold">{proposal.title}</h3>
                <p className="mb-4 text-muted-foreground">{proposal.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    Yes
                  </Button>
                  <Button variant="outline" className="flex-1">
                    No
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
