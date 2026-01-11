"use client"

import { useState } from "react"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import AuthButton from "@/components/auth-button"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useAuth } from "@/providers/auth-context"
import { useWalletConnection, WalletModal } from "@/connect-wallet"
import WalletInfoModal from "@/components/wallet-info-modal"

interface NavbarActionsProps {
  className?: string
}

export function NavbarActions({ className }: NavbarActionsProps) {
  const { isAuthenticated } = useAuth()
  const { walletState } = useWalletConnection()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false)

  const handleWalletButtonClick = () => {
    if (walletState.isConnected) {
      setWalletInfoModalOpen(true)
    } else {
      setWalletModalOpen(true)
    }
  }

  return (
    <>
      <div className={className}>
        {isAuthenticated && (
          <>
            {walletState.isConnected ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleWalletButtonClick}
                className="hidden sm:flex"
              >
                <Wallet className="h-4 w-4" />
                <span className="sr-only">Wallet Info</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleWalletButtonClick}
                className="hidden sm:flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden lg:inline">Connect</span>
              </Button>
            )}
          </>
        )}

        {isAuthenticated && <NotificationDropdown />}

        <ModeToggle />

        <AuthButton />
      </div>

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <WalletInfoModal
        isOpen={walletInfoModalOpen}
        onClose={() => setWalletInfoModalOpen(false)}
      />
    </>
  )
}

// Mobile version for use in mobile menus
export function NavbarActionsMobile({ onAction }: { onAction?: () => void }) {
  const { isAuthenticated } = useAuth()
  const { walletState } = useWalletConnection()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [walletInfoModalOpen, setWalletInfoModalOpen] = useState(false)

  const handleWalletButtonClick = () => {
    if (walletState.isConnected) {
      setWalletInfoModalOpen(true)
    } else {
      setWalletModalOpen(true)
    }
    onAction?.()
  }

  if (!isAuthenticated) return null

  return (
    <>
      {walletState.isConnected ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleWalletButtonClick}
          className="w-full"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Wallet Info
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={handleWalletButtonClick}
          className="w-full"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect
        </Button>
      )}

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <WalletInfoModal
        isOpen={walletInfoModalOpen}
        onClose={() => setWalletInfoModalOpen(false)}
      />
    </>
  )
}
