import { StorageProvider, UploadResult } from "./types"
import { ArweaveUploader } from "./arweave"
import { PinataUploader } from "./pinata"

export type { StorageProvider, UploadResult }

export async function uploadToStorage(
  provider: StorageProvider,
  collectionImage: File,
  nftAssets: FileList,
  collectionData: {
    name: string
    symbol: string
    description: string
    supply: number
  },
  onProgress?: (uploaded: number, total: number) => void,
  pinataApiKey?: string,
  bannerImage?: File,
  wallet?: any
): Promise<UploadResult> {
  if (provider === "arweave") {
    if (!wallet) {
      throw new Error("Wallet required for Arweave upload")
    }
    const uploader = new ArweaveUploader()
    await uploader.initialize(wallet)
    return uploader.uploadCollection(collectionImage, nftAssets, collectionData, onProgress, bannerImage)
  } else {
    if (!pinataApiKey) {
      throw new Error("API key required for Pinata")
    }
    const uploader = new PinataUploader(pinataApiKey)
    await uploader.initialize()
    return uploader.uploadCollection(collectionImage, nftAssets, collectionData, onProgress, bannerImage)
  }
}
