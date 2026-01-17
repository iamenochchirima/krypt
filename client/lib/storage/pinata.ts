import { PinataSDK } from "pinata"
import { StorageUploader, UploadResult, NFTMetadata } from "./types"

export class PinataUploader implements StorageUploader {
  private client: PinataSDK

  constructor(jwt: string) {
    this.client = new PinataSDK({ pinataJwt: jwt })
  }

  async initialize() {
    console.log("Pinata client initialized")
  }

  async uploadCollection(
    collectionImage: File,
    nftAssets: File[] | FileList,
    collectionData: {
      name: string
      symbol: string
      description: string
      supply?: number
      royaltyBps?: number
    },
    onProgress?: (uploaded: number, total: number) => void,
    bannerImage?: File
  ): Promise<UploadResult> {
    const totalFiles = nftAssets.length + (bannerImage ? 3 : 2)
    let uploadedCount = 0

    const collImageUpload = await this.client.upload.public.file(collectionImage)
    const collectionImageUrl = `https://gateway.pinata.cloud/ipfs/${collImageUpload.cid}`
    uploadedCount++
    onProgress?.(uploadedCount, totalFiles)

    let bannerImageUrl: string | undefined
    if (bannerImage) {
      const bannerUpload = await this.client.upload.public.file(bannerImage)
      bannerImageUrl = `https://gateway.pinata.cloud/ipfs/${bannerUpload.cid}`
      uploadedCount++
      onProgress?.(uploadedCount, totalFiles)
    }

    const nftImageUrls: string[] = []
    for (let i = 0; i < nftAssets.length; i++) {
      const file = nftAssets[i]
      const upload = await this.client.upload.public.file(file)
      const url = `https://gateway.pinata.cloud/ipfs/${upload.cid}`
      nftImageUrls.push(url)
      uploadedCount++
      onProgress?.(uploadedCount, totalFiles)
    }

    const metadataUrls: string[] = []
    for (let i = 0; i < nftImageUrls.length; i++) {
      const metadata: NFTMetadata = {
        name: `${collectionData.name} #${i + 1}`,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: nftImageUrls[i],
        attributes: [],
        properties: {
          files: [{ uri: nftImageUrls[i], type: nftAssets[i].type }],
          category: "image",
        },
      }

      const metadataFile = new File(
        [JSON.stringify(metadata)],
        `${i}.json`,
        { type: "application/json" }
      )
      const upload = await this.client.upload.public.file(metadataFile)
      const url = `https://gateway.pinata.cloud/ipfs/${upload.cid}`
      metadataUrls.push(url)
    }

    const manifest = {
      name: collectionData.name,
      symbol: collectionData.symbol,
      description: collectionData.description,
      image: collectionImageUrl,
      ...(bannerImageUrl && { banner: bannerImageUrl }),
      seller_fee_basis_points: 500,
      properties: {
        files: metadataUrls.map((url) => ({
          uri: url,
          type: "application/json",
        })),
        category: "image",
      },
    }

    const manifestFile = new File(
      [JSON.stringify(manifest)],
      "manifest.json",
      { type: "application/json" }
    )
    const manifestUpload = await this.client.upload.public.file(manifestFile)
    const manifestUrl = `https://gateway.pinata.cloud/ipfs/${manifestUpload.cid}`

    return {
      collectionImageUrl,
      bannerImageUrl,
      manifestUrl,
      nftMetadataUrls: metadataUrls,
    }
  }
}
