"use client";

import { Buffer } from "buffer";
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";
import type { StorageUploader, UploadResult, NFTMetadata } from "./types";

// NOTE: We intentionally keep this 'any' because the package types can resolve to BaseWebIrys
// which declares Node-centric overloads. At runtime, the web build accepts Blob/Uint8Array fine.
type AnyIrys = any;

export class ArweaveUploader implements StorageUploader {
  private uploader: AnyIrys | null = null;

  async initialize(_: any) {
    if (typeof window === "undefined") {
      throw new Error("Browser environment required");
    }
    // @ts-ignore
    const provider = window.solana;
    if (!provider?.publicKey) {
      throw new Error("Connect your Solana wallet (Phantom, etc.)");
    }

    try {
      this.uploader = await WebUploader(WebSolana)
        .withProvider(provider)
        .withRpc("https://api.devnet.solana.com")
        .devnet()
        .build();

      console.log("Irys ready:", this.uploader.address);
    } catch (e: any) {
      throw new Error(`Irys init failed: ${e?.message ?? String(e)}`);
    }
  }

  // ---- Helpers ----
  private ensureFile(file: File | null | undefined, name = "file"): File {
    if (!file) throw new Error(`${name} is missing`);
    if (!file.size) throw new Error(`${name} is empty`);
    return file;
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    return Buffer.from(await file.arrayBuffer());
  }

  private objectToBuffer(obj: unknown): Buffer {
    return Buffer.from(JSON.stringify(obj));
  }

  async uploadCollection(
    collectionImage: File,
    nftAssets: File[] | FileList,
    collectionData: {
      name: string;
      symbol: string;
      description: string;
      supply?: number;
      royaltyBps?: number;
    },
    onProgress?: (uploaded: number, total: number) => void,
    bannerImage?: File
  ): Promise<UploadResult> {
    if (!this.uploader) throw new Error("Uploader not initialized");

    const totalFiles = nftAssets.length + (bannerImage ? 3 : 2);
    let uploadedCount = 0;

    const collFile = this.ensureFile(collectionImage, "collectionImage");
    const collReceipt = await this.uploader.upload(await this.fileToBuffer(collFile), {
      tags: [
        { name: "Content-Type", value: collFile.type || "image/png" },
        { name: "App-Name", value: "CryptoDotFun" },
        { name: "Type", value: "collection-image" },
      ],
    });
    const collectionImageUrl = `https://gateway.irys.xyz/${collReceipt.id}`;
    uploadedCount++;
    onProgress?.(uploadedCount, totalFiles);

    let bannerImageUrl: string | undefined;
    if (bannerImage) {
      const bannerReceipt = await this.uploader.upload(await this.fileToBuffer(bannerImage), {
        tags: [
          { name: "Content-Type", value: bannerImage.type || "image/png" },
          { name: "App-Name", value: "CryptoDotFun" },
          { name: "Type", value: "banner-image" },
        ],
      });
      bannerImageUrl = `https://gateway.irys.xyz/${bannerReceipt.id}`;
      uploadedCount++;
      onProgress?.(uploadedCount, totalFiles);
    }

    const nftImageUrls: string[] = [];
    for (let i = 0; i < nftAssets.length; i++) {
      const file = this.ensureFile(nftAssets[i], `nftAsset[${i}]`);
      const receipt = await this.uploader.upload(await this.fileToBuffer(file), {
        tags: [
          { name: "Content-Type", value: file.type || "image/png" },
          { name: "App-Name", value: "CryptoDotFun" },
          { name: "Type", value: "nft-image" },
          { name: "Index", value: String(i) },
        ],
      });
      nftImageUrls.push(`https://gateway.irys.xyz/${receipt.id}`);
      uploadedCount++;
      onProgress?.(uploadedCount, totalFiles);
    }

    const metadataUrls: string[] = [];
    for (let i = 0; i < nftImageUrls.length; i++) {
      const srcFile = this.ensureFile(nftAssets[i], `nftAsset[${i}]`);

      const metadata: NFTMetadata = {
        name: `${collectionData.name} #${i + 1}`,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: nftImageUrls[i],
        attributes: [],
        properties: {
          files: [{ uri: nftImageUrls[i], type: srcFile.type || "image/png" }],
          category: "image",
        },
      };

      const receipt = await this.uploader.upload(this.objectToBuffer(metadata), {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "App-Name", value: "CryptoDotFun" },
          { name: "Type", value: "nft-metadata" },
          { name: "Index", value: String(i) },
        ],
      });
      metadataUrls.push(`https://gateway.irys.xyz/${receipt.id}`);
    }

    const manifest = {
      name: collectionData.name,
      symbol: collectionData.symbol,
      description: collectionData.description,
      image: collectionImageUrl,
      ...(bannerImageUrl && { banner: bannerImageUrl }),
      seller_fee_basis_points: 500,
      properties: {
        files: metadataUrls.map((u) => ({ uri: u, type: "application/json" })),
        category: "image",
      },
    };

    const manifestReceipt = await this.uploader.upload(this.objectToBuffer(manifest), {
      tags: [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "CryptoDotFun" },
        { name: "Type", value: "manifest" },
      ],
    });
    const manifestUrl = `https://gateway.irys.xyz/${manifestReceipt.id}`;

    return {
      collectionImageUrl,
      bannerImageUrl,
      manifestUrl,
      nftMetadataUrls: metadataUrls,
    };
  }
}
