// providers/eth/wagmi/wagmi.config.ts
import { createConfig, http } from "wagmi";
import { mainnet, base, polygon, arbitrum, sepolia, baseSepolia } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

// Replace with your own WalletConnect project ID
const WALLETCONNECT_PROJECT_ID = "3936b3795b20eea5fe9282a3a80be958";

// Supported chains for NFT deployment
export const supportedChains = [
  { id: mainnet.id, name: "Ethereum", chain: mainnet, testnet: false },
  { id: base.id, name: "Base", chain: base, testnet: false },
  { id: polygon.id, name: "Polygon", chain: polygon, testnet: false },
  { id: arbitrum.id, name: "Arbitrum", chain: arbitrum, testnet: false },
  { id: sepolia.id, name: "Sepolia", chain: sepolia, testnet: true },
  { id: baseSepolia.id, name: "Base Sepolia", chain: baseSepolia, testnet: true },
] as const;

function getConnectors() {
  const connectors = [];

  // Only initialize connectors on client side
  if (typeof window !== 'undefined') {
    // Add injected connector for MetaMask, etc.
    connectors.push(injected());

    connectors.push(
      walletConnect({
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'Krypt',
          description: 'NFT Launchpad & Marketplace',
          url: window.location.origin,
          icons: ['https://your-app-icon.com/icon.png']
        }
      })
    );
  }

  return connectors;
}

export const wagmiConfig = createConfig({
  chains: [mainnet, base, polygon, arbitrum, sepolia, baseSepolia],
  connectors: getConnectors(),
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});