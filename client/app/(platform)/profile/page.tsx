"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Settings,
  BookOpen,
  Coins,
  Shield,
  MessageSquare,
  ImageIcon,
  Bell,
  Lock,
  CreditCard,
  LogOut,
  Edit,
  ChevronRight,
  Wallet,
  Receipt,
} from "lucide-react"
import AuthGuard from "@/components/auth-guard"
import { useAuth } from "@/providers/auth-context"
import { WalletType } from "@/providers/types"

const recentActivity = [
  {
    id: 1,
    type: "course",
    title: "Completed Module: Consensus Mechanisms",
    date: "2 days ago",
    reward: 10,
  },
  {
    id: 2,
    type: "bounty",
    title: "Submitted Audit Report: Ethereum DeFi Protocol",
    date: "1 week ago",
    reward: 25,
  },
  {
    id: 3,
    type: "blog",
    title: "Published: Understanding Layer 2 Solutions",
    date: "2 weeks ago",
    reward: 15,
  },
  {
    id: 4,
    type: "nft",
    title: "Purchased NFT: Cosmic Voyager #42",
    date: "3 weeks ago",
    reward: 0,
  },
  {
    id: 5,
    type: "token",
    title: "Staked 50 $CDF tokens",
    date: "1 month ago",
    reward: 5,
  },
]

// Mock courses data
const enrolledCourses = [
  {
    id: 1,
    title: "Introduction to Blockchain",
    progress: 75,
    image: "/blockchain-intro-concept.png",
  },
  {
    id: 2,
    title: "Solidity for Ethereum",
    progress: 30,
    image: "/coding-the-blockchain.png",
  },
  {
    id: 3,
    title: "DeFi Protocols Explained",
    progress: 10,
    image: "/defi-learning-journey.png",
  },
]

// Mock NFT data
const userNFTs = [
  {
    id: 1,
    name: "Cosmic Voyager #42",
    collection: "Cosmic Voyagers",
    image: "/cosmic-space-traveler-nft.png",
    chain: "Ethereum",
  },
  {
    id: 2,
    name: "Neon Samurai",
    collection: "Neo Tokyo",
    image: "/neon-cyberpunk-samurai-nft.png",
    chain: "Solana",
  },
  {
    id: 3,
    name: "Abstract Mindscape #7",
    collection: "Mindscapes",
    image: "/abstract-mindscape-nft.png",
    chain: "Ethereum",
  },
]

// Mock token data
const userTokens = [
  {
    id: 1,
    name: "CDF",
    balance: 120,
    staked: 50,
    value: "$240",
    chain: "Ethereum",
  },
  {
    id: 2,
    name: "LEARN",
    balance: 75,
    staked: 0,
    value: "$15",
    chain: "Polygon",
  },
]

