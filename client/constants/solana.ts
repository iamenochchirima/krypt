import { PublicKey } from "@solana/web3.js";

export const SOLANA_CONTRACTS = {
  devnet: {
    auctionHouse: {
      address: "9iyTqHkzCxiUUiguLpa3otxbRTcj7DhXSmewY9fnSX8n",
      authority: "43AsHsJckVJHTsHRPxvJs1WDhHBJSSLM5cUZfkxXrKS2",
      treasuryMint: "So11111111111111111111111111111111111111112", // Native SOL
      sellerFeeBasisPoints: 200, // 2%
    },
  },
  mainnet: {
    auctionHouse: {
      address: "", // TODO: Add after mainnet deployment
      authority: "",
      treasuryMint: "So11111111111111111111111111111111111111112",
      sellerFeeBasisPoints: 200,
    },
  },
} as const;

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";

export const SOLANA_NETWORK = {
  devnet: {
    name: "Solana Devnet",
    rpcUrl: HELIUS_API_KEY
      ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
      : "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com",
    cluster: "devnet" as const,
  },
  mainnet: {
    name: "Solana Mainnet",
    rpcUrl: HELIUS_API_KEY
      ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
      : "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    cluster: "mainnet-beta" as const,
  },
} as const;

export type SolanaNetwork = "devnet" | "mainnet";

// Metaplex Auction House Program ID
export const AUCTION_HOUSE_PROGRAM_ID = new PublicKey(
  "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk"
);

// Native SOL mint
export const NATIVE_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

export function getCurrentSolanaNetwork(): SolanaNetwork {
  const solanaEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (solanaEnv === "mainnet") {
    return "mainnet";
  }
  return "devnet";
}

export function getAuctionHouseAddress(network?: SolanaNetwork): PublicKey {
  const net = network || getCurrentSolanaNetwork();
  const address = SOLANA_CONTRACTS[net].auctionHouse.address;
  if (!address) {
    throw new Error(`Auction House not deployed on ${net}`);
  }
  return new PublicKey(address);
}

export function getSolanaExplorerUrl(
  address: string,
  type: "address" | "tx" = "address",
  network?: SolanaNetwork
): string {
  const net = network || getCurrentSolanaNetwork();
  const baseUrl = SOLANA_NETWORK[net].explorerUrl;
  const cluster = net === "devnet" ? "?cluster=devnet" : "";
  return `${baseUrl}/${type}/${address}${cluster}`;
}

export function getSolanaRpcUrl(network?: SolanaNetwork): string {
  const net = network || getCurrentSolanaNetwork();
  return SOLANA_NETWORK[net].rpcUrl;
}
