import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { ICRC7_NFT_SERVICE } from "@/constants/canisters-config";
import type { MARKETPLACE_SERVICE, ICRC2_SERVICE } from "@/constants/canisters-config";

export async function approveMarketplace(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  tokenId: bigint,
  marketplaceCanisterId: string
): Promise<void> {
  const marketplacePrincipal = Principal.fromText(marketplaceCanisterId);
  const createdAtTimeNs = BigInt(Date.now()) * 1_000_000n;

  const approvalArg = {
    token_id: tokenId,
    approval_info: {
      spender: { owner: marketplacePrincipal, subaccount: [] as [] },
      created_at_time: createdAtTimeNs,
      expires_at: [] as [] | [bigint],
      memo: [] as [] | [Uint8Array | number[]],
      from_subaccount: [] as [] | [Uint8Array | number[]],
    },
  };

  const result = await nftActor.icrc37_approve_tokens([approvalArg]);

  if ("Err" in result) {
    throw new Error(`Failed to approve marketplace: ${JSON.stringify(result.Err)}`);
  }

  if (result.Ok && result.Ok.length > 0) {
    const tokenResult = result.Ok[0];
    if (tokenResult && "Err" in tokenResult) {
      throw new Error(`Token approval failed: ${JSON.stringify(tokenResult.Err)}`);
    }
  }
}

export async function isMarketplaceApproved(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  tokenId: bigint,
  ownerPrincipal: Principal,
  marketplaceCanisterId: string
): Promise<boolean> {
  const marketplacePrincipal = Principal.fromText(marketplaceCanisterId);

  const isApprovedArg = {
    token_id: tokenId,
    from_subaccount: [] as [] | [Uint8Array | number[]],
    spender: { owner: marketplacePrincipal, subaccount: [] as [] },
  };

  try {
    const result = await nftActor.icrc37_is_approved([isApprovedArg]);
    return result && result.length > 0 && result[0] === true;
  } catch {
    return false;
  }
}

export async function listNFT(
  marketActor: ActorSubclass<MARKETPLACE_SERVICE>,
  collectionId: Principal,
  tokenId: bigint,
  price: bigint,
  duration?: bigint
): Promise<string> {
  const result = await marketActor.list_nft({
    collection_id: collectionId,
    token_id: tokenId,
    price,
    duration: duration ? [duration] : [],
  });

  if ("Err" in result) {
    throw new Error(`Failed to list NFT: ${JSON.stringify(result.Err)}`);
  }

  return result.Ok;
}

export async function approveAndListNFT(
  nftActor: ActorSubclass<ICRC7_NFT_SERVICE>,
  marketActor: ActorSubclass<MARKETPLACE_SERVICE>,
  collectionId: string,
  tokenId: bigint,
  priceICP: number,
  marketplaceCanisterId: string,
  durationDays?: number
): Promise<string> {
  const priceE8s = BigInt(Math.floor(priceICP * 100_000_000));
  const durationNs = durationDays
    ? BigInt(durationDays) * 24n * 60n * 60n * 1_000_000_000n
    : undefined;

  await approveMarketplace(nftActor, tokenId, marketplaceCanisterId);

  return await listNFT(
    marketActor,
    Principal.fromText(collectionId),
    tokenId,
    priceE8s,
    durationNs
  );
}

export async function buyNFT(
  icpActor: ActorSubclass<ICRC2_SERVICE>,
  marketActor: ActorSubclass<MARKETPLACE_SERVICE>,
  listingId: string,
  price: bigint,
  marketplaceCanisterId: string
): Promise<void> {
  const marketplacePrincipal = Principal.fromText(marketplaceCanisterId);
  const ICP_TRANSFER_FEE = 10_000n;
  const approvalAmount = price + ICP_TRANSFER_FEE;
  const createdAtTimeNs = BigInt(Date.now()) * 1_000_000n;

  const approveResult = await icpActor.icrc2_approve({
    spender: { owner: marketplacePrincipal, subaccount: [] },
    amount: approvalAmount,
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [createdAtTimeNs],
    expected_allowance: [],
    expires_at: [],
  });

  if ("Err" in approveResult) {
    throw new Error(
      `Failed to approve ICP transfer: ${JSON.stringify(approveResult.Err, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`
    );
  }

  const buyResult = await marketActor.buy_nft({ listing_id: listingId });

  if ("Err" in buyResult) {
    throw new Error(`Failed to buy NFT: ${JSON.stringify(buyResult.Err)}`);
  }
}

export async function cancelListing(
  marketActor: ActorSubclass<MARKETPLACE_SERVICE>,
  listingId: string
): Promise<void> {
  const result = await marketActor.cancel_listing(listingId);

  if ("Err" in result) {
    throw new Error(`Failed to cancel listing: ${JSON.stringify(result.Err)}`);
  }
}

export function formatPriceICP(e8s: bigint): string {
  const icp = Number(e8s) / 100_000_000;
  return icp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function parseICPtoE8s(icp: string): bigint {
  const parsed = parseFloat(icp);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid ICP amount");
  }
  return BigInt(Math.floor(parsed * 100_000_000));
}
