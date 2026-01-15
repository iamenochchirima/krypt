const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export interface NFTAsset {
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

export interface NFTResponse {
  items: NFTAsset[]
  total: number
  page: number
  limit: number
}

export async function fetchCollectionNFTs(
  collectionMint: string,
  page = 1,
  limit = 20,
  refresh = false
): Promise<NFTResponse> {
  const url = `${API_BASE_URL}/api/nfts/collection/${collectionMint}?page=${page}&limit=${limit}${refresh ? '&refresh=true' : ''}`
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch collection NFTs")
  return response.json()
}

export async function fetchNFTsByOwner(
  ownerAddress: string,
  page = 1,
  limit = 20,
  refresh = false
): Promise<NFTResponse> {
  const url = `${API_BASE_URL}/api/nfts/owner/${ownerAddress}?page=${page}&limit=${limit}${refresh ? '&refresh=true' : ''}`
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch owner NFTs")
  return response.json()
}

export async function fetchNFTMetadata(mintAddress: string): Promise<NFTAsset | null> {
  const url = `${API_BASE_URL}/api/nfts/${mintAddress}`
  const response = await fetch(url)
  if (!response.ok) return null
  return response.json()
}

export interface ListingReceipt {
  address: string
  trade_state: string
  bookkeeper: string
  auction_house: string
  seller: string
  metadata: string
  purchase_receipt: string | null
  price: number
  token_size: number
  created_at: number
  canceled_at: number | null
}

export interface ListingsResponse {
  listings: ListingReceipt[]
  total: number
}

export async function fetchListings(
  auctionHouse?: string,
  refresh = false
): Promise<ListingsResponse> {
  let url = `${API_BASE_URL}/api/nfts/listings`
  const params = new URLSearchParams()
  if (auctionHouse) params.set("auction_house", auctionHouse)
  if (refresh) params.set("refresh", "true")
  if (params.toString()) url += `?${params.toString()}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch listings")
  return response.json()
}

export async function fetchCollectionListings(
  collectionMint: string,
  auctionHouse?: string,
  refresh = false
): Promise<ListingsResponse> {
  let url = `${API_BASE_URL}/api/nfts/listings/collection/${collectionMint}`
  const params = new URLSearchParams()
  if (auctionHouse) params.set("auction_house", auctionHouse)
  if (refresh) params.set("refresh", "true")
  if (params.toString()) url += `?${params.toString()}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch collection listings")
  return response.json()
}
