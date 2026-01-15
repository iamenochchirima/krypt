"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, Copy, CheckCircle2, Rocket, Trash2, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, Connection } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import { createCreateAuctionHouseInstruction, PROGRAM_ID as AUCTION_HOUSE_PROGRAM_ID } from "@metaplex-foundation/mpl-auction-house"
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js"

const SOLANA_NETWORK = "devnet"
const NATIVE_MINT = new PublicKey("So11111111111111111111111111111111111111112")
const AUCTION_HOUSE_ADDRESS = new PublicKey("9iyTqHkzCxiUUiguLpa3otxbRTcj7DhXSmewY9fnSX8n")

interface ListingInfo {
  tradeState: string
  seller: string
  metadata: string
  price: number
  createdAt: number
  status: "active" | "sold" | "cancelled" | "orphaned"
  reason?: string
}

interface DeployedContract {
  name: string
  address: string
  network: string
  deployedAt: string
}

export default function SmartContractsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStep, setDeployStep] = useState("")
  const [sellerFeeBps, setSellerFeeBps] = useState(200)
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  // Listings management state
  const [listings, setListings] = useState<ListingInfo[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set())

  const wallet = useWallet()

  const staleListings = listings.filter(l => l.status !== "active")
  const activeListings = listings.filter(l => l.status === "active")

  const checkSellerOwnsNft = async (connection: Connection, seller: PublicKey, mint: PublicKey): Promise<boolean> => {
    try {
      const sellerAta = await getAssociatedTokenAddress(mint, seller)
      const tokenAccount = await getAccount(connection, sellerAta)
      return tokenAccount.amount > 0n
    } catch {
      // Token account doesn't exist or has zero balance
      return false
    }
  }

  const loadListings = async () => {
    if (!connection) return
    setIsLoadingListings(true)
    try {
      const metaplex = Metaplex.make(connection)
      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: AUCTION_HOUSE_ADDRESS })
      const allListings = await metaplex.auctionHouse().findListings({ auctionHouse })

      const listingInfos: ListingInfo[] = []

      for (const lazyListing of allListings as any[]) {
        let status: ListingInfo["status"] = "active"
        let reason = ""
        let mintAddress = ""

        if (lazyListing.canceledAt) {
          status = "cancelled"
          reason = "Listing was cancelled"
        } else if (lazyListing.purchaseReceiptAddress) {
          status = "sold"
          reason = "NFT was sold"
        } else {
          // Load the full listing to get the mint address
          try {
            const fullListing = await metaplex.auctionHouse().loadListing({ lazyListing })
            const mint = fullListing.asset?.mint?.address || fullListing.asset?.address

            if (mint) {
              mintAddress = mint.toString()
              const sellerAddress = lazyListing.sellerAddress

              // Check if seller still owns the NFT
              const sellerOwnsNft = await checkSellerOwnsNft(connection, sellerAddress, mint)

              if (!sellerOwnsNft) {
                status = "orphaned"
                reason = "Seller no longer owns this NFT"
              }
            } else {
              status = "orphaned"
              reason = "Could not determine NFT mint"
            }
          } catch (error) {
            console.error("Error loading listing:", error)
            status = "orphaned"
            reason = "Could not verify ownership"
          }
        }

        listingInfos.push({
          tradeState: lazyListing.tradeStateAddress?.toString() || "",
          seller: lazyListing.sellerAddress?.toString() || "",
          metadata: lazyListing.metadataAddress?.toString() || "",
          price: Number(lazyListing.price?.basisPoints || 0) / 1e9,
          createdAt: Number(lazyListing.createdAt || 0),
          status,
          reason,
        })
      }

      setListings(listingInfos)
      toast.success(`Loaded ${listingInfos.length} listings`)
    } catch (error) {
      console.error("Failed to load listings:", error)
      toast.error("Failed to load listings")
    } finally {
      setIsLoadingListings(false)
    }
  }

  const cleanupSelectedListings = async () => {
    if (!connected || !publicKey || selectedListings.size === 0) return

    setIsCleaningUp(true)
    let successCount = 0
    let failCount = 0

    try {
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet))
      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: AUCTION_HOUSE_ADDRESS })

      for (const tradeState of selectedListings) {
        try {
          const listing = listings.find(l => l.tradeState === tradeState)
          if (!listing) continue

          // Find the lazy listing
          const lazyListings = await metaplex.auctionHouse().findListings({
            auctionHouse,
            seller: new PublicKey(listing.seller),
          })

          const lazyListing = lazyListings.find((l: any) => l.tradeStateAddress?.toString() === tradeState)
          if (!lazyListing) {
            failCount++
            continue
          }

          // Load and cancel the listing
          const fullListing = await metaplex.auctionHouse().loadListing({ lazyListing: lazyListing as any })
          await metaplex.auctionHouse().cancelListing({
            auctionHouse,
            listing: fullListing,
          })

          successCount++
        } catch (error) {
          console.error(`Failed to cancel listing ${tradeState}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Cleaned up ${successCount} listing(s)`)
      }
      if (failCount > 0) {
        toast.error(`Failed to clean up ${failCount} listing(s)`)
      }

      setSelectedListings(new Set())
      await loadListings()
    } catch (error) {
      console.error("Cleanup failed:", error)
      toast.error("Cleanup failed")
    } finally {
      setIsCleaningUp(false)
    }
  }

  const toggleListingSelection = (tradeState: string) => {
    setSelectedListings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tradeState)) {
        newSet.delete(tradeState)
      } else {
        newSet.add(tradeState)
      }
      return newSet
    })
  }

  const selectAllStale = () => {
    setSelectedListings(new Set(staleListings.map(l => l.tradeState)))
  }

  const clearSelection = () => {
    setSelectedListings(new Set())
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  const openInExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=${SOLANA_NETWORK}`, "_blank")
  }

  const findAuctionHousePda = (authority: PublicKey, treasuryMint: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("auction_house"), authority.toBuffer(), treasuryMint.toBuffer()],
      AUCTION_HOUSE_PROGRAM_ID
    )
  }

  const findAuctionHouseFeePda = (auctionHouse: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("auction_house"), auctionHouse.toBuffer(), Buffer.from("fee_payer")],
      AUCTION_HOUSE_PROGRAM_ID
    )
  }

  const findAuctionHouseTreasuryPda = (auctionHouse: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("auction_house"), auctionHouse.toBuffer(), Buffer.from("treasury")],
      AUCTION_HOUSE_PROGRAM_ID
    )
  }

  const deployAuctionHouse = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      toast.error("Please connect your Solana wallet")
      return
    }

    try {
      setIsDeploying(true)
      setDeployStep("Deriving PDAs...")

      const [auctionHouse, auctionHouseBump] = findAuctionHousePda(publicKey, NATIVE_MINT)
      const [feeAccount, feePayerBump] = findAuctionHouseFeePda(auctionHouse)
      const [treasury, treasuryBump] = findAuctionHouseTreasuryPda(auctionHouse)

      setDeployStep("Creating instruction...")

      const instruction = createCreateAuctionHouseInstruction(
        {
          treasuryMint: NATIVE_MINT,
          payer: publicKey,
          authority: publicKey,
          feeWithdrawalDestination: publicKey,
          treasuryWithdrawalDestination: publicKey,
          treasuryWithdrawalDestinationOwner: publicKey,
          auctionHouse,
          auctionHouseFeeAccount: feeAccount,
          auctionHouseTreasury: treasury,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        {
          bump: auctionHouseBump,
          feePayerBump,
          treasuryBump,
          sellerFeeBasisPoints: sellerFeeBps,
          requiresSignOff: false,
          canChangeSalePrice: false,
        }
      )

      setDeployStep("Building transaction...")

      const transaction = new Transaction().add(instruction)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      setDeployStep("Confirm in wallet...")

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, "confirmed")

      const newContract: DeployedContract = {
        name: "Auction House",
        address: auctionHouse.toString(),
        network: SOLANA_NETWORK,
        deployedAt: new Date().toISOString(),
      }

      setDeployedContracts((prev) => [...prev, newContract])

      toast.success("Auction House deployed!", {
        description: `${auctionHouse.toString().slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () => openInExplorer(auctionHouse.toString()),
        },
      })
    } catch (error: any) {
      console.error("Deployment failed:", error)
      toast.error("Deployment failed", { description: error?.message || "Check console" })
    } finally {
      setIsDeploying(false)
      setDeployStep("")
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in to access this page</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Smart Contracts</h1>
          <p className="text-muted-foreground">Deploy and manage Solana smart contracts</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Solana Auction House</CardTitle>
                  <CardDescription>Deploy a marketplace for secondary NFT sales</CardDescription>
                </div>
                <Badge variant="secondary">Solana</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div>
                  <p className="text-sm font-medium">Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {connected ? `${publicKey?.toString().slice(0, 8)}...${publicKey?.toString().slice(-4)}` : "Not connected"}
                  </p>
                </div>
                <WalletMultiButton />
              </div>

              <div>
                <label className="text-sm font-medium">Marketplace Fee (basis points)</label>
                <p className="mb-2 text-xs text-muted-foreground">100 = 1%, 200 = 2%, etc.</p>
                <input
                  type="number"
                  value={sellerFeeBps}
                  onChange={(e) => setSellerFeeBps(Number(e.target.value))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  min={0}
                  max={10000}
                />
              </div>

              {deployStep && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {deployStep}
                </div>
              )}

              <Button className="w-full gap-2" onClick={deployAuctionHouse} disabled={!connected || isDeploying}>
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy Auction House
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployed Contracts</CardTitle>
              <CardDescription>Your deployed smart contracts</CardDescription>
            </CardHeader>
            <CardContent>
              {deployedContracts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No contracts deployed yet</p>
              ) : (
                <div className="space-y-3">
                  {deployedContracts.map((contract, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{contract.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.address.slice(0, 12)}...{contract.address.slice(-8)}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{contract.network}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(contract.address, contract.address)}>
                          {copied === contract.address ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openInExplorer(contract.address)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listings Management Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Marketplace Listings</CardTitle>
                <CardDescription>View and clean up stale or orphaned listings</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadListings} disabled={isLoadingListings}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingListings ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                {staleListings.length > 0 && (
                  <Button variant="outline" size="sm" onClick={selectAllStale}>
                    Select All Stale ({staleListings.length})
                  </Button>
                )}
                {selectedListings.size > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear Selection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={cleanupSelectedListings}
                      disabled={isCleaningUp || !connected}
                    >
                      {isCleaningUp ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cleaning...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clean Up ({selectedListings.size})
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">Connect your wallet to manage listings</p>
                <WalletMultiButton />
              </div>
            ) : isLoadingListings ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No listings found</p>
                <Button variant="outline" size="sm" onClick={loadListings} className="mt-4">
                  Load Listings
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>Active ({activeListings.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span>Stale ({staleListings.length})</span>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectedListings.size === staleListings.length && staleListings.length > 0}
                            onChange={() => selectedListings.size === staleListings.length ? clearSelection() : selectAllStale()}
                            className="rounded"
                          />
                        </th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Trade State</th>
                        <th className="p-3 text-left">Seller</th>
                        <th className="p-3 text-left">Price</th>
                        <th className="p-3 text-left">Reason</th>
                        <th className="p-3 text-left w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr
                          key={listing.tradeState}
                          className={`border-t ${listing.status !== "active" ? "bg-yellow-50/50 dark:bg-yellow-950/10" : ""}`}
                        >
                          <td className="p-3">
                            {listing.status !== "active" && (
                              <input
                                type="checkbox"
                                checked={selectedListings.has(listing.tradeState)}
                                onChange={() => toggleListingSelection(listing.tradeState)}
                                className="rounded"
                              />
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={listing.status === "active" ? "default" : "secondary"}
                              className={
                                listing.status === "active"
                                  ? "bg-green-500"
                                  : listing.status === "sold"
                                  ? "bg-blue-500"
                                  : listing.status === "cancelled"
                                  ? "bg-gray-500"
                                  : "bg-yellow-500"
                              }
                            >
                              {listing.status}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {listing.tradeState.slice(0, 8)}...{listing.tradeState.slice(-4)}
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {listing.seller.slice(0, 8)}...{listing.seller.slice(-4)}
                          </td>
                          <td className="p-3">{listing.price.toFixed(4)} SOL</td>
                          <td className="p-3 text-muted-foreground">
                            {listing.reason && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {listing.reason}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openInExplorer(listing.tradeState)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
