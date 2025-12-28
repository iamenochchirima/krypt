"use client";

import { ReactNode } from 'react';
import { EthereumProvider } from './ethereum-provider';
import { SolanaProvider } from './solana-provider';
import { MovementProvider } from './movement-provider';
import { CasperProvider } from './casper-provider';
import { WalletConnectionProvider } from '../context/wallet-connection-context';
import { useEthereumWallet } from '../hooks/useEthereumWallet';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useMovementWallet } from '../hooks/useMovementWallet';
import { useCasperWallet } from '../hooks/useCasperWallet';

interface CombinedWalletProviderProps {
  children: ReactNode;
}

/**
 * Hook initializer component that ensures all wallet hooks are active
 */
function WalletHookInitializer({ children }: { children: ReactNode }) {
  // Initialize all wallet hooks so they can sync with the global state
  useEthereumWallet();
  useSolanaWallet();
  useBitcoinWallet();
  useMovementWallet();
  useCasperWallet();

  return <>{children}</>;
}

/**
 * Combined provider that wraps all chain-specific providers and the wallet connection context
 *
 * Provider hierarchy:
 * - EthereumProvider (Wagmi + QueryClient)
 *   - SolanaProvider (Solana wallet adapter)
 *     - MovementProvider (Aptos/Movement wallet adapter)
 *       - CasperProvider (Casper wallet - pass-through)
 *         - WalletConnectionProvider (Wallet state management)
 *           - WalletHookInitializer (Activates all wallet hooks)
 */
export function CombinedWalletProvider({ children }: CombinedWalletProviderProps) {
  return (
    <EthereumProvider>
      <SolanaProvider>
        <MovementProvider>
          <CasperProvider>
            <WalletConnectionProvider>
              <WalletHookInitializer>
                {children}
              </WalletHookInitializer>
            </WalletConnectionProvider>
          </CasperProvider>
        </MovementProvider>
      </SolanaProvider>
    </EthereumProvider>
  );
}

// Export with a more user-friendly name
export { CombinedWalletProvider as WalletConnectionProvider };
