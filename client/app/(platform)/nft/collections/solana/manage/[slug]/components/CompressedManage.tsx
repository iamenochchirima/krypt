"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, TreePine, RefreshCw, Grid3X3, Settings, Wallet, Plus, AlertTriangle, Info, Users, Download, Send, Layers } from "lucide-react"
import { toast } from "sonner"
import { Collection, CompressedCollectionData } from "@/declarations/registry/registry.did"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplBubblegum, mintToCollectionV1 } from "@metaplex-foundation/mpl-bubblegum"
import { Connection, PublicKey } from "@solana/web3.js"
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey, none } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

interface HolderInfo {
  wallet: string
  count: number
  nfts: string[]
}

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
  ? "mainnet-beta"
  : "devnet") as "devnet" | "mainnet-beta"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com")

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface CompressedNFT {
  id: string
  content?: {
    json_uri?: string
    metadata?: {
      name?: string
      symbol?: string
      description?: string
    }
    links?: {
      image?: string
    }
  }
  compression?: {
    leaf_id: number
    tree: string
  }
  ownership?: {
    owner: string
  }
}

interface MerkleTreeState {
  publicKey: string
  authority: string
  maxDepth: number
  maxBufferSize: number
  canopyDepth: number
  activeIndex: number
  maxCapacity: number
  usedCapacity: number
}

interface CompressedManageProps {
  collection: Collection
  solanaData: CompressedCollectionData
}

