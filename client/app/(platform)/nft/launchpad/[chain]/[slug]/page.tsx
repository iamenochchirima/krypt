"use client"

import { useState, useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Clock,
  Flame,
  Calendar,
  CheckCircle,
  Share2,
  Heart,
  ExternalLink,
  Minus,
  Plus,
  Loader2,
  Users,
  Layers,
  Tag,
} from "lucide-react"
import { getChainById } from "@/types/chains"
import { MOCK_SALES } from "../../page"

function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTime))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
}

function calculateTimeLeft(targetTime: number) {
  const diff = targetTime - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  }
}

function CountdownDisplay({ targetTime, label }: { targetTime: number; label: string }) {
  const { days, hours, minutes, seconds } = useCountdown(targetTime)

  return (
    <div className="text-center">
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className="flex gap-3 justify-center">
        {days > 0 && (
          <div className="bg-muted rounded-lg p-3 min-w-[60px]">
            <div className="text-2xl font-bold">{days}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        )}
        <div className="bg-muted rounded-lg p-3 min-w-[60px]">
          <div className="text-2xl font-bold">{String(hours).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground">hours</div>
        </div>
        <div className="bg-muted rounded-lg p-3 min-w-[60px]">
          <div className="text-2xl font-bold">{String(minutes).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground">mins</div>
        </div>
        <div className="bg-muted rounded-lg p-3 min-w-[60px]">
          <div className="text-2xl font-bold">{String(seconds).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground">secs</div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "live":
      return (
        <Badge className="bg-green-500 text-white text-sm px-3 py-1">
          <Flame className="w-4 h-4 mr-1" /> Live
        </Badge>
      )
    case "upcoming":
      return (
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Calendar className="w-4 h-4 mr-1" /> Upcoming
        </Badge>
      )
    case "ended":
      return (
        <Badge variant="secondary" className="bg-gray-500 text-white text-sm px-3 py-1">
          <CheckCircle className="w-4 h-4 mr-1" /> Ended
        </Badge>
      )
    default:
      return null
  }
}

export default function LaunchpadDetailPage() {
  const params = useParams()
  const chain = params.chain as string
  const slug = params.slug as string

  const [mintAmount, setMintAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  const [isWatchlisted, setIsWatchlisted] = useState(false)

  const sale = MOCK_SALES.find(s => s.chain === chain && s.slug === slug)

  if (!sale) {
    notFound()
  }

  const chainInfo = getChainById(sale.chain)
  const isOpenEdition = sale.saleType === "OpenEdition"
  const mintedPercent = sale.totalSupply > 0 ? (sale.minted / sale.totalSupply) * 100 : 0
  const remaining = sale.totalSupply > 0 ? sale.totalSupply - sale.minted : null
  const totalCost = sale.price * mintAmount

  const handleMint = async () => {
    setIsMinting(true)
    // TODO: Implement actual minting logic
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsMinting(false)
  }

  const canMint = sale.status === "live"
  const maxMint = remaining !== null ? Math.min(remaining, 10) : 10

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/nft/launchpad" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Launchpad
      </Link>

      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden">
        <Image
          src={sale.banner}
          alt={sale.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Collection image overlay */}
        <div className="absolute bottom-4 left-4 flex items-end gap-4">
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-xl overflow-hidden border-4 border-background shadow-xl">
            <Image src={sale.image} alt={sale.name} fill className="object-cover" />
          </div>
          <div className="text-white pb-2">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={sale.status} />
              {sale.whitelistOnly && (
                <Badge className="bg-purple-500 text-white">Whitelist</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{sale.name}</h1>
            <p className="text-white/80">by {sale.creator}</p>
          </div>
        </div>

        {/* Chain badge */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-3 py-2">
            {chainInfo && (
              <Image src={chainInfo.icon} alt={chainInfo.name} width={20} height={20} className="rounded-full" />
            )}
            <span className="font-medium">{chainInfo?.name || sale.chain}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/90 backdrop-blur-sm"
            onClick={() => setIsWatchlisted(!isWatchlisted)}
          >
            <Heart className={`w-4 h-4 ${isWatchlisted ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button variant="secondary" size="icon" className="bg-background/90 backdrop-blur-sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-muted-foreground">{sale.description}</p>
          </Card>

          {/* Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Tag className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-bold">{sale.price} {sale.priceSymbol}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Layers className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Supply</div>
                <div className="font-bold">{isOpenEdition ? "Open Edition" : sale.totalSupply.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Minted</div>
                <div className="font-bold">{sale.minted.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-bold text-sm">{sale.saleType}</div>
              </div>
            </div>
          </Card>

          {/* Progress (for non-open editions) */}
          {!isOpenEdition && sale.totalSupply > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Mint Progress</h2>
                <span className="text-sm text-muted-foreground">
                  {sale.minted.toLocaleString()} / {sale.totalSupply.toLocaleString()}
                </span>
              </div>
              <Progress value={mintedPercent} className="h-3 mb-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{mintedPercent.toFixed(1)}% minted</span>
                {remaining !== null && remaining > 0 && (
                  <span>{remaining.toLocaleString()} remaining</span>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Mint panel */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-4">
            {/* Countdown */}
            {sale.status === "upcoming" && (
              <div className="mb-6">
                <CountdownDisplay targetTime={sale.startTime} label="Mint starts in" />
              </div>
            )}
            {sale.status === "live" && sale.endTime && (
              <div className="mb-6">
                <CountdownDisplay targetTime={sale.endTime} label="Mint ends in" />
              </div>
            )}

            {/* Price display */}
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">Price per NFT</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{sale.price}</span>
                <span className="text-xl text-muted-foreground">{sale.priceSymbol}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Mint controls */}
            {canMint ? (
              <>
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Quantity</div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                      disabled={mintAmount <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{mintAmount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setMintAmount(Math.min(maxMint, mintAmount + 1))}
                      disabled={mintAmount >= maxMint}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {remaining !== null && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Max {maxMint} per transaction
                    </div>
                  )}
                </div>

                <div className="bg-muted rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold">{totalCost.toFixed(2)} {sale.priceSymbol}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleMint}
                  disabled={isMinting}
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    `Mint ${mintAmount} NFT${mintAmount > 1 ? "s" : ""}`
                  )}
                </Button>
              </>
            ) : sale.status === "upcoming" ? (
              <div className="text-center">
                <Button className="w-full h-12" disabled>
                  <Clock className="w-5 h-5 mr-2" />
                  Mint Not Started
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Set a reminder to be notified when minting begins
                </p>
                <Button variant="outline" className="w-full mt-3" onClick={() => setIsWatchlisted(true)}>
                  <Heart className={`w-4 h-4 mr-2 ${isWatchlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWatchlisted ? "Watchlisted" : "Add to Watchlist"}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button className="w-full h-12" disabled>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mint Ended
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This mint has ended. Check the secondary market for available NFTs.
                </p>
                <Link href={`/nft/collections/${sale.chain}/${sale.slug}`}>
                  <Button variant="outline" className="w-full mt-3">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Collection
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
