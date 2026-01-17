"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getRegistryActor } from "@/providers/actors/marketplace"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, Sparkles, RefreshCw, Grid3X3, Settings, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Collection } from "@/declarations/registry/registry.did"
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWalletClient } from "wagmi"
import { formatEther, parseEther } from "viem"

const getExplorerUrl = (chainId: number, address: string, type: 'address' | 'tx' = 'address') => {
  const base = {
    1: 'https://etherscan.io',
    8453: 'https://basescan.org',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    11155111: 'https://sepolia.etherscan.io',
    84532: 'https://sepolia.basescan.org',
  }[chainId] || 'https://etherscan.io'
  return `${base}/${type}/${address}`
}

const getChainName = (chainId: number) => {
  return {
    1: 'Ethereum',
    8453: 'Base',
    137: 'Polygon',
    42161: 'Arbitrum',
    11155111: 'Sepolia',
    84532: 'Base Sepolia',
  }[chainId] || 'Unknown'
}

export default function ManageEthereumCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [manifest, setManifest] = useState<any>(null)
  const [nftImages, setNftImages] = useState<Record<string, string>>({})

  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [totalMinted, setTotalMinted] = useState<bigint | null>(null)
  const [maxSupply, setMaxSupply] = useState<bigint | null>(null)

  const ethData = collection && 'Ethereum' in collection.chain_data ? collection.chain_data.Ethereum : null
  const contractAddress = ethData?.contract_address?.[0] || null
  const manifestUrl = ethData?.manifest_url?.[0] || null
  const collectionChainId = ethData ? Number(ethData.chain_id) : 1
  const mintPriceWei = ethData?.mint_price_wei?.[0] || BigInt(0)
  const contractType = ethData?.contract_type ? ('ERC721' in ethData.contract_type ? 'ERC-721' : 'ERC-1155') : 'Unknown'

  useEffect(() => {
    if (!isAuthenticated || !collectionId || !identity) return
    loadCollectionData()
  }, [isAuthenticated, collectionId, identity])

  useEffect(() => {
    if (manifestUrl && !manifest) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(async data => {
          setManifest(data)
          if (data.properties?.files) {
            const imagePromises = data.properties.files.slice(0, 20).map(async (file: { uri: string }, index: number) => {
              try {
                const res = await fetch(file.uri)
                const metadata = await res.json()
                return { index: String(index), name: metadata.name, image: metadata.image }
              } catch {
                return null
              }
            })
            const results = await Promise.all(imagePromises)
            const images: Record<string, string> = {}
            results.forEach(r => {
              if (r?.image) {
                images[r.index] = r.image
                if (r.name) images[r.name] = r.image
              }
            })
            setNftImages(images)
          }
        })
        .catch(err => console.error('Failed to fetch manifest:', err))
    }
  }, [manifestUrl])

  useEffect(() => {
    if (contractAddress && publicClient && chainId === collectionChainId) {
      fetchContractState()
    }
  }, [contractAddress, publicClient, chainId, collectionChainId])

  const loadCollectionData = async () => {
    if (!identity) return
    try {
      setIsLoading(true)
      const actor = await getRegistryActor(identity)
      const result = await actor.get_collection(collectionId)
      if (!result || result.length === 0) throw new Error("Collection not found")

      const collectionData = result[0]
      if (collectionData.creator.toString() !== identity.getPrincipal().toString()) {
        toast.error("You don't have permission to manage this collection")
        router.push('/nft/collections')
        return
      }
      setCollection(collectionData)
    } catch (error) {
      console.error("Failed to load collection:", error)
      toast.error("Failed to load collection data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContractState = async () => {
    if (!contractAddress || !publicClient) return
    try {
      const [minted, supply] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'totalMinted', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'totalMinted',
        }).catch(() => null),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'maxSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'maxSupply',
        }).catch(() => null),
      ])
      if (minted !== null) setTotalMinted(minted as bigint)
      if (supply !== null) setMaxSupply(supply as bigint)
    } catch (error) {
      console.error("Failed to fetch contract state:", error)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const handleMint = async () => {
    if (!isConnected || !address || !walletClient || !contractAddress) {
      toast.error("Please connect your wallet")
      return
    }
    if (chainId !== collectionChainId) {
      toast.error(`Please switch to ${getChainName(collectionChainId)}`)
      switchChain({ chainId: collectionChainId })
      return
    }

    try {
      setIsMinting(true)
      setMintStep("Preparing transaction...")

      const mintAbi = [{
        name: 'mint',
        type: 'function',
        inputs: [{ name: 'quantity', type: 'uint256' }],
        outputs: [],
        stateMutability: 'payable'
      }]

      setMintStep("Confirm in wallet...")
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: mintAbi,
        functionName: 'mint',
        args: [BigInt(1)],
        value: mintPriceWei,
      })

      setMintStep("Waiting for confirmation...")
      const receipt = await publicClient?.waitForTransactionReceipt({ hash })

      toast.success("NFT Minted!", {
        action: {
          label: "View TX",
          onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank')
        }
      })

      fetchContractState()
    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Mint failed", { description: error?.message || "Check console" })
    } finally {
      setIsMinting(false)
      setMintStep("")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Card><CardContent className="py-12 text-center text-muted-foreground">Collection not found</CardContent></Card>
      </div>
    )
  }

  const mintPrice = Number(mintPriceWei) / 1e18

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {manifest?.image ? (
          <img src={manifest.image} alt={collection.name} className="w-40 h-40 rounded-2xl object-cover shadow-lg" />
        ) : collection.image_url ? (
          <img src={collection.image_url} alt={collection.name} className="w-40 h-40 rounded-2xl object-cover shadow-lg" />
        ) : (
          <div className="w-40 h-40 rounded-2xl bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              <Badge variant="secondary">{collection.symbol}</Badge>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{getChainName(collectionChainId)}</Badge>
              <Badge variant="outline">{contractType}</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMintModalOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Mint NFT
            </Button>
            <Button variant="outline" onClick={fetchContractState}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {contractAddress && (
              <Button variant="outline" onClick={() => window.open(getExplorerUrl(collectionChainId, contractAddress), '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Explorer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{mintPrice} ETH</div>
            <div className="text-sm text-muted-foreground">Mint Price</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalMinted !== null ? totalMinted.toString() : '-'}</div>
            <div className="text-sm text-muted-foreground">Minted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{maxSupply !== null ? (maxSupply === BigInt(0) ? '∞' : maxSupply.toString()) : collection.total_supply.toString()}</div>
            <div className="text-sm text-muted-foreground">Max Supply</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{Number(collection.royalty_bps) / 100}%</div>
            <div className="text-sm text-muted-foreground">Royalties</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nfts" className="gap-2"><Grid3X3 className="h-4 w-4" />NFTs</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Details</TabsTrigger>
        </TabsList>

        <TabsContent value="nfts" className="space-y-4">
          {Object.keys(nftImages).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">NFT previews from manifest</p>
                <Button className="mt-4" onClick={() => setMintModalOpen(true)}>Mint an NFT</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.entries(nftImages).filter(([key]) => !isNaN(Number(key))).map(([index, imageUrl]) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    <img src={imageUrl} alt={`NFT #${index}`} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">#{index}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Contract</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {contractAddress && (
                  <div>
                    <label className="text-sm text-muted-foreground">Contract Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{contractAddress}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(contractAddress, 'contract')}>
                        {copied === 'contract' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><div className="text-sm text-muted-foreground">Chain</div><div className="font-medium">{getChainName(collectionChainId)}</div></div>
                  <div><div className="text-sm text-muted-foreground">Type</div><div className="font-medium">{contractType}</div></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Collection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Registry ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{collection.id}</code>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(collection.id, 'id')}>
                      {copied === 'id' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {manifestUrl && (
                  <div>
                    <label className="text-sm text-muted-foreground">Manifest URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{manifestUrl}</code>
                      <Button size="icon" variant="ghost" onClick={() => window.open(manifestUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mint Modal */}
      <Dialog open={mintModalOpen} onOpenChange={setMintModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mint NFT</DialogTitle>
            <DialogDescription>Mint a new NFT from {collection.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Price</div>
                <div className="text-2xl font-bold">{mintPrice} ETH</div>
              </div>
              {(manifest?.image || collection.image_url) && (
                <img src={manifest?.image || collection.image_url} alt={collection.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500/10 text-green-500" : ""}>
                {isConnected ? (chainId === collectionChainId ? "Connected" : "Wrong Chain") : "Disconnected"}
              </Badge>
            </div>

            {mintStep && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-500 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mintStep}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleMint} disabled={isMinting || !isConnected}>
              {isMinting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</> : <><Sparkles className="h-4 w-4 mr-2" />Mint for {mintPrice} ETH</>}
            </Button>

            {!isConnected && (
              <p className="text-xs text-center text-muted-foreground">Connect your wallet using the button in the navigation bar</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
