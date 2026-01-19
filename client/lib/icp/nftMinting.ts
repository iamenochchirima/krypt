import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { ICRC7_NFT_SERVICE } from "@/constants/canisters-config";
import type { ICRC3Value } from "@/declarations/icrc7_nft/core_nft.did";

export interface ICRC97Metadata {
  name: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

export function createICRC97Metadata(
  name: string,
  description: string,
  imageUrl: string,
  attributes: Array<{ trait_type: string; value: string | number; display_type?: string }> = []
): ICRC97Metadata {
  return { name, description, image: imageUrl, attributes };
}

export function metadataUrlToICRC3Value(
  metadataUrl: string,
  imageUrl?: string
): Array<[string, ICRC3Value]> {
  return [
    ["icrc7:metadata:uri:image", { Text: imageUrl || metadataUrl }],
    ["icrc7:token:metadata", { Text: metadataUrl }],
  ];
}

export async function mintNFT(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  owner: Principal,
  metadata: Array<[string, ICRC3Value]>,
  memo?: string
): Promise<bigint> {
  const mintArgs = {
    mint_requests: [
      {
        token_owner: { owner, subaccount: [] },
        memo: memo ? [Array.from(new TextEncoder().encode(memo))] : [],
        metadata,
      },
    ],
  };

  const result = await nftActor.mint(mintArgs);

  if ("Ok" in result) {
    return result.Ok;
  } else if ("Err" in result) {
    throw new Error(`Minting failed: ${JSON.stringify(result.Err)}`);
  }

  throw new Error("Unexpected minting response format");
}

export async function mintNFTBatch(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  requests: Array<{
    owner: Principal;
    metadata: Array<[string, ICRC3Value]>;
    memo?: string;
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<bigint> {
  const CHUNK_SIZE = 10;
  const CHUNK_DELAY = 3000;

  const totalNFTs = requests.length;
  let firstTokenId: bigint | null = null;

  for (let i = 0; i < totalNFTs; i += CHUNK_SIZE) {
    const chunk = requests.slice(i, Math.min(i + CHUNK_SIZE, totalNFTs));

    const mintArgs = {
      mint_requests: chunk.map((request) => ({
        token_owner: { owner: request.owner, subaccount: [] },
        memo: request.memo ? [Array.from(new TextEncoder().encode(request.memo))] : [],
        metadata: request.metadata,
      })),
    };

    const result = await nftActor.mint(mintArgs);

    if ("Ok" in result) {
      if (firstTokenId === null) {
        firstTokenId = result.Ok;
      }
      onProgress?.(i + chunk.length, totalNFTs);

      if (i + CHUNK_SIZE < totalNFTs) {
        await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY));
      }
    } else if ("Err" in result) {
      throw new Error(`Batch minting failed: ${JSON.stringify(result.Err)}`);
    }
  }

  if (firstTokenId === null) {
    throw new Error("No tokens were minted");
  }

  return firstTokenId;
}

export function createTextMetadata(key: string, value: string): [string, ICRC3Value] {
  return [key, { Text: value }];
}

export function createNatMetadata(key: string, value: bigint): [string, ICRC3Value] {
  return [key, { Nat: value }];
}
