import {
  EthereumWalletType,
  SolanaWalletType,
  BitcoinWalletType,
  MovementWalletType,
} from '../types';

export interface WalletConfig {
  name: string;
  icon: string;
  description: string;
}

// Ethereum wallet configurations
export const ETHEREUM_WALLETS: Record<EthereumWalletType, WalletConfig> = {
  metamask: {
    name: 'MetaMask',
    icon: '/wallets/metamask.svg',
    description: 'The most popular Ethereum wallet',
  },
  walletconnect: {
    name: 'WalletConnect',
    icon: '/wallets/walletconnect.png',
    description: 'Connect mobile wallets via QR code',
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '/placeholder-logo.svg',
    description: 'Self-custody wallet by Coinbase',
  },
  brave: {
    name: 'Brave Wallet',
    icon: '/wallets/brave.png',
    description: 'Built-in Brave browser wallet',
  },
  rabby: {
    name: 'Rabby',
    icon: '/placeholder-logo.svg',
    description: 'Multi-chain DeFi wallet',
  },
  rainbow: {
    name: 'Rainbow',
    icon: '/placeholder-logo.svg',
    description: 'Ethereum wallet for DeFi & NFTs',
  },
  trust: {
    name: 'Trust Wallet',
    icon: '/placeholder-logo.svg',
    description: 'Multi-chain mobile wallet',
  },
  injected: {
    name: 'Browser Wallet',
    icon: '/placeholder-logo.svg',
    description: 'Connect using your browser\'s wallet',
  },
};

// Solana wallet configurations
export const SOLANA_WALLETS: Record<SolanaWalletType, WalletConfig> = {
  phantom: {
    name: 'Phantom',
    icon: '/wallets/phantom.png',
    description: 'Most popular Solana wallet',
  },
  solflare: {
    name: 'Solflare',
    icon: '/placeholder-logo.svg',
    description: 'Secure Solana wallet',
  },
  backpack: {
    name: 'Backpack',
    icon: '/placeholder-logo.svg',
    description: 'Multi-chain crypto wallet',
  },
  glow: {
    name: 'Glow',
    icon: '/placeholder-logo.svg',
    description: 'Solana DeFi wallet',
  },
};

// Bitcoin wallet configurations
export const BITCOIN_WALLETS: Record<BitcoinWalletType, WalletConfig> = {
  unisat: {
    name: 'Unisat',
    icon: '/wallets/unisat.png',
    description: 'Leading Bitcoin wallet',
  },
  xverse: {
    name: 'Xverse',
    icon: '/placeholder-logo.svg',
    description: 'Bitcoin & Stacks wallet',
  },
  okx: {
    name: 'OKX Wallet',
    icon: '/placeholder-logo.svg',
    description: 'Multi-chain wallet by OKX',
  },
  wizz: {
    name: 'Wizz',
    icon: '/placeholder-logo.svg',
    description: 'Bitcoin wallet',
  },
  leather: {
    name: 'Leather',
    icon: '/placeholder-logo.svg',
    description: 'Bitcoin & Stacks wallet',
  },
};

// Movement wallet configurations
export const MOVEMENT_WALLETS: Record<MovementWalletType, WalletConfig> = {
  nightly: {
    name: 'Nightly',
    icon: '/placeholder-logo.svg',
    description: 'Multi-chain wallet for Aptos',
  },
  petra: {
    name: 'Petra',
    icon: '/placeholder-logo.svg',
    description: 'Official Aptos wallet',
  },
  martian: {
    name: 'Martian',
    icon: '/placeholder-logo.svg',
    description: 'Aptos wallet with DeFi features',
  },
  pontem: {
    name: 'Pontem',
    icon: '/placeholder-logo.svg',
    description: 'Aptos wallet & browser extension',
  },
  fewcha: {
    name: 'Fewcha',
    icon: '/placeholder-logo.svg',
    description: 'Aptos wallet extension',
  },
};

// Chain configurations
export interface ChainConfig {
  name: string;
  icon: string;
  description: string;
}

export const CHAIN_CONFIGS: Record<'ethereum' | 'solana' | 'bitcoin' | 'movement', ChainConfig> = {
  ethereum: {
    name: 'Ethereum',
    icon: '/wallets/etherium.png',
    description: 'Connect Ethereum wallets',
  },
  solana: {
    name: 'Solana',
    icon: '/wallets/solana-sol-logo.png',
    description: 'Connect Solana wallets',
  },
  bitcoin: {
    name: 'Bitcoin',
    icon: '/wallets/bitcoin.png',
    description: 'Connect Bitcoin wallets',
  },
  movement: {
    name: 'Movement',
    icon: '/chains/movement.jpeg',
    description: 'Connect Movement wallets',
  },
};
