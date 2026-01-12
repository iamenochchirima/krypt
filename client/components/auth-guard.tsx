"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-context"
import WalletModal from "@/connect-wallet/components/wallet-modal"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      setShowModal(true)
      router.push("/")
    }
  }, [isAuthenticated, router, mounted])

  if (!mounted) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <>
        <WalletModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    )
  }

  return <>{children}</>
}