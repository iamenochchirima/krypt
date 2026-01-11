export interface Chain {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  rpcUrl?: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  category: 'layer1' | 'layer2' | 'sidechain';
}

export const supportedChains: Chain[] = [
  {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    icon: '/wallets/icp.png',
    color: '#29ABE2',
    explorerUrl: 'https://dashboard.internetcomputer.org',
    nativeCurrency: {
      name: 'Internet Computer',
      symbol: 'ICP',
      decimals: 8,
    },
    category: 'layer1',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '/wallets/etherium.png',
    color: '#627EEA',
    rpcUrl: 'https://ethereum.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    category: 'layer1',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: '/wallets/solana-sol-logo.png',
    color: '#9945FF',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    category: 'layer1',
  },
  {
    id: 'movement',
    name: 'Movement',
    symbol: 'MOVE',
    icon: '/chains/movement.jpeg',
    color: '#FFCC00',
    rpcUrl: 'https://testnet.movementnetwork.xyz/v1',
    explorerUrl: 'https://explorer.movementnetwork.xyz',
    nativeCurrency: {
      name: 'Movement',
      symbol: 'MOVE',
      decimals: 8,
    },
    category: 'layer2',
  },
  {
    id: 'near',
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    icon: '/chains/near.svg',
    color: '#00D395',
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io',
    nativeCurrency: {
      name: 'NEAR',
      symbol: 'NEAR',
      decimals: 24,
    },
    category: 'layer1',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '/chains/polygon.svg',
    color: '#8247E5',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
    category: 'layer2',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    icon: '/chains/arbitrum.svg',
    color: '#28A0F0',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    category: 'layer2',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    icon: '/placeholder-logo.svg',
    color: '#FF0420',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    category: 'layer2',
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'BASE',
    icon: '/chains/base.svg',
    color: '#0052FF',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    category: 'layer2',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: '/placeholder-logo.svg',
    color: '#E84142',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    category: 'layer1',
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    icon: '/placeholder-logo.svg',
    color: '#F3BA2F',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    category: 'sidechain',
  },
];

export const getChainById = (id: string): Chain | undefined => {
  return supportedChains.find(chain => chain.id === id);
};

export const getChainsByCategory = (category: Chain['category']): Chain[] => {
  return supportedChains.filter(chain => chain.category === category);
};