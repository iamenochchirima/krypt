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

const MAX_BATCH_SIZE = 1024 * 1024 * 2; // 2MB max for batch operations

export interface PreparedFile {
  file: File
  filePath: string
  fileHash: string
  uint8Array: Uint8Array
  name: string
  description: string
  attributes: Array<{ trait_type: string; value: string | number; display_type?: string }>
}

export interface BatchUploadResult {
  imageUrl: string
  metadataUrl: string
  name: string
}

export async function prepareFilesForBatchUpload(
  files: File[],
  collectionName: string,
  generateAttributes: (index: number) => Array<{ trait_type: string; value: string | number }>
): Promise<PreparedFile[]> {
  const prepared: PreparedFile[] = []
  const timestamp = Date.now()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const fileHash = computeFileHash(uint8Array)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const filePath = `${fileHash}-${timestamp}-${i}.${fileExtension}`
    const nftNumber = i + 1

    prepared.push({
      file,
      filePath,
      fileHash,
      uint8Array,
      name: `${collectionName} #${nftNumber}`,
      description: `NFT #${nftNumber} from ${collectionName} collection`,
      attributes: generateAttributes(i),
    })
  }

  return prepared
}

export async function batchUploadAssets(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  preparedFiles: PreparedFile[],
  onProgress?: (current: number, total: number, status: string) => void
): Promise<BatchUploadResult[]> {
  const totalFiles = preparedFiles.length

  onProgress?.(0, totalFiles, "Initializing uploads...")

  const initArgs = preparedFiles.map(pf => ({
    file_hash: pf.fileHash,
    file_path: pf.filePath,
    file_size: BigInt(pf.uint8Array.length),
    chunk_size: (pf.uint8Array.length > DEFAULT_CHUNK_SIZE ? [BigInt(DEFAULT_CHUNK_SIZE)] : []) as [] | [bigint],
  }))

  const initResult = await nftActor.batch_init_upload({ files: initArgs })

  if ("Err" in initResult) {
    throw new Error(`Batch init failed: ${JSON.stringify(initResult.Err)}`)
  }

  for (let i = 0; i < initResult.Ok.results.length; i++) {
    const result = initResult.Ok.results[i]
    if ("Err" in result) {
      throw new Error(`Init failed for file ${i}: ${JSON.stringify(result.Err)}`)
    }
  }

  onProgress?.(0, totalFiles, "Uploading files...")

  const allChunks: Array<{ fileIndex: number; chunkId: number; filePath: string; data: Uint8Array }> = []
  for (let i = 0; i < preparedFiles.length; i++) {
    const pf = preparedFiles[i]
    const totalChunks = Math.ceil(pf.uint8Array.length / DEFAULT_CHUNK_SIZE)
    for (let c = 0; c < totalChunks; c++) {
      const start = c * DEFAULT_CHUNK_SIZE
      const end = Math.min(start + DEFAULT_CHUNK_SIZE, pf.uint8Array.length)
      allChunks.push({
        fileIndex: i,
        chunkId: c,
        filePath: pf.filePath,
        data: pf.uint8Array.slice(start, end),
      })
    }
  }

  let uploadedChunks = 0
  const totalChunks = allChunks.length

  while (uploadedChunks < totalChunks) {
    const batch: typeof allChunks = []
    let batchSize = 0

    while (uploadedChunks + batch.length < totalChunks) {
      const nextChunk = allChunks[uploadedChunks + batch.length]
      if (batchSize + nextChunk.data.length > MAX_BATCH_SIZE && batch.length > 0) break
      batch.push(nextChunk)
      batchSize += nextChunk.data.length
    }

    const storeArgs = batch.map(chunk => ({
      chunk_id: BigInt(chunk.chunkId),
      file_path: chunk.filePath,
      chunk_data: Array.from(chunk.data),
    }))

    const storeResult = await nftActor.batch_store_chunks({ chunks: storeArgs })

    if ("Err" in storeResult) {
      throw new Error(`Batch store failed: ${JSON.stringify(storeResult.Err)}`)
    }

    for (let i = 0; i < storeResult.Ok.results.length; i++) {
      const result = storeResult.Ok.results[i]
      if ("Err" in result) {
        throw new Error(`Store chunk failed: ${JSON.stringify(result.Err)}`)
      }
    }

    uploadedChunks += batch.length
    const filesProgress = Math.floor((uploadedChunks / totalChunks) * totalFiles * 0.7)
    onProgress?.(filesProgress, totalFiles, `Uploading chunks ${uploadedChunks}/${totalChunks}`)
  }

  onProgress?.(Math.floor(totalFiles * 0.7), totalFiles, "Finalizing uploads...")

  const finalizeArgs = preparedFiles.map(pf => ({ file_path: pf.filePath }))
  const finalizeResult = await nftActor.batch_finalize_upload({ files: finalizeArgs })

  if ("Err" in finalizeResult) {
    throw new Error(`Batch finalize failed: ${JSON.stringify(finalizeResult.Err)}`)
  }

  const imageUrls: string[] = []
  for (let i = 0; i < finalizeResult.Ok.results.length; i++) {
    const result = finalizeResult.Ok.results[i]
    if ("Err" in result) {
      throw new Error(`Finalize failed for file ${i}: ${JSON.stringify(result.Err)}`)
    }
    imageUrls.push(result.Ok)
  }

  onProgress?.(Math.floor(totalFiles * 0.8), totalFiles, "Uploading metadata...")

  const metadataFiles: PreparedFile[] = []
  for (let i = 0; i < preparedFiles.length; i++) {
    const pf = preparedFiles[i]
    const metadata = {
      name: pf.name,
      description: pf.description,
      image: imageUrls[i],
      attributes: pf.attributes,
    }
    const metadataJson = JSON.stringify(metadata, null, 2)
    const metadataBytes = new TextEncoder().encode(metadataJson)
    const metadataHash = sha256(metadataBytes)

    metadataFiles.push({
      file: new File([metadataBytes], `${metadataHash}.json`),
      filePath: `${metadataHash}.json`,
      fileHash: metadataHash,
      uint8Array: metadataBytes,
      name: pf.name,
      description: pf.description,
      attributes: pf.attributes,
    })
  }

  const metaInitArgs = metadataFiles.map(mf => ({
    file_hash: mf.fileHash,
    file_path: mf.filePath,
    file_size: BigInt(mf.uint8Array.length),
    chunk_size: [] as [] | [bigint],
  }))

  const metaInitResult = await nftActor.batch_init_upload({ files: metaInitArgs })

  if ("Err" in metaInitResult) {
    throw new Error(`Metadata batch init failed: ${JSON.stringify(metaInitResult.Err)}`)
  }

  let metaChunkIndex = 0
  while (metaChunkIndex < metadataFiles.length) {
    const batch: Array<{ chunk_id: bigint; file_path: string; chunk_data: number[] }> = []
    let batchSize = 0

    while (metaChunkIndex + batch.length < metadataFiles.length) {
      const mf = metadataFiles[metaChunkIndex + batch.length]
      if (batchSize + mf.uint8Array.length > MAX_BATCH_SIZE && batch.length > 0) break
      batch.push({
        chunk_id: BigInt(0),
        file_path: mf.filePath,
        chunk_data: Array.from(mf.uint8Array),
      })
      batchSize += mf.uint8Array.length
    }

    const metaStoreResult = await nftActor.batch_store_chunks({ chunks: batch })

    if ("Err" in metaStoreResult) {
      throw new Error(`Metadata batch store failed: ${JSON.stringify(metaStoreResult.Err)}`)
    }

    metaChunkIndex += batch.length
  }

  onProgress?.(Math.floor(totalFiles * 0.95), totalFiles, "Finalizing metadata...")

  const metaFinalizeArgs = metadataFiles.map(mf => ({ file_path: mf.filePath }))
  const metaFinalizeResult = await nftActor.batch_finalize_upload({ files: metaFinalizeArgs })

  if ("Err" in metaFinalizeResult) {
    throw new Error(`Metadata batch finalize failed: ${JSON.stringify(metaFinalizeResult.Err)}`)
  }

  const results: BatchUploadResult[] = []
  for (let i = 0; i < preparedFiles.length; i++) {
    const metaResult = metaFinalizeResult.Ok.results[i]
    if ("Err" in metaResult) {
      throw new Error(`Metadata finalize failed for file ${i}: ${JSON.stringify(metaResult.Err)}`)
    }
    results.push({
      imageUrl: imageUrls[i],
      metadataUrl: metaResult.Ok,
      name: preparedFiles[i].name,
    })
  }

  onProgress?.(totalFiles, totalFiles, "Upload complete")
  return results
}
