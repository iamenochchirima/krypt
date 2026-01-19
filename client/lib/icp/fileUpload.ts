import { ActorSubclass } from "@dfinity/agent";
import { ICRC7_NFT_SERVICE } from "@/constants/canisters-config";

const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 2; // 2MB chunks

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
  const fileHash = await computeFileHash(file);
  const fileSize = BigInt(file.size);
  const chunkSize = BigInt(DEFAULT_CHUNK_SIZE);

  onProgress?.({ stage: "init", progress: 0 });

  const initResult = await nftActor.init_upload({
    file_hash: fileHash,
    file_path: filePath,
    file_size: fileSize,
    chunk_size: [chunkSize],
  });

  if ("Err" in initResult) {
    throw new Error(`Failed to init upload: ${JSON.stringify(initResult.Err)}`);
  }

  const totalChunks = Math.ceil(file.size / DEFAULT_CHUNK_SIZE);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ stage: "uploading", progress: 0, currentChunk: 0, totalChunks });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * DEFAULT_CHUNK_SIZE;
    const end = Math.min(start + DEFAULT_CHUNK_SIZE, file.size);
    const chunk = new Uint8Array(arrayBuffer.slice(start, end));

    const storeResult = await nftActor.store_chunk({
      chunk_id: BigInt(i),
      file_path: filePath,
      chunk_data: chunk,
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

export async function uploadAssetWithMetadata(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  imageFile: File,
  name: string,
  description: string,
  collectionId: string,
  attributes: Array<{ trait_type: string; value: string | number; display_type?: string }> = [],
  onProgress?: (progress: number, status: string) => void
): Promise<{ imageUrl: string; metadataUrl: string }> {
  const timestamp = Date.now();
  const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const imagePath = `assets/${collectionId}/${timestamp}_${sanitizedName}`;

  onProgress?.(0, "Uploading image...");

  const imageUrl = await uploadFileToCanister(nftActor, imageFile, imagePath, (p) => {
    if (p.stage === "uploading") {
      onProgress?.(p.progress * 0.7, `Uploading image (${p.currentChunk}/${p.totalChunks})`);
    }
  });

  onProgress?.(70, "Creating metadata...");

  const metadata = {
    name,
    description,
    image: imageUrl,
    attributes,
  };

  const metadataJson = JSON.stringify(metadata);
  const metadataBlob = new Blob([metadataJson], { type: "application/json" });
  const metadataFile = new File([metadataBlob], "metadata.json", { type: "application/json" });
  const metadataPath = `metadata/${collectionId}/${timestamp}_metadata.json`;

  onProgress?.(75, "Uploading metadata...");

  const metadataUrl = await uploadFileToCanister(nftActor, metadataFile, metadataPath, (p) => {
    if (p.stage === "uploading") {
      onProgress?.(75 + p.progress * 0.25, "Uploading metadata...");
    }
  });

  onProgress?.(100, "Upload complete");

  return { imageUrl, metadataUrl };
}
