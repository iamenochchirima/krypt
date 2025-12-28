"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chain } from "../types";
import ChainSelector from "./chain-selector";
import EthereumConnector from "./wallet-connectors/ethereum-connector";
import SolanaConnector from "./wallet-connectors/solana-connector";
import BitcoinConnector from "./wallet-connectors/bitcoin-connector";
import MovementConnector from "./wallet-connectors/movement-connector";
import CasperConnector from "./wallet-connectors/casper-connector";
import { useWalletConnection } from "../hooks/useWalletConnection";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { error, clearError, walletState } = useWalletConnection();
  const [selectedChain, setSelectedChain] = useState<Chain>(null);
  const [connecting, setConnecting] = useState(false);

  // Handle body overflow when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Auto-close modal after successful connection
  useEffect(() => {
    if (isOpen && walletState.isConnected && !connecting) {
      const timer = setTimeout(() => {
        clearError();
        setSelectedChain(null);
        setConnecting(false);
        onClose();
      }, 1500); // Close after 1.5 seconds to show success message

      return () => clearTimeout(timer);
    }
  }, [isOpen, walletState.isConnected]);

  const handleBack = () => {
    setSelectedChain(null);
    clearError();
  };

  const handleClose = () => {
    if (!connecting) {
      clearError();
      setSelectedChain(null);
      setConnecting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex items-center justify-center min-h-full p-4">
        <div
          className="w-full max-w-md bg-background border rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex flex-col space-y-1.5 p-6 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {selectedChain ? 'Connect Wallet' : 'Select Chain'}
              </h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                disabled={connecting}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedChain
                ? `Choose a ${selectedChain} wallet to connect`
                : 'Choose a blockchain to connect your wallet'}
            </p>
          </div>

          {/* Modal Content */}
          <div className="p-6 pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Chain Selection View */}
            {!selectedChain && (
              <ChainSelector
                onSelectChain={setSelectedChain}
                disabled={connecting}
              />
            )}

            {/* Chain-Specific Wallet Connectors */}
            {selectedChain === 'ethereum' && (
              <EthereumConnector onBack={handleBack} />
            )}
            {selectedChain === 'solana' && (
              <SolanaConnector onBack={handleBack} />
            )}
            {selectedChain === 'bitcoin' && (
              <BitcoinConnector onBack={handleBack} />
            )}
            {selectedChain === 'movement' && (
              <MovementConnector onBack={handleBack} />
            )}
            {selectedChain === 'casper' && (
              <CasperConnector onBack={handleBack} />
            )}

            {connecting && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
