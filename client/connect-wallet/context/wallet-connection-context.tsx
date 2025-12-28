"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import {
  WalletState,
  WalletConnectionContextType,
  Chain,
  WalletType,
  initialWalletState,
} from '../types';
import { saveWalletState, loadWalletState, clearWalletState } from '../utils/storage';

const WalletConnectionContext = createContext<WalletConnectionContextType | null>(null);

export function useWalletConnectionContext() {
  const context = useContext(WalletConnectionContext);
  if (!context) {
    throw new Error(
      'useWalletConnectionContext must be used within WalletConnectionProvider'
    );
  }
  return context;
}

interface WalletConnectionProviderProps {
  children: ReactNode;
}

export function WalletConnectionProvider({ children }: WalletConnectionProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>(initialWalletState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnectRequested, setDisconnectRequested] = useState(false);

  // Load wallet state from localStorage on mount
  useEffect(() => {
    const storedState = loadWalletState();
    if (storedState && storedState.isConnected) {
      setWalletState(storedState);
    }
  }, []);

  // Save wallet state to localStorage whenever it changes
  useEffect(() => {
    if (walletState.isConnected) {
      saveWalletState(walletState);
    } else {
      clearWalletState();
    }
  }, [walletState]);

  // Update wallet state (partial update)
  const updateWalletState = useCallback((partialState: Partial<WalletState>) => {
    setWalletState((prev) => ({
      ...prev,
      ...partialState,
    }));
  }, []);

  // Connect wallet (placeholder - actual connection is handled by chain-specific hooks)
  const connectWallet = useCallback(async (chain: Chain, walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      // This is a placeholder - actual connection logic happens in chain-specific hooks
      // The hooks will call updateWalletState when connection succeeds
      console.log(`Connecting to ${chain} wallet: ${walletType}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      // Signal to chain-specific hooks to disconnect
      setDisconnectRequested(true);
      // Reset state
      setWalletState(initialWalletState);
      clearWalletState();
      setError(null);
      // Reset the disconnect flag after a short delay
      setTimeout(() => setDisconnectRequested(false), 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper getters for chain-specific connection status
  const isEthereumConnected = walletState.isConnected && walletState.chain === 'ethereum';
  const isSolanaConnected = walletState.isConnected && walletState.chain === 'solana';
  const isBitcoinConnected = walletState.isConnected && walletState.chain === 'bitcoin';
  const isMovementConnected = walletState.isConnected && walletState.chain === 'movement';
  const isCasperConnected = walletState.isConnected && walletState.chain === 'casper';

  const value: WalletConnectionContextType = {
    walletState,
    isConnecting,
    error,
    disconnectRequested,
    connectWallet,
    disconnectWallet,
    clearError,
    updateWalletState,
    isEthereumConnected,
    isSolanaConnected,
    isBitcoinConnected,
    isMovementConnected,
    isCasperConnected,
  };

  return (
    <WalletConnectionContext.Provider value={value}>
      {children}
    </WalletConnectionContext.Provider>
  );
}
