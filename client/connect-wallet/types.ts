// Chain types
export type Chain = 'ethereum' | 'solana' | 'bitcoin' | 'movement' | 'casper' | null;

// Wallet type definitions by chain
export type EthereumWalletType =
  | 'metamask'
  | 'walletconnect'
  | 'coinbase'
  | 'brave'
  | 'rabby'
  | 'rainbow'
  | 'trust'
  | 'injected';

export type SolanaWalletType =
  | 'phantom'
  | 'solflare'
  | 'backpack'
  | 'glow';

export type BitcoinWalletType =
  | 'unisat'
  | 'xverse'
  | 'okx'
  | 'wizz'
  | 'leather';

export type MovementWalletType =
  | 'nightly'
  | 'petra'
  | 'martian'
  | 'pontem'
  | 'fewcha';

export type CasperWalletType =
  | 'casper-wallet'
  | 'casper-signer';

export type WalletType = EthereumWalletType | SolanaWalletType | BitcoinWalletType | MovementWalletType | CasperWalletType;

// Main wallet state interface
export interface WalletState {
  isConnected: boolean;
  chain: Chain;
  walletType: WalletType | null;
  address: string | null;
  connectionTimestamp: number | null;
}

// Wallet connection context type
export interface WalletConnectionContextType {
  // State
  walletState: WalletState;
  isConnecting: boolean;
  error: string | null;
  disconnectRequested: boolean;

  // Actions
  connectWallet: (chain: Chain, walletType: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  clearError: () => void;

  // Helper methods for updating state
  updateWalletState: (state: Partial<WalletState>) => void;

  // Chain-specific getters
  isEthereumConnected: boolean;
  isSolanaConnected: boolean;
  isBitcoinConnected: boolean;
  isMovementConnected: boolean;
  isCasperConnected: boolean;
}

// Initial wallet state
export const initialWalletState: WalletState = {
  isConnected: false,
  chain: null,
  walletType: null,
  address: null,
  connectionTimestamp: null,
};
