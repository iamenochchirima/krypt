"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, Flame, Calendar, CheckCircle, Share2, Heart, ExternalLink, Minus, Plus, Loader2, Users, Layers, Tag, Wallet, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Collection, LegacyCollectionData } from "@/declarations/registry/registry.did"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mintV2, mplCandyMachine, fetchCandyMachine, fetchCandyGuard } from "@metaplex-foundation/mpl-candy-machine"
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey, generateSigner, transactionBuilder, some } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox"
import { getChainById } from "@/types/chains"

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet") as "devnet" | "mainnet-beta"
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || (SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com")

interface CandyMachineState {
  itemsLoaded: number
  itemsRedeemed: number
  authority: string
  mintPrice: number
  startTime: number | null
  endTime: number | null
  isActive: boolean
}

interface LegacyMintProps {
  collection: Collection
  solanaData: LegacyCollectionData
}

function useCountdown(targetTime: number | null) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime))

  useEffect(() => {
    if (!targetTime) return
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetTime)), 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  return timeLeft
}

function calculateTimeLeft(targetTime: number | null) {
  if (!targetTime) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
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

export default function LegacyMint({ collection, solanaData }: LegacyMintProps) {
  const wallet = useWallet()
  const { publicKey: walletPublicKey, connected } = wallet

  const [mintAmount, setMintAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [cmState, setCmState] = useState<CandyMachineState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null)

  const candyMachineAddress = solanaData.candy_machine_address?.[0] || null
  const chainInfo = getChainById("solana")

  const fetchCandyMachineState = useCallback(async () => {
    if (!candyMachineAddress) return
    try {
      setIsLoading(true)
      const umi = createUmi(SOLANA_RPC_URL).use(mplCandyMachine()).use(mplTokenMetadata())
      const cmPubkey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, cmPubkey)

      let mintPrice = 0
      let startTime: number | null = null
      let endTime: number | null = null
      let isActive = true

      try {
        const guard = await fetchCandyGuard(umi, cm.mintAuthority)
        if (guard.guards.solPayment.__option === 'Some') {
          mintPrice = Number(guard.guards.solPayment.value.lamports.basisPoints) / 1e9
        }
        if (guard.guards.startDate.__option === 'Some') {
          startTime = Number(guard.guards.startDate.value.date) * 1000
          isActive = Date.now() >= startTime
        }
        if (guard.guards.endDate.__option === 'Some') {
          endTime = Number(guard.guards.endDate.value.date) * 1000
          if (Date.now() > endTime) isActive = false
        }

        // Check whitelist (allowList guard)
        if (guard.guards.allowList.__option === 'Some' && walletPublicKey) {
          // For now, assume not whitelisted unless we can verify
          // Real implementation would check merkle proof
          setIsWhitelisted(null) // null = unknown, need to check
        } else {
          setIsWhitelisted(true) // No allowlist = everyone can mint
        }
      } catch (e) {
        console.log('No candy guard found')
        setIsWhitelisted(true)
      }

      setCmState({
        itemsLoaded: Number(cm.itemsLoaded),
        itemsRedeemed: Number(cm.itemsRedeemed),
        authority: cm.authority.toString(),
        mintPrice,
        startTime,
        endTime,
        isActive,
      })
    } catch (error) {
      console.error("Failed to fetch candy machine:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }, [candyMachineAddress, walletPublicKey])

  useEffect(() => {
    fetchCandyMachineState()
  }, [fetchCandyMachineState])

  const getStatus = () => {
    if (!cmState) return "loading"
    if (cmState.startTime && Date.now() < cmState.startTime) return "upcoming"
    if (cmState.endTime && Date.now() > cmState.endTime) return "ended"
    if (cmState.itemsRedeemed >= cmState.itemsLoaded) return "ended"
    return "live"
  }

  const status = getStatus()
  const startCountdown = useCountdown(cmState?.startTime || null)
  const endCountdown = useCountdown(cmState?.endTime || null)

  const handleMint = async () => {
    if (!connected || !walletPublicKey) {
      toast.error("Please connect your wallet")
      return
    }
    if (!candyMachineAddress) {
      toast.error("Candy machine not found")
      return
    }

    try {
      setIsMinting(true)
      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplCandyMachine())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))

      const cmPubkey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, cmPubkey)

      let candyGuard = null
      let mintArgs: any = {}

      try {
        candyGuard = await fetchCandyGuard(umi, cm.mintAuthority)
        if (candyGuard.guards.solPayment.__option === 'Some') {
          mintArgs.solPayment = some({ destination: candyGuard.guards.solPayment.value.destination })
        }
      } catch (e) {
        console.log('No candy guard')
      }

      for (let i = 0; i < mintAmount; i++) {
        const nftMint = generateSigner(umi)
        const mintBuilder = transactionBuilder()
          .add(setComputeUnitLimit(umi, { units: 400_000 }))
          .add(mintV2(umi, {
            candyMachine: cmPubkey,
            nftMint,
            collectionMint: cm.collectionMint,
            collectionUpdateAuthority: cm.authority,
            candyGuard: candyGuard?.publicKey,
            mintArgs: Object.keys(mintArgs).length > 0 ? mintArgs : undefined,
          }))

        await mintBuilder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
        toast.success(`Minted NFT ${i + 1}/${mintAmount}!`)
      }

      fetchCandyMachineState()
    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Mint failed", { description: error?.message })
    } finally {
      setIsMinting(false)
    }
  }

  const mintPrice = cmState?.mintPrice || Number(collection.mint_price?.[0] || 0) / 1e9
  const totalSupply = cmState?.itemsLoaded || Number(collection.total_supply)
  const minted = cmState?.itemsRedeemed || 0
  const remaining = totalSupply - minted
  const mintedPercent = totalSupply > 0 ? (minted / totalSupply) * 100 : 0
  const totalCost = mintPrice * mintAmount
  const maxMint = Math.min(remaining, 10)
  const canMint = status === "live" && connected && remaining > 0 && (isWhitelisted === true || isWhitelisted === null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/nft/launchpad" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Launchpad
      </Link>

      <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden">
        {collection.banner_url?.[0] ? (
          <Image src={collection.banner_url[0]} alt={collection.name} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-4 left-4 flex items-end gap-4">
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-xl overflow-hidden border-4 border-background shadow-xl">
            {collection.image_url ? (
              <Image src={collection.image_url} alt={collection.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
          <div className="text-white pb-2">
            <div className="flex items-center gap-2 mb-1">
              {status === "live" && <Badge className="bg-green-500 text-white"><Flame className="w-3 h-3 mr-1" />Live</Badge>}
              {status === "upcoming" && <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />Upcoming</Badge>}
              {status === "ended" && <Badge variant="secondary" className="bg-gray-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Ended</Badge>}
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Legacy</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{collection.name}</h1>
            <p className="text-white/80 text-sm">{collection.symbol}</p>
          </div>
        </div>

        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-3 py-2">
            {chainInfo && <Image src={chainInfo.icon} alt={chainInfo.name} width={20} height={20} className="rounded-full" />}
            <span className="font-medium">{chainInfo?.name || "Solana"}</span>
          </div>
        </div>

        <div className="absolute top-4 left-4 flex gap-2">
          <Button variant="secondary" size="icon" className="bg-background/90 backdrop-blur-sm" onClick={() => setIsWatchlisted(!isWatchlisted)}>
            <Heart className={`w-4 h-4 ${isWatchlisted ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button variant="secondary" size="icon" className="bg-background/90 backdrop-blur-sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-muted-foreground">{collection.description || "No description available."}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Tag className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-bold">{mintPrice} SOL</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Layers className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Supply</div>
                <div className="font-bold">{totalSupply.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Minted</div>
                <div className="font-bold">{minted.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="font-bold">{remaining.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {totalSupply > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Mint Progress</h2>
                <span className="text-sm text-muted-foreground">{minted.toLocaleString()} / {totalSupply.toLocaleString()}</span>
              </div>
              <Progress value={mintedPercent} className="h-3 mb-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{mintedPercent.toFixed(1)}% minted</span>
                {remaining > 0 && <span>{remaining.toLocaleString()} remaining</span>}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 sticky top-4">
            {status === "upcoming" && cmState?.startTime && (
              <div className="mb-6 text-center">
                <div className="text-sm text-muted-foreground mb-2">Mint starts in</div>
                <div className="flex gap-2 justify-center">
                  {startCountdown.days > 0 && <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{startCountdown.days}</div><div className="text-xs text-muted-foreground">days</div></div>}
                  <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{String(startCountdown.hours).padStart(2, "0")}</div><div className="text-xs text-muted-foreground">hrs</div></div>
                  <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{String(startCountdown.minutes).padStart(2, "0")}</div><div className="text-xs text-muted-foreground">min</div></div>
                  <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{String(startCountdown.seconds).padStart(2, "0")}</div><div className="text-xs text-muted-foreground">sec</div></div>
                </div>
              </div>
            )}

            {status === "live" && cmState?.endTime && (
              <div className="mb-6 text-center">
                <div className="text-sm text-muted-foreground mb-2">Mint ends in</div>
                <div className="flex gap-2 justify-center">
                  {endCountdown.days > 0 && <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{endCountdown.days}</div><div className="text-xs text-muted-foreground">days</div></div>}
                  <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{String(endCountdown.hours).padStart(2, "0")}</div><div className="text-xs text-muted-foreground">hrs</div></div>
                  <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{String(endCountdown.minutes).padStart(2, "0")}</div><div className="text-xs text-muted-foreground">min</div></div>
                  <div className="bg-muted rounded-lg p-2 min-w-[50px]"><div className="text-xl font-bold">{String(endCountdown.seconds).padStart(2, "0")}</div><div className="text-xs text-muted-foreground">sec</div></div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">Price per NFT</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{mintPrice}</span>
                <span className="text-xl text-muted-foreground">SOL</span>
              </div>
            </div>

            <Separator className="my-4" />

            {!connected ? (
              <div className="text-center py-4">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Connect your wallet to mint</p>
                <Button className="w-full" disabled>Connect Wallet</Button>
              </div>
            ) : status === "live" && remaining > 0 ? (
              <>
                {isWhitelisted === false && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">You are not on the whitelist</span>
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Quantity</div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => setMintAmount(Math.max(1, mintAmount - 1))} disabled={mintAmount <= 1}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{mintAmount}</span>
                    <Button variant="outline" size="icon" onClick={() => setMintAmount(Math.min(maxMint, mintAmount + 1))} disabled={mintAmount >= maxMint}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Max {maxMint} per transaction</div>
                </div>

                <div className="bg-muted rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold">{totalCost.toFixed(4)} SOL</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-lg" onClick={handleMint} disabled={isMinting || !canMint}>
                  {isMinting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Minting...</> : `Mint ${mintAmount} NFT${mintAmount > 1 ? "s" : ""}`}
                </Button>
              </>
            ) : status === "upcoming" ? (
              <div className="text-center">
                <Button className="w-full h-12" disabled><Clock className="w-5 h-5 mr-2" />Mint Not Started</Button>
                <p className="text-sm text-muted-foreground mt-2">Set a reminder to be notified when minting begins</p>
                <Button variant="outline" className="w-full mt-3" onClick={() => setIsWatchlisted(true)}>
                  <Heart className={`w-4 h-4 mr-2 ${isWatchlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWatchlisted ? "Watchlisted" : "Add to Watchlist"}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button className="w-full h-12" disabled><CheckCircle className="w-5 h-5 mr-2" />Sold Out</Button>
                <p className="text-sm text-muted-foreground mt-2">This collection has sold out. Check secondary markets.</p>
                <Link href={`/nft/collections/solana/${collection.slug}`}>
                  <Button variant="outline" className="w-full mt-3"><ExternalLink className="w-4 h-4 mr-2" />View Collection</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
