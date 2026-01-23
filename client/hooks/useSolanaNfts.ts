import { useState, useCallback } from "react"
import { Connection, PublicKey } from "@solana/web3.js"

const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
  ? "mainnet-beta"
  : "devnet") as "devnet" | "mainnet-beta"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  (SOLANA_NETWORK === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com")

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Raw DAS API response types
export interface DASAssetItem {
  id: string
  content?: {
    metadata?: { name?: string; description?: string; attributes?: Array<{ trait_type: string; value: string }> }
    links?: { image?: string }
    files?: Array<{ uri?: string }>
    json_uri?: string
  }
  ownership?: { owner?: string }
  compression?: { compressed?: boolean; tree?: string; leaf_id?: number }
}

export interface DASCollectionResponse {
  items: DASAssetItem[]
  total: number
}

// Fetch raw NFT data by collection address via DAS API
export async function fetchCollectionAssets(
  collectionAddress: string,
  page = 1,
  limit = 100
): Promise<DASCollectionResponse> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "get-assets",
      method: "getAssetsByGroup",
      params: { groupKey: "collection", groupValue: collectionAddress, page, limit },
    }),
  })
  const data = await response.json()
  return {
    items: data.result?.items || [],
    total: data.result?.total || 0,
  }
}

// Simple helper to get just the minted count
export async function fetchCollectionMintedCount(collectionAddress: string): Promise<number> {
  const { total } = await fetchCollectionAssets(collectionAddress, 1, 1)
  return total
}

export interface CompressedNFT {
  id: string
  name: string
  image: string
  owner: string
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

export interface MerkleTreeState {
  publicKey: string
  authority: string
  maxDepth: number
  maxBufferSize: number
  canopyDepth: number
  activeIndex: number
  maxCapacity: number
  usedCapacity: number
}

export interface UseSolanaNftsOptions {
  collectionMint: string | null
  merkleTreeAddress?: string | null
  walletPublicKey?: string | null
  autoFetch?: boolean
}

export interface UseSolanaNftsResult {
  nfts: CompressedNFT[]
  myNfts: CompressedNFT[]
  total: number
  treeState: MerkleTreeState | null
  isLoading: boolean
  isLoadingTree: boolean
  error: string | null
  fetchNfts: (page?: number, refresh?: boolean) => Promise<void>
  fetchTreeState: () => Promise<void>
  refreshAll: () => Promise<void>
}

function normalizeNft(nft: any): CompressedNFT {
  return {
    id: nft.id || nft.assetId || '',
    name: nft.name || nft.content?.metadata?.name || 'Unknown',
    image: nft.image || nft.content?.links?.image || nft.content?.json_uri || '',
    owner: nft.owner || nft.ownership?.owner || '',
    content: nft.content,
    compression: nft.compression,
    ownership: nft.ownership,
  }
}

export function useSolanaNfts({
  collectionMint,
  merkleTreeAddress,
  walletPublicKey,
}: UseSolanaNftsOptions): UseSolanaNftsResult {
  const [nfts, setNfts] = useState<CompressedNFT[]>([])
  const [myNfts, setMyNfts] = useState<CompressedNFT[]>([])
  const [total, setTotal] = useState(0)
  const [treeState, setTreeState] = useState<MerkleTreeState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTree, setIsLoadingTree] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNfts = useCallback(async (page = 1, refresh = false) => {
    if (!collectionMint) return
    setIsLoading(true)
    setError(null)
    try {
      const url = `${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=${page}&limit=50${refresh ? '&refresh=true' : ''}&compressed=true`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch NFTs")
      const data = await response.json()

      const rawNfts = data.items || data.nfts || []
      const normalizedNfts = rawNfts.map(normalizeNft)

      setNfts(normalizedNfts)
      setTotal(data.total || normalizedNfts.length)

      if (walletPublicKey) {
        const filtered = normalizedNfts.filter((nft: CompressedNFT) => nft.owner === walletPublicKey)
        setMyNfts(filtered)
      }
    } catch (err: any) {
      console.error("Failed to fetch NFTs:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [collectionMint, walletPublicKey])

  const fetchTreeState = useCallback(async () => {
    if (!merkleTreeAddress) return
    setIsLoadingTree(true)
    try {
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
        activeIndex: total,
        maxCapacity,
        usedCapacity: total,
      })
    } catch (err: any) {
      console.error("Failed to fetch merkle tree state:", err)
    } finally {
      setIsLoadingTree(false)
    }
  }, [merkleTreeAddress, total])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchNfts(1, true),
      merkleTreeAddress ? fetchTreeState() : Promise.resolve(),
    ])
  }, [fetchNfts, fetchTreeState, merkleTreeAddress])

  return {
    nfts,
    myNfts,
    total,
    treeState,
    isLoading,
    isLoadingTree,
    error,
    fetchNfts,
    fetchTreeState,
    refreshAll,
  }
}

export async function fetchCompressedNftsByCollection(
  collectionMint: string,
  page = 1,
  limit = 50,
  refresh = false
): Promise<{ items: CompressedNFT[]; total: number }> {
  const url = `${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=${page}&limit=${limit}${refresh ? '&refresh=true' : ''}&compressed=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch NFTs")
  const data = await response.json()

  const rawNfts = data.items || data.nfts || []
  return {
    items: rawNfts.map(normalizeNft),
    total: data.total || rawNfts.length,
  }
}

export async function fetchMerkleTreeState(
  merkleTreeAddress: string
): Promise<MerkleTreeState | null> {
  try {
    const connection = new Connection(SOLANA_RPC_URL)
    const accountInfo = await connection.getAccountInfo(new PublicKey(merkleTreeAddress))

    if (!accountInfo) return null

    const data = accountInfo.data
    const maxBufferSize = data.readUInt32LE(9)
    const maxDepth = data.readUInt32LE(13)
    const authority = new PublicKey(data.slice(17, 49)).toString()

    const validMaxDepth = maxDepth > 0 && maxDepth <= 30 ? maxDepth : 14
    const validBufferSize = maxBufferSize > 0 && maxBufferSize <= 2048 ? maxBufferSize : 64
    const maxCapacity = Math.pow(2, validMaxDepth)

    return {
      publicKey: merkleTreeAddress,
      authority,
      maxDepth: validMaxDepth,
      maxBufferSize: validBufferSize,
      canopyDepth: 0,
      activeIndex: 0,
      maxCapacity,
      usedCapacity: 0,
    }
  } catch (err) {
    console.error("Failed to fetch merkle tree state:", err)
    return null
  }
}
