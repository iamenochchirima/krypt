"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWalletConnectionContext } from '../context/wallet-connection-context';
import { CasperWalletType } from '../types';
import { CASPER_WALLET_TIMEOUT } from '@/constants/casper';

// Declare global window types for Casper Wallet
declare global {
  interface Window {
    CasperWalletProvider?: any;
    CasperWalletEventTypes?: any;
  }
}

/**
 * Hook for Casper wallet operations
 * Manages connection to Casper Wallet browser extension
 */
export function useCasperWallet() {
  const { updateWalletState, disconnectRequested, walletState } = useWalletConnectionContext();
  const [provider, setProvider] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize provider
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const providerConstructor = window.CasperWalletProvider;
    if (!providerConstructor) {
      setError("Casper Wallet extension is not installed");
      return null;
    }

    try {
      return providerConstructor({ timeout: CASPER_WALLET_TIMEOUT });
    } catch (err) {
      console.error("Failed to initialize Casper Wallet provider:", err);
      setError("Failed to initialize Casper Wallet");
      return null;
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async (walletType: CasperWalletType = 'casper-wallet') => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletProvider = getProvider();
      if (!walletProvider) {
        throw new Error("Casper Wallet provider not available");
      }

      // Request connection
      const connected = await walletProvider.requestConnection();

      if (!connected) {
        throw new Error("Connection request was rejected");
      }

      // Get active public key
      const activePublicKey = await walletProvider.getActivePublicKey();

      if (!activePublicKey) {
        throw new Error("Failed to get active public key");
      }

      setProvider(walletProvider);
      setPublicKey(activePublicKey);
      setIsConnected(true);

      // Update global wallet state
      updateWalletState({
        isConnected: true,
        chain: 'casper',
        walletType,
        address: activePublicKey,
        connectionTimestamp: Date.now(),
      });

    } catch (err: any) {
      console.error("Failed to connect Casper wallet:", err);
      setError(err.message || "Failed to connect to Casper Wallet");
      setIsConnected(false);
      setPublicKey(null);
      setProvider(null);
    } finally {
      setIsConnecting(false);
    }
  }, [getProvider, updateWalletState]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.disconnectFromSite();

      setProvider(null);
      setPublicKey(null);
      setIsConnected(false);
      setError(null);

      // Update global wallet state
      updateWalletState({
        isConnected: false,
        chain: null,
        walletType: null,
        address: null,
        connectionTimestamp: null,
      });
    } catch (err: any) {
      console.error("Failed to disconnect Casper wallet:", err);
      setError(err.message || "Failed to disconnect");
    }
  }, [provider, updateWalletState]);

  // Watch for disconnect requests from context
  useEffect(() => {
    if (disconnectRequested && isConnected && walletState.chain === 'casper') {
      disconnect();
    }
  }, [disconnectRequested, isConnected, walletState.chain, disconnect]);

  // Listen for wallet events
  useEffect(() => {
    if (!provider || typeof window === 'undefined') return;

    const handleAccountChange = async () => {
      try {
        const activePublicKey = await provider.getActivePublicKey();
        if (activePublicKey) {
          setPublicKey(activePublicKey);
          updateWalletState({
            address: activePublicKey,
          });
        } else {
          // Account was disconnected
          await disconnect();
        }
      } catch (err) {
        console.error("Error handling account change:", err);
        await disconnect();
      }
    };

    const handleDisconnect = async () => {
      await disconnect();
    };

    // Add event listeners if available
    if (window.CasperWalletEventTypes) {
      try {
        provider.on(window.CasperWalletEventTypes.ActiveKeyChanged, handleAccountChange);
        provider.on(window.CasperWalletEventTypes.Disconnected, handleDisconnect);
      } catch (err) {
        console.error("Error adding event listeners:", err);
      }
    }

    return () => {
      // Cleanup event listeners
      if (window.CasperWalletEventTypes && provider.off) {
        try {
          provider.off(window.CasperWalletEventTypes.ActiveKeyChanged, handleAccountChange);
          provider.off(window.CasperWalletEventTypes.Disconnected, handleDisconnect);
        } catch (err) {
          console.error("Error removing event listeners:", err);
        }
      }
    };
  }, [provider, disconnect, updateWalletState]);

  // Sign a deploy/transaction
  const signDeploy = useCallback(async (deploy: any) => {
    if (!provider) {
      throw new Error("Wallet not connected");
    }

    try {
      const signedDeploy = await provider.sign(deploy);
      return signedDeploy;
    } catch (err: any) {
      console.error("Failed to sign deploy:", err);
      throw new Error(err.message || "Failed to sign transaction");
    }
  }, [provider]);

  return {
    provider,
    isConnected,
    publicKey,
    address: publicKey,
    isConnecting,
    error,
    connect,
    disconnect,
    signDeploy,
    isWalletInstalled: typeof window !== 'undefined' && !!window.CasperWalletProvider,
  };
}
