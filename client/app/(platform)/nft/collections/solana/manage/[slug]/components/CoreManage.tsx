"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, Sparkles, RefreshCw, Grid3X3, Settings, Wallet, Plus, Info, Users, Download, Send, Layers } from "lucide-react"
import { toast } from "sonner"
import { Collection, CoreCollectionData } from "@/declarations/registry/registry.did"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplCore, fetchCollection, fetchAssetsByCollection, create } from "@metaplex-foundation/mpl-core"
import { generateSigner, publicKey as umiPublicKey } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
  ? "mainnet-beta"
  : "devnet") as "devnet" | "mainnet-beta"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com")

interface CoreAsset {
  publicKey: string
  name: string
  uri: string
  owner: string
  image?: string
}

interface CollectionState {
  publicKey: string
  name: string
  uri: string
  numMinted: number
  currentSize: number
  updateAuthority?: string
}

interface HolderInfo {
  wallet: string
  count: number
  assets: string[]
}

interface CoreManageProps {
  collection: Collection
  solanaData: CoreCollectionData
}

export default function CoreManage({ collection, solanaData }: CoreManageProps) {
  const wallet = useWallet()
  const { publicKey: walletPublicKey, connected } = wallet

  const [copied, setCopied] = useState<string | null>(null)
  const [collectionState, setCollectionState] = useState<CollectionState | null>(null)
  const [isLoadingCollection, setIsLoadingCollection] = useState(false)

  const [assets, setAssets] = useState<CoreAsset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)

  // Single mint modal
  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [newAssetName, setNewAssetName] = useState("")
  const [newAssetUri, setNewAssetUri] = useState("")

  // Batch mint modal
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [isBatchMinting, setIsBatchMinting] = useState(false)
  const [batchQuantity, setBatchQuantity] = useState("10")
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchTotal, setBatchTotal] = useState(0)

  // Airdrop modal
  const [airdropModalOpen, setAirdropModalOpen] = useState(false)
  const [isAirdropping, setIsAirdropping] = useState(false)
  const [airdropWallets, setAirdropWallets] = useState("")
  const [airdropProgress, setAirdropProgress] = useState(0)
  const [airdropTotal, setAirdropTotal] = useState(0)

  const [manifest, setManifest] = useState<{ image?: string; name?: string; properties?: { files?: Array<{ uri: string }> } } | null>(null)
  const [nftMetadataUrls, setNftMetadataUrls] = useState<string[]>([])
  const [currentMintIndex, setCurrentMintIndex] = useState(0)

  const collectionAddress = solanaData.collection_address?.[0] || null
  const manifestUrl = solanaData.manifest_url?.[0] || null

  // Calculate holders from assets
  const holders = useMemo(() => {
    if (assets.length === 0) return []
    const holderMap = new Map<string, HolderInfo>()
    assets.forEach(asset => {
      const owner = asset.owner
      if (!holderMap.has(owner)) {
        holderMap.set(owner, { wallet: owner, count: 0, assets: [] })
      }
      const holder = holderMap.get(owner)!
      holder.count++
      holder.assets.push(asset.publicKey)
    })
    return Array.from(holderMap.values()).sort((a, b) => b.count - a.count)
  }, [assets])

  const remainingToMint = nftMetadataUrls.length - currentMintIndex
  const isOwner = collectionState?.updateAuthority === walletPublicKey?.toString()

  useEffect(() => {
    if (collectionAddress && !collectionState && !isLoadingCollection) {
      fetchCollectionState()
    }
  }, [collectionAddress])

  useEffect(() => {
    if (collectionAddress && assets.length === 0 && !isLoadingAssets) {
      fetchAssets()
    }
  }, [collectionAddress])

  useEffect(() => {
    if (manifestUrl && !manifest) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(data => {
          setManifest(data)
          if (data.properties?.files) {
            setNftMetadataUrls(data.properties.files.map((f: { uri: string }) => f.uri))
          }
        })
        .catch(err => console.error('Failed to fetch manifest:', err))
    }
  }, [manifestUrl])

  const getUmi = useCallback(() => {
    if (!walletPublicKey) return null
    return createUmi(SOLANA_RPC_URL)
      .use(mplCore())
      .use(walletAdapterIdentity(wallet))
  }, [walletPublicKey, wallet])

  const fetchCollectionState = useCallback(async () => {
    if (!collectionAddress) return
    try {
      setIsLoadingCollection(true)
      const umi = createUmi(SOLANA_RPC_URL).use(mplCore())
      const coll = await fetchCollection(umi, umiPublicKey(collectionAddress))

      setCollectionState({
        publicKey: collectionAddress,
        name: coll.name,
        uri: coll.uri,
        numMinted: Number(coll.numMinted),
        currentSize: Number(coll.currentSize),
        updateAuthority: coll.updateAuthority.toString(),
      })
    } catch (error) {
      console.error("Failed to fetch collection state:", error)
      toast.error("Failed to fetch collection data")
    } finally {
      setIsLoadingCollection(false)
    }
  }, [collectionAddress])

  const fetchAssets = useCallback(async () => {
    if (!collectionAddress) return
    try {
      setIsLoadingAssets(true)
      const umi = createUmi(SOLANA_RPC_URL).use(mplCore())

      const fetchedAssets = await fetchAssetsByCollection(umi, umiPublicKey(collectionAddress))

      const assetsWithMetadata: CoreAsset[] = await Promise.all(
        fetchedAssets.map(async (asset) => {
          let image: string | undefined
          try {
            const metaRes = await fetch(asset.uri)
            const meta = await metaRes.json()
            image = meta.image
          } catch {
            // Metadata fetch failed
          }
          return {
            publicKey: asset.publicKey.toString(),
            name: asset.name,
            uri: asset.uri,
            owner: asset.owner.toString(),
            image,
          }
        })
      )

      setAssets(assetsWithMetadata)
      setCurrentMintIndex(assetsWithMetadata.length)
    } catch (error) {
      console.error("Failed to fetch assets:", error)
    } finally {
      setIsLoadingAssets(false)
    }
  }, [collectionAddress])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const openInExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=${SOLANA_NETWORK}`, '_blank')
  }

  const exportHoldersCsv = () => {
    if (holders.length === 0) {
      toast.error("No holders to export")
      return
    }

    const csvContent = [
      "Wallet,Asset Count,Asset Addresses",
      ...holders.map(h => `${h.wallet},${h.count},"${h.assets.join(', ')}"`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collection.symbol}_holders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Holder list exported!")
  }

  // Single asset create
  const handleMint = async () => {
    if (!connected || !walletPublicKey) {
      toast.error("Please connect your Solana wallet")
      return
    }
    if (!collectionAddress) {
      toast.error("No collection address found")
      return
    }

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

      const umi = getUmi()
      if (!umi) throw new Error("Failed to initialize")

      setMintStep("Fetching collection...")
      const coll = await fetchCollection(umi, umiPublicKey(collectionAddress))

      setMintStep("Creating asset...")
      const assetSigner = generateSigner(umi)

      const createTx = await create(umi, {
        asset: assetSigner,
        name: assetName || `${collection.name} #${currentMintIndex + 1}`,
        uri: assetUri,
        collection: coll,
      })

      setMintStep("Confirm in wallet...")
      await createTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

      toast.success("Asset created!", {
        description: `${assetSigner.publicKey.toString().slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () => openInExplorer(assetSigner.publicKey.toString())
        }
      })

      setNewAssetName("")
      setNewAssetUri("")
      setCurrentMintIndex(prev => prev + 1)
      fetchCollectionState()
      fetchAssets()

    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Failed to create asset", { description: error?.message || "Check console" })
    } finally {
      setIsMinting(false)
      setMintStep("")
    }
  }

  // Batch create assets
  const handleBatchMint = async () => {
    if (!connected || !walletPublicKey) {
      toast.error("Please connect your Solana wallet")
      return
    }
    if (!collectionAddress) {
      toast.error("No collection address found")
      return
    }

    const quantity = parseInt(batchQuantity) || 0
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    if (quantity > remainingToMint) {
      toast.error(`Only ${remainingToMint} metadata URLs remaining in manifest`)
      return
    }

    try {
      setIsBatchMinting(true)
      setBatchProgress(0)
      setBatchTotal(quantity)

      const umi = getUmi()
      if (!umi) throw new Error("Failed to initialize")

      const coll = await fetchCollection(umi, umiPublicKey(collectionAddress))

      let successCount = 0
      let failCount = 0
      let localIndex = currentMintIndex

      for (let i = 0; i < quantity; i++) {
        try {
          const assetUri = nftMetadataUrls[localIndex]
          const assetName = `${collection.name} #${localIndex + 1}`
          const assetSigner = generateSigner(umi)

          const createTx = await create(umi, {
            asset: assetSigner,
            name: assetName,
            uri: assetUri,
            collection: coll,
          })

          await createTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
          successCount++
          localIndex++
          setBatchProgress(i + 1)
        } catch (error) {
          console.error(`Failed to create asset ${localIndex + 1}:`, error)
          failCount++
          setBatchProgress(i + 1)
        }
      }

      setCurrentMintIndex(localIndex)
      toast.success(`Batch complete: ${successCount} created, ${failCount} failed`)
      setBatchModalOpen(false)
      fetchCollectionState()
      fetchAssets()

    } catch (error: any) {
      console.error("Batch mint failed:", error)
      toast.error("Batch mint failed", { description: error?.message || "Check console" })
    } finally {
      setIsBatchMinting(false)
      setBatchProgress(0)
      setBatchTotal(0)
    }
  }

  // Airdrop - create assets to specific wallets
  const handleAirdrop = async () => {
    if (!connected || !walletPublicKey) {
      toast.error("Please connect your Solana wallet")
      return
    }
    if (!collectionAddress) {
      toast.error("No collection address found")
      return
    }

    const wallets = airdropWallets.split('\n').map(w => w.trim()).filter(w => w.length > 0)
    if (wallets.length === 0) {
      toast.error("Please enter at least one wallet address")
      return
    }

    if (wallets.length > remainingToMint) {
      toast.error(`Only ${remainingToMint} metadata URLs remaining. Cannot airdrop to ${wallets.length} wallets.`)
      return
    }

    try {
      setIsAirdropping(true)
      setAirdropProgress(0)
      setAirdropTotal(wallets.length)

      const umi = getUmi()
      if (!umi) throw new Error("Failed to initialize")

      const coll = await fetchCollection(umi, umiPublicKey(collectionAddress))

      let successCount = 0
      let failCount = 0
      let localIndex = currentMintIndex

      for (let i = 0; i < wallets.length; i++) {
        const targetWallet = wallets[i]
        try {
          const assetUri = nftMetadataUrls[localIndex]
          const assetName = `${collection.name} #${localIndex + 1}`
          const assetSigner = generateSigner(umi)

          // Create asset with owner set to target wallet
          const createTx = await create(umi, {
            asset: assetSigner,
            name: assetName,
            uri: assetUri,
            collection: coll,
            owner: umiPublicKey(targetWallet),
          })

          await createTx.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
          successCount++
          localIndex++
          setAirdropProgress(i + 1)
        } catch (error) {
          console.error(`Failed to airdrop to ${targetWallet}:`, error)
          failCount++
          setAirdropProgress(i + 1)
        }
      }

      setCurrentMintIndex(localIndex)
      toast.success(`Airdrop complete: ${successCount} sent, ${failCount} failed`)
      setAirdropModalOpen(false)
      setAirdropWallets("")
      fetchCollectionState()
      fetchAssets()

    } catch (error: any) {
      console.error("Airdrop failed:", error)
      toast.error("Airdrop failed", { description: error?.message || "Check console" })
    } finally {
      setIsAirdropping(false)
      setAirdropProgress(0)
      setAirdropTotal(0)
    }
  }

  const mintPrice = Number(collection.mint_price?.[0] || 0) / 1_000_000_000

  return (
    <div className="space-y-8">
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
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Core</Badge>
              {isOwner && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Owner</Badge>}
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMintModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Asset
            </Button>
            <Button onClick={() => setBatchModalOpen(true)} variant="outline" className="gap-2" disabled={remainingToMint === 0}>
              <Layers className="h-4 w-4" />
              Batch Create
            </Button>
            <Button onClick={() => setAirdropModalOpen(true)} variant="outline" className="gap-2" disabled={remainingToMint === 0}>
              <Send className="h-4 w-4" />
              Airdrop
            </Button>
            <Button variant="outline" onClick={() => { fetchCollectionState(); fetchAssets() }} disabled={isLoadingCollection || isLoadingAssets}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCollection || isLoadingAssets ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {collectionAddress && (
              <Button variant="outline" onClick={() => openInExplorer(collectionAddress)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Explorer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Connection Banner */}
      {!connected && (
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">Wallet Not Connected</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Connect your Solana wallet to manage this collection</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{collectionState?.numMinted ?? assets.length}</div>
            <div className="text-sm text-muted-foreground">Assets Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{collection.total_supply.toString()}</div>
            <div className="text-sm text-muted-foreground">Max Supply</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-500">{remainingToMint}</div>
            <div className="text-sm text-muted-foreground">Remaining to Mint</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{holders.length}</div>
            <div className="text-sm text-muted-foreground">Unique Holders</div>
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
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Metaplex Core Collection</div>
            <p className="text-purple-600 dark:text-purple-400">
              Core NFTs use a single account per asset. Assets are created directly without a candy machine.
              {remainingToMint > 0 && ` You have ${remainingToMint} metadata URLs remaining in your manifest.`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assets" className="gap-2"><Grid3X3 className="h-4 w-4" />Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="holders" className="gap-2"><Users className="h-4 w-4" />Holders ({holders.length})</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Details</TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          {isLoadingAssets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No assets created yet</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button onClick={() => setMintModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Asset
                  </Button>
                  <Button variant="outline" onClick={() => setBatchModalOpen(true)} disabled={remainingToMint === 0}>
                    <Layers className="h-4 w-4 mr-2" />
                    Batch Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <Card key={asset.publicKey} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openInExplorer(asset.publicKey)}>
                  <div className="aspect-square bg-muted">
                    {asset.image ? (
                      <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="font-medium text-sm truncate">{asset.name || 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground truncate">{asset.owner.slice(0, 6)}...{asset.owner.slice(-4)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Holders Tab */}
        <TabsContent value="holders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Holder Distribution</h3>
            <Button variant="outline" onClick={exportHoldersCsv} disabled={holders.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {holders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No holders yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {holders.slice(0, 50).map((holder, idx) => (
                    <div key={holder.wallet} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </div>
                        <div>
                          <code className="text-sm">{holder.wallet.slice(0, 8)}...{holder.wallet.slice(-4)}</code>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(holder.wallet, holder.wallet) }}>
                            {copied === holder.wallet ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{holder.count} asset{holder.count > 1 ? 's' : ''}</div>
                        <div className="text-xs text-muted-foreground">
                          {((holder.count / assets.length) * 100).toFixed(1)}% of supply
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Collection Address</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {collectionAddress && (
                  <div>
                    <label className="text-sm text-muted-foreground">Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{collectionAddress}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(collectionAddress, 'coll')}>
                        {copied === 'coll' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {collectionState?.updateAuthority && (
                  <div>
                    <label className="text-sm text-muted-foreground">Update Authority</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{collectionState.updateAuthority}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(collectionState.updateAuthority!, 'auth')}>
                        {copied === 'auth' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingCollection && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>}

                {collectionState && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{collectionState.numMinted}</div>
                      <div className="text-xs text-muted-foreground">Total Minted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{collectionState.currentSize}</div>
                      <div className="text-xs text-muted-foreground">Current Size</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Registry Info</CardTitle></CardHeader>
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
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><div className="text-sm text-muted-foreground">Max Supply</div><div className="font-medium">{collection.total_supply.toString()}</div></div>
                  <div><div className="text-sm text-muted-foreground">Royalties</div><div className="font-medium">{Number(collection.royalty_bps) / 100}%</div></div>
                </div>

                {manifestUrl && (
                  <div>
                    <label className="text-sm text-muted-foreground">Manifest URL</label>
                    <a href={manifestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-500 hover:underline block truncate mt-1">
                      {manifestUrl}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Asset Modal */}
      <Dialog open={mintModalOpen} onOpenChange={setMintModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Asset</DialogTitle>
            <DialogDescription>Create a new Core asset in {collection.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                    <p className="text-xs">Will use metadata #{currentMintIndex + 1} from manifest ({remainingToMint} remaining)</p>
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
              <div className="flex items-center gap-2 p-3 bg-purple-500/10 text-purple-500 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mintStep}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleMint} disabled={isMinting || !connected}>
              {isMinting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Create Asset</>
              )}
            </Button>

            {!connected && (
              <p className="text-xs text-center text-muted-foreground">Connect your wallet using the button in the navigation bar</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Create Modal */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Create Assets</DialogTitle>
            <DialogDescription>Create multiple assets at once from your manifest</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metadata URLs Remaining</span>
                <span className="font-bold text-purple-500">{remainingToMint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Index</span>
                <span className="font-medium">#{currentMintIndex + 1}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchQty">Quantity to Create</Label>
              <Input
                id="batchQty"
                type="number"
                min="1"
                max={remainingToMint}
                value={batchQuantity}
                onChange={(e) => setBatchQuantity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Max: {remainingToMint}</p>
            </div>

            {isBatchMinting && batchTotal > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{batchProgress} / {batchTotal}</span>
                </div>
                <Progress value={(batchProgress / batchTotal) * 100} />
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> Each asset requires a separate transaction. You'll need to approve each one in your wallet.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchModalOpen(false)} disabled={isBatchMinting}>Cancel</Button>
            <Button onClick={handleBatchMint} disabled={isBatchMinting || !connected || remainingToMint === 0}>
              {isBatchMinting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating {batchProgress}/{batchTotal}...</>
              ) : (
                <><Layers className="h-4 w-4 mr-2" />Create {batchQuantity} Assets</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Airdrop Modal */}
      <Dialog open={airdropModalOpen} onOpenChange={setAirdropModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Airdrop Assets</DialogTitle>
            <DialogDescription>Create and send assets directly to other wallets</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metadata URLs Remaining</span>
                <span className="font-bold text-purple-500">{remainingToMint}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="airdropWallets">Wallet Addresses (one per line)</Label>
              <Textarea
                id="airdropWallets"
                placeholder="wallet1address...\nwallet2address...\nwallet3address..."
                rows={6}
                value={airdropWallets}
                onChange={(e) => setAirdropWallets(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {airdropWallets.split('\n').filter(w => w.trim()).length} wallets entered (max {remainingToMint})
              </p>
            </div>

            {isAirdropping && airdropTotal > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{airdropProgress} / {airdropTotal}</span>
                </div>
                <Progress value={(airdropProgress / airdropTotal) * 100} />
              </div>
            )}

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              Each wallet receives 1 asset. Assets are created with the recipient as the owner.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAirdropModalOpen(false)} disabled={isAirdropping}>Cancel</Button>
            <Button onClick={handleAirdrop} disabled={isAirdropping || !connected || remainingToMint === 0}>
              {isAirdropping ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending {airdropProgress}/{airdropTotal}...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Send Airdrop</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