// Mock security data
const securityActivities = [
  {
    id: 1,
    title: "Ethereum DeFi Protocol Audit",
    status: "In Progress",
    deadline: "Dec 31, 2023",
    reward: "$5,000",
  },
  {
    id: 2,
    title: "NFT Marketplace Security Review",
    status: "In Progress",
    deadline: "Nov 15, 2023",
    reward: "$3,000",
  },
]

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const { user, principalId, sessionData, fetchingUser } = useAuth()

  // Only show the component after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a loading state or null while not mounted
  if (!mounted || fetchingUser) {
    return <div className="container mx-auto px-4 py-24">Loading profile...</div>
  }

  const getWalletType = () => {
    if (sessionData?.connectedWalletType) {
      switch (sessionData.connectedWalletType) {
        case WalletType.SIWE:
          return "Ethereum Wallet"
        case WalletType.SIWS:
          return "Solana Wallet"
        case WalletType.SIWB:
          return "Bitcoin Wallet"
        case WalletType.NFID:
          return "NFID"
        default:
          return "Internet Identity"
      }
    }
    return "Unknown"
  }

  // Create dynamic user data with fallbacks
  const userData = {
    address: principalId ? `${principalId.substring(0, 6)}...${principalId.slice(-4)}` : sessionData?.chainAddress?.substring(0, 10) + "..." || "Not connected",
    username: user?.username || "Crypto Explorer",
    email: user?.email?.[0] || "user@cryptodotfun.com",
    joinDate: user?.created_at ? new Date(Number(user.created_at) / 1000000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently",
    avatar: "/crypto-user-avatar.png",
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    tokens: 0,
    nftsOwned: 0,
    tokensLaunched: 0,
    coursesEnrolled: 0,
    coursesCompleted: 0,
    activeBounties: 0,
    blogPosts: 0,
    reputation: 0,
    walletType: getWalletType(),
    interests: user?.interests?.map(interest => interest.value) || [],
    chainData: user?.chain_data || null,
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Dashboard</h1>
          <p className="text-muted-foreground">Manage your profile, activities, and settings</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.username} />
                      <AvatarFallback>{userData.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{userData.username}</h2>
                    <p className="text-sm text-muted-foreground mb-2">{userData.address}</p>
                    <div className="flex flex-wrap items-center justify-center gap-1 mb-4">
                      <Badge variant="outline" className="bg-crypto-purple/10 text-crypto-purple">
                        Level {userData.level}
                      </Badge>
                      <Badge variant="outline" className="bg-crypto-blue/10 text-crypto-blue">
                        {userData.walletType}
                      </Badge>
                      {userData.chainData && (
                        <Badge variant="outline" className="bg-crypto-yellow/10 text-crypto-yellow">
                          {Object.keys(userData.chainData.chain)[0]}
                        </Badge>
                      )}
                      {userData.interests.length > 0 && (
                        <Badge variant="outline" className="bg-crypto-pink/10 text-crypto-pink">
                          {userData.interests.length} Interests
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/profile/edit">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card>
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "overview"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <User className="h-5 w-5" />
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("learning")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "learning"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <BookOpen className="h-5 w-5" />
                      Learning
                    </button>
                    <button
                      onClick={() => setActiveTab("earnings")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "earnings"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <Coins className="h-5 w-5" />
                      Earnings & Tokens
                    </button>
                    <button
                      onClick={() => setActiveTab("nfts")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "nfts"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <ImageIcon className="h-5 w-5" />
                      NFTs
                    </button>
                    <button
                      onClick={() => setActiveTab("security")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "security"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <Shield className="h-5 w-5" />
                      Security Activities
                    </button>
                    <button
                      onClick={() => setActiveTab("community")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "community"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <MessageSquare className="h-5 w-5" />
                      Community
                    </button>
                    <button
                      onClick={() => setActiveTab("subscriptions")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "subscriptions"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <CreditCard className="h-5 w-5" />
                      Subscriptions
                    </button>
                    <button
                      onClick={() => setActiveTab("billing")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "billing"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <Receipt className="h-5 w-5" />
                      Billing
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className={`flex items-center gap-3 border-l-2 ${activeTab === "settings"
                          ? "border-primary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        } px-4 py-3 text-left transition-colors`}
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </button>
                  </nav>
                </CardContent>
              </Card>

              {/* Logout Button */}
              <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === "overview" && (
              <section id="overview">
                <h2 className="text-2xl font-bold mb-6">Overview</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <BookOpen className="h-8 w-8 text-crypto-blue mb-2" />
                        <p className="text-sm text-muted-foreground">Courses</p>
                        <p className="text-2xl font-bold">
                          {userData.coursesCompleted}/{userData.coursesEnrolled}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <Coins className="h-8 w-8 text-crypto-yellow mb-2" />
                        <p className="text-sm text-muted-foreground">Tokens</p>
                        <p className="text-2xl font-bold">{userData.tokens} $CDF</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <ImageIcon className="h-8 w-8 text-crypto-purple mb-2" />
                        <p className="text-sm text-muted-foreground">NFTs</p>
                        <p className="text-2xl font-bold">{userData.nftsOwned}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <Shield className="h-8 w-8 text-crypto-green mb-2" />
                        <p className="text-sm text-muted-foreground">Bounties</p>
                        <p className="text-2xl font-bold">{userData.activeBounties}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Level Progress */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Level Progress</CardTitle>
                    <CardDescription>Your journey to the next level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Level {userData.level}</span>
                      <span>Level {userData.level + 1}</span>
                    </div>
                    <Progress value={(userData.xp / userData.nextLevelXp) * 100} className="h-2 mb-2" />
                    <div className="text-center text-sm text-muted-foreground">
                      {userData.xp} / {userData.nextLevelXp} XP
                    </div>
                  </CardContent>
                </Card>

                {/* User Interests */}
                {userData.interests.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Your Interests</CardTitle>
                      <CardDescription>Areas you're passionate about in crypto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {userData.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="bg-crypto-blue/10 text-crypto-blue">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Chain & Wallet Info */}
                {userData.chainData && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Wallet Information</CardTitle>
                      <CardDescription>Your connected wallet details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Chain:</span>
                          <Badge className="bg-crypto-yellow/10 text-crypto-yellow">
                            {Object.keys(userData.chainData.chain)[0]}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Wallet:</span>
                          <span className="text-sm font-mono">{userData.chainData.wallet}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Address:</span>
                          <span className="text-xs font-mono">{userData.chainData.wallet_address}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest actions across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${activity.type === "course"
                                ? "bg-crypto-blue/10 text-crypto-blue"
                                : activity.type === "bounty"
                                  ? "bg-crypto-green/10 text-crypto-green"
                                  : activity.type === "blog"
                                    ? "bg-crypto-purple/10 text-crypto-purple"
                                    : activity.type === "nft"
                                      ? "bg-crypto-pink/10 text-crypto-pink"
                                      : "bg-crypto-yellow/10 text-crypto-yellow"
                              }`}
                          >
                            {activity.type === "course" ? (
                              <BookOpen className="h-5 w-5" />
                            ) : activity.type === "bounty" ? (
                              <Shield className="h-5 w-5" />
                            ) : activity.type === "blog" ? (
                              <MessageSquare className="h-5 w-5" />
                            ) : activity.type === "nft" ? (
                              <ImageIcon className="h-5 w-5" />
                            ) : (
                              <Coins className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.date}</p>
                          </div>
                          {activity.reward > 0 && (
                            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              <Coins className="h-3 w-3" />+{activity.reward} $CDF
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeTab === "learning" && (
              <section id="learning">
                <h2 className="text-2xl font-bold mb-6">Learning</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Enrolled Courses</CardTitle>
                    <CardDescription>Continue your learning journey</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {enrolledCourses.map((course) => (
                        <div key={course.id} className="flex items-center gap-4 rounded-lg border p-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={course.image || "/placeholder.svg"}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{course.title}</h3>
                            <div className="mt-2">
                              <div className="mb-1 flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{course.progress}%</span>
                              </div>
                              <Progress value={course.progress} className="h-1" />
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/learn/${course.id}`}>Continue</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/learn">
                          Explore More Courses <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeTab === "earnings" && (
              <section id="earnings">
                <h2 className="text-2xl font-bold mb-6">Earnings & Tokens</h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Token Balance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Token Balance</CardTitle>
                      <CardDescription>Your earned and staked tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userTokens.map((token) => (
                          <div key={token.id} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                  <span className="text-xs font-bold">{token.name}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{token.name}</p>
                                  <p className="text-xs text-muted-foreground">{token.chain}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{token.balance}</p>
                                <p className="text-xs text-muted-foreground">≈ {token.value}</p>
                              </div>
                            </div>
                            {token.staked > 0 && (
                              <div className="mt-2 rounded-lg bg-muted p-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Staked:</span>
                                  <span className="font-medium">
                                    {token.staked} {token.name}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button className="flex-1">Stake Tokens</Button>
                        <Button variant="outline" className="flex-1">
                          Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Earning Opportunities */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Earning Opportunities</CardTitle>
                      <CardDescription>Ways to earn more tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <BookOpen className="h-5 w-5 text-crypto-blue" />
                            <h3 className="font-medium">Complete Courses</h3>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">Earn up to 20 $CDF per course completion</p>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/learn">Browse Courses</Link>
                          </Button>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-5 w-5 text-crypto-green" />
                            <h3 className="font-medium">Participate in Bounties</h3>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">
                            Earn $CDF tokens for successful security audits
                          </p>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/secure">Find Bounties</Link>
                          </Button>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="h-5 w-5 text-crypto-purple" />
                            <h3 className="font-medium">Write Blog Posts</h3>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">Earn 10-25 $CDF for quality content</p>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/connect">Start Writing</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            {activeTab === "nfts" && (
              <section id="nfts">
                <h2 className="text-2xl font-bold mb-6">NFTs</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Your NFT Collection</CardTitle>
                    <CardDescription>NFTs you own across different blockchains</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                      {userNFTs.map((nft) => (
                        <div key={nft.id} className="overflow-hidden rounded-lg border bg-card">
                          <div className="relative aspect-square overflow-hidden">
                            <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
                            <div className="absolute bottom-2 left-2">
                              <div className="rounded-full bg-background/50 px-2 py-1 text-xs backdrop-blur-sm">
                                {nft.chain}
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="mb-1 text-sm text-muted-foreground">{nft.collection}</div>
                            <h3 className="mb-2 text-lg font-bold">{nft.name}</h3>
                            <Button size="sm" variant="outline" className="w-full" asChild>
                              <Link href={`/collections/${nft.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-4">
                      <Button className="flex-1" asChild>
                        <Link href="/collections">Browse Collections</Link>
                      </Button>
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href="/nft/launchpad">Create NFT</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeTab === "security" && (
              <section id="security">
                <h2 className="text-2xl font-bold mb-6">Security Activities</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Bounties</CardTitle>
                    <CardDescription>Security bounties you're participating in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {securityActivities.map((activity) => (
                        <div key={activity.id} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="font-medium">{activity.title}</h3>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-crypto-green">{activity.reward}</span>
                                <span className="text-muted-foreground">Deadline: {activity.deadline}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-crypto-yellow/10 text-crypto-yellow">
                                {activity.status}
                              </Badge>
                              <Button size="sm" asChild>
                                <Link href={`/secure/${activity.id}`}>View</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/secure">
                          Find More Bounties <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeTab === "community" && (
              <section id="community">
                <h2 className="text-2xl font-bold mb-6">Community</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Contributions</CardTitle>
                    <CardDescription>Your activity in the community</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="rounded-lg border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <MessageSquare className="h-6 w-6 text-crypto-purple" />
                          <h3 className="text-lg font-medium">Blog Posts</h3>
                        </div>
                        <p className="text-3xl font-bold mb-2">{userData.blogPosts}</p>
                        <p className="text-sm text-muted-foreground mb-4">Published posts</p>
                        <Button size="sm" asChild>
                          <Link href="/connect">Write New Post</Link>
                        </Button>
                      </div>
                      <div className="rounded-lg border p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <MessageSquare className="h-6 w-6 text-crypto-blue" />
                          <h3 className="text-lg font-medium">Forum Activity</h3>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Threads:</span>
                            <span className="font-medium">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Replies:</span>
                            <span className="font-medium">12</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Likes received:</span>
                            <span className="font-medium">28</span>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href="/connect">Go to Forum</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeTab === "subscriptions" && (
              <section id="subscriptions">
                <h2 className="text-2xl font-bold mb-6">Subscriptions</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Subscriptions</CardTitle>
                    <CardDescription>Manage your subscription plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Pro Plan */}
                      <div className="rounded-lg border p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crypto-purple/10">
                                <span className="text-xs font-bold text-crypto-purple">PRO</span>
                              </div>
                              <h3 className="font-bold text-lg">Pro Plan</h3>
                              <Badge className="bg-crypto-green">Active</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Access to all courses, premium content, and early access to new features
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              $19.99<span className="text-sm font-normal text-muted-foreground">/month</span>
                            </p>
                            <p className="text-sm text-muted-foreground">Renews on Nov 15, 2023</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">
                            Change Plan
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive">
                            Cancel
                          </Button>
                        </div>
                      </div>

                      {/* Other Available Plans */}
                      <div className="rounded-lg border p-6">
                        <h3 className="font-bold mb-4">Available Plans</h3>
                        <div className="space-y-4">
                          {/* Premium Plan */}
                          <div className="rounded-lg border p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-crypto-blue/10">
                                    <span className="text-xs font-bold text-crypto-blue">P</span>
                                  </div>
                                  <h4 className="font-medium">Premium Plan</h4>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Everything in Pro plus 1-on-1 mentoring sessions
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  $49.99<span className="text-xs font-normal text-muted-foreground">/month</span>
                                </p>
                                <Button size="sm" className="mt-2">
                                  Upgrade
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Enterprise Plan */}
                          <div className="rounded-lg border p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-crypto-pink/10">
                                    <span className="text-xs font-bold text-crypto-pink">E</span>
                                  </div>
                                  <h4 className="font-medium">Enterprise Plan</h4>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Custom solutions for teams and organizations
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">Custom Pricing</p>
                                <Button size="sm" variant="outline" className="mt-2">
                                  Contact Sales
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
            {activeTab === "billing" && (
              <section id="billing">
                <h2 className="text-2xl font-bold mb-6">Billing</h2>

                <div className="space-y-6">
                  {/* Payment Methods */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>Manage your payment methods</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Visa Card */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">Visa ending in 4242</p>
                              <p className="text-xs text-muted-foreground">Expires 12/24</p>
                            </div>
                          </div>
                          <Badge>Default</Badge>
                        </div>

                        <Button>Add Payment Method</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing History</CardTitle>
                      <CardDescription>View your past invoices and payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border">
                        <div className="grid grid-cols-1 divide-y">
                          {[
                            {
                              date: "Oct 15, 2023",
                              description: "Pro Plan - Monthly",
                              amount: "$19.99",
                              status: "Paid",
                            },
                            {
                              date: "Sep 15, 2023",
                              description: "Pro Plan - Monthly",
                              amount: "$19.99",
                              status: "Paid",
                            },
                            {
                              date: "Aug 15, 2023",
                              description: "Pro Plan - Monthly",
                              amount: "$19.99",
                              status: "Paid",
                            },
                          ].map((invoice, index) => (
                            <div key={index} className="flex items-center justify-between p-4">
                              <div>
                                <p className="font-medium">{invoice.description}</p>
                                <p className="text-xs text-muted-foreground">{invoice.date}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="font-medium">{invoice.amount}</p>
                                <Badge variant="outline" className="bg-crypto-green/10 text-crypto-green">
                                  {invoice.status}
                                </Badge>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Receipt className="h-4 w-4" />
                                  <span className="sr-only">Download</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Address</CardTitle>
                      <CardDescription>Manage your billing address</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border p-4">
                        <p className="font-medium">John Doe</p>
                        <p className="text-sm text-muted-foreground">123 Blockchain Street</p>
                        <p className="text-sm text-muted-foreground">Crypto City, CC 12345</p>
                        <p className="text-sm text-muted-foreground">United States</p>
                        <div className="mt-4">
                          <Button variant="outline" size="sm">
                            Edit Address
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            {activeTab === "settings" && (
              <section id="settings">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>

                <div className="space-y-6">
                  {/* Account Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>Manage your account information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" defaultValue={userData.username} className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={userData.email} className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <textarea
                            id="bio"
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                            placeholder="Tell us about yourself..."
                          ></textarea>
                        </div>
                        <Button>Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Settings</CardTitle>
                      <CardDescription>Manage how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Course Updates</p>
                              <p className="text-sm text-muted-foreground">Receive notifications about course updates</p>
                            </div>
                          </div>
                          <Switch checked={true} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Token Rewards</p>
                              <p className="text-sm text-muted-foreground">Receive notifications about token rewards</p>
                            </div>
                          </div>
                          <Switch checked={true} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Security Alerts</p>
                              <p className="text-sm text-muted-foreground">Receive notifications about security alerts</p>
                            </div>
                          </div>
                          <Switch checked={true} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Community Activity</p>
                              <p className="text-sm text-muted-foreground">
                                Receive notifications about community activity
                              </p>
                            </div>
                          </div>
                          <Switch checked={false} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Manage your account security</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Two-Factor Authentication</p>
                              <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Enable
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Connected Wallets</p>
                              <p className="text-sm text-muted-foreground">Manage your connected wallets</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Payment Methods</p>
                              <p className="text-sm text-muted-foreground">Manage your payment methods</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
