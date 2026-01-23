"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Flame, Calendar, CheckCircle, Share2, Heart, ExternalLink, Minus, Plus, Loader2, Users, Layers, Tag, Wallet, TreePine, RefreshCw, Grid3X3, User } from "lucide-react"
import { toast } from "sonner"
import { Collection, CompressedCollectionData } from "@/declarations/registry/registry.did"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplBubblegum, mintToCollectionV1 } from "@metaplex-foundation/mpl-bubblegum"
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"
import { Connection, PublicKey } from "@solana/web3.js"
import { getChainById } from "@/types/chains"

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet") as "devnet" | "mainnet-beta"
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || (SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com")
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface TreeState {
  maxCapacity: number
  usedCapacity: number
}

interface MintedNFT {
  id: string
  name: string
  image: string
  owner: string
  jsonUri?: string
}

interface CompressedMintProps {
  collection: Collection
  solanaData: CompressedCollectionData
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

export default function CompressedMint({ collection, solanaData }: CompressedMintProps) {
  const wallet = useWallet()
  const { publicKey: walletPublicKey, connected } = wallet

  const [mintAmount, setMintAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [treeState, setTreeState] = useState<TreeState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalMinted, setTotalMinted] = useState(0)
  const [manifest, setManifest] = useState<any>(null)
  const [nftMetadataUrls, setNftMetadataUrls] = useState<string[]>([])
  const [allNfts, setAllNfts] = useState<MintedNFT[]>([])
  const [myNfts, setMyNfts] = useState<MintedNFT[]>([])
  const [isLoadingNfts, setIsLoadingNfts] = useState(false)
  const [nftTab, setNftTab] = useState("all")

  const merkleTreeAddress = solanaData.merkle_tree_address?.[0] || null
  const collectionMint = solanaData.collection_mint?.[0] || null
  const manifestUrl = solanaData.manifest_url?.[0] || null
  const chainInfo = getChainById("solana")

  const mintPrice = Number(collection.mint_price?.[0] || 0) / 1e9
  const totalSupply = Number(collection.total_supply) || nftMetadataUrls.length

  const getValidImageUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === '') return null
    if (url.startsWith('http') || url.startsWith('ipfs://') || url.startsWith('ar://')) return url
    return null
  }

  const collectionImageUrl = getValidImageUrl(collection.image_url) || getValidImageUrl(manifest?.image) || null
  const bannerImageUrl = getValidImageUrl(collection.banner_url?.[0]) || getValidImageUrl(manifest?.banner) || null

  const fetchTreeState = useCallback(async () => {
    if (!merkleTreeAddress) return
    try {
      const connection = new Connection(SOLANA_RPC_URL)
      const accountInfo = await connection.getAccountInfo(new PublicKey(merkleTreeAddress))
      if (!accountInfo) return

      const data = accountInfo.data
      const maxBufferSize = data.readUInt32LE(9)
      const maxDepth = data.readUInt32LE(13)
      const validMaxDepth = maxDepth > 0 && maxDepth <= 30 ? maxDepth : 14
      const maxCapacity = Math.pow(2, validMaxDepth)

      setTreeState({ maxCapacity, usedCapacity: totalMinted })
    } catch (error) {
      console.error("Failed to fetch tree state:", error)
    }
  }, [merkleTreeAddress, totalMinted])

  const fetchMintedCount = useCallback(async () => {
    if (!collectionMint) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=1&limit=1&compressed=true`)
      if (response.ok) {
        const data = await response.json()
        setTotalMinted(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch minted count:", error)
    }
  }, [collectionMint])

  const metadataCacheRef = useRef<Record<string, { image: string }>>({})

  const fetchNfts = useCallback(async () => {
    if (!collectionMint) return
    setIsLoadingNfts(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=1&limit=50&compressed=true`)
      if (response.ok) {
        const data = await response.json()
        const rawNfts = data.items || data.nfts || []
        const cache = metadataCacheRef.current

        const nfts: MintedNFT[] = rawNfts.map((nft: any) => {
          let imageUrl = nft.image || nft.content?.links?.image || ''
          const jsonUri = nft.content?.json_uri || ''

          if (!imageUrl && jsonUri && cache[jsonUri]) {
            imageUrl = cache[jsonUri].image
          }

          return {
            id: nft.id || nft.assetId || '',
            name: nft.name || nft.content?.metadata?.name || 'Unknown',
            image: imageUrl,
            jsonUri,
            owner: nft.owner || nft.ownership?.owner || '',
          }
        })

        setAllNfts(nfts)
        setTotalMinted(data.total || nfts.length)
        if (walletPublicKey) {
          const myNftsList = nfts.filter(nft => nft.owner === walletPublicKey.toBase58())
          setMyNfts(myNftsList)
        }

        const nftsNeedingMetadata = nfts.filter(nft => !nft.image && nft.jsonUri && !cache[nft.jsonUri])
        if (nftsNeedingMetadata.length > 0) {
          await Promise.all(
            nftsNeedingMetadata.slice(0, 20).map(async (nft) => {
              try {
                const res = await fetch(nft.jsonUri!)
                if (res.ok) {
                  const metadata = await res.json()
                  cache[nft.jsonUri!] = { image: metadata.image || '' }
                }
              } catch (e) {}
            })
          )

          setAllNfts(prev => prev.map(nft => ({
            ...nft,
            image: nft.image || (nft.jsonUri && cache[nft.jsonUri]?.image) || ''
          })))
          if (walletPublicKey) {
            setMyNfts(prev => prev.map(nft => ({
              ...nft,
              image: nft.image || (nft.jsonUri && cache[nft.jsonUri]?.image) || ''
            })))
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch NFTs:", error)
    } finally {
      setIsLoadingNfts(false)
    }
  }, [collectionMint, walletPublicKey])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await Promise.all([fetchTreeState(), fetchMintedCount(), fetchNfts()])
      if (manifestUrl) {
        try {
          const res = await fetch(manifestUrl)
          const data = await res.json()
          setManifest(data)
          if (data.properties?.files) {
            setNftMetadataUrls(data.properties.files.map((f: { uri: string }) => f.uri))
          }
        } catch (e) {
          console.error('Failed to fetch manifest:', e)
        }
      }
      setIsLoading(false)
    }
    init()
  }, [fetchTreeState, fetchMintedCount, fetchNfts, manifestUrl])

  const refreshAll = async () => {
    await Promise.all([fetchTreeState(), fetchMintedCount(), fetchNfts()])
  }

  const getStatus = () => {
    const remaining = totalSupply - totalMinted
    if (remaining <= 0 && totalSupply > 0) return "ended"
    return "live"
  }

  const status = getStatus()
  const remaining = totalSupply > 0 ? totalSupply - totalMinted : (treeState?.maxCapacity || 0) - totalMinted
  const mintedPercent = totalSupply > 0 ? (totalMinted / totalSupply) * 100 : 0

  const handleMint = async () => {
    if (!connected || !walletPublicKey || !merkleTreeAddress || !collectionMint) {
      toast.error("Missing wallet or collection data")
      return
    }

    try {
      setIsMinting(true)
      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplBubblegum())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))

      for (let i = 0; i < mintAmount; i++) {
        const mintIndex = totalMinted + i
        const uri = nftMetadataUrls[mintIndex] || manifest?.image || collection.image_url || ''
        const name = `${collection.name} #${mintIndex + 1}`

        const mintTx = await mintToCollectionV1(umi, {
          leafOwner: umi.identity.publicKey,
          merkleTree: umiPublicKey(merkleTreeAddress),
          collectionMint: umiPublicKey(collectionMint),
          metadata: {
            name,
            symbol: collection.symbol,
            uri,
            sellerFeeBasisPoints: collection.royalty_bps,
            collection: { key: umiPublicKey(collectionMint), verified: false },
            creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }],
          },
        })

        await mintTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
        toast.success(`Minted cNFT ${i + 1}/${mintAmount}!`)
      }

      setTotalMinted(prev => prev + mintAmount)
      await refreshAll()
    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Mint failed", { description: error?.message })
    } finally {
      setIsMinting(false)
    }
  }

  const totalCost = mintPrice * mintAmount
  const maxMint = Math.min(remaining > 0 ? remaining : 10, 10)
  const canMint = status === "live" && connected && remaining > 0

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
        {bannerImageUrl ? (
          <Image src={bannerImageUrl} alt={collection.name} fill className="object-cover" priority unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-4 left-4 flex items-end gap-4">
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-xl overflow-hidden border-4 border-background shadow-xl">
            {collectionImageUrl ? (
              <Image src={collectionImageUrl} alt={collection.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {collection.symbol?.slice(0, 2) || collection.name?.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="text-white pb-2">
            <div className="flex items-center gap-2 mb-1">
              {status === "live" && <Badge className="bg-green-500 text-white"><Flame className="w-3 h-3 mr-1" />Live</Badge>}
              {status === "ended" && <Badge variant="secondary" className="bg-gray-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Sold Out</Badge>}
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30"><TreePine className="w-3 h-3 mr-1" />cNFT</Badge>
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
                <div className="font-bold">{mintPrice > 0 ? `${mintPrice} SOL` : '~0.00005 SOL'}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Layers className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Supply</div>
                <div className="font-bold">{totalSupply > 0 ? totalSupply.toLocaleString() : 'Open'}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Minted</div>
                <div className="font-bold">{totalMinted.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="font-bold">{totalSupply > 0 ? remaining.toLocaleString() : '∞'}</div>
              </div>
            </div>
          </Card>

          {totalSupply > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Mint Progress</h2>
                <span className="text-sm text-muted-foreground">{totalMinted.toLocaleString()} / {totalSupply.toLocaleString()}</span>
              </div>
              <Progress value={mintedPercent} className="h-3 mb-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{mintedPercent.toFixed(1)}% minted</span>
                {remaining > 0 && <span>{remaining.toLocaleString()} remaining</span>}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Minted NFTs</h2>
              <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoadingNfts}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingNfts ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <Tabs value={nftTab} onValueChange={setNftTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  All NFTs ({allNfts.length})
                </TabsTrigger>
                <TabsTrigger value="my" className="gap-2">
                  <User className="w-4 h-4" />
                  My NFTs ({myNfts.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {isLoadingNfts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allNfts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No NFTs minted yet</p>
                    <p className="text-sm">Be the first to mint from this collection!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allNfts.map((nft) => (
                      <div key={nft.id} className="group relative rounded-lg overflow-hidden border bg-muted/50 hover:border-primary/50 transition-colors">
                        <div className="aspect-square relative">
                          {nft.image ? (
                            <Image src={nft.image} alt={nft.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">
                              {nft.name?.slice(0, 2) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="font-medium text-sm truncate">{nft.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {nft.owner ? `${nft.owner.slice(0, 4)}...${nft.owner.slice(-4)}` : "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="my">
                {!connected ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Connect your wallet to see your NFTs</p>
                  </div>
                ) : isLoadingNfts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : myNfts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>You haven't minted any NFTs yet</p>
                    <p className="text-sm">Mint some NFTs to see them here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {myNfts.map((nft) => (
                      <div key={nft.id} className="group relative rounded-lg overflow-hidden border bg-muted/50 hover:border-primary/50 transition-colors">
                        <div className="aspect-square relative">
                          {nft.image ? (
                            <Image src={nft.image} alt={nft.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">
                              {nft.name?.slice(0, 2) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="font-medium text-sm truncate">{nft.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 sticky top-4">
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-1">Price per NFT</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{mintPrice > 0 ? mintPrice : '~0.00005'}</span>
                <span className="text-xl text-muted-foreground">SOL</span>
              </div>
              {mintPrice === 0 && <p className="text-xs text-muted-foreground mt-1">Only tree storage cost</p>}
            </div>

            <Separator className="my-4" />

            {!connected ? (
              <div className="text-center py-4">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Connect your wallet to mint</p>
                <Button className="w-full" disabled>Connect Wallet</Button>
              </div>
            ) : status === "live" ? (
              <>
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
                    <span className="text-xl font-bold">{mintPrice > 0 ? `${totalCost.toFixed(4)} SOL` : `~${(0.00005 * mintAmount).toFixed(5)} SOL`}</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" onClick={handleMint} disabled={isMinting || !canMint}>
                  {isMinting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Minting...</> : `Mint ${mintAmount} cNFT${mintAmount > 1 ? "s" : ""}`}
                </Button>
              </>
            ) : (
              <div className="text-center">
                <Button className="w-full h-12" disabled><CheckCircle className="w-5 h-5 mr-2" />Sold Out</Button>
                <p className="text-sm text-muted-foreground mt-2">This collection has sold out.</p>
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
