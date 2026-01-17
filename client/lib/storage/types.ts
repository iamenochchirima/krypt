export type StorageProvider = "arweave" | "nft-storage"

export interface UploadResult {
  collectionImageUrl: string
  bannerImageUrl?: string
  manifestUrl: string
  nftMetadataUrls: string[]
}

export interface NFTMetadata {
  name: string
  symbol: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  properties?: {
    files: Array<{ uri: string; type: string }>
    category: string
  }
}

export interface StorageUploader {
  uploadCollection(
    collectionImage: File,
    nftAssets: File[] | FileList,
    collectionData: {
      name: string
      symbol: string
      description: string
      supply: number
    },
    onProgress?: (uploaded: number, total: number) => void,
    bannerImage?: File
  ): Promise<UploadResult>
}
