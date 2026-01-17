// Core Candy Machine - Metaplex Core NFT Standard
import {
  mplCore,
  createCollection,
  fetchCollection,
} from '@metaplex-foundation/mpl-core'
import {
  create,
  addConfigLines,
  mplCoreCandyMachine,
} from '@metaplex-foundation/mpl-core-candy-machine'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  publicKey as umiPublicKey,
  some,
  sol,
  dateTime,
  createNoopSigner,
  signerIdentity,
  AccountMeta,
  percentAmount,
} from '@metaplex-foundation/umi'

export interface CoreCollectionConfig {
  name: string
  uri: string
  royaltyBps: number
  collectionAddress: string
  authority: string
  network?: 'devnet' | 'mainnet-beta'
}

export interface CoreCandyMachineConfig {
  collectionId: string
  name: string
  symbol: string
  supply: number
  mintPrice: number
  goLiveDate?: string
  royaltyBps: number
  manifestUrl: string
  authority: string
  candyMachineAddress: string
  collectionAddress: string
  network?: 'devnet' | 'mainnet-beta'
}

export interface CoreInstructionData {
  programId: string
  accounts: Array<{
    pubkey: string
    isSigner: boolean
    isWritable: boolean
  }>
  data: Uint8Array
}

export interface CoreConfigLine {
  name: string
  uri: string
}

function getRpcEndpoint(network?: 'devnet' | 'mainnet-beta'): string {
  return network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com'
}

export async function createCoreCollectionInstruction(
  config: CoreCollectionConfig
): Promise<CoreInstructionData[]> {
  const umi = createUmi(getRpcEndpoint(config.network))
    .use(mplCore())

  const authority = umiPublicKey(config.authority)
  const noopSigner = createNoopSigner(authority)
  umi.use(signerIdentity(noopSigner))

  const collectionSigner = createNoopSigner(umiPublicKey(config.collectionAddress))

  console.log('Creating Core Collection instruction:')
  console.log('  Collection Address:', config.collectionAddress)
  console.log('  Authority:', config.authority)
  console.log('  Name:', config.name)

  const createCollectionIx = createCollection(umi, {
    collection: collectionSigner,
    name: config.name,
    uri: config.uri,
    plugins: [
      {
        type: 'Royalties',
        basisPoints: config.royaltyBps,
        creators: [
          {
            address: authority,
            percentage: 100,
          },
        ],
        ruleSet: { __kind: 'None' },
      },
    ],
  })

  const items = createCollectionIx.getInstructions()

  return items.map((instruction, ixIndex) => {
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isCollection = pubkeyStr === config.collectionAddress
      const isAuthority = pubkeyStr === config.authority

      const isSigner = isCollection || isAuthority
      const isWritable = key.isWritable || isCollection || isAuthority

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    console.log(`Core Collection instruction ${ixIndex}:`, {
      programId: instruction.programId.toString(),
      accountCount: accounts.length,
      signers: accounts.filter(a => a.isSigner).map(a => a.pubkey),
    })

    return {
      programId: instruction.programId.toString(),
      accounts,
      data: instruction.data,
    }
  })
}

export async function createCoreCandyMachineInstruction(
  config: CoreCandyMachineConfig
): Promise<CoreInstructionData[]> {
  const umi = createUmi(getRpcEndpoint(config.network))
    .use(mplCore())
    .use(mplCoreCandyMachine())

  const authority = umiPublicKey(config.authority)
  const noopSigner = createNoopSigner(authority)
  umi.use(signerIdentity(noopSigner))

  const candyMachineSigner = createNoopSigner(umiPublicKey(config.candyMachineAddress))
  const collection = umiPublicKey(config.collectionAddress)

  console.log('Creating Core Candy Machine instruction:')
  console.log('  Candy Machine:', config.candyMachineAddress)
  console.log('  Collection:', config.collectionAddress)
  console.log('  Authority:', config.authority)

  const createIx = await create(umi, {
    candyMachine: candyMachineSigner,
    collection: collection,
    collectionUpdateAuthority: umi.identity,
    itemsAvailable: config.supply,
    authority: umi.identity,
    isMutable: true,
    configLineSettings: some({
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: false,
    }),
    guards: {
      solPayment: some({
        lamports: sol(config.mintPrice),
        destination: authority,
      }),
      startDate: config.goLiveDate
        ? some({ date: dateTime(config.goLiveDate) })
        : some({ date: dateTime(new Date().toISOString()) }),
    },
  })

  const items = createIx.getInstructions()

  return items.map((instruction, ixIndex) => {
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isCandyMachine = pubkeyStr === config.candyMachineAddress
      const isAuth = pubkeyStr === config.authority
      const isCol = pubkeyStr === config.collectionAddress

      const isSigner = isCandyMachine || isAuth
      const isWritable = key.isWritable || isCandyMachine || isAuth || isCol

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    console.log(`Core Candy Machine instruction ${ixIndex}:`, {
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

export interface AddCoreConfigLinesParams {
  authority: string
  candyMachineAddress: string
  startIndex: number
  items: CoreConfigLine[]
  network?: 'devnet' | 'mainnet-beta'
}

export async function buildAddCoreConfigLinesInstruction(
  params: AddCoreConfigLinesParams
): Promise<CoreInstructionData> {
  if (!params.items.length) {
    throw new Error('No config lines provided')
  }

  const umi = createUmi(getRpcEndpoint(params.network))
    .use(mplCore())
    .use(mplCoreCandyMachine())

  const authority = umiPublicKey(params.authority)
  const noopSigner = createNoopSigner(authority)
  umi.use(signerIdentity(noopSigner))

  const builder = await addConfigLines(umi, {
    candyMachine: umiPublicKey(params.candyMachineAddress),
    index: params.startIndex,
    configLines: params.items.map(item => ({
      name: item.name,
      uri: item.uri,
    })),
  })

  const instruction = builder.getInstructions()[0]

  const accounts = instruction.keys.map((key: AccountMeta) => {
    const pubkeyStr = key.pubkey.toString()
    const isCandyMachine = pubkeyStr === params.candyMachineAddress
    const isAuth = pubkeyStr === params.authority

    const isSigner = isCandyMachine || isAuth
    const isWritable = key.isWritable || isCandyMachine

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
}
