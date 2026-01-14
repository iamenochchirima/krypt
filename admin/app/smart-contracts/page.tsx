"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, Copy, CheckCircle2, Rocket } from "lucide-react"
import { toast } from "sonner"
import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { createCreateAuctionHouseInstruction, PROGRAM_ID as AUCTION_HOUSE_PROGRAM_ID } from "@metaplex-foundation/mpl-auction-house"
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"

const SOLANA_NETWORK = "devnet"
const NATIVE_MINT = new PublicKey("So11111111111111111111111111111111111111112")

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
      </main>
    </div>
  )
}
