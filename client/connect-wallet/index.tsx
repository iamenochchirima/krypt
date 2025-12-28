/**
 * Standalone Wallet Connection System
 *
 * Pure blockchain wallet connections without ICP/canister integration
 *
 * @example
 * import { WalletConnectionProvider, WalletModal, useWalletConnection } from '@/connect-wallet';
 *
 * // Wrap your app with the provider
 * <WalletConnectionProvider>
 *   <App />
 * </WalletConnectionProvider>
 *
 * // Use the hook and modal in your components
 * const { walletState, disconnectWallet } = useWalletConnection();
 * <WalletModal isOpen={open} onClose={() => setOpen(false)} />
 */

// Main provider (exports from combined-provider)
export { WalletConnectionProvider } from './providers/combined-provider';

// Main hook for accessing wallet state
export { useWalletConnection } from './hooks/useWalletConnection';

// Chain-specific hooks (optional, for advanced usage)
export { useEthereumWallet } from './hooks/useEthereumWallet';
export { useSolanaWallet } from './hooks/useSolanaWallet';
export { useBitcoinWallet } from './hooks/useBitcoinWallet';
export { useCasperWallet } from './hooks/useCasperWallet';

// Main modal component
export { default as WalletModal } from './components/wallet-modal';

// Type exports
export type {
  WalletState,
  WalletConnectionContextType,
  Chain,
  WalletType,
  EthereumWalletType,
  SolanaWalletType,
  BitcoinWalletType,
  CasperWalletType,
} from './types';

// Utility exports (optional, for advanced usage)
export {
  saveWalletState,
  loadWalletState,
  clearWalletState,
} from './utils/storage';

export {
  ETHEREUM_WALLETS,
  SOLANA_WALLETS,
  BITCOIN_WALLETS,
  CASPER_WALLETS,
  CHAIN_CONFIGS,
} from './utils/wallet-config';