export default function CompressedManage({ collection, solanaData }: CompressedManageProps) {
  const wallet = useWallet()
  const { publicKey: walletPublicKey, connected } = wallet

  const [copied, setCopied] = useState<string | null>(null)
  const [treeState, setTreeState] = useState<MerkleTreeState | null>(null)
  const [isLoadingTree, setIsLoadingTree] = useState(false)

  const [cNFTs, setCNFTs] = useState<CompressedNFT[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [totalCNFTs, setTotalCNFTs] = useState(0)

  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [newAssetName, setNewAssetName] = useState("")
  const [newAssetUri, setNewAssetUri] = useState("")

  const [manifest, setManifest] = useState<{ image?: string; name?: string; properties?: { files?: Array<{ uri: string }> } } | null>(null)
  const [nftMetadataUrls, setNftMetadataUrls] = useState<string[]>([])
  const [currentMintIndex, setCurrentMintIndex] = useState(0)

  const [batchMintModalOpen, setBatchMintModalOpen] = useState(false)
  const [batchMintQuantity, setBatchMintQuantity] = useState(5)
  const [isBatchMinting, setIsBatchMinting] = useState(false)
  const [batchMintProgress, setBatchMintProgress] = useState(0)
  const [batchMintStep, setBatchMintStep] = useState("")

  const [airdropModalOpen, setAirdropModalOpen] = useState(false)
  const [airdropWallets, setAirdropWallets] = useState("")
  const [isAirdropping, setIsAirdropping] = useState(false)
  const [airdropProgress, setAirdropProgress] = useState(0)
  const [airdropStep, setAirdropStep] = useState("")

  const [holders, setHolders] = useState<HolderInfo[]>([])
  const [isLoadingHolders, setIsLoadingHolders] = useState(false)

  const merkleTreeAddress = solanaData.merkle_tree_address?.[0] || null
  const collectionMint = solanaData.collection_mint?.[0] || null
  const manifestUrl = solanaData.manifest_url?.[0] || null

  useEffect(() => {
    if (merkleTreeAddress && !treeState && !isLoadingTree) {
      fetchTreeState()
    }
  }, [merkleTreeAddress])

  useEffect(() => {
    if (collectionMint && cNFTs.length === 0 && !isLoadingNFTs) {
      fetchCompressedNFTs()
    }
  }, [collectionMint])

  useEffect(() => {
    if (manifestUrl && !manifest) {
      console.log('Fetching manifest from:', manifestUrl)
      fetch(manifestUrl)
        .then(res => res.json())
        .then(data => {
          console.log('Manifest loaded:', data)
          setManifest(data)
          if (data.properties?.files) {
            const urls = data.properties.files.map((f: { uri: string }) => f.uri)
            console.log('Extracted metadata URLs:', urls.length)
            setNftMetadataUrls(urls)
          } else {
            console.warn('Manifest missing properties.files array')
          }
        })
        .catch(err => console.error('Failed to fetch manifest:', err))
    }
  }, [manifestUrl])

  const fetchTreeState = useCallback(async () => {
    if (!merkleTreeAddress) return
    try {
      setIsLoadingTree(true)
      const connection = new Connection(SOLANA_RPC_URL)
      const accountInfo = await connection.getAccountInfo(new PublicKey(merkleTreeAddress))

      if (!accountInfo) throw new Error("Tree not found")

      const data = accountInfo.data
      const maxBufferSize = data.readUInt32LE(9)
      const maxDepth = data.readUInt32LE(13)
      const authority = new PublicKey(data.slice(17, 49)).toString()

      const validMaxDepth = maxDepth > 0 && maxDepth <= 30 ? maxDepth : 14
      const validBufferSize = maxBufferSize > 0 && maxBufferSize <= 2048 ? maxBufferSize : 64
      const maxCapacity = Math.pow(2, validMaxDepth)

      setTreeState({
        publicKey: merkleTreeAddress,
        authority,
        maxDepth: validMaxDepth,
        maxBufferSize: validBufferSize,
        canopyDepth: 0,
        activeIndex: totalCNFTs,
        maxCapacity,
        usedCapacity: totalCNFTs,
      })
    } catch (error) {
      console.error("Failed to fetch merkle tree state:", error)
    } finally {
      setIsLoadingTree(false)
    }
  }, [merkleTreeAddress, totalCNFTs])

  const fetchCompressedNFTs = async (page = 1, refresh = false) => {
    if (!collectionMint) return
    try {
      setIsLoadingNFTs(true)
      // Using DAS API endpoint for compressed NFTs
      const url = `${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=${page}&limit=20${refresh ? '&refresh=true' : ''}&compressed=true`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch cNFTs")
      const data = await response.json()
      setCNFTs(data.items || [])
      setTotalCNFTs(data.total || 0)
      setCurrentMintIndex(data.total || 0)
    } catch (error) {
      console.error("Failed to fetch compressed NFTs:", error)
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const openInExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=${SOLANA_NETWORK}`, '_blank')
  }

  const handleMint = async () => {
    if (!connected || !walletPublicKey) {
      toast.error("Please connect your Solana wallet")
      return
    }
    if (!merkleTreeAddress || !collectionMint) {
      toast.error("Missing merkle tree or collection address")
      return
    }

    // Determine the URI for the new asset
    let assetUri = newAssetUri
    let assetName = newAssetName

    if (!assetUri && nftMetadataUrls.length > currentMintIndex) {
      assetUri = nftMetadataUrls[currentMintIndex]
      assetName = assetName || `${collection.name} #${currentMintIndex + 1}`
    }

    if (!assetUri) {
      toast.error("Please provide an asset URI or ensure metadata URLs are available")
      return
    }

    try {
      setIsMinting(true)
      setMintStep("Initializing...")

      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplBubblegum())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))

      setMintStep("Minting compressed NFT...")

      const mintTx = await mintToCollectionV1(umi, {
        leafOwner: umi.identity.publicKey,
        merkleTree: umiPublicKey(merkleTreeAddress),
        collectionMint: umiPublicKey(collectionMint),
        metadata: {
          name: assetName || `${collection.name} #${currentMintIndex + 1}`,
          symbol: collection.symbol,
          uri: assetUri,
          sellerFeeBasisPoints: collection.royalty_bps,
          collection: { key: umiPublicKey(collectionMint), verified: false },
          creators: [
            {
              address: umi.identity.publicKey,
              verified: false,
              share: 100,
            },
          ],
        },
      })

      setMintStep("Confirm in wallet...")
      await mintTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

      toast.success("cNFT Minted!", {
        description: "Compressed NFT created successfully"
      })

      // Reset and refresh
      setNewAssetName("")
      setNewAssetUri("")
      setCurrentMintIndex(prev => prev + 1)
      fetchTreeState()
      setTimeout(() => fetchCompressedNFTs(1, true), 2000)

    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Failed to mint cNFT", { description: error?.message || "Check console" })
    } finally {
      setIsMinting(false)
      setMintStep("")
    }
  }

  const handleBatchMint = async () => {
    if (!connected || !walletPublicKey || !merkleTreeAddress || !collectionMint) {
      toast.error("Missing wallet or collection data")
      return
    }
    if (nftMetadataUrls.length === 0) {
      toast.error("No metadata URLs in manifest")
      return
    }

    const availableUrls = nftMetadataUrls.slice(currentMintIndex, currentMintIndex + batchMintQuantity)
    if (availableUrls.length === 0) {
      toast.error("No more metadata URLs available")
      return
    }

    try {
      setIsBatchMinting(true)
      setBatchMintProgress(0)
      setBatchMintStep("Initializing...")

      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplBubblegum())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))

      let successCount = 0
      for (let i = 0; i < availableUrls.length; i++) {
        const uri = availableUrls[i]
        const mintIndex = currentMintIndex + i
        setBatchMintStep(`Minting ${i + 1}/${availableUrls.length}...`)
        setBatchMintProgress(Math.round((i / availableUrls.length) * 100))

        try {
          const mintTx = await mintToCollectionV1(umi, {
            leafOwner: umi.identity.publicKey,
            merkleTree: umiPublicKey(merkleTreeAddress),
            collectionMint: umiPublicKey(collectionMint),
            metadata: {
              name: `${collection.name} #${mintIndex + 1}`,
              symbol: collection.symbol,
              uri,
              sellerFeeBasisPoints: collection.royalty_bps,
              collection: { key: umiPublicKey(collectionMint), verified: false },
              creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }],
            },
          })
          await mintTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
          successCount++
        } catch (err) {
          console.error(`Failed to mint #${mintIndex + 1}:`, err)
        }
      }

      setBatchMintProgress(100)
      toast.success(`Batch mint complete`, { description: `${successCount}/${availableUrls.length} cNFTs minted` })
      setCurrentMintIndex(prev => prev + successCount)
      setBatchMintModalOpen(false)
      fetchTreeState()
      setTimeout(() => fetchCompressedNFTs(1, true), 2000)
    } catch (error: any) {
      toast.error("Batch mint failed", { description: error?.message })
    } finally {
      setIsBatchMinting(false)
      setBatchMintStep("")
      setBatchMintProgress(0)
    }
  }

  const handleAirdrop = async () => {
    if (!connected || !walletPublicKey || !merkleTreeAddress || !collectionMint) {
      toast.error("Missing wallet or collection data")
      return
    }

    const walletList = airdropWallets.split('\n').map(w => w.trim()).filter(w => w.length > 0)
    if (walletList.length === 0) {
      toast.error("Please enter wallet addresses")
      return
    }

    const availableUrls = nftMetadataUrls.slice(currentMintIndex, currentMintIndex + walletList.length)
    if (availableUrls.length < walletList.length && nftMetadataUrls.length > 0) {
      toast.error(`Only ${availableUrls.length} metadata URLs available for ${walletList.length} wallets`)
      return
    }

    try {
      setIsAirdropping(true)
      setAirdropProgress(0)
      setAirdropStep("Initializing...")

      const umi = createUmi(SOLANA_RPC_URL)
        .use(mplBubblegum())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))

      let successCount = 0
      for (let i = 0; i < walletList.length; i++) {
        const targetWallet = walletList[i]
        const uri = availableUrls[i] || `${collection.image_url || ''}`
        const mintIndex = currentMintIndex + i
        setAirdropStep(`Airdropping to ${targetWallet.slice(0, 4)}...${targetWallet.slice(-4)} (${i + 1}/${walletList.length})`)
        setAirdropProgress(Math.round((i / walletList.length) * 100))

        try {
          new PublicKey(targetWallet)
        } catch {
          console.error(`Invalid wallet: ${targetWallet}`)
          continue
        }

        try {
          const mintTx = await mintToCollectionV1(umi, {
            leafOwner: umiPublicKey(targetWallet),
            merkleTree: umiPublicKey(merkleTreeAddress),
            collectionMint: umiPublicKey(collectionMint),
            metadata: {
              name: `${collection.name} #${mintIndex + 1}`,
              symbol: collection.symbol,
              uri,
              sellerFeeBasisPoints: collection.royalty_bps,
              collection: { key: umiPublicKey(collectionMint), verified: false },
              creators: [{ address: umi.identity.publicKey, verified: false, share: 100 }],
            },
          })
          await mintTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
          successCount++
        } catch (err) {
          console.error(`Failed to airdrop to ${targetWallet}:`, err)
        }
      }

      setAirdropProgress(100)
      toast.success(`Airdrop complete`, { description: `${successCount}/${walletList.length} cNFTs sent` })
      setCurrentMintIndex(prev => prev + successCount)
      setAirdropWallets("")
      setAirdropModalOpen(false)
      fetchTreeState()
      setTimeout(() => fetchCompressedNFTs(1, true), 2000)
    } catch (error: any) {
      toast.error("Airdrop failed", { description: error?.message })
    } finally {
      setIsAirdropping(false)
      setAirdropStep("")
      setAirdropProgress(0)
    }
  }

  const fetchHolders = async () => {
    if (cNFTs.length === 0) return
    setIsLoadingHolders(true)
    try {
      const holderMap = new Map<string, { count: number; nfts: string[] }>()
      for (const nft of cNFTs) {
        const owner = nft.ownership?.owner || 'Unknown'
        const existing = holderMap.get(owner) || { count: 0, nfts: [] }
        existing.count++
        existing.nfts.push(nft.id)
        holderMap.set(owner, existing)
      }
      const holderList: HolderInfo[] = Array.from(holderMap.entries())
        .map(([wallet, data]) => ({ wallet, ...data }))
        .sort((a, b) => b.count - a.count)
      setHolders(holderList)
    } catch (error) {
      console.error("Failed to process holders:", error)
    } finally {
      setIsLoadingHolders(false)
    }
  }

  const exportHoldersCSV = () => {
    if (holders.length === 0) return
    const csv = ['Wallet,Count,NFT IDs', ...holders.map(h => `${h.wallet},${h.count},"${h.nfts.join(', ')}"`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collection.slug || collection.id}-holders.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  const mintPrice = Number(collection.mint_price?.[0] || 0) / 1_000_000_000
  const treeUsagePercent = treeState ? Math.round((treeState.usedCapacity / treeState.maxCapacity) * 100) : 0
  const remainingCapacity = treeState ? treeState.maxCapacity - treeState.usedCapacity : 0
  const remainingMetadata = nftMetadataUrls.length - currentMintIndex
  const hasManifest = nftMetadataUrls.length > 0
  const canMint = !hasManifest || remainingMetadata > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {manifest?.image ? (
          <img
            src={manifest.image}
            alt={collection.name}
            className="w-40 h-40 rounded-2xl object-cover shadow-lg"
          />
        ) : collection.image_url ? (
          <img
            src={collection.image_url}
            alt={collection.name}
            className="w-40 h-40 rounded-2xl object-cover shadow-lg"
          />
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
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">cNFT</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button onClick={() => setMintModalOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700" disabled={!canMint}>
                      <Plus className="h-4 w-4" />
                      Mint cNFT
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canMint && <TooltipContent>Fully minted ({nftMetadataUrls.length}/{nftMetadataUrls.length})</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button onClick={() => setBatchMintModalOpen(true)} variant="outline" className="gap-2" disabled={!canMint}>
                      <Layers className="h-4 w-4" />
                      Batch Mint
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canMint && <TooltipContent>Fully minted</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button onClick={() => setAirdropModalOpen(true)} variant="outline" className="gap-2" disabled={!canMint}>
                      <Send className="h-4 w-4" />
                      Airdrop
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canMint && <TooltipContent>Fully minted</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" onClick={() => { fetchTreeState(); fetchCompressedNFTs(1, true) }} disabled={isLoadingTree || isLoadingNFTs}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTree || isLoadingNFTs ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {merkleTreeAddress && (
              <Button variant="outline" onClick={() => openInExplorer(merkleTreeAddress)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Explorer
              </Button>
            )}
          </div>
        </div>
      </div>

      {!connected && (
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">Wallet Not Connected</h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Connect your Solana wallet to manage this collection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">~0.00005 SOL</div>
            <div className="text-sm text-muted-foreground">Cost per Mint</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {hasManifest ? `${currentMintIndex} / ${nftMetadataUrls.length}` : totalCNFTs}
            </div>
            <div className="text-sm text-muted-foreground">Minted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{treeState?.maxCapacity?.toLocaleString() ?? '-'}</div>
            <div className="text-sm text-muted-foreground">Tree Capacity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-3xl font-bold ${remainingMetadata === 0 && hasManifest ? 'text-red-500' : ''}`}>
              {hasManifest ? remainingMetadata : remainingCapacity.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">{hasManifest ? 'NFTs Remaining' : 'Tree Remaining'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tree Capacity Bar */}
      {treeState && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Merkle Tree Usage</span>
              <span className="text-sm text-muted-foreground">{treeUsagePercent}%</span>
            </div>
            <Progress value={treeUsagePercent} className="h-3" />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{treeState.usedCapacity.toLocaleString()} used</span>
              <span>{remainingCapacity.toLocaleString()} available</span>
            </div>
          </CardContent>
        </Card>
      )}

      {treeState && treeUsagePercent > 80 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-amber-700 dark:text-amber-300 mb-1">Tree Nearly Full</div>
              <p className="text-amber-600 dark:text-amber-400">
                Your Merkle tree is {treeUsagePercent}% full. Consider creating a new collection with a larger tree.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="nfts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nfts" className="gap-2"><Grid3X3 className="h-4 w-4" />cNFTs ({totalCNFTs})</TabsTrigger>
          <TabsTrigger value="holders" className="gap-2" onClick={() => { if (holders.length === 0) fetchHolders() }}><Users className="h-4 w-4" />Holders</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Merkle Tree</TabsTrigger>
        </TabsList>

        <TabsContent value="nfts" className="space-y-4">
          {isLoadingNFTs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TreePine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No cNFTs minted yet</p>
                <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => setMintModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Mint your first cNFT
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cNFTs.map((nft) => {
                const nftName = nft.content?.metadata?.name || ''
                const imageUrl = nft.content?.links?.image
                return (
                  <Card key={nft.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openInExplorer(nft.id)}>
                    <div className="aspect-square bg-muted">
                      {imageUrl ? (
                        <img src={imageUrl} alt={nftName || 'cNFT'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="font-medium text-sm truncate">{nftName || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">
                        Leaf #{nft.compression?.leaf_id ?? '?'}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="holders" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">{holders.length} unique holders</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchHolders} disabled={isLoadingHolders}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHolders ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportHoldersCSV} disabled={holders.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          {isLoadingHolders ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : holders.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No holders data yet</p>
              <Button className="mt-4" variant="outline" onClick={fetchHolders}>Load Holders</Button>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {holders.map((holder, idx) => (
                    <div key={holder.wallet} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm font-medium text-green-500">
                          {idx + 1}
                        </div>
                        <div>
                          <code className="text-sm">{holder.wallet.slice(0, 8)}...{holder.wallet.slice(-6)}</code>
                          <div className="text-xs text-muted-foreground">{holder.count} cNFT{holder.count > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(holder.wallet, holder.wallet)}>
                          {copied === holder.wallet ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openInExplorer(holder.wallet)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Merkle Tree</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {merkleTreeAddress && (
                  <div>
                    <label className="text-sm text-muted-foreground">Tree Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{merkleTreeAddress}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(merkleTreeAddress, 'tree')}>
                        {copied === 'tree' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingTree && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>}

                {treeState && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{treeState.maxDepth}</div>
                        <div className="text-xs text-muted-foreground">Max Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{treeState.maxBufferSize}</div>
                        <div className="text-xs text-muted-foreground">Buffer Size</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Capacity</span>
                        <span className="font-mono">{treeState.maxCapacity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Used</span>
                        <span className="font-mono">{treeState.usedCapacity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Canopy Depth</span>
                        <span className="font-mono">{treeState.canopyDepth}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Collection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {collectionMint && (
                  <div>
                    <label className="text-sm text-muted-foreground">Collection Mint</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{collectionMint}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(collectionMint, 'coll')}>
                        {copied === 'coll' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Registry ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{collection.id}</code>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(collection.id, 'id')}>
                      {copied === 'id' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Manifest URL</label>
                  {manifestUrl ? (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{manifestUrl}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(manifestUrl, 'manifest')}>
                        {copied === 'manifest' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => window.open(manifestUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600">
                      No manifest URL set - you'll need to input metadata URIs manually when minting
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><div className="text-sm text-muted-foreground">Royalties</div><div className="font-medium">{Number(collection.royalty_bps) / 100}%</div></div>
                  <div><div className="text-sm text-muted-foreground">Metadata URLs</div><div className="font-medium">{nftMetadataUrls.length} loaded</div></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mint Modal */}
      <Dialog open={mintModalOpen} onOpenChange={setMintModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mint cNFT</DialogTitle>
            <DialogDescription>Mint a compressed NFT to {collection.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                <div>
                  <div className="font-medium text-green-700 dark:text-green-300">Ultra Low Cost</div>
                  <div className="text-2xl font-bold text-green-600">~0.00005 SOL</div>
                </div>
                <TreePine className="h-10 w-10 text-green-500" />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {connected ? `${walletPublicKey?.toString().slice(0, 6)}...${walletPublicKey?.toString().slice(-4)}` : 'Not connected'}
                  </span>
                </div>
                <Badge variant={connected ? "default" : "secondary"} className={connected ? "bg-green-500/10 text-green-500" : ""}>
                  {connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              {nftMetadataUrls.length > 0 && currentMintIndex < nftMetadataUrls.length && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium">Auto-fill available</p>
                      <p className="text-xs">Will use metadata #{currentMintIndex + 1} from manifest ({nftMetadataUrls.length - currentMintIndex} remaining)</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="assetName">Asset Name</Label>
                  <Input
                    id="assetName"
                    placeholder={`${collection.name} #${currentMintIndex + 1}`}
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetUri">Metadata URI</Label>
                  <Input
                    id="assetUri"
                    placeholder={nftMetadataUrls[currentMintIndex] || "https://..."}
                    value={newAssetUri}
                    onChange={(e) => setNewAssetUri(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use next metadata from manifest</p>
                </div>
              </div>

            {mintStep && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mintStep}
              </div>
            )}

            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" onClick={handleMint} disabled={isMinting || !connected}>
              {isMinting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</>
              ) : (
                <><TreePine className="h-4 w-4 mr-2" />Mint cNFT</>
              )}
            </Button>

            {!connected && (
              <p className="text-xs text-center text-muted-foreground">Connect your wallet using the button in the navigation bar</p>
            )}

            {treeState && (
              <div className="text-xs text-center text-muted-foreground">
                Tree capacity: {treeState.usedCapacity.toLocaleString()} / {treeState.maxCapacity.toLocaleString()} ({treeUsagePercent}% used)
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Mint Modal */}
      <Dialog open={batchMintModalOpen} onOpenChange={setBatchMintModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Mint cNFTs</DialogTitle>
            <DialogDescription>Mint multiple cNFTs from your manifest</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-500/10 rounded-lg">
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>{nftMetadataUrls.length - currentMintIndex}</strong> metadata URLs remaining
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantity to Mint</Label>
              <Input
                type="number"
                min={1}
                max={Math.min(20, nftMetadataUrls.length - currentMintIndex)}
                value={batchMintQuantity}
                onChange={(e) => setBatchMintQuantity(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">Max 20 per batch (sequential transactions)</p>
            </div>
            {isBatchMinting && (
              <div className="space-y-2">
                <Progress value={batchMintProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">{batchMintStep}</p>
              </div>
            )}
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleBatchMint} disabled={isBatchMinting || !connected || nftMetadataUrls.length - currentMintIndex === 0}>
              {isBatchMinting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</> : <><Layers className="h-4 w-4 mr-2" />Mint {batchMintQuantity} cNFTs</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Airdrop Modal */}
      <Dialog open={airdropModalOpen} onOpenChange={setAirdropModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Airdrop cNFTs</DialogTitle>
            <DialogDescription>Mint cNFTs directly to recipient wallets</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Wallet Addresses (one per line)</Label>
              <Textarea
                placeholder="wallet1address...\nwallet2address...\nwallet3address..."
                value={airdropWallets}
                onChange={(e) => setAirdropWallets(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                {airdropWallets.split('\n').filter(w => w.trim()).length} wallets entered
              </p>
            </div>
            {nftMetadataUrls.length > 0 && (
              <div className="p-3 bg-blue-500/10 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                Will use metadata URLs #{currentMintIndex + 1} onwards from manifest
              </div>
            )}
            {isAirdropping && (
              <div className="space-y-2">
                <Progress value={airdropProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">{airdropStep}</p>
              </div>
            )}
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAirdrop} disabled={isAirdropping || !connected || !airdropWallets.trim()}>
              {isAirdropping ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Airdropping...</> : <><Send className="h-4 w-4 mr-2" />Airdrop cNFTs</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
