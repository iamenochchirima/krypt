export const CASPER_NETWORK = {
  testnet: {
    name: "casper-test",
    rpcUrl: "http://65.108.127.127:7777/rpc",
    chainId: "casper-test",
    explorerUrl: "https://testnet.cspr.live",
  },
  mainnet: {
    name: "casper",
    rpcUrl: "https://rpc.mainnet.casperlabs.io/rpc",
    chainId: "casper",
    explorerUrl: "https://cspr.live",
  },
} as const;

export type CasperNetwork = "testnet" | "mainnet";

export function getCurrentCasperNetwork(): CasperNetwork {
  const network = process.env.NEXT_PUBLIC_CASPER_NETWORK as CasperNetwork;
  if (network !== "testnet" && network !== "mainnet") {
    console.warn(`Invalid NEXT_PUBLIC_CASPER_NETWORK: ${network}. Defaulting to testnet.`);
    return "testnet";
  }
  return network;
}

// Timeout for wallet requests (30 minutes)
export const CASPER_WALLET_TIMEOUT = 30 * 60 * 1000;
