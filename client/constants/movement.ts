export const MOVEMENT_CONTRACTS = {
  testnet: {
    launchpad: {
      address: "0x445516c4b4caba7ff0e233b029d57f65b63309b46cb4cd468e55353e52090fb1",
      module: "nft_collection",
    },
    marketplace: {
      address: "0x445516c4b4caba7ff0e233b029d57f65b63309b46cb4cd468e55353e52090fb1",
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
