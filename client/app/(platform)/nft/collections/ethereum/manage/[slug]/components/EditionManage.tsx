"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Loader2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, RefreshCw,
  Settings, Wallet, Minus, Plus, Layers, Banknote, Pause, Play, Send, DollarSign,
  Users, AlertTriangle, TrendingUp, Activity, Clock, Lock
} from "lucide-react"
import { toast } from "sonner"
import { Collection, EthereumCollectionData } from "@/declarations/registry/registry.did"
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

interface EditionManageProps {
  collection: Collection
  ethData: EthereumCollectionData
}

interface MintEvent {
  minter: string
  quantity: number
  txHash: string
  timestamp: number
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

  // Owner feature state
  const [contractBalance, setContractBalance] = useState<bigint | null>(null)
  const [isPaused, setIsPaused] = useState<boolean | null>(null)
  const [maxPerWallet, setMaxPerWallet] = useState<bigint | null>(null)
  const [contractOwner, setContractOwner] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<MintEvent[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)
  const [isLoadingContract, setIsLoadingContract] = useState(false)

  // Modal states
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [airdropModalOpen, setAirdropModalOpen] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [maxWalletModalOpen, setMaxWalletModalOpen] = useState(false)
  const [maxSupplyModalOpen, setMaxSupplyModalOpen] = useState(false)

