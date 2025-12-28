"use client";

import { ReactNode } from 'react';

interface CasperProviderProps {
  children: ReactNode;
}

/**
 * Casper Wallet Provider
 *
 * Unlike other chains, Casper Wallet doesn't require a React context provider.
 * The wallet is accessed directly through window.CasperWalletProvider.
 * This component is just a pass-through for consistency with other chain providers.
 */
export function CasperProvider({ children }: CasperProviderProps) {
  return <>{children}</>;
}
