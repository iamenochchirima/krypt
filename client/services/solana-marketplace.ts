import {
  PublicKey,
  Transaction,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createSellInstruction,
  createCancelInstruction,
  createCancelListingReceiptInstruction,
  createPrintListingReceiptInstruction,
  PROGRAM_ID as AUCTION_HOUSE_PROGRAM_ID,
} from "@metaplex-foundation/mpl-auction-house";
import { Metaplex, walletAdapterIdentity, sol } from "@metaplex-foundation/js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
  getAuctionHouseAddress,
  getCurrentSolanaNetwork,
  SOLANA_CONTRACTS,
  NATIVE_MINT,
} from "@/constants/solana";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

function findAuctionHouseFeePda(auctionHouse: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction_house"), auctionHouse.toBuffer(), Buffer.from("fee_payer")],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findAuctionHouseTreasuryPda(auctionHouse: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction_house"), auctionHouse.toBuffer(), Buffer.from("treasury")],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findSellerTradeStatePda(
  auctionHouse: PublicKey,
  seller: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: bigint,
  buyerPrice: bigint
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("auction_house"),
      seller.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(buyerPrice.toString(16).padStart(16, "0"), "hex").reverse(),
      Buffer.from(tokenSize.toString(16).padStart(16, "0"), "hex").reverse(),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findBuyerTradeStatePda(
  auctionHouse: PublicKey,
  buyer: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: bigint,
  buyerPrice: bigint
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("auction_house"),
      buyer.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(buyerPrice.toString(16).padStart(16, "0"), "hex").reverse(),
      Buffer.from(tokenSize.toString(16).padStart(16, "0"), "hex").reverse(),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findProgramAsSignerPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction_house"), Buffer.from("signer")],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findFreeSellerTradeStatePda(
  auctionHouse: PublicKey,
  seller: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: bigint
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("auction_house"),
      seller.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from("0".padStart(16, "0"), "hex"),
      Buffer.from(tokenSize.toString(16).padStart(16, "0"), "hex").reverse(),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findEscrowPaymentAccountPda(auctionHouse: PublicKey, buyer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auction_house"), auctionHouse.toBuffer(), buyer.toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function findListingReceiptPda(tradeState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing_receipt"), tradeState.toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID
  );
}

function getMetadataAddress(mint: PublicKey): PublicKey {
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
  return metadataAddress;
}

