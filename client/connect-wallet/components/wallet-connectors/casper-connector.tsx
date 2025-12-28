"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useCasperWallet } from "../../hooks/useCasperWallet";
import { CASPER_WALLETS } from "../../utils/wallet-config";
import { CasperWalletType } from "../../types";

interface CasperConnectorProps {
  onBack?: () => void;
}

export default function CasperConnector({ onBack }: CasperConnectorProps) {
  const { isConnected, publicKey, isConnecting, error, connect, disconnect, isWalletInstalled } = useCasperWallet();
  const [connecting, setConnecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleWalletSelect = async (walletType: CasperWalletType) => {
    setConnecting(true);
    setLocalError(null);

    try {
      if (isConnected) {
        await disconnect();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await connect(walletType);
    } catch (err: any) {
      const errorMessage = err.message || "";
      const isUserRejection = errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('cancelled');

      if (!isUserRejection) {
        setLocalError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLocalError(null);
      await disconnect();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to disconnect wallet');
    }
  };

  const displayError = localError || error;

  return (
    <div className="space-y-4">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span className="text-white">Back</span>
        </button>
      )}

      {/* Connection State: Not Connected */}
      {!isConnected && (
        <div className="space-y-3">
          {isWalletInstalled ? (
            Object.entries(CASPER_WALLETS).map(([walletType, config]) => {
              const isConnectingWallet = connecting && walletType === 'casper-wallet';

              return (
                <button
                  key={walletType}
                  onClick={() => handleWalletSelect(walletType as CasperWalletType)}
                  disabled={connecting || isConnecting}
                  className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 relative flex-shrink-0">
                      {isConnectingWallet ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <Image
                          src={config.icon}
                          alt={config.name}
                          width={32}
                          height={32}
                          className="rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-logo.svg";
                          }}
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {config.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {config.description}
                      </div>
                    </div>
                  </div>

                  {isConnectingWallet && (
                    <div className="text-xs text-primary">Connecting...</div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-4 rounded-lg border bg-muted">
              <div className="text-sm text-muted-foreground text-center">
                Casper Wallet extension is not installed. Please install the Casper Wallet browser extension.
              </div>
              <div className="mt-3 text-center">
                <a
                  href="https://www.casperwallet.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Get Casper Wallet →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {displayError && (
        <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
          <div className="text-sm text-destructive font-medium">Connection Error</div>
          <div className="text-xs text-destructive/80 mt-1">{displayError}</div>
        </div>
      )}

      {/* Connection State: Connected */}
      {isConnected && publicKey && (
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              Wallet connected successfully!
            </div>
            <div className="text-xs text-muted-foreground">
              Connected to: Casper Wallet
            </div>
            <div className="p-2 rounded bg-muted font-mono text-xs break-all">
              {publicKey}
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
