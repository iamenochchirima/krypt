"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, Sparkles, RefreshCw, Grid3X3, Settings, Wallet, Minus, Plus, Layers } from "lucide-react"
import { toast } from "sonner"
import { Collection, EthereumCollectionData } from "@/declarations/registry/registry.did"
import { useAccount, useChainId, useSwitchChain, usePublicClient, useWalletClient } from "wagmi"

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

interface EditionManageProps {
  collection: Collection
  ethData: EthereumCollectionData
}

export default function EditionManage({ collection, ethData }: EditionManageProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [copied, setCopied] = useState<string | null>(null)
  const [manifest, setManifest] = useState<any>(null)
  const [editionImage, setEditionImage] = useState<string | null>(null)

  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [mintQuantity, setMintQuantity] = useState(1)
  const [totalMinted, setTotalMinted] = useState<bigint | null>(null)
  const [maxSupply, setMaxSupply] = useState<bigint | null>(null)

  const contractAddress = ethData?.contract_address?.[0] || null
  const manifestUrl = ethData?.manifest_url?.[0] || null
  const collectionChainId = ethData ? Number(ethData.chain_id) : 1
  const mintPriceWei = ethData?.mint_price_wei?.[0] || BigInt(0)

  useEffect(() => {
    if (manifestUrl && !manifest) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(async data => {
          setManifest(data)
          // For editions, get the first (usually only) token metadata
          if (data.properties?.files?.[0]?.uri) {
            try {
              const metaRes = await fetch(data.properties.files[0].uri)
              const metadata = await metaRes.json()
              setEditionImage(metadata.image || data.image)
            } catch {
              setEditionImage(data.image)
            }
          } else {
            setEditionImage(data.image)
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

  const fetchContractState = useCallback(async () => {
    if (!contractAddress || !publicClient) return
    try {
      // For ERC-1155, totalMinted for tokenId 0 or totalSupply(0)
      const [minted, supply] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'totalMinted', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'totalMinted',
        }).catch(() =>
          // Try alternative: totalSupply(tokenId)
          publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: [{ name: 'totalSupply', type: 'function', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
            functionName: 'totalSupply',
            args: [BigInt(0)],
          }).catch(() => null)
        ),
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
  }, [contractAddress, publicClient])

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

      // ERC-1155 mint function: mint(tokenId, quantity)
      const mintAbi = [{
        name: 'mint',
        type: 'function',
        inputs: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'quantity', type: 'uint256' }
        ],
        outputs: [],
        stateMutability: 'payable'
      }]

      const totalValue = mintPriceWei * BigInt(mintQuantity)

      setMintStep("Confirm in wallet...")
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: mintAbi,
        functionName: 'mint',
        args: [BigInt(0), BigInt(mintQuantity)], // tokenId = 0 for editions
        value: totalValue,
      })

      setMintStep("Waiting for confirmation...")
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success(`${mintQuantity} ${mintQuantity > 1 ? 'copies' : 'copy'} Minted!`, {
        action: {
          label: "View TX",
          onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank')
        }
      })

      fetchContractState()
      setMintModalOpen(false)
    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Mint failed", { description: error?.message || "Check console" })
    } finally {
      setIsMinting(false)
      setMintStep("")
    }
  }

  const mintPrice = Number(mintPriceWei) / 1e18
  const totalPrice = mintPrice * mintQuantity

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {editionImage || manifest?.image ? (
          <img src={editionImage || manifest?.image} alt={collection.name} className="w-40 h-40 rounded-2xl object-cover shadow-lg" />
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
              <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">Edition (ERC-1155)</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMintModalOpen(true)} className="gap-2">
              <Layers className="h-4 w-4" />
              Mint Copies
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
            <div className="text-sm text-muted-foreground">Copies Minted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{maxSupply !== null ? (maxSupply === BigInt(0) ? '∞' : maxSupply.toString()) : collection.total_supply.toString()}</div>
            <div className="text-sm text-muted-foreground">Max Copies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{Number(collection.royalty_bps) / 100}%</div>
            <div className="text-sm text-muted-foreground">Royalties</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-cyan-500 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-cyan-700 dark:text-cyan-300 mb-1">Edition Collection (ERC-1155)</div>
            <p className="text-cyan-600 dark:text-cyan-400">
              This is an edition collection where multiple copies of the same artwork can be minted. Each copy shares the same token ID (0) but is individually owned.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="edition" className="space-y-6">
        <TabsList>
          <TabsTrigger value="edition" className="gap-2"><Layers className="h-4 w-4" />Edition</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Details</TabsTrigger>
        </TabsList>

        <TabsContent value="edition" className="space-y-4">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Edition Artwork */}
              <div className="aspect-square bg-muted flex items-center justify-center">
                {editionImage || manifest?.image || collection.image_url ? (
                  <img
                    src={editionImage || manifest?.image || collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              {/* Edition Info */}
              <div className="p-6 flex flex-col justify-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{collection.name}</h3>
                  <p className="text-muted-foreground mt-2">{collection.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Token ID</span>
                    <span className="font-mono font-bold">0</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Copies Minted</span>
                    <span className="font-bold text-lg">
                      {totalMinted !== null ? totalMinted.toString() : '-'}
                      {maxSupply !== null && maxSupply > BigInt(0) && (
                        <span className="text-muted-foreground font-normal"> / {maxSupply.toString()}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Price per Copy</span>
                    <span className="font-bold">{mintPrice} ETH</span>
                  </div>
                </div>

                <Button onClick={() => setMintModalOpen(true)} className="w-full gap-2" size="lg">
                  <Layers className="h-4 w-4" />
                  Mint Copies
                </Button>
              </div>
            </div>
          </Card>
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
                  <div><div className="text-sm text-muted-foreground">Type</div><div className="font-medium">ERC-1155</div></div>
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
            <DialogTitle>Mint Copies</DialogTitle>
            <DialogDescription>Mint copies of {collection.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Price per Copy</div>
                <div className="text-2xl font-bold">{mintPrice} ETH</div>
              </div>
              {(editionImage || manifest?.image || collection.image_url) && (
                <img src={editionImage || manifest?.image || collection.image_url} alt={collection.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                  disabled={mintQuantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={mintQuantity}
                    onChange={(e) => setMintQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="text-center text-lg font-bold"
                    min={1}
                    max={100}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMintQuantity(Math.min(100, mintQuantity + 1))}
                  disabled={mintQuantity >= 100}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Max 100 copies per transaction</p>
            </div>

            {/* Total Price */}
            <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{totalPrice.toFixed(4)} ETH</span>
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
              <div className="flex items-center gap-2 p-3 bg-cyan-500/10 text-cyan-500 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mintStep}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleMint} disabled={isMinting || !isConnected}>
              {isMinting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
              ) : (
                <><Layers className="h-4 w-4 mr-2" />Mint {mintQuantity} {mintQuantity > 1 ? 'copies' : 'copy'} for {totalPrice.toFixed(4)} ETH</>
              )}
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
