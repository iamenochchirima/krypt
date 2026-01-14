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
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mintV2, mplCandyMachine, fetchCandyMachine, fetchCandyGuard } from "@metaplex-foundation/mpl-candy-machine"
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox"
import { transactionBuilder, some } from "@metaplex-foundation/umi"
import { mplTokenMetadata, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey, generateSigner, base58 } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
  ? "mainnet-beta"
  : "devnet") as "devnet" | "mainnet-beta"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface NFTAsset {
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
      external_url?: string
    }
  }
  ownership?: {
    owner: string
  }
}

interface MintedNFT {
  mint: string
  name?: string
  image?: string
  loading?: boolean
}

interface CandyMachineState {
  authority: string
  itemsAvailable: number
  itemsLoaded: number
  itemsRedeemed: number
  configLineSettings?: {
    prefixName: string
    nameLength: number
    prefixUri: string
    uriLength: number
    isSequential: boolean
  }
  hiddenSettings?: boolean
  items?: Array<{ name: string; uri: string }>
}

export default function ManageSolanaCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()
  const { publicKey: walletPublicKey, connected, signTransaction, signAllTransactions } = useWallet()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [candyMachineState, setCandyMachineState] = useState<CandyMachineState | null>(null)
  const [isLoadingCM, setIsLoadingCM] = useState(false)

  const [collectionNFTs, setCollectionNFTs] = useState<NFTAsset[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [nftPage, setNftPage] = useState(1)
  const [totalNFTs, setTotalNFTs] = useState(0)

  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])
  const [manifest, setManifest] = useState<{ image?: string; name?: string; description?: string; properties?: { files?: Array<{ uri: string; type: string }> } } | null>(null)
  const [nftImages, setNftImages] = useState<Record<string, string>>({})

  const solanaData = collection && 'Solana' in collection.chain_data ? collection.chain_data.Solana : null
  const candyMachineAddress = solanaData?.candy_machine_address?.[0] || null
  const collectionMint = solanaData?.collection_mint?.[0] || null
  const manifestUrl = solanaData?.manifest_url?.[0] || null

  useEffect(() => {
    if (!isAuthenticated || !collectionId || !identity) return
    loadCollectionData()
  }, [isAuthenticated, collectionId, identity])

  useEffect(() => {
    if (candyMachineAddress && !candyMachineState && !isLoadingCM) {
      fetchCandyMachineState()
    }
  }, [candyMachineAddress])

  useEffect(() => {
    if (collectionMint && collectionNFTs.length === 0 && !isLoadingNFTs) {
      fetchCollectionNFTs()
    }
  }, [collectionMint])

  useEffect(() => {
    if (manifestUrl && !manifest) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(async data => {
          setManifest(data)

          if (data.properties?.files) {
            const imagePromises = data.properties.files.map(async (file: { uri: string }, index: number) => {
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

  const fetchCandyMachineState = useCallback(async () => {
    if (!candyMachineAddress) return
    try {
      setIsLoadingCM(true)
      const rpcEndpoint = SOLANA_NETWORK === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com"

      const umi = createUmi(rpcEndpoint).use(mplTokenMetadata()).use(mplCandyMachine())
      const cm = await fetchCandyMachine(umi, umiPublicKey(candyMachineAddress))

      console.log('Full Candy Machine Data:', cm)

      const state: CandyMachineState = {
        authority: cm.authority.toString(),
        itemsAvailable: Number(cm.data.itemsAvailable),
        itemsLoaded: Number(cm.itemsLoaded),
        itemsRedeemed: Number(cm.itemsRedeemed),
      }

      if (cm.data.configLineSettings.__option === 'Some') {
        state.configLineSettings = {
          prefixName: cm.data.configLineSettings.value.prefixName,
          nameLength: cm.data.configLineSettings.value.nameLength,
          prefixUri: cm.data.configLineSettings.value.prefixUri,
          uriLength: cm.data.configLineSettings.value.uriLength,
          isSequential: cm.data.configLineSettings.value.isSequential,
        }
      }

      state.hiddenSettings = cm.data.hiddenSettings.__option === 'Some'

      if (cm.items && cm.items.length > 0) {
        state.items = cm.items.slice(0, 10).map(item => ({
          name: item.name,
          uri: item.uri,
        }))
      }

      setCandyMachineState(state)
    } catch (error) {
      console.error("Failed to fetch candy machine state:", error)
    } finally {
      setIsLoadingCM(false)
    }
  }, [candyMachineAddress])

  const fetchCollectionNFTs = async (page = 1, refresh = false) => {
    if (!collectionMint) return
    try {
      setIsLoadingNFTs(true)
      const url = `${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=${page}&limit=20${refresh ? '&refresh=true' : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch NFTs")
      const data = await response.json()
      setCollectionNFTs(data.items || [])
      setTotalNFTs(data.total || 0)
      setNftPage(page)
    } catch (error) {
      console.error("Failed to fetch collection NFTs:", error)
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

  const fetchNFTMetadata = async (umi: any, mintAddress: any, index: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const asset = await fetchDigitalAsset(umi, mintAddress)
      const metadataResponse = await fetch(asset.metadata.uri)
      const metadata = await metadataResponse.json()

      setMintedNFTs(prev => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = { ...updated[index], name: asset.metadata.name, image: metadata.image, loading: false }
        }
        return updated
      })
    } catch (error) {
      setMintedNFTs(prev => {
        const updated = [...prev]
        if (updated[index]) updated[index] = { ...updated[index], loading: false }
        return updated
      })
    }
  }

  const handleMint = async () => {
    if (!connected || !walletPublicKey || !signTransaction || !signAllTransactions) {
      toast.error("Please connect your Solana wallet")
      return
    }
    if (!candyMachineAddress) {
      toast.error("No candy machine address found")
      return
    }

    try {
      setIsMinting(true)
      setMintStep("Initializing...")

      const rpcEndpoint = SOLANA_NETWORK === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com"

      const umi = createUmi(rpcEndpoint)
        .use(walletAdapterIdentity({ publicKey: walletPublicKey, signTransaction, signAllTransactions }))
        .use(mplTokenMetadata())
        .use(mplCandyMachine())

      const confirmOptions = { send: { commitment: 'confirmed' as const }, confirm: { commitment: 'confirmed' as const } }

      setMintStep("Fetching candy machine...")
      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)
      const candyMachineAccount = await fetchCandyMachine(umi, candyMachinePublicKey)

      console.log('Candy Machine:', {
        address: candyMachinePublicKey,
        itemsLoaded: Number(candyMachineAccount.itemsLoaded),
        itemsRedeemed: Number(candyMachineAccount.itemsRedeemed),
        itemsAvailable: Number(candyMachineAccount.data.itemsAvailable),
        authority: candyMachineAccount.authority.toString(),
        collectionMint: candyMachineAccount.collectionMint.toString(),
        mintAuthority: candyMachineAccount.mintAuthority.toString(),
      })

      if (Number(candyMachineAccount.itemsLoaded) === 0) {
        throw new Error('Candy machine has no items loaded. Please add config lines first.')
      }

      if (Number(candyMachineAccount.itemsRedeemed) >= Number(candyMachineAccount.itemsLoaded)) {
        throw new Error('All available items have been minted.')
      }

      setMintStep("Fetching candy guard...")
      let candyGuard = null
      let mintArgs: any = {}

      try {
        candyGuard = await fetchCandyGuard(umi, candyMachineAccount.mintAuthority)
        console.log('Candy Guard:', candyGuard)
        console.log('Guards:', candyGuard.guards)

        if (candyGuard.guards.solPayment.__option === 'Some') {
          console.log('SOL Payment guard detected:', candyGuard.guards.solPayment.value)
          mintArgs.solPayment = some({
            destination: candyGuard.guards.solPayment.value.destination,
          })
        }
      } catch (e) {
        console.log('No candy guard found or error fetching:', e)
      }

      setMintStep("Preparing mint...")
      const nftMint = generateSigner(umi)
      console.log('NFT Mint keypair:', nftMint.publicKey.toString())
      console.log('Mint args:', mintArgs)

      const mintBuilder = transactionBuilder()
        .add(setComputeUnitLimit(umi, { units: 800_000 }))
        .add(
          mintV2(umi, {
            candyMachine: candyMachinePublicKey,
            nftMint,
            collectionMint: candyMachineAccount.collectionMint,
            collectionUpdateAuthority: candyMachineAccount.authority,
            candyGuard: candyGuard?.publicKey,
            mintArgs: Object.keys(mintArgs).length > 0 ? mintArgs : undefined,
          })
        )

      setMintStep("Confirm in wallet...")
      const result = await mintBuilder.sendAndConfirm(umi, confirmOptions)

      console.log('Mint result:', result)
      console.log('Signature:', result.signature)

      const signatureStr = typeof result.signature === 'string'
        ? result.signature
        : base58.deserialize(result.signature)[0]

      console.log('Transaction URL:', `https://explorer.solana.com/tx/${signatureStr}?cluster=${SOLANA_NETWORK}`)

      const mintedNFT: MintedNFT = { mint: nftMint.publicKey.toString(), loading: true }
      setMintedNFTs(prev => [...prev, mintedNFT])

      toast.success("NFT Minted!", {
        description: `${nftMint.publicKey.toString().slice(0, 8)}...`,
        action: {
          label: "View TX",
          onClick: () => window.open(`https://explorer.solana.com/tx/${signatureStr}?cluster=${SOLANA_NETWORK}`, '_blank')
        }
      })
      fetchNFTMetadata(umi, nftMint.publicKey, mintedNFTs.length)
      fetchCandyMachineState()
      setTimeout(() => fetchCollectionNFTs(1, true), 3000)

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

  const mintPrice = solanaData?.candy_machine_config?.[0]?.price
    ? Number(solanaData.candy_machine_config[0].price) / 1_000_000_000
    : 0

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {manifest?.image ? (
          <img
            src={manifest.image}
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
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Solana</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMintModalOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Mint NFT
            </Button>
            <Button variant="outline" onClick={() => { fetchCandyMachineState(); fetchCollectionNFTs(1, true) }} disabled={isLoadingCM || isLoadingNFTs}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCM || isLoadingNFTs ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {candyMachineAddress && (
              <Button variant="outline" onClick={() => openInExplorer(candyMachineAddress)}>
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
            <div className="text-3xl font-bold">{candyMachineState?.itemsRedeemed ?? '-'}</div>
            <div className="text-sm text-muted-foreground">Minted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{candyMachineState?.itemsAvailable ?? collection.total_supply.toString()}</div>
            <div className="text-sm text-muted-foreground">Total Supply</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {candyMachineState ? Math.round((candyMachineState.itemsRedeemed / candyMachineState.itemsAvailable) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Minted</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nfts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nfts" className="gap-2"><Grid3X3 className="h-4 w-4" />NFTs ({totalNFTs})</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Details</TabsTrigger>
        </TabsList>

        <TabsContent value="nfts" className="space-y-4">
          {isLoadingNFTs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : collectionNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No NFTs minted yet</p>
                <Button className="mt-4" onClick={() => setMintModalOpen(true)}>Mint your first NFT</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {collectionNFTs.map((nft) => {
                const nftName = nft.content?.metadata?.name || ''
                const imageUrl = nft.content?.links?.image || nftImages[nftName] || nftImages[nftName.replace(/\D/g, '')]
                return (
                  <Card key={nft.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openInExplorer(nft.id)}>
                    <div className="aspect-square bg-muted">
                      {imageUrl ? (
                        <img src={imageUrl} alt={nftName || 'NFT'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="font-medium text-sm truncate">{nftName || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground truncate">{nft.id.slice(0, 8)}...{nft.id.slice(-4)}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Candy Machine Inspection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {candyMachineAddress && (
                  <div>
                    <label className="text-sm text-muted-foreground">Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{candyMachineAddress}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(candyMachineAddress, 'cm')}>
                        {copied === 'cm' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingCM && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>}

                {candyMachineState && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${candyMachineState.itemsLoaded === 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {candyMachineState.itemsLoaded}
                        </div>
                        <div className="text-xs text-muted-foreground">Items Loaded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{candyMachineState.itemsRedeemed}</div>
                        <div className="text-xs text-muted-foreground">Items Minted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{candyMachineState.itemsAvailable}</div>
                        <div className="text-xs text-muted-foreground">Max Supply</div>
                      </div>
                    </div>

                    {candyMachineState.itemsLoaded === 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                        <strong>Problem:</strong> No items loaded! Config lines were not inserted during deployment. You need to redeploy or manually add config lines.
                      </div>
                    )}

                    {candyMachineState.configLineSettings && (
                      <div>
                        <div className="text-sm font-medium mb-2">Config Line Settings</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Prefix Name:</span> "{candyMachineState.configLineSettings.prefixName || '(empty)'}"</div>
                          <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Name Length:</span> {candyMachineState.configLineSettings.nameLength}</div>
                          <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">Prefix URI:</span> "{candyMachineState.configLineSettings.prefixUri || '(empty)'}"</div>
                          <div className="p-2 bg-muted rounded"><span className="text-muted-foreground">URI Length:</span> {candyMachineState.configLineSettings.uriLength}</div>
                        </div>
                      </div>
                    )}

                    {candyMachineState.items && candyMachineState.items.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Loaded Items (first 10)</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {candyMachineState.items.map((item, idx) => (
                            <div key={idx} className="text-xs p-2 bg-muted rounded flex justify-between">
                              <span className="font-mono">{item.name || '(empty)'}</span>
                              <span className="text-muted-foreground truncate max-w-[200px]">{item.uri || '(no uri)'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {candyMachineState.items?.length === 0 && candyMachineState.itemsLoaded === 0 && (
                      <div className="text-xs text-muted-foreground">No config lines found. The candy machine is empty.</div>
                    )}
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
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(collectionMint, 'mint')}>
                        {copied === 'mint' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><div className="text-sm text-muted-foreground">Supply</div><div className="font-medium">{collection.total_supply.toString()}</div></div>
                  <div><div className="text-sm text-muted-foreground">Royalties</div><div className="font-medium">{Number(collection.royalty_bps) / 100}%</div></div>
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
            <DialogTitle>Mint NFT</DialogTitle>
            <DialogDescription>Mint a new NFT from {collection.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Price</div>
                <div className="text-2xl font-bold">{mintPrice} SOL</div>
              </div>
              <img src={collection.image_url} alt={collection.name} className="w-16 h-16 rounded-lg object-cover" />
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

            {mintStep && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-500 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mintStep}
              </div>
            )}

            {mintedNFTs.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Just Minted</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {mintedNFTs.map((nft, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => openInExplorer(nft.mint)}
                      title={`View ${nft.mint} on Explorer`}
                    >
                      {nft.loading ? (
                        <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : nft.image ? (
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Click to view on Solana Explorer</div>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleMint} disabled={isMinting || !connected}>
              {isMinting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</> : <><Sparkles className="h-4 w-4 mr-2" />Mint for {mintPrice} SOL</>}
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
