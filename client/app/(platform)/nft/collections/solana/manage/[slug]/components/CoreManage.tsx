"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, Sparkles, RefreshCw, Grid3X3, Settings, Wallet, Plus, Info } from "lucide-react"
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

  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [newAssetName, setNewAssetName] = useState("")
  const [newAssetUri, setNewAssetUri] = useState("")

  const [manifest, setManifest] = useState<{ image?: string; name?: string; properties?: { files?: Array<{ uri: string }> } } | null>(null)
  const [nftMetadataUrls, setNftMetadataUrls] = useState<string[]>([])
  const [currentMintIndex, setCurrentMintIndex] = useState(0)

  const collectionAddress = solanaData.collection_address?.[0] || null
  const manifestUrl = solanaData.manifest_url?.[0] || null

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
            // Metadata fetch failed, continue without image
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

  const handleMint = async () => {
    if (!connected || !walletPublicKey) {
      toast.error("Please connect your Solana wallet")
      return
    }
    if (!collectionAddress) {
      toast.error("No collection address found")
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
        .use(mplCore())
        .use(walletAdapterIdentity(wallet))

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

      // Reset and refresh
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

  const mintPrice = Number(collection.mint_price?.[0] || 0) / 1_000_000_000

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
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Core</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMintModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Asset
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{mintPrice} SOL</div>
            <div className="text-sm text-muted-foreground">Mint Price</div>
          </CardContent>
        </Card>
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
              Core NFTs use a single account per asset with built-in royalty enforcement via plugins.
              Assets are created directly without a candy machine.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assets" className="gap-2"><Grid3X3 className="h-4 w-4" />Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Collection Details</TabsTrigger>
        </TabsList>

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
                <Button className="mt-4" onClick={() => setMintModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first asset
                </Button>
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
                    <div className="text-xs text-muted-foreground truncate">{asset.publicKey.slice(0, 8)}...{asset.publicKey.slice(-4)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

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
    </div>
  )
}
