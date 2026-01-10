"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import { getMarketplaceActor } from "@/providers/actors/marketplace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, Copy, CheckCircle2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Collection } from "@/declarations/marketplace/marketplace.did"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { buildAddConfigLinesInstruction } from "@/lib/solana/candyMachine"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { mplCandyMachine, fetchCandyMachine } from "@metaplex-foundation/mpl-candy-machine"
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi"

const ITEMS_PER_TRANSACTION = 5
const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
  ? "mainnet-beta"
  : "devnet") as "devnet" | "mainnet-beta"

const chunkArray = <T,>(array: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export default function ManageSolanaCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, identity } = useAuth()
  const { connection } = useConnection()
  const { publicKey: walletPublicKey } = useWallet()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isUploadingItems, setIsUploadingItems] = useState(false)
  const [isInspecting, setIsInspecting] = useState(false)
  const [candyMachineState, setCandyMachineState] = useState<{
    authority: string
    itemsAvailable: number
    itemsLoaded: number
    prefixUri?: string
    nameLength?: number
    uriLength?: number
  } | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !collectionId || !identity) {
      return
    }

    loadCollectionData()
  }, [isAuthenticated, collectionId, identity])

  const loadCollectionData = async () => {
    if (!identity) {
      return
    }
    try {
      setIsLoading(true)
      const actor = await getMarketplaceActor(identity)

      const result = await actor.get_collection(collectionId)
      if (!result || result.length === 0) {
        throw new Error("Collection not found")
      }

      const collectionData = result[0]

      if (collectionData.creator.toString() !== identity.getPrincipal().toString()) {
        toast.error("You don't have permission to manage this collection")
        router.push('/collections')
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const openInExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, '_blank')
  }

  const handleUploadItems = async () => {
    if (!identity || !collection) {
      toast.error("Missing required data")
      return
    }

    const solanaData = 'Solana' in collection.chain_data ? collection.chain_data.Solana : null
    const manifestUrl = solanaData?.manifest_url?.[0]

    if (!manifestUrl) {
      toast.error("Manifest URL not found for this collection")
      return
    }

    try {
      setIsUploadingItems(true)
      toast.info("Uploading items to your candy machine...")

      const actor = await getMarketplaceActor(identity)
      const [manifestResponse, solanaAccountsResult] = await Promise.all([
        fetch(manifestUrl),
        actor.get_collection_solana_accounts(collectionId)
      ])

      if (!manifestResponse.ok) {
        throw new Error(`Failed to fetch manifest (${manifestResponse.status})`)
      }

      if ('Err' in solanaAccountsResult) {
        throw new Error(solanaAccountsResult.Err)
      }

      const manifestJson = await manifestResponse.json()
      const rawItems: any[] = Array.isArray(manifestJson?.items)
        ? manifestJson.items
        : Array.isArray(manifestJson?.properties?.files)
          ? manifestJson.properties.files
          : []

      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new Error("Manifest does not contain any items")
      }

      const totalSupply = Number(collection.total_supply)
      const preparedItems = rawItems
        .map((entry: any, index: number) => {
          const uri = typeof entry === "string"
            ? entry
            : entry?.uri ?? entry?.link ?? ""

          if (!uri) {
            return null
          }

          const name = `${collection.name} #${index + 1}`
          return {
            name: name.slice(0, 32),
            uri: uri.slice(0, 200),
          }
        })
        .filter((item): item is { name: string; uri: string } => !!item?.uri)
        .slice(0, totalSupply || rawItems.length)

      // For devnet testing: force ultra-short URIs to avoid prefix+uri length issues
      const testItems = preparedItems.map((item, idx) => ({
        name: item.name.slice(0, 32),
        uri: `u${idx + 1}`, // minimal suffix to stay well under the configured uriLength
      }))

      if (testItems.length === 0) {
        throw new Error("No valid manifest entries found")
      }

      const { payer_address: payerAddress, candy_machine_address: derivedCandyMachine } = solanaAccountsResult.Ok
      const resolvedCandyMachine = derivedCandyMachine || candyMachineAddress

      if (!payerAddress || !resolvedCandyMachine) {
        throw new Error("Failed to resolve candy machine addresses")
      }

      let startIndex = 0
      for (const chunk of chunkArray(testItems, ITEMS_PER_TRANSACTION)) {
        const instructionData = await buildAddConfigLinesInstruction({
          canisterPayerAddress: payerAddress,
          candyMachineAddress: resolvedCandyMachine,
          startIndex,
          items: chunk,
          network: SOLANA_NETWORK,
        })

        const result = await (actor as any).add_items_to_candy_machine(collectionId, {
          program_id: instructionData.programId,
          accounts: instructionData.accounts.map(acc => ({
            pubkey: acc.pubkey,
            is_signer: acc.isSigner,
            is_writable: acc.isWritable,
          })),
          data: Array.from(instructionData.data),
        })

        if ('Err' in result) {
          throw new Error(result.Err)
        }

        startIndex += chunk.length
        toast.success(`Uploaded items ${startIndex - chunk.length + 1}-${startIndex}`)
      }

      toast.success("Candy machine items uploaded successfully")
      await loadCollectionData()
    } catch (error) {
      console.error("Failed to upload items:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload items to candy machine")
    } finally {
      setIsUploadingItems(false)
    }
  }

  const handleInspectCandyMachine = async () => {
    if (!candyMachineAddress) {
      toast.error("No candy machine address found for this collection")
      return
    }

    try {
      setIsInspecting(true)
      const rpcEndpoint = SOLANA_NETWORK === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com"

      const umi = createUmi(rpcEndpoint)
        .use(mplTokenMetadata())
        .use(mplCandyMachine())
      const cm = await fetchCandyMachine(umi, umiPublicKey(candyMachineAddress))

      setCandyMachineState({
        authority: cm.authority.toString(),
        itemsAvailable: Number(cm.data.itemsAvailable),
        itemsLoaded: Number(cm.itemsLoaded),
        prefixUri: cm.data.configLineSettings?.prefixUri,
        nameLength: cm.data.configLineSettings?.nameLength,
        uriLength: cm.data.configLineSettings?.uriLength,
      })

      toast.success("Candy machine state fetched")
    } catch (error) {
      console.error("Failed to fetch candy machine state:", error)
      toast.error("Failed to fetch candy machine state")
    } finally {
      setIsInspecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Collection not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const solanaData = 'Solana' in collection.chain_data ? collection.chain_data.Solana : null
  const candyMachineAddress = solanaData?.candy_machine_address?.[0] || null
  const candyMachineAuthority = solanaData?.candy_machine_authority?.[0] || null
  const collectionMint = solanaData?.collection_mint?.[0] || null

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        <img
          src={collection.image_url}
          alt={collection.name}
          className="w-32 h-32 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
          <p className="text-muted-foreground mb-4">{collection.description}</p>
          <div className="flex gap-2">
            <Badge variant="secondary">{collection.symbol}</Badge>
            <Badge variant="outline">Solana</Badge>
            <Badge variant="default">Active</Badge>
          </div>
        </div>
      </div>

      {/* Candy Machine Info */}
      {candyMachineAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Candy Machine</CardTitle>
            <CardDescription>
              Manage your Solana NFT minting machine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {candyMachineAddress}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(candyMachineAddress)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInExplorer(candyMachineAddress)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Config Info */}
            {solanaData?.candy_machine_config?.[0] && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Items Available</label>
                  <p className="text-2xl font-bold">
                    {solanaData.candy_machine_config[0].items_available.toString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price (lamports)</label>
                  <p className="text-2xl font-bold">
                    {solanaData.candy_machine_config[0].price.toString()}
                  </p>
                </div>
              </div>
            )}

            {/* Authority */}
            {candyMachineAuthority && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Authority</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {candyMachineAuthority}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInExplorer(candyMachineAuthority)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {!solanaData?.candy_machine_items_uploaded && (
                <Button
                  variant="default"
                  onClick={handleUploadItems}
                  disabled={isUploadingItems}
                >
                  {isUploadingItems ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading Items...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Items to Candy Machine
                    </>
                  )}
                </Button>
              )}
              {candyMachineAddress && (
                <Button
                  variant="outline"
                  onClick={handleInspectCandyMachine}
                  disabled={isInspecting}
                >
                  {isInspecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Inspecting...
                    </>
                  ) : (
                    "Inspect Candy Machine"
                  )}
                </Button>
              )}
              {solanaData?.candy_machine_items_uploaded && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Items uploaded successfully
                </div>
              )}
              <Button variant="outline" disabled>
                Update Settings
              </Button>
              <Button variant="outline" disabled>
                Transfer Authority
              </Button>
              <Button variant="outline" disabled>
                Withdraw Funds
              </Button>
            </div>
            {!solanaData?.candy_machine_items_uploaded && (
              <p className="text-sm text-muted-foreground">
                Upload items from your manifest to enable minting
              </p>
            )}

            {candyMachineState && (
              <div className="mt-4 space-y-2 text-sm">
                <div><span className="font-medium">Authority:</span> {candyMachineState.authority}</div>
                <div><span className="font-medium">Items Available:</span> {candyMachineState.itemsAvailable}</div>
                <div><span className="font-medium">Items Loaded:</span> {candyMachineState.itemsLoaded}</div>
                <div><span className="font-medium">Prefix URI:</span> {candyMachineState.prefixUri || "N/A"}</div>
                <div><span className="font-medium">Name Length:</span> {candyMachineState.nameLength ?? "N/A"}</div>
                <div><span className="font-medium">URI Length:</span> {candyMachineState.uriLength ?? "N/A"}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Collection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Collection ID</label>
            <p className="text-sm font-mono">{collection.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Supply</label>
            <p className="text-sm">{collection.total_supply.toString()}</p>
          </div>
          {collectionMint && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Collection Mint</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {collectionMint}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInExplorer(collectionMint)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {solanaData?.manifest_url?.[0] && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Manifest URL</label>
              <a
                href={solanaData.manifest_url[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {solanaData.manifest_url[0]}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
