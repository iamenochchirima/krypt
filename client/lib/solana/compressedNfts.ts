// Compressed NFTs - Bubblegum + Merkle Trees
import {
  mplBubblegum,
  createTree,
  mintToCollectionV1,
  findLeafAssetIdPda,
} from '@metaplex-foundation/mpl-bubblegum'
import {
  mplTokenMetadata,
  createNft,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  publicKey as umiPublicKey,
  createNoopSigner,
  signerIdentity,
  AccountMeta,
  percentAmount,
  generateSigner,
  none,
} from '@metaplex-foundation/umi'

export interface MerkleTreeConfig {
  maxDepth: number
  maxBufferSize: number
  canopyDepth?: number
}

// Common tree configurations
export const TREE_CONFIGS = {
  small: { maxDepth: 14, maxBufferSize: 64, canopyDepth: 0, maxNfts: 16384 },
  medium: { maxDepth: 20, maxBufferSize: 256, canopyDepth: 0, maxNfts: 1048576 },
  large: { maxDepth: 24, maxBufferSize: 512, canopyDepth: 0, maxNfts: 16777216 },
  xlarge: { maxDepth: 30, maxBufferSize: 2048, canopyDepth: 0, maxNfts: 1073741824 },
} as const

export interface CompressedCollectionConfig {
  name: string
  uri: string
  royaltyBps: number
  collectionMintAddress: string
  authority: string
  network?: 'devnet' | 'mainnet-beta'
}

export interface CreateTreeConfig {
  merkleTreeAddress: string
  authority: string
  maxDepth: number
  maxBufferSize: number
  canopyDepth?: number
  network?: 'devnet' | 'mainnet-beta'
}

export interface MintCompressedNftConfig {
  merkleTreeAddress: string
  collectionMintAddress: string
  authority: string
  name: string
  uri: string
  network?: 'devnet' | 'mainnet-beta'
}

export interface CompressedInstructionData {
  programId: string
  accounts: Array<{
    pubkey: string
    isSigner: boolean
    isWritable: boolean
  }>
  data: Uint8Array
}

function getRpcEndpoint(network?: 'devnet' | 'mainnet-beta'): string {
  return network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com'
}

export function getRecommendedTreeConfig(estimatedSupply: number): typeof TREE_CONFIGS[keyof typeof TREE_CONFIGS] {
  if (estimatedSupply <= 16384) return TREE_CONFIGS.small
  if (estimatedSupply <= 1048576) return TREE_CONFIGS.medium
  if (estimatedSupply <= 16777216) return TREE_CONFIGS.large
  return TREE_CONFIGS.xlarge
}

export function estimateTreeCost(config: MerkleTreeConfig): number {
  // Approximate rent cost in SOL for the merkle tree account
  // Based on account size = 2^maxDepth * 32 bytes (plus overhead)
  const nodes = Math.pow(2, config.maxDepth + 1) - 1
  const nodeSize = 32 // bytes per node
  const bufferSize = config.maxBufferSize * 32
  const canopySize = config.canopyDepth ? Math.pow(2, config.canopyDepth) * 32 : 0
  const totalSize = nodes * nodeSize + bufferSize + canopySize + 100 // overhead

  // Rent exemption: ~0.00000348 SOL per byte
  const rentPerByte = 0.00000348
  return totalSize * rentPerByte
}

export async function createCollectionNftInstruction(
  config: CompressedCollectionConfig
): Promise<CompressedInstructionData[]> {
  const umi = createUmi(getRpcEndpoint(config.network))
    .use(mplTokenMetadata())

  const authority = umiPublicKey(config.authority)
  const noopSigner = createNoopSigner(authority)
  umi.use(signerIdentity(noopSigner))

  const collectionMintSigner = createNoopSigner(umiPublicKey(config.collectionMintAddress))

  console.log('Creating Collection NFT for cNFTs:')
  console.log('  Collection Mint:', config.collectionMintAddress)
  console.log('  Authority:', config.authority)

  const createNftIx = createNft(umi, {
    mint: collectionMintSigner,
    authority: umi.identity,
    name: config.name,
    uri: config.uri,
    sellerFeeBasisPoints: percentAmount(config.royaltyBps / 100, 2),
    isCollection: true,
    collectionDetails: {
      __kind: 'V1',
      size: 0,
    },
  })

  const items = createNftIx.getInstructions()

  return items.map((instruction) => {
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isCollectionMint = pubkeyStr === config.collectionMintAddress
      const isAuth = pubkeyStr === config.authority

      const isSigner = isCollectionMint || isAuth
      const isWritable = key.isWritable || isCollectionMint || isAuth

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    return {
      programId: instruction.programId.toString(),
      accounts,
      data: instruction.data,
    }
  })
}

