import { ActorSubclass } from "@dfinity/agent";
import { ICRC7_NFT_SERVICE } from "@/constants/canisters-config";
import { sha256 } from "js-sha256";

const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 2; // 2MB chunks

export function computeFileHash(uint8Array: Uint8Array): string {
  return sha256(uint8Array);
}

export interface UploadProgress {
  stage: "init" | "uploading" | "finalizing" | "done";
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
}

export async function uploadFileToCanister(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  file: File,
  filePath: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const fileHash = computeFileHash(uint8Array);
  const fileSize = BigInt(uint8Array.length);

  onProgress?.({ stage: "init", progress: 0 });

  const initResult = await nftActor.init_upload({
    file_hash: fileHash,
    file_path: filePath,
    file_size: fileSize,
    chunk_size: uint8Array.length > DEFAULT_CHUNK_SIZE ? [BigInt(DEFAULT_CHUNK_SIZE)] : [],
  });

  if ("Err" in initResult) {
    throw new Error(`Failed to init upload: ${JSON.stringify(initResult.Err)}`);
  }

  const totalChunks = Math.ceil(uint8Array.length / DEFAULT_CHUNK_SIZE);

  onProgress?.({ stage: "uploading", progress: 0, currentChunk: 0, totalChunks });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * DEFAULT_CHUNK_SIZE;
    const end = Math.min(start + DEFAULT_CHUNK_SIZE, uint8Array.length);
    const chunk = uint8Array.slice(start, end);

    const storeResult = await nftActor.store_chunk({
      chunk_id: BigInt(i),
      file_path: filePath,
      chunk_data: Array.from(chunk),
    });

    if ("Err" in storeResult) {
      throw new Error(`Failed to store chunk ${i}: ${JSON.stringify(storeResult.Err)}`);
    }

    onProgress?.({
      stage: "uploading",
      progress: ((i + 1) / totalChunks) * 100,
      currentChunk: i + 1,
      totalChunks,
    });
  }

  onProgress?.({ stage: "finalizing", progress: 100 });

  const finalizeResult = await nftActor.finalize_upload({ file_path: filePath });

  if ("Err" in finalizeResult) {
    throw new Error(`Failed to finalize upload: ${JSON.stringify(finalizeResult.Err)}`);
  }

  onProgress?.({ stage: "done", progress: 100 });

  return finalizeResult.Ok.url;
}

export async function uploadMetadataJSON(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  metadata: any
): Promise<string> {
  const metadataJson = JSON.stringify(metadata, null, 2);
  const metadataBytes = new TextEncoder().encode(metadataJson);
  const fileHash = sha256(metadataBytes);
  const filePath = `${fileHash}.json`;

  const initResult = await nftActor.init_upload({
    file_hash: fileHash,
    file_path: filePath,
    file_size: BigInt(metadataBytes.length),
    chunk_size: [],
  });

  if ("Err" in initResult) {
    throw new Error(`Failed to init metadata upload: ${JSON.stringify(initResult.Err)}`);
  }

  const storeResult = await nftActor.store_chunk({
    chunk_id: BigInt(0),
    file_path: filePath,
    chunk_data: Array.from(metadataBytes),
  });

  if ("Err" in storeResult) {
    throw new Error(`Failed to store metadata: ${JSON.stringify(storeResult.Err)}`);
  }

  const finalizeResult = await nftActor.finalize_upload({ file_path: filePath });

  if ("Err" in finalizeResult) {
    throw new Error(`Failed to finalize metadata: ${JSON.stringify(finalizeResult.Err)}`);
  }

  return finalizeResult.Ok.url;
}

export async function uploadAssetWithMetadata(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  imageFile: File,
  name: string,
  description: string,
  collectionId: string,
  attributes: Array<{ trait_type: string; value: string | number; display_type?: string }> = [],
  onProgress?: (progress: number, status: string) => void
): Promise<{ imageUrl: string; metadataUrl: string }> {
  const arrayBuffer = await imageFile.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const fileHash = computeFileHash(uint8Array);
  const fileExtension = imageFile.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const imagePath = `${fileHash}-${timestamp}.${fileExtension}`;

  onProgress?.(0, "Uploading image...");

  const imageUrl = await uploadFileToCanister(nftActor, imageFile, imagePath, (p) => {
    if (p.stage === "uploading") {
      onProgress?.(p.progress * 0.5, `Uploading image (${p.currentChunk}/${p.totalChunks})`);
    }
  });

  onProgress?.(50, "Creating metadata...");

  const metadata = {
    name,
    description,
    image: imageUrl,
    attributes,
  };

  onProgress?.(60, "Uploading metadata...");

  const metadataUrl = await uploadMetadataJSON(nftActor, metadata);

  onProgress?.(100, "Upload complete");

  return { imageUrl, metadataUrl };
}
