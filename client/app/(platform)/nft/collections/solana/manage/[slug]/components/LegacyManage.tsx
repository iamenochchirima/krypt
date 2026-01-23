"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, Sparkles, RefreshCw, Grid3X3, Settings, Wallet, DollarSign, Users, Download, Send, Play, Pause, Clock, Shield, AlertTriangle, Banknote } from "lucide-react"
import { toast } from "sonner"
import { Collection, LegacyCollectionData } from "@/declarations/registry/registry.did"
import { useWallet } from "@solana/wallet-adapter-react"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  mintV2,
  mplCandyMachine,
  fetchCandyMachine,
  fetchCandyGuard,
  updateCandyGuard,
  deleteCandyGuard,
  createCandyGuard,
  wrap,
  unwrap,
  withdrawCandyMachine,
  withdrawCandyGuard,
} from "@metaplex-foundation/mpl-candy-machine"
import { transactionBuilder, some, none, sol, lamports } from "@metaplex-foundation/umi"
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox"
import { mplTokenMetadata, fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey, generateSigner, base58 } from "@metaplex-foundation/umi"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
  ? "mainnet-beta"
  : "devnet") as "devnet" | "mainnet-beta"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com")

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

interface GuardSettings {
  solPayment?: { amount: number; destination: string }
  startDate?: number // unix timestamp
  endDate?: number // unix timestamp
  mintLimit?: { limit: number }
  allowList?: { merkleRoot: string }
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

interface HolderInfo {
  wallet: string
  count: number
  nfts: string[]
}

interface LegacyManageProps {
  collection: Collection
  solanaData: LegacyCollectionData
}

export default function LegacyManage({ collection, solanaData }: LegacyManageProps) {
  const wallet = useWallet()
  const { publicKey: walletPublicKey, connected, signTransaction, signAllTransactions } = wallet

  const [copied, setCopied] = useState<string | null>(null)
  const [candyMachineState, setCandyMachineState] = useState<CandyMachineState | null>(null)
  const [isLoadingCM, setIsLoadingCM] = useState(false)
  const [guardSettings, setGuardSettings] = useState<GuardSettings | null>(null)
  const [candyGuardAddress, setCandyGuardAddress] = useState<string | null>(null)

  const [collectionNFTs, setCollectionNFTs] = useState<NFTAsset[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [totalNFTs, setTotalNFTs] = useState(0)
  const [holders, setHolders] = useState<HolderInfo[]>([])
  const [isLoadingHolders, setIsLoadingHolders] = useState(false)

  const [mintModalOpen, setMintModalOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintStep, setMintStep] = useState("")
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])
  const [manifest, setManifest] = useState<{ image?: string; name?: string; description?: string; properties?: { files?: Array<{ uri: string; type: string }> } } | null>(null)
  const [nftImages, setNftImages] = useState<Record<string, string>>({})

