import { MOVEMENT_NETWORK, getCurrentNetwork } from "@/constants/movement"

const MOVEMENT_GRAPHQL_ENDPOINTS = {
  testnet: "https://indexer.testnet.movementnetwork.xyz/v1/graphql",
  mainnet: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
}

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const graphqlCache = new Map<string, CacheEntry<any>>()

function getCachedData<T>(key: string): T | null {
  const entry = graphqlCache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_DURATION) {
    graphqlCache.delete(key)
    return null
  }

  return entry.data as T
}

function setCachedData<T>(key: string, data: T): void {
  graphqlCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export async function queryMovementGraphQL(
  query: string,
  variables: Record<string, any> = {},
  network?: "testnet" | "mainnet"
): Promise<any> {
  const activeNetwork = network ?? getCurrentNetwork();
  const endpoint = MOVEMENT_GRAPHQL_ENDPOINTS[activeNetwork]

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables
    })
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result = await response.json()
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  return result.data
}

export async function getCollectionByAddress(
  collectionAddress: string,
  network?: "testnet" | "mainnet",
  useCache = true
): Promise<any> {
  const activeNetwork = network ?? getCurrentNetwork();
  const cacheKey = `collection_${collectionAddress}_${activeNetwork}`

  if (useCache) {
    const cached = getCachedData<any>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const query = `
    query GetCollection($collectionId: String!) {
      current_collections_v2(
        where: {collection_id: {_eq: $collectionId}}
      ) {
        collection_properties
        max_supply
        total_minted_v2
        collection_name
        collection_id
        current_supply
        creator_address
        description
        uri
        last_transaction_timestamp
      }
    }
  `

  const data = await queryMovementGraphQL(query, { collectionId: collectionAddress }, activeNetwork)
  const collection = data.current_collections_v2?.[0] || null

  if (collection) {
    setCachedData(cacheKey, collection)
  }

  return collection
}

export async function getCollectionsByCreator(
  creatorAddress: string,
  network?: "testnet" | "mainnet",
  useCache = true
): Promise<any[]> {
  const activeNetwork = network ?? getCurrentNetwork();
  const cacheKey = `collections_creator_${creatorAddress}_${activeNetwork}`

  if (useCache) {
    const cached = getCachedData<any[]>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const query = `
    query GetCollectionsByCreator($creatorAddress: String!) {
      current_collections_v2(
        where: {creator_address: {_eq: $creatorAddress}}
      ) {
        collection_properties
        max_supply
        total_minted_v2
        collection_name
        collection_id
        current_supply
        creator_address
        description
        uri
        last_transaction_timestamp
      }
    }
  `

  const data = await queryMovementGraphQL(query, { creatorAddress }, activeNetwork)
  const collections = data.current_collections_v2 || []

  if (collections.length > 0) {
    setCachedData(cacheKey, collections)
  }

  return collections
}

export async function getNFTsByCollection(
  collectionId: string,
  network?: "testnet" | "mainnet",
  useCache = true
): Promise<any[]> {
  const activeNetwork = network ?? getCurrentNetwork();
  const cacheKey = `nfts_collection_${collectionId}_${activeNetwork}`

  if (useCache) {
    const cached = getCachedData<any[]>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const query = `
    query GetNFTsByCollection($collectionId: String!) {
      current_token_ownerships_v2(
        where: {
          current_token_data: {collection_id: {_eq: $collectionId}},
          amount: {_gt: 0}
        }
      ) {
        token_data_id
        amount
        owner_address
        current_token_data {
          token_name
          token_uri
          token_properties
          collection_id
          current_collection {
            collection_name
            creator_address
            description
            uri
          }
        }
      }
    }
  `

  const data = await queryMovementGraphQL(query, { collectionId }, activeNetwork)
  const nfts = data.current_token_ownerships_v2 || []

  if (nfts.length > 0) {
    setCachedData(cacheKey, nfts)
  }

  return nfts
}

export async function getNFTsByOwner(
  ownerAddress: string,
  collectionId?: string,
  network?: "testnet" | "mainnet",
  useCache = true
): Promise<any[]> {
  const activeNetwork = network ?? getCurrentNetwork();
  const cacheKey = `nfts_owner_${ownerAddress}_${collectionId || 'all'}_${activeNetwork}`

  if (useCache) {
    const cached = getCachedData<any[]>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const where: any = {
    owner_address: { _eq: ownerAddress },
    amount: { _gt: 0 }
  }

  if (collectionId) {
    where.current_token_data = { collection_id: { _eq: collectionId } }
  }

  const query = `
    query GetNFTsByOwner($where: current_token_ownerships_v2_bool_exp!) {
      current_token_ownerships_v2(where: $where) {
        token_data_id
        amount
        owner_address
        current_token_data {
          token_name
          token_uri
          token_properties
          collection_id
          current_collection {
            collection_name
            creator_address
            description
            uri
          }
        }
      }
    }
  `

  const data = await queryMovementGraphQL(query, { where }, activeNetwork)
  const nfts = data.current_token_ownerships_v2 || []

  if (nfts.length > 0) {
    setCachedData(cacheKey, nfts)
  }

  return nfts
}

export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of graphqlCache.keys()) {
      if (key.includes(pattern)) {
        graphqlCache.delete(key)
      }
    }
  } else {
    graphqlCache.clear()
  }
}