export async function createMerkleTreeInstruction(
  config: CreateTreeConfig
): Promise<CompressedInstructionData[]> {
  const umi = createUmi(getRpcEndpoint(config.network))
    .use(mplBubblegum())

  const authority = umiPublicKey(config.authority)
  const noopSigner = createNoopSigner(authority)
  umi.use(signerIdentity(noopSigner))

  const merkleTreeSigner = createNoopSigner(umiPublicKey(config.merkleTreeAddress))

  console.log('Creating Merkle Tree:')
  console.log('  Tree Address:', config.merkleTreeAddress)
  console.log('  Authority:', config.authority)
  console.log('  Max Depth:', config.maxDepth)
  console.log('  Max Buffer Size:', config.maxBufferSize)

  const createTreeIx = await createTree(umi, {
    merkleTree: merkleTreeSigner,
    maxDepth: config.maxDepth,
    maxBufferSize: config.maxBufferSize,
    canopyDepth: config.canopyDepth,
  })

  const items = createTreeIx.getInstructions()

  return items.map((instruction, ixIndex) => {
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isTree = pubkeyStr === config.merkleTreeAddress
      const isAuth = pubkeyStr === config.authority

      const isSigner = isTree || isAuth
      const isWritable = key.isWritable || isTree

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    console.log(`Merkle Tree instruction ${ixIndex}:`, {
      programId: instruction.programId.toString(),
      accountCount: accounts.length,
    })

    return {
      programId: instruction.programId.toString(),
      accounts,
      data: instruction.data,
    }
  })
}

export async function createMintCompressedNftInstruction(
  config: MintCompressedNftConfig
): Promise<CompressedInstructionData[]> {
  const umi = createUmi(getRpcEndpoint(config.network))
    .use(mplBubblegum())
    .use(mplTokenMetadata())

  const authority = umiPublicKey(config.authority)
  const noopSigner = createNoopSigner(authority)
  umi.use(signerIdentity(noopSigner))

  const merkleTree = umiPublicKey(config.merkleTreeAddress)
  const collectionMint = umiPublicKey(config.collectionMintAddress)

  console.log('Creating Mint cNFT instruction:')
  console.log('  Merkle Tree:', config.merkleTreeAddress)
  console.log('  Collection:', config.collectionMintAddress)

  const mintIx = await mintToCollectionV1(umi, {
    leafOwner: authority,
    merkleTree: merkleTree,
    collectionMint: collectionMint,
    metadata: {
      name: config.name,
      uri: config.uri,
      sellerFeeBasisPoints: 0, // Set at collection level
      collection: { key: collectionMint, verified: false },
      creators: [
        { address: authority, verified: false, share: 100 },
      ],
    },
  })

  const items = mintIx.getInstructions()

  return items.map((instruction) => {
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isTree = pubkeyStr === config.merkleTreeAddress
      const isAuth = pubkeyStr === config.authority

      const isSigner = isAuth
      const isWritable = key.isWritable || isTree

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    return {
      programId: instruction.programId.toString(),
      accounts,
      data: instruction.data,
    }
  })
}

export interface BatchMintConfig {
  merkleTreeAddress: string
  collectionMintAddress: string
  authority: string
  items: Array<{ name: string; uri: string }>
  network?: 'devnet' | 'mainnet-beta'
}

export async function createBatchMintInstructions(
  config: BatchMintConfig
): Promise<CompressedInstructionData[][]> {
  const allInstructions: CompressedInstructionData[][] = []

  for (const item of config.items) {
    const instructions = await createMintCompressedNftInstruction({
      merkleTreeAddress: config.merkleTreeAddress,
      collectionMintAddress: config.collectionMintAddress,
      authority: config.authority,
      name: item.name,
      uri: item.uri,
      network: config.network,
    })
    allInstructions.push(instructions)
  }

  return allInstructions
}
