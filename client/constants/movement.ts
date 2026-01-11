export const MOVEMENT_CONTRACTS = {
  testnet: {
    launchpad: {
      address: "0x38a24fb18c1e8aadf7037a15bf279a71f9a9ca158e46e9b1ca1cfd6be0834828",
      module: "launchpad",
    },
    marketplace: {
      address: "0x6f7ab492c91c86ee6f1c86bb1da9c4eae0de11e43ae7bd5e56b16a5696e458ff",
      module: "marketplace",
    },
  },
  mainnet: {
    launchpad: {
      address: "", // TODO: Add after mainnet deployment
      module: "launchpad",
    },
    marketplace: {
      address: "", // TODO: Add after mainnet deployment
      module: "marketplace",
    },
  },
} as const;

export const MOVEMENT_NETWORK = {
  testnet: {
    chainId: 250,
    name: "Movement Testnet",
    rpcUrl: "https://testnet.movementnetwork.xyz/v1",
    explorerUrl: "https://explorer.movementnetwork.xyz/?network=testnet",
    faucetUrl: "https://faucet.movementlabs.xyz/",
    indexerUrl: "https://indexer.testnet.movementnetwork.xyz/v1/graphql",
  },
  mainnet: {
    chainId: 126,
    name: "Movement Mainnet",
    rpcUrl: "https://mainnet.movementnetwork.xyz/v1",
    explorerUrl: "https://explorer.movementnetwork.xyz",
    faucetUrl: "",
    indexerUrl: "https://indexer.mainnet.movementnetwork.xyz/v1/graphql",
  },
} as const;

export type MovementNetwork = "testnet" | "mainnet";

export function getCurrentNetwork(): MovementNetwork {
  const network = process.env.NEXT_PUBLIC_MOVEMENT_NETWORK as MovementNetwork;
  if (network !== "testnet" && network !== "mainnet") {
    console.warn(`Invalid NEXT_PUBLIC_MOVEMENT_NETWORK: ${network}. Defaulting to testnet.`);
    return "testnet";
  }
  return network;
}

export function getModuleId(
  contract: "launchpad" | "marketplace",
  network: MovementNetwork = "testnet"
): string {
  const config = MOVEMENT_CONTRACTS[network][contract];
  return `${config.address}::${config.module}`;
}

export function getContractAddress(
  contract: "launchpad" | "marketplace",
  network: MovementNetwork = "testnet"
): string {
  return MOVEMENT_CONTRACTS[network][contract].address;
}

export function getModuleName(
  contract: "launchpad" | "marketplace",
  network: MovementNetwork = "testnet"
): string {
  return MOVEMENT_CONTRACTS[network][contract].module;
}