  // Action states
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isPauseToggling, setIsPauseToggling] = useState(false)
  const [isAirdropping, setIsAirdropping] = useState(false)
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [isUpdatingMaxWallet, setIsUpdatingMaxWallet] = useState(false)
  const [isUpdatingMaxSupply, setIsUpdatingMaxSupply] = useState(false)

  // Form states
  const [airdropAddresses, setAirdropAddresses] = useState("")
  const [airdropQuantity, setAirdropQuantity] = useState("1")
  const [newMintPrice, setNewMintPrice] = useState("")
  const [newMaxPerWallet, setNewMaxPerWallet] = useState("")
  const [newMaxSupply, setNewMaxSupply] = useState("")

  const contractAddress = ethData?.contract_address?.[0] || null
  const manifestUrl = ethData?.manifest_url?.[0] || null
  const collectionChainId = ethData ? Number(ethData.chain_id) : 1
  const mintPriceWei = ethData?.mint_price_wei?.[0] || BigInt(0)

  const isOwner = contractOwner && address && contractOwner.toLowerCase() === address.toLowerCase()
  const isOpenEdition = maxSupply === null || maxSupply === BigInt(0)

  // Fetch manifest
  useEffect(() => {
    if (manifestUrl && !manifest) {
      fetch(manifestUrl)
        .then(res => res.json())
        .then(async data => {
          setManifest(data)
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

  const fetchContractState = useCallback(async () => {
    if (!contractAddress || !publicClient) return
    setIsLoadingContract(true)
    try {
      const balance = await publicClient.getBalance({ address: contractAddress as `0x${string}` })
      setContractBalance(balance)

      // Try totalMinted, fallback to totalSupply(0) for ERC-1155
      try {
        const minted = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'totalMinted', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'totalMinted',
        })
        setTotalMinted(minted as bigint)
      } catch {
        try {
          const supply = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: [{ name: 'totalSupply', type: 'function', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
            functionName: 'totalSupply',
            args: [BigInt(0)],
          })
          setTotalMinted(supply as bigint)
        } catch { /* contract may not have this function */ }
      }

      try {
        const supply = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'maxSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'maxSupply',
        })
        setMaxSupply(supply as bigint)
      } catch { /* contract may not have this function */ }
    } catch (error) {
      console.error("Failed to fetch contract state:", error)
    } finally {
      setIsLoadingContract(false)
    }
  }, [contractAddress, publicClient])

  const fetchOwnerData = useCallback(async () => {
    if (!contractAddress || !publicClient) return
    try {
      const [owner, paused, maxWallet] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'owner', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' }],
          functionName: 'owner',
        }).catch(() => null),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'paused', type: 'function', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' }],
          functionName: 'paused',
        }).catch(() => null),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'maxPerWallet', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'maxPerWallet',
        }).catch(() => null),
      ])
      if (owner !== null) setContractOwner(owner as string)
      if (paused !== null) setIsPaused(paused as boolean)
      if (maxWallet !== null) setMaxPerWallet(maxWallet as bigint)
    } catch (error) {
      console.error("Failed to fetch owner data:", error)
    }
  }, [contractAddress, publicClient])

  const fetchRecentActivity = useCallback(async () => {
    if (!contractAddress || !publicClient) return
    setIsLoadingActivity(true)
    try {
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(0)

      // ERC-1155 TransferSingle event
      const logs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        event: {
          type: 'event',
          name: 'TransferSingle',
          inputs: [
            { type: 'address', indexed: true, name: 'operator' },
            { type: 'address', indexed: true, name: 'from' },
            { type: 'address', indexed: true, name: 'to' },
            { type: 'uint256', indexed: false, name: 'id' },
            { type: 'uint256', indexed: false, name: 'value' },
          ],
        },
        fromBlock,
        toBlock: 'latest',
      })

      const mintLogs = logs
        .filter(log => log.args.from === '0x0000000000000000000000000000000000000000')
        .slice(-20)
        .reverse()

      const activities: MintEvent[] = []
      for (const log of mintLogs) {
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          activities.push({
            minter: log.args.to as string,
            quantity: Number(log.args.value),
            txHash: log.transactionHash,
            timestamp: Number(block.timestamp) * 1000,
          })
        } catch {
          activities.push({
            minter: log.args.to as string,
            quantity: Number(log.args.value),
            txHash: log.transactionHash,
            timestamp: Date.now(),
          })
        }
      }

      setRecentActivity(activities.slice(0, 10))
    } catch (error) {
      console.error("Failed to fetch activity:", error)
    } finally {
      setIsLoadingActivity(false)
    }
  }, [contractAddress, publicClient])

  useEffect(() => {
    if (contractAddress && publicClient && chainId === collectionChainId) {
      fetchContractState()
      fetchOwnerData()
      fetchRecentActivity()
    }
  }, [contractAddress, publicClient, chainId, collectionChainId, fetchContractState, fetchOwnerData, fetchRecentActivity])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const ensureCorrectChain = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet")
      return false
    }
    if (chainId !== collectionChainId) {
      toast.error(`Please switch to ${getChainName(collectionChainId)}`)
      switchChain({ chainId: collectionChainId })
      return false
    }
    return true
  }

  // ==================== OWNER ACTIONS ====================

  const handleWithdraw = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    try {
      setIsWithdrawing(true)
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: [{ name: 'withdraw', type: 'function', inputs: [], outputs: [], stateMutability: 'nonpayable' }],
        functionName: 'withdraw',
      })

      toast.info("Withdrawing funds...")
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success("Funds withdrawn!", {
        action: { label: "View TX", onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank') }
      })

      fetchContractState()
      setWithdrawModalOpen(false)
    } catch (error: any) {
      console.error("Withdraw failed:", error)
      toast.error("Withdraw failed", { description: error?.shortMessage || error?.message })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handlePauseToggle = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    const action = isPaused ? 'unpause' : 'pause'
    try {
      setIsPauseToggling(true)
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: [{ name: action, type: 'function', inputs: [], outputs: [], stateMutability: 'nonpayable' }],
        functionName: action,
      })

      toast.info(`${isPaused ? 'Resuming' : 'Pausing'} minting...`)
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success(`Minting ${isPaused ? 'resumed' : 'paused'}!`, {
        action: { label: "View TX", onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank') }
      })

      setIsPaused(!isPaused)
    } catch (error: any) {
      console.error("Pause toggle failed:", error)
      toast.error(`Failed to ${action}`, { description: error?.shortMessage || error?.message })
    } finally {
      setIsPauseToggling(false)
    }
  }

  const handleAirdrop = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    const addresses = airdropAddresses
      .split(/[\n,]/)
      .map(a => a.trim())
      .filter(a => a.startsWith('0x') && a.length === 42)

    if (addresses.length === 0) {
      toast.error("Please enter valid addresses")
      return
    }

    const qty = parseInt(airdropQuantity) || 1

    try {
      setIsAirdropping(true)

      // Try batch airdrop first
      let hash: string
      try {
        hash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'airdrop', type: 'function', inputs: [{ name: 'recipients', type: 'address[]' }, { name: 'quantity', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }],
          functionName: 'airdrop',
          args: [addresses as `0x${string}`[], BigInt(qty)],
        })
      } catch {
        // Fallback: mintTo
        hash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: [{ name: 'mintTo', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }, { name: 'quantity', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }],
          functionName: 'mintTo',
          args: [addresses[0] as `0x${string}`, BigInt(0), BigInt(qty)],
        })
      }

      toast.info(`Airdropping to ${addresses.length} addresses...`)
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success(`Airdropped ${qty} copies to ${addresses.length} addresses!`, {
        action: { label: "View TX", onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank') }
      })

      fetchContractState()
      fetchRecentActivity()
      setAirdropModalOpen(false)
      setAirdropAddresses("")
      setAirdropQuantity("1")
    } catch (error: any) {
      console.error("Airdrop failed:", error)
      toast.error("Airdrop failed", { description: error?.shortMessage || error?.message })
    } finally {
      setIsAirdropping(false)
    }
  }

  const handleUpdatePrice = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    const priceWei = parseEther(newMintPrice || "0")

    try {
      setIsUpdatingPrice(true)
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: [{ name: 'setMintPrice', type: 'function', inputs: [{ name: 'price', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }],
        functionName: 'setMintPrice',
        args: [priceWei],
      })

      toast.info("Updating mint price...")
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success(`Mint price updated to ${newMintPrice} ETH!`, {
        action: { label: "View TX", onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank') }
      })

      setPriceModalOpen(false)
      setNewMintPrice("")
    } catch (error: any) {
      console.error("Update price failed:", error)
      toast.error("Failed to update price", { description: error?.shortMessage || error?.message })
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  const handleUpdateMaxPerWallet = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    const maxValue = BigInt(newMaxPerWallet || "0")

    try {
      setIsUpdatingMaxWallet(true)
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: [{ name: 'setMaxPerWallet', type: 'function', inputs: [{ name: 'max', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }],
        functionName: 'setMaxPerWallet',
        args: [maxValue],
      })

      toast.info("Updating max per wallet...")
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success(`Max per wallet updated to ${newMaxPerWallet}!`, {
        action: { label: "View TX", onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank') }
      })

      setMaxPerWallet(maxValue)
      setMaxWalletModalOpen(false)
      setNewMaxPerWallet("")
    } catch (error: any) {
      console.error("Update max per wallet failed:", error)
      toast.error("Failed to update", { description: error?.shortMessage || error?.message })
    } finally {
      setIsUpdatingMaxWallet(false)
    }
  }

  const handleSetMaxSupply = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    const supplyValue = BigInt(newMaxSupply || "0")

    if (totalMinted !== null && supplyValue < totalMinted) {
      toast.error("Max supply cannot be less than already minted")
      return
    }

    try {
      setIsUpdatingMaxSupply(true)
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: [{ name: 'setMaxSupply', type: 'function', inputs: [{ name: 'supply', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }],
        functionName: 'setMaxSupply',
        args: [supplyValue],
      })

      toast.info("Setting max supply...")
      await publicClient?.waitForTransactionReceipt({ hash })

      toast.success(`Edition closed at ${newMaxSupply} copies!`, {
        action: { label: "View TX", onClick: () => window.open(getExplorerUrl(collectionChainId, hash, 'tx'), '_blank') }
      })

      setMaxSupply(supplyValue)
      setMaxSupplyModalOpen(false)
      setNewMaxSupply("")
    } catch (error: any) {
      console.error("Set max supply failed:", error)
      toast.error("Failed to set max supply", { description: error?.shortMessage || error?.message })
    } finally {
      setIsUpdatingMaxSupply(false)
    }
  }

  // ==================== MINT HANDLER ====================

  const handleMint = async () => {
    if (!await ensureCorrectChain() || !walletClient || !contractAddress) return

    try {
      setIsMinting(true)
      setMintStep("Preparing transaction...")

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
        args: [BigInt(0), BigInt(mintQuantity)],
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

      setMintModalOpen(false)

      await new Promise(resolve => setTimeout(resolve, 2000))
      await fetchContractState()
      await fetchRecentActivity()
    } catch (error: any) {
      console.error("Mint failed:", error)
      toast.error("Mint failed", { description: error?.shortMessage || error?.message })
    } finally {
      setIsMinting(false)
      setMintStep("")
    }
  }

  // ==================== COMPUTED VALUES ====================

  const mintPrice = Number(mintPriceWei) / 1e18
  const totalPrice = mintPrice * mintQuantity
  const mintProgress = totalMinted !== null && maxSupply !== null && maxSupply > BigInt(0)
    ? Number((totalMinted * BigInt(100)) / maxSupply)
    : 0
  const balanceEth = contractBalance !== null ? formatEther(contractBalance) : '0'
  const estimatedRevenue = totalMinted !== null ? Number(totalMinted) * mintPrice : 0

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
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold">{collection.name}</h1>
              <Badge variant="secondary">{collection.symbol}</Badge>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{getChainName(collectionChainId)}</Badge>
              <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">Edition (ERC-1155)</Badge>
              {isOpenEdition && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Open Edition</Badge>}
              {isPaused && <Badge variant="destructive">Paused</Badge>}
            </div>
            <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMintModalOpen(true)} className="gap-2" disabled={isPaused === true}>
              <Layers className="h-4 w-4" />
              Mint Copies
            </Button>
            <Button variant="outline" onClick={() => { fetchContractState(); fetchOwnerData(); fetchRecentActivity(); }}>
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

      {/* Wallet Connection Banner */}
      {!isConnected && (
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">Wallet Not Connected</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Connect your Ethereum wallet to manage this collection</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mint Progress Bar - only show if not open edition */}
      {!isOpenEdition && maxSupply !== null && maxSupply > BigInt(0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Mint Progress</span>
              <span className="text-sm text-muted-foreground">
                {totalMinted?.toString() || '0'} / {maxSupply.toString()} copies
              </span>
            </div>
            <Progress value={mintProgress} className="h-3" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{mintProgress.toFixed(1)}% minted</span>
              <span className="text-xs text-muted-foreground">
                {(Number(maxSupply) - Number(totalMinted || 0)).toString()} remaining
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Balance</span>
            </div>
            <div className="text-2xl font-bold">{Number(balanceEth).toFixed(4)} ETH</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Est. Revenue</span>
            </div>
            <div className="text-2xl font-bold">{estimatedRevenue.toFixed(2)} ETH</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Mint Price</span>
            </div>
            <div className="text-2xl font-bold">{mintPrice} ETH</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">Copies Minted</span>
            </div>
            <div className="text-2xl font-bold">{totalMinted !== null ? totalMinted.toString() : '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Max/Wallet</span>
            </div>
            <div className="text-2xl font-bold">{maxPerWallet !== null ? (maxPerWallet === BigInt(0) ? '∞' : maxPerWallet.toString()) : '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Owner Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => setWithdrawModalOpen(true)}
              >
                <Banknote className="h-5 w-5 text-green-500" />
                <span>Withdraw</span>
                <span className="text-xs text-muted-foreground">{Number(balanceEth).toFixed(4)} ETH</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2"
                onClick={handlePauseToggle}
                disabled={isPauseToggling}
              >
                {isPauseToggling ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPaused ? (
                  <Play className="h-5 w-5 text-green-500" />
                ) : (
                  <Pause className="h-5 w-5 text-yellow-500" />
                )}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
                <span className="text-xs text-muted-foreground">{isPaused ? 'Minting paused' : 'Minting active'}</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => setAirdropModalOpen(true)}
              >
                <Send className="h-5 w-5 text-blue-500" />
                <span>Airdrop</span>
                <span className="text-xs text-muted-foreground">Send copies</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => setPriceModalOpen(true)}
              >
                <DollarSign className="h-5 w-5 text-yellow-500" />
                <span>Set Price</span>
                <span className="text-xs text-muted-foreground">{mintPrice} ETH</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => setMaxWalletModalOpen(true)}
              >
                <Users className="h-5 w-5 text-purple-500" />
                <span>Max/Wallet</span>
                <span className="text-xs text-muted-foreground">{maxPerWallet !== null ? (maxPerWallet === BigInt(0) ? 'Unlimited' : maxPerWallet.toString()) : '-'}</span>
              </Button>

              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => setMaxSupplyModalOpen(true)}
              >
                <Lock className="h-5 w-5 text-red-500" />
                <span>Close Edition</span>
                <span className="text-xs text-muted-foreground">{isOpenEdition ? 'Open' : maxSupply?.toString()}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not owner info */}
      {contractOwner && !isOwner && isConnected && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Owner actions are only available to the contract owner ({contractOwner.slice(0, 6)}...{contractOwner.slice(-4)})</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="edition" className="space-y-6">
        <TabsList>
          <TabsTrigger value="edition" className="gap-2"><Layers className="h-4 w-4" />Edition</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Activity className="h-4 w-4" />Activity</TabsTrigger>
          <TabsTrigger value="details" className="gap-2"><Settings className="h-4 w-4" />Details</TabsTrigger>
        </TabsList>

        <TabsContent value="edition" className="space-y-4">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
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
                      {!isOpenEdition && maxSupply !== null && (
                        <span className="text-muted-foreground font-normal"> / {maxSupply.toString()}</span>
                      )}
                      {isOpenEdition && <span className="text-muted-foreground font-normal"> (Open)</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Price per Copy</span>
                    <span className="font-bold">{mintPrice} ETH</span>
                  </div>
                </div>

                <Button onClick={() => setMintModalOpen(true)} className="w-full gap-2" size="lg" disabled={isPaused === true}>
                  <Layers className="h-4 w-4" />
                  Mint Copies
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Recent Mints</span>
                <Button variant="ghost" size="sm" onClick={fetchRecentActivity} disabled={isLoadingActivity}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingActivity ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No minting activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((event, i) => (
                    <div key={event.txHash + i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <Layers className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {event.minter.slice(0, 6)}...{event.minter.slice(-4)} minted {event.quantity} {event.quantity > 1 ? 'copies' : 'copy'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(collectionChainId, event.txHash, 'tx'), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
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
                {contractOwner && (
                  <div>
                    <label className="text-sm text-muted-foreground">Owner Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate">{contractOwner}</code>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(contractOwner, 'owner')}>
                        {copied === 'owner' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><div className="text-sm text-muted-foreground">Chain</div><div className="font-medium">{getChainName(collectionChainId)}</div></div>
                  <div><div className="text-sm text-muted-foreground">Type</div><div className="font-medium">ERC-1155</div></div>
                  <div><div className="text-sm text-muted-foreground">Royalties</div><div className="font-medium">{Number(collection.royalty_bps) / 100}%</div></div>
                  <div><div className="text-sm text-muted-foreground">Status</div><div className="font-medium">{isPaused ? 'Paused' : 'Active'}</div></div>
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

      {/* ==================== MODALS ==================== */}

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

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))} disabled={mintQuantity <= 1}>
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
                <Button variant="outline" size="icon" onClick={() => setMintQuantity(Math.min(100, mintQuantity + 1))} disabled={mintQuantity >= 100}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Max 100 copies per transaction</p>
            </div>

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

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Withdraw accumulated ETH from your contract</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-6 bg-green-500/10 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
              <div className="text-4xl font-bold text-green-500">{Number(balanceEth).toFixed(6)} ETH</div>
            </div>

            {Number(balanceEth) === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-600 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                No funds available to withdraw
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Funds will be sent to your connected wallet address: {address?.slice(0, 10)}...{address?.slice(-8)}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawModalOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={isWithdrawing || Number(balanceEth) === 0} className="bg-green-600 hover:bg-green-700">
              {isWithdrawing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Withdrawing...</> : 'Withdraw All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Airdrop Modal */}
      <Dialog open={airdropModalOpen} onOpenChange={setAirdropModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Airdrop Copies</DialogTitle>
            <DialogDescription>Send copies to multiple addresses</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Recipient Addresses</Label>
              <Textarea
                placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                value={airdropAddresses}
                onChange={(e) => setAirdropAddresses(e.target.value)}
                rows={6}
                className="mt-2 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {airdropAddresses.split(/[\n,]/).filter(a => a.trim().startsWith('0x') && a.trim().length === 42).length} valid addresses
              </p>
            </div>

            <div>
              <Label>Copies per Address</Label>
              <Input
                type="number"
                value={airdropQuantity}
                onChange={(e) => setAirdropQuantity(e.target.value)}
                min={1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-cyan-500/10 text-cyan-500 rounded-lg text-sm">
              <Send className="h-4 w-4" />
              Each address will receive {airdropQuantity} {parseInt(airdropQuantity) > 1 ? 'copies' : 'copy'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAirdropModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAirdrop} disabled={isAirdropping || !airdropAddresses.trim()}>
              {isAirdropping ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Airdropping...</> : 'Send Airdrop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Price Modal */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Mint Price</DialogTitle>
            <DialogDescription>Set a new mint price for your edition</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="text-2xl font-bold">{mintPrice} ETH</div>
            </div>

            <div>
              <Label>New Price (ETH)</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.05"
                value={newMintPrice}
                onChange={(e) => setNewMintPrice(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter 0 for free mints</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePrice} disabled={isUpdatingPrice || newMintPrice === ''}>
              {isUpdatingPrice ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Price'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Max Per Wallet Modal */}
      <Dialog open={maxWalletModalOpen} onOpenChange={setMaxWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Max Per Wallet</DialogTitle>
            <DialogDescription>Limit how many copies each wallet can mint</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Current Limit</div>
              <div className="text-2xl font-bold">
                {maxPerWallet !== null ? (maxPerWallet === BigInt(0) ? 'Unlimited' : maxPerWallet.toString()) : '-'}
              </div>
            </div>

            <div>
              <Label>New Limit</Label>
              <Input
                type="number"
                placeholder="10"
                value={newMaxPerWallet}
                onChange={(e) => setNewMaxPerWallet(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter 0 for unlimited</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMaxWalletModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateMaxPerWallet} disabled={isUpdatingMaxWallet || newMaxPerWallet === ''}>
              {isUpdatingMaxWallet ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : 'Update Limit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Edition / Set Max Supply Modal */}
      <Dialog open={maxSupplyModalOpen} onOpenChange={setMaxSupplyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Edition</DialogTitle>
            <DialogDescription>Set a max supply to close this open edition</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Current Status</div>
              <div className="text-2xl font-bold">
                {isOpenEdition ? 'Open Edition (Unlimited)' : `Limited to ${maxSupply?.toString()}`}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {totalMinted?.toString() || '0'} copies already minted
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4" />
              This action cannot be undone. Once set, max supply can only be decreased.
            </div>

            <div>
              <Label>Max Supply</Label>
              <Input
                type="number"
                placeholder={totalMinted?.toString() || "100"}
                value={newMaxSupply}
                onChange={(e) => setNewMaxSupply(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least {totalMinted?.toString() || '0'} (already minted)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMaxSupplyModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSetMaxSupply}
              disabled={isUpdatingMaxSupply || newMaxSupply === '' || (totalMinted !== null && BigInt(newMaxSupply || 0) < totalMinted)}
              variant="destructive"
            >
              {isUpdatingMaxSupply ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting...</> : 'Close Edition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
