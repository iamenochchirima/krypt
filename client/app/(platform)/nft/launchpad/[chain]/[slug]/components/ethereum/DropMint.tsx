"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, Flame, Calendar, CheckCircle, Share2, Heart, ExternalLink, Minus, Plus, Loader2, Users, Layers, Tag, Wallet, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Collection, EthereumCollectionData } from "@/declarations/registry/registry.did"
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, formatEther } from "viem"
import { getChainById } from "@/types/chains"

const MINT_ABI = [
  { name: 'mint', type: 'function', inputs: [{ name: 'quantity', type: 'uint256' }], outputs: [], stateMutability: 'payable' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'maxSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'mintPrice', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'saleActive', type: 'function', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { name: 'whitelistActive', type: 'function', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { name: 'isWhitelisted', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const

interface DropMintProps {
  collection: Collection
  ethData: EthereumCollectionData
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

export default function DropMint({ collection, ethData }: DropMintProps) {
  const { address, isConnected } = useAccount()
  const [mintAmount, setMintAmount] = useState(1)
  const [isWatchlisted, setIsWatchlisted] = useState(false)

  const contractAddress = ethData.contract_address?.[0] as `0x${string}` | undefined
  const chainInfo = getChainById("ethereum")

  const { data: totalSupplyData } = useReadContract({
    address: contractAddress,
    abi: MINT_ABI,
    functionName: 'totalSupply',
  })

  const { data: maxSupplyData } = useReadContract({
    address: contractAddress,
    abi: MINT_ABI,
    functionName: 'maxSupply',
  })

  const { data: mintPriceData } = useReadContract({
    address: contractAddress,
    abi: MINT_ABI,
    functionName: 'mintPrice',
  })

  const { data: saleActiveData } = useReadContract({
    address: contractAddress,
    abi: MINT_ABI,
    functionName: 'saleActive',
  })

  const { data: whitelistActiveData } = useReadContract({
    address: contractAddress,
    abi: MINT_ABI,
    functionName: 'whitelistActive',
  })

  const { data: isWhitelistedData } = useReadContract({
    address: contractAddress,
    abi: MINT_ABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!whitelistActiveData }
  })

  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isTxSuccess) {
      toast.success("NFT Minted!", { description: `Successfully minted ${mintAmount} NFT(s)` })
    }
  }, [isTxSuccess, mintAmount])

  const totalMinted = totalSupplyData ? Number(totalSupplyData) : 0
  const maxSupply = maxSupplyData ? Number(maxSupplyData) : Number(collection.total_supply)
  const mintPrice = mintPriceData ? Number(formatEther(mintPriceData as bigint)) : Number(collection.mint_price?.[0] || 0) / 1e18
  const saleActive = saleActiveData ?? true
  const whitelistActive = whitelistActiveData ?? false
  const isWhitelisted = isWhitelistedData ?? true

  const remaining = maxSupply - totalMinted
  const mintedPercent = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0

  const getStatus = () => {
    if (remaining <= 0) return "ended"
    if (!saleActive) return "upcoming"
    return "live"
  }

  const status = getStatus()
  const totalCost = mintPrice * mintAmount
  const maxMint = Math.min(remaining, 10)
  const canMint = status === "live" && isConnected && remaining > 0 && (!whitelistActive || isWhitelisted)

  const handleMint = () => {
    if (!contractAddress) {
      toast.error("Contract address not found")
      return
    }

    writeContract({
      address: contractAddress,
      abi: MINT_ABI,
      functionName: 'mint',
      args: [BigInt(mintAmount)],
      value: parseEther(totalCost.toString()),
    })
  }

  const isMinting = isWritePending || isTxLoading

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
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600" />
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
              {status === "ended" && <Badge variant="secondary" className="bg-gray-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Sold Out</Badge>}
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">ERC-721</Badge>
              {whitelistActive && <Badge className="bg-purple-500 text-white">Whitelist</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{collection.name}</h1>
            <p className="text-white/80 text-sm">{collection.symbol}</p>
          </div>
        </div>

        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-3 py-2">
            {chainInfo && <Image src={chainInfo.icon} alt={chainInfo.name} width={20} height={20} className="rounded-full" />}
            <span className="font-medium">{chainInfo?.name || "Ethereum"}</span>
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
                <div className="font-bold">{mintPrice} ETH</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Layers className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Supply</div>
                <div className="font-bold">{maxSupply.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Minted</div>
                <div className="font-bold">{totalMinted.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="font-bold">{remaining.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {maxSupply > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Mint Progress</h2>
                <span className="text-sm text-muted-foreground">{totalMinted.toLocaleString()} / {maxSupply.toLocaleString()}</span>
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
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">Price per NFT</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{mintPrice}</span>
                <span className="text-xl text-muted-foreground">ETH</span>
              </div>
            </div>

            <Separator className="my-4" />

            {!isConnected ? (
              <div className="text-center py-4">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Connect your wallet to mint</p>
                <Button className="w-full" disabled>Connect Wallet</Button>
              </div>
            ) : status === "live" && remaining > 0 ? (
              <>
                {whitelistActive && !isWhitelisted && (
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
                    <span className="text-xl font-bold">{totalCost.toFixed(4)} ETH</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-lg" onClick={handleMint} disabled={isMinting || !canMint}>
                  {isMinting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Minting...</> : `Mint ${mintAmount} NFT${mintAmount > 1 ? "s" : ""}`}
                </Button>
              </>
            ) : status === "upcoming" ? (
              <div className="text-center">
                <Button className="w-full h-12" disabled><Clock className="w-5 h-5 mr-2" />Mint Not Started</Button>
                <p className="text-sm text-muted-foreground mt-2">Sale has not started yet</p>
                <Button variant="outline" className="w-full mt-3" onClick={() => setIsWatchlisted(true)}>
                  <Heart className={`w-4 h-4 mr-2 ${isWatchlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWatchlisted ? "Watchlisted" : "Add to Watchlist"}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button className="w-full h-12" disabled><CheckCircle className="w-5 h-5 mr-2" />Sold Out</Button>
                <p className="text-sm text-muted-foreground mt-2">This collection has sold out.</p>
                <Link href={`/nft/collections/ethereum/${collection.slug}`}>
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