  // Management modals
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [newMintPrice, setNewMintPrice] = useState("")
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false)
  const [mintLimitModalOpen, setMintLimitModalOpen] = useState(false)
  const [isUpdatingMintLimit, setIsUpdatingMintLimit] = useState(false)
  const [newMintLimit, setNewMintLimit] = useState("")
  const [allowlistModalOpen, setAllowlistModalOpen] = useState(false)
  const [isUpdatingAllowlist, setIsUpdatingAllowlist] = useState(false)
  const [allowlistWallets, setAllowlistWallets] = useState("")
  const [airdropModalOpen, setAirdropModalOpen] = useState(false)
  const [isAirdropping, setIsAirdropping] = useState(false)
  const [airdropWallets, setAirdropWallets] = useState("")
  const [airdropQuantity, setAirdropQuantity] = useState("1")

  // Schedule state
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [mintingEnabled, setMintingEnabled] = useState(true)

  const candyMachineAddress = solanaData.candy_machine_address?.[0] || null
  const collectionMint = solanaData.collection_mint?.[0] || null
  const manifestUrl = solanaData.manifest_url?.[0] || null

  // Calculate revenue
  const mintPrice = Number(collection.mint_price?.[0] || 0) / 1_000_000_000
  const totalRevenue = candyMachineState ? (candyMachineState.itemsRedeemed * mintPrice) : 0

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

  const getUmi = useCallback(() => {
    if (!walletPublicKey || !signTransaction || !signAllTransactions) return null
    return createUmi(SOLANA_RPC_URL)
      .use(walletAdapterIdentity({ publicKey: walletPublicKey, signTransaction, signAllTransactions }))
      .use(mplTokenMetadata())
      .use(mplCandyMachine())
  }, [walletPublicKey, signTransaction, signAllTransactions])

  const fetchCandyMachineState = useCallback(async () => {
    if (!candyMachineAddress) return
    try {
      setIsLoadingCM(true)
      const umi = createUmi(SOLANA_RPC_URL).use(mplTokenMetadata()).use(mplCandyMachine())
      const cm = await fetchCandyMachine(umi, umiPublicKey(candyMachineAddress))

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

      // Fetch candy guard settings
      try {
        const candyGuard = await fetchCandyGuard(umi, cm.mintAuthority)
        setCandyGuardAddress(candyGuard.publicKey.toString())

        const guards: GuardSettings = {}

        if (candyGuard.guards.solPayment.__option === 'Some') {
          guards.solPayment = {
            amount: Number(candyGuard.guards.solPayment.value.lamports.basisPoints) / 1_000_000_000,
            destination: candyGuard.guards.solPayment.value.destination.toString()
          }
        }

        if (candyGuard.guards.startDate.__option === 'Some') {
          guards.startDate = Number(candyGuard.guards.startDate.value.date)
          const date = new Date(guards.startDate * 1000)
          setStartDate(date.toISOString().split('T')[0])
          setStartTime(date.toTimeString().slice(0, 5))
        }

        if (candyGuard.guards.endDate.__option === 'Some') {
          guards.endDate = Number(candyGuard.guards.endDate.value.date)
          const date = new Date(guards.endDate * 1000)
          setEndDate(date.toISOString().split('T')[0])
          setEndTime(date.toTimeString().slice(0, 5))
        }

        if (candyGuard.guards.mintLimit.__option === 'Some') {
          guards.mintLimit = { limit: candyGuard.guards.mintLimit.value.limit }
        }

        if (candyGuard.guards.allowList.__option === 'Some') {
          guards.allowList = { merkleRoot: Buffer.from(candyGuard.guards.allowList.value.merkleRoot).toString('hex') }
        }

        setGuardSettings(guards)

        // Check if minting is currently enabled based on dates
        const now = Math.floor(Date.now() / 1000)
        const isAfterStart = !guards.startDate || now >= guards.startDate
        const isBeforeEnd = !guards.endDate || now <= guards.endDate
        setMintingEnabled(isAfterStart && isBeforeEnd)

      } catch (e) {
        console.log('No candy guard found:', e)
        setCandyGuardAddress(null)
        setGuardSettings(null)
      }
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
      const url = `${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=${page}&limit=100${refresh ? '&refresh=true' : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch NFTs")
      const data = await response.json()
      setCollectionNFTs(data.items || [])
      setTotalNFTs(data.total || 0)

      // Calculate holders from NFTs
      if (data.items && data.items.length > 0) {
        const holderMap = new Map<string, HolderInfo>()
        data.items.forEach((nft: NFTAsset) => {
          const owner = nft.ownership?.owner || 'Unknown'
          if (!holderMap.has(owner)) {
            holderMap.set(owner, { wallet: owner, count: 0, nfts: [] })
          }
          const holder = holderMap.get(owner)!
          holder.count++
          holder.nfts.push(nft.id)
        })
        setHolders(Array.from(holderMap.values()).sort((a, b) => b.count - a.count))
      }
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

  // ============ CORE ACTIONS ============

  const handleWithdraw = async () => {
    const umi = getUmi()
    if (!umi || !candyMachineAddress) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      setIsWithdrawing(true)

      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)

      // Withdraw from candy machine (reclaims rent)
      const withdrawBuilder = transactionBuilder().add(
        withdrawCandyMachine(umi, {
          candyMachine: candyMachinePublicKey,
        })
      )

      await withdrawBuilder.sendAndConfirm(umi, {
        confirm: { commitment: 'confirmed' }
      })

      toast.success("Funds withdrawn successfully!")
      setWithdrawModalOpen(false)
      fetchCandyMachineState()
    } catch (error: any) {
      console.error("Withdraw failed:", error)
      toast.error("Withdraw failed", { description: error?.message || "Check console" })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleUpdatePrice = async () => {
    const umi = getUmi()
    if (!umi || !candyMachineAddress || !candyGuardAddress) {
      toast.error("Please connect your wallet")
      return
    }

    const priceInSol = parseFloat(newMintPrice)
    if (isNaN(priceInSol) || priceInSol < 0) {
      toast.error("Please enter a valid price")
      return
    }

    try {
      setIsUpdatingPrice(true)

      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, candyMachinePublicKey)
      const candyGuard = await fetchCandyGuard(umi, cm.mintAuthority)

      // Build updated guards keeping existing ones
      const updatedGuards: any = {}

      // Update sol payment
      if (priceInSol > 0) {
        updatedGuards.solPayment = some({
          lamports: sol(priceInSol),
          destination: walletPublicKey ? umiPublicKey(walletPublicKey.toString()) : candyGuard.guards.solPayment.__option === 'Some'
            ? candyGuard.guards.solPayment.value.destination
            : cm.authority,
        })
      } else {
        updatedGuards.solPayment = none()
      }

      // Keep other existing guards
      if (candyGuard.guards.startDate.__option === 'Some') {
        updatedGuards.startDate = candyGuard.guards.startDate
      }
      if (candyGuard.guards.endDate.__option === 'Some') {
        updatedGuards.endDate = candyGuard.guards.endDate
      }
      if (candyGuard.guards.mintLimit.__option === 'Some') {
        updatedGuards.mintLimit = candyGuard.guards.mintLimit
      }

      const updateBuilder = transactionBuilder().add(
        updateCandyGuard(umi, {
          candyGuard: candyGuard.publicKey,
          guards: updatedGuards,
        })
      )

      await updateBuilder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

      toast.success(`Mint price updated to ${priceInSol} SOL`)
      setPriceModalOpen(false)
      setNewMintPrice("")
      fetchCandyMachineState()
    } catch (error: any) {
      console.error("Update price failed:", error)
      toast.error("Update failed", { description: error?.message || "Check console" })
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  const handleUpdateSchedule = async () => {
    const umi = getUmi()
    if (!umi || !candyMachineAddress || !candyGuardAddress) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      setIsUpdatingSchedule(true)

      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, candyMachinePublicKey)
      const candyGuard = await fetchCandyGuard(umi, cm.mintAuthority)

      const updatedGuards: any = {}

      // Keep existing guards
      if (candyGuard.guards.solPayment.__option === 'Some') {
        updatedGuards.solPayment = candyGuard.guards.solPayment
      }
      if (candyGuard.guards.mintLimit.__option === 'Some') {
        updatedGuards.mintLimit = candyGuard.guards.mintLimit
      }

      // Update start date
      if (startDate && startTime) {
        const startTimestamp = Math.floor(new Date(`${startDate}T${startTime}`).getTime() / 1000)
        updatedGuards.startDate = some({ date: BigInt(startTimestamp) })
      } else {
        updatedGuards.startDate = none()
      }

      // Update end date
      if (endDate && endTime) {
        const endTimestamp = Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000)
        updatedGuards.endDate = some({ date: BigInt(endTimestamp) })
      } else {
        updatedGuards.endDate = none()
      }

      const updateBuilder = transactionBuilder().add(
        updateCandyGuard(umi, {
          candyGuard: candyGuard.publicKey,
          guards: updatedGuards,
        })
      )

      await updateBuilder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

      toast.success("Mint schedule updated!")
      setScheduleModalOpen(false)
      fetchCandyMachineState()
    } catch (error: any) {
      console.error("Update schedule failed:", error)
      toast.error("Update failed", { description: error?.message || "Check console" })
    } finally {
      setIsUpdatingSchedule(false)
    }
  }

  const handleUpdateMintLimit = async () => {
    const umi = getUmi()
    if (!umi || !candyMachineAddress || !candyGuardAddress) {
      toast.error("Please connect your wallet")
      return
    }

    const limit = parseInt(newMintLimit)
    if (isNaN(limit) || limit < 0) {
      toast.error("Please enter a valid limit (0 for unlimited)")
      return
    }

    try {
      setIsUpdatingMintLimit(true)

      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, candyMachinePublicKey)
      const candyGuard = await fetchCandyGuard(umi, cm.mintAuthority)

      const updatedGuards: any = {}

      // Keep existing guards
      if (candyGuard.guards.solPayment.__option === 'Some') {
        updatedGuards.solPayment = candyGuard.guards.solPayment
      }
      if (candyGuard.guards.startDate.__option === 'Some') {
        updatedGuards.startDate = candyGuard.guards.startDate
      }
      if (candyGuard.guards.endDate.__option === 'Some') {
        updatedGuards.endDate = candyGuard.guards.endDate
      }

      // Update mint limit
      if (limit > 0) {
        updatedGuards.mintLimit = some({ id: 1, limit })
      } else {
        updatedGuards.mintLimit = none()
      }

      const updateBuilder = transactionBuilder().add(
        updateCandyGuard(umi, {
          candyGuard: candyGuard.publicKey,
          guards: updatedGuards,
        })
      )

      await updateBuilder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

      toast.success(limit > 0 ? `Mint limit set to ${limit} per wallet` : "Mint limit removed")
      setMintLimitModalOpen(false)
      setNewMintLimit("")
      fetchCandyMachineState()
    } catch (error: any) {
      console.error("Update mint limit failed:", error)
      toast.error("Update failed", { description: error?.message || "Check console" })
    } finally {
      setIsUpdatingMintLimit(false)
    }
  }

  const handleAirdrop = async () => {
    const umi = getUmi()
    if (!umi || !candyMachineAddress) {
      toast.error("Please connect your wallet")
      return
    }

    const wallets = airdropWallets.split('\n').map(w => w.trim()).filter(w => w.length > 0)
    const quantity = parseInt(airdropQuantity) || 1

    if (wallets.length === 0) {
      toast.error("Please enter at least one wallet address")
      return
    }

    try {
      setIsAirdropping(true)

      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)
      const cm = await fetchCandyMachine(umi, candyMachinePublicKey)

      let candyGuard = null
      try {
        candyGuard = await fetchCandyGuard(umi, cm.mintAuthority)
      } catch (e) {
        console.log('No candy guard found')
      }

      let successCount = 0
      let failCount = 0

      for (const walletAddress of wallets) {
        for (let i = 0; i < quantity; i++) {
          try {
            const nftMint = generateSigner(umi)
            const targetOwner = umiPublicKey(walletAddress)

            const mintBuilder = transactionBuilder()
              .add(setComputeUnitLimit(umi, { units: 400_000 }))
              .add(
                mintV2(umi, {
                  candyMachine: candyMachinePublicKey,
                  nftMint,
                  collectionMint: cm.collectionMint,
                  collectionUpdateAuthority: cm.authority,
                  candyGuard: candyGuard?.publicKey,
                })
              )

            await mintBuilder.sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })
            successCount++
          } catch (error) {
            console.error(`Failed to airdrop to ${walletAddress}:`, error)
            failCount++
          }
        }
      }

      toast.success(`Airdrop complete: ${successCount} sent, ${failCount} failed`)
      setAirdropModalOpen(false)
      setAirdropWallets("")
      fetchCandyMachineState()
      fetchCollectionNFTs(1, true)
    } catch (error: any) {
      console.error("Airdrop failed:", error)
      toast.error("Airdrop failed", { description: error?.message || "Check console" })
    } finally {
      setIsAirdropping(false)
    }
  }

  const exportHoldersCsv = () => {
    if (holders.length === 0) {
      toast.error("No holders to export")
      return
    }

    const csvContent = [
      "Wallet,NFT Count,NFT Mints",
      ...holders.map(h => `${h.wallet},${h.count},"${h.nfts.join(', ')}"`)
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

      const umi = getUmi()
      if (!umi) throw new Error("Failed to initialize")

      const confirmOptions = { send: { commitment: 'confirmed' as const }, confirm: { commitment: 'confirmed' as const } }

      setMintStep("Fetching candy machine...")
      const candyMachinePublicKey = umiPublicKey(candyMachineAddress)
      const candyMachineAccount = await fetchCandyMachine(umi, candyMachinePublicKey)

      if (Number(candyMachineAccount.itemsLoaded) === 0) {
        throw new Error('Candy machine has no items loaded.')
      }

      if (Number(candyMachineAccount.itemsRedeemed) >= Number(candyMachineAccount.itemsLoaded)) {
        throw new Error('All items have been minted.')
      }

      setMintStep("Fetching candy guard...")
      let candyGuard = null
      let mintArgs: any = {}

      try {
        candyGuard = await fetchCandyGuard(umi, candyMachineAccount.mintAuthority)

        if (candyGuard.guards.solPayment.__option === 'Some') {
          mintArgs.solPayment = some({
            destination: candyGuard.guards.solPayment.value.destination,
          })
        }
      } catch (e) {
        console.log('No candy guard found:', e)
      }

      setMintStep("Preparing mint...")
      const nftMint = generateSigner(umi)

      const mintBuilder = transactionBuilder()
        .add(setComputeUnitLimit(umi, { units: 400_000 }))
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

      const signatureStr = typeof result.signature === 'string'
        ? result.signature
        : base58.deserialize(result.signature)[0]

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

  const isOwner = candyMachineState?.authority === walletPublicKey?.toString()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {manifest?.image ? (
          <img src={manifest.image} alt={collection.name} className="w-40 h-40 rounded-2xl object-cover shadow-lg" />
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
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Legacy</Badge>
              {isOwner && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Owner</Badge>}
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
            <div className="text-3xl font-bold">{guardSettings?.solPayment?.amount ?? mintPrice} SOL</div>
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
            <div className="text-3xl font-bold text-green-500">{totalRevenue.toFixed(2)} SOL</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{holders.length}</div>
            <div className="text-sm text-muted-foreground">Unique Holders</div>
          </CardContent>
        </Card>
      </div>

      {/* Minting Status Banner */}
      {guardSettings && (
        <div className={`p-4 rounded-lg border ${mintingEnabled ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
          <div className="flex items-center gap-3">
            {mintingEnabled ? (
              <Play className="h-5 w-5 text-green-500" />
            ) : (
              <Pause className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <div className={`font-medium ${mintingEnabled ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                {mintingEnabled ? 'Minting is Live' : 'Minting Paused'}
              </div>
              <div className={`text-sm ${mintingEnabled ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {guardSettings.startDate && `Starts: ${new Date(guardSettings.startDate * 1000).toLocaleString()}`}
                {guardSettings.startDate && guardSettings.endDate && ' | '}
                {guardSettings.endDate && `Ends: ${new Date(guardSettings.endDate * 1000).toLocaleString()}`}
                {guardSettings.mintLimit && ` | Limit: ${guardSettings.mintLimit.limit} per wallet`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="nfts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nfts" className="gap-2"><Grid3X3 className="h-4 w-4" />NFTs ({totalNFTs})</TabsTrigger>
          <TabsTrigger value="holders" className="gap-2"><Users className="h-4 w-4" />Holders ({holders.length})</TabsTrigger>
          <TabsTrigger value="manage" className="gap-2"><Settings className="h-4 w-4" />Manage</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Details</TabsTrigger>
        </TabsList>

        {/* NFTs Tab */}
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
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-2" onClick={() => copyToClipboard(holder.wallet, holder.wallet)}>
                            {copied === holder.wallet ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{holder.count} NFT{holder.count > 1 ? 's' : ''}</div>
                        <div className="text-xs text-muted-foreground">
                          {((holder.count / totalNFTs) * 100).toFixed(1)}% of supply
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-4">
          {!isOwner && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  You are not the owner of this candy machine. Management features are disabled.
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Revenue & Withdraw */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Revenue & Withdraw
                </CardTitle>
                <CardDescription>View earnings and withdraw funds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-500">{totalRevenue.toFixed(4)} SOL</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">NFTs Sold</div>
                    <div className="text-2xl font-bold">{candyMachineState?.itemsRedeemed ?? 0}</div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setWithdrawModalOpen(true)} disabled={!isOwner}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </CardContent>
            </Card>

            {/* Mint Price */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Mint Price
                </CardTitle>
                <CardDescription>Update the mint price for your collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Current Price</div>
                  <div className="text-2xl font-bold">{guardSettings?.solPayment?.amount ?? mintPrice} SOL</div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setPriceModalOpen(true)} disabled={!isOwner || !candyGuardAddress}>
                  Update Price
                </Button>
              </CardContent>
            </Card>

            {/* Mint Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Mint Schedule
                </CardTitle>
                <CardDescription>Control when minting is available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span>{guardSettings?.startDate ? new Date(guardSettings.startDate * 1000).toLocaleString() : 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span>{guardSettings?.endDate ? new Date(guardSettings.endDate * 1000).toLocaleString() : 'Not set'}</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setScheduleModalOpen(true)} disabled={!isOwner || !candyGuardAddress}>
                  {mintingEnabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Update Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Mint Limit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Mint Limit
                </CardTitle>
                <CardDescription>Limit mints per wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Current Limit</div>
                  <div className="text-2xl font-bold">
                    {guardSettings?.mintLimit?.limit ?? 'Unlimited'}
                    {guardSettings?.mintLimit && <span className="text-sm font-normal text-muted-foreground"> per wallet</span>}
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setMintLimitModalOpen(true)} disabled={!isOwner || !candyGuardAddress}>
                  Update Limit
                </Button>
              </CardContent>
            </Card>

            {/* Airdrop */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Airdrop
                </CardTitle>
                <CardDescription>Send NFTs to specific wallets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Available to Airdrop</div>
                  <div className="text-2xl font-bold">
                    {candyMachineState ? candyMachineState.itemsLoaded - candyMachineState.itemsRedeemed : '-'}
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setAirdropModalOpen(true)} disabled={!isOwner}>
                  <Send className="h-4 w-4 mr-2" />
                  Airdrop NFTs
                </Button>
              </CardContent>
            </Card>

            {/* Allowlist - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Allowlist
                </CardTitle>
                <CardDescription>Manage whitelist for minting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-lg font-bold">
                    {guardSettings?.allowList ? 'Active' : 'Not configured'}
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setAllowlistModalOpen(true)} disabled={!isOwner || !candyGuardAddress}>
                  Manage Allowlist
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Candy Machine</CardTitle></CardHeader>
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

                {candyGuardAddress && (
                  <div>
                    <label className="text-sm text-muted-foreground">Candy Guard</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{candyGuardAddress}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(candyGuardAddress, 'cg')}>
                        {copied === 'cg' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
                        <strong>Problem:</strong> No items loaded!
                      </div>
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

      {/* ============ MODALS ============ */}

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
                <div className="text-2xl font-bold">{guardSettings?.solPayment?.amount ?? mintPrice} SOL</div>
              </div>
              {(manifest?.image || collection.image_url) && (
                <img src={manifest?.image || collection.image_url} alt={collection.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
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
                    <div key={idx} className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => openInExplorer(nft.mint)}>
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
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleMint} disabled={isMinting || !connected}>
              {isMinting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting...</> : <><Sparkles className="h-4 w-4 mr-2" />Mint for {guardSettings?.solPayment?.amount ?? mintPrice} SOL</>}
            </Button>

            {!connected && (
              <p className="text-xs text-center text-muted-foreground">Connect your wallet using the button in the navigation bar</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Withdraw collected funds and reclaim rent from the candy machine</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Revenue</span>
                <span className="font-bold text-green-500">{totalRevenue.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NFTs Sold</span>
                <span className="font-medium">{candyMachineState?.itemsRedeemed ?? 0}</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> This will close the candy machine and reclaim all rent. Make sure minting is complete.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawModalOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Withdrawing...</> : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Price Modal */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Mint Price</DialogTitle>
            <DialogDescription>Set a new mint price for your collection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Price</Label>
              <div className="text-2xl font-bold">{guardSettings?.solPayment?.amount ?? mintPrice} SOL</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPrice">New Price (SOL)</Label>
              <Input id="newPrice" type="number" step="0.001" min="0" placeholder="0.1" value={newMintPrice} onChange={(e) => setNewMintPrice(e.target.value)} />
              <p className="text-xs text-muted-foreground">Set to 0 for free mints</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePrice} disabled={isUpdatingPrice}>
              {isUpdatingPrice ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Price'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Mint Schedule</DialogTitle>
            <DialogDescription>Control when minting is available</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Leave empty to start immediately</p>
            </div>
            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Leave empty for no end date</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSchedule} disabled={isUpdatingSchedule}>
              {isUpdatingSchedule ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mint Limit Modal */}
      <Dialog open={mintLimitModalOpen} onOpenChange={setMintLimitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Mint Limit</DialogTitle>
            <DialogDescription>Limit how many NFTs each wallet can mint</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Limit</Label>
              <div className="text-2xl font-bold">{guardSettings?.mintLimit?.limit ?? 'Unlimited'}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mintLimit">New Limit (per wallet)</Label>
              <Input id="mintLimit" type="number" min="0" placeholder="5" value={newMintLimit} onChange={(e) => setNewMintLimit(e.target.value)} />
              <p className="text-xs text-muted-foreground">Set to 0 for unlimited</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMintLimitModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateMintLimit} disabled={isUpdatingMintLimit}>
              {isUpdatingMintLimit ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Limit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Airdrop Modal */}
      <Dialog open={airdropModalOpen} onOpenChange={setAirdropModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Airdrop NFTs</DialogTitle>
            <DialogDescription>Send NFTs to specific wallet addresses</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Available to Airdrop</div>
              <div className="text-xl font-bold">{candyMachineState ? candyMachineState.itemsLoaded - candyMachineState.itemsRedeemed : 0} NFTs</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="airdropWallets">Wallet Addresses (one per line)</Label>
              <Textarea id="airdropWallets" placeholder="wallet1address...\nwallet2address...\nwallet3address..." rows={5} value={airdropWallets} onChange={(e) => setAirdropWallets(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airdropQty">NFTs per Wallet</Label>
              <Input id="airdropQty" type="number" min="1" max="10" value={airdropQuantity} onChange={(e) => setAirdropQuantity(e.target.value)} />
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              Total: {(airdropWallets.split('\n').filter(w => w.trim()).length * (parseInt(airdropQuantity) || 1))} NFTs to {airdropWallets.split('\n').filter(w => w.trim()).length} wallets
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAirdropModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAirdrop} disabled={isAirdropping}>
              {isAirdropping ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send Airdrop</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allowlist Modal */}
      <Dialog open={allowlistModalOpen} onOpenChange={setAllowlistModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Allowlist</DialogTitle>
            <DialogDescription>Add wallets to the whitelist for minting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> Allowlist requires generating a Merkle root from wallet addresses. This feature requires additional setup.
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowlistWallets">Whitelisted Wallets (one per line)</Label>
              <Textarea id="allowlistWallets" placeholder="wallet1address...\nwallet2address...\nwallet3address..." rows={8} value={allowlistWallets} onChange={(e) => setAllowlistWallets(e.target.value)} />
            </div>
            <div className="text-sm text-muted-foreground">
              {allowlistWallets.split('\n').filter(w => w.trim()).length} wallets in list
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllowlistModalOpen(false)}>Cancel</Button>
            <Button disabled>
              Coming Soon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