export interface ListNFTParams {
  connection: Connection;
  seller: PublicKey;
  nftMint: PublicKey;
  priceInSol: number;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

export interface BuyNFTParams {
  connection: Connection;
  buyer: PublicKey;
  nftMint: PublicKey;
  seller: PublicKey;
  priceInSol: number;
  wallet: any; // Wallet adapter
}

export interface CancelListingParams {
  connection: Connection;
  seller: PublicKey;
  nftMint: PublicKey;
  priceInSol: number;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

export async function listNFT({
  connection,
  seller,
  nftMint,
  priceInSol,
  signTransaction,
}: ListNFTParams): Promise<string> {
  const network = getCurrentSolanaNetwork();
  const auctionHouse = getAuctionHouseAddress(network);
  const authority = new PublicKey(SOLANA_CONTRACTS[network].auctionHouse.authority);
  const treasuryMint = NATIVE_MINT;
  const priceInLamports = BigInt(Math.floor(priceInSol * LAMPORTS_PER_SOL));
  const tokenSize = BigInt(1);

  const tokenAccount = await getAssociatedTokenAddress(nftMint, seller);
  const [auctionHouseFeeAccount] = findAuctionHouseFeePda(auctionHouse);
  const [sellerTradeState, sellerTradeStateBump] = findSellerTradeStatePda(
    auctionHouse, seller, tokenAccount, treasuryMint, nftMint, tokenSize, priceInLamports
  );
  const [freeSellerTradeState, freeSellerTradeStateBump] = findFreeSellerTradeStatePda(
    auctionHouse, seller, tokenAccount, treasuryMint, nftMint, tokenSize
  );
  const [programAsSigner, programAsSignerBump] = findProgramAsSignerPda();
  const [listingReceipt, listingReceiptBump] = findListingReceiptPda(sellerTradeState);

  const sellInstruction = createSellInstruction(
    {
      wallet: seller,
      tokenAccount,
      metadata: getMetadataAddress(nftMint),
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      sellerTradeState,
      freeSellerTradeState,
      programAsSigner,
    },
    {
      tradeStateBump: sellerTradeStateBump,
      freeTradeStateBump: freeSellerTradeStateBump,
      programAsSignerBump,
      buyerPrice: priceInLamports,
      tokenSize,
    }
  );

  const printListingReceiptInstruction = createPrintListingReceiptInstruction(
    {
      receipt: listingReceipt,
      bookkeeper: seller,
      instruction: new PublicKey("Sysvar1nstructions1111111111111111111111111"),
    },
    { receiptBump: listingReceiptBump }
  );

  const transaction = new Transaction().add(sellInstruction, printListingReceiptInstruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = seller;

  const signedTx = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}

export async function buyNFT({
  connection,
  buyer,
  nftMint,
  seller,
  priceInSol,
  wallet,
}: BuyNFTParams): Promise<string> {
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouseAddress = getAuctionHouseAddress(getCurrentSolanaNetwork());

  const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

  // Find the listing for this NFT at this price
  const lazyListings = await metaplex.auctionHouse().findListings({
    auctionHouse,
    seller,
    metadata: getMetadataAddress(nftMint),
  });

  const lazyListing = lazyListings.find((l: any) => {
    const listingPrice = Number(l.price.basisPoints) / LAMPORTS_PER_SOL;
    return Math.abs(listingPrice - priceInSol) < 0.0001;
  });

  if (!lazyListing) {
    throw new Error("Listing not found for this NFT at this price");
  }

  // Load the full listing (lazy listings don't have asset data)
  const listing = await metaplex.auctionHouse().loadListing({ lazyListing });

  // Use the Metaplex SDK's buy method which handles all accounts including creators
  const { response } = await metaplex.auctionHouse().buy({
    auctionHouse,
    listing,
    price: sol(priceInSol),
  });

  return response.signature;
}

export async function cancelListing({
  connection,
  seller,
  nftMint,
  priceInSol,
  signTransaction,
}: CancelListingParams): Promise<string> {
  const network = getCurrentSolanaNetwork();
  const auctionHouse = getAuctionHouseAddress(network);
  const authority = new PublicKey(SOLANA_CONTRACTS[network].auctionHouse.authority);
  const treasuryMint = NATIVE_MINT;
  const priceInLamports = BigInt(Math.floor(priceInSol * LAMPORTS_PER_SOL));
  const tokenSize = BigInt(1);

  const tokenAccount = await getAssociatedTokenAddress(nftMint, seller);
  const [auctionHouseFeeAccount] = findAuctionHouseFeePda(auctionHouse);
  const [sellerTradeState] = findSellerTradeStatePda(
    auctionHouse, seller, tokenAccount, treasuryMint, nftMint, tokenSize, priceInLamports
  );
  const [listingReceipt] = findListingReceiptPda(sellerTradeState);

  const cancelInstruction = createCancelInstruction(
    {
      wallet: seller,
      tokenAccount,
      tokenMint: nftMint,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      tradeState: sellerTradeState,
    },
    { buyerPrice: priceInLamports, tokenSize }
  );

  const cancelReceiptInstruction = createCancelListingReceiptInstruction({
    receipt: listingReceipt,
    instruction: new PublicKey("Sysvar1nstructions1111111111111111111111111"),
  });

  const transaction = new Transaction().add(cancelInstruction, cancelReceiptInstruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = seller;

  const signedTx = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}

export interface Listing {
  nftMint: string;
  seller: string;
  price: number;
  tokenAccount: string;
  tradeState: string;
}

export interface PlaceBidParams {
  connection: Connection;
  buyer: PublicKey;
  nftMint: PublicKey;
  priceInSol: number;
  wallet: any;
}

export interface CancelBidParams {
  connection: Connection;
  buyer: PublicKey;
  nftMint: PublicKey;
  priceInSol: number;
  wallet: any;
}

export interface AcceptBidParams {
  connection: Connection;
  seller: PublicKey;
  nftMint: PublicKey;
  buyer: PublicKey;
  priceInSol: number;
  wallet: any;
}

export interface Bid {
  buyer: string;
  price: number;
  createdAt: number;
  tradeState: string;
  nftMint?: string;
  isValid?: boolean;
}

export async function placeBid({
  connection,
  buyer,
  nftMint,
  priceInSol,
  wallet,
}: PlaceBidParams): Promise<string> {
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouseAddress = getAuctionHouseAddress(getCurrentSolanaNetwork());
  const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

  const { response } = await metaplex.auctionHouse().bid({
    auctionHouse,
    mintAccount: nftMint,
    price: sol(priceInSol),
  });

  return response.signature;
}

export async function cancelBid({
  connection,
  buyer,
  nftMint,
  priceInSol,
  wallet,
}: CancelBidParams): Promise<string> {
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouseAddress = getAuctionHouseAddress(getCurrentSolanaNetwork());
  const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

  const lazyBids = await metaplex.auctionHouse().findBids({
    auctionHouse,
    buyer,
    metadata: getMetadataAddress(nftMint),
  });

  const lazyBid = lazyBids.find((b: any) => {
    const bidPrice = Number(b.price.basisPoints) / LAMPORTS_PER_SOL;
    return Math.abs(bidPrice - priceInSol) < 0.0001 && !b.canceledAt;
  });

  if (!lazyBid) throw new Error("Bid not found");

  const bid = await metaplex.auctionHouse().loadBid({ lazyBid });
  const { response } = await metaplex.auctionHouse().cancelBid({ auctionHouse, bid });

  return response.signature;
}

export async function acceptBid({
  connection,
  seller,
  nftMint,
  buyer,
  priceInSol,
  wallet,
}: AcceptBidParams): Promise<string> {
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouseAddress = getAuctionHouseAddress(getCurrentSolanaNetwork());
  const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

  const lazyBids = await metaplex.auctionHouse().findBids({
    auctionHouse,
    buyer: new PublicKey(buyer),
    metadata: getMetadataAddress(nftMint),
  });

  const lazyBid = lazyBids.find((b: any) => {
    const bidPrice = Number(b.price.basisPoints) / LAMPORTS_PER_SOL;
    return Math.abs(bidPrice - priceInSol) < 0.0001 && !b.canceledAt;
  });

  if (!lazyBid) throw new Error("Bid not found");

  const bid = await metaplex.auctionHouse().loadBid({ lazyBid });

  const { listing } = await metaplex.auctionHouse().list({
    auctionHouse,
    mintAccount: nftMint,
    price: sol(priceInSol),
  });

  const { response } = await metaplex.auctionHouse().executeSale({
    auctionHouse,
    listing,
    bid,
  });

  return response.signature;
}

export async function getBidsForNft(connection: Connection, nftMint: PublicKey): Promise<Bid[]> {
  const metaplex = Metaplex.make(connection);
  const auctionHouseAddress = getAuctionHouseAddress(getCurrentSolanaNetwork());
  const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

  const lazyBids = await metaplex.auctionHouse().findBids({
    auctionHouse,
    metadata: getMetadataAddress(nftMint),
  });

  const bids: Bid[] = [];
  for (const lazyBid of lazyBids as any[]) {
    if (lazyBid.canceledAt || lazyBid.purchaseReceiptAddress) continue;
    bids.push({
      buyer: lazyBid.buyerAddress?.toString() || "",
      price: Number(lazyBid.price?.basisPoints || 0) / LAMPORTS_PER_SOL,
      createdAt: Number(lazyBid.createdAt || 0),
      tradeState: lazyBid.tradeStateAddress?.toString() || "",
    });
  }

  return bids.sort((a, b) => b.price - a.price);
}

export async function getBidsByBuyer(connection: Connection, buyer: PublicKey): Promise<Bid[]> {
  const metaplex = Metaplex.make(connection);
  const auctionHouseAddress = getAuctionHouseAddress(getCurrentSolanaNetwork());
  const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

  const lazyBids = await metaplex.auctionHouse().findBids({ auctionHouse, buyer });

  const bids: Bid[] = [];
  for (const lazyBid of lazyBids as any[]) {
    if (lazyBid.canceledAt || lazyBid.purchaseReceiptAddress) continue;

    let nftMint = "";
    try {
      const fullBid = await metaplex.auctionHouse().loadBid({ lazyBid });
      nftMint = fullBid.asset?.mint?.address?.toString() || fullBid.asset?.address?.toString() || "";
    } catch {}

    bids.push({
      buyer: lazyBid.buyerAddress?.toString() || "",
      price: Number(lazyBid.price?.basisPoints || 0) / LAMPORTS_PER_SOL,
      createdAt: Number(lazyBid.createdAt || 0),
      tradeState: lazyBid.tradeStateAddress?.toString() || "",
      nftMint,
    });
  }

  return bids.sort((a, b) => b.createdAt - a.createdAt);
}
