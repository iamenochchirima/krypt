"use client"

import React, { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { Identity } from "@dfinity/agent"
import { AuthClient } from "@dfinity/auth-client"
import { getIIURL, host } from "@/constants/urls"

const ADMIN_PRINCIPALS = [
  "your-admin-principal-here",
]

interface AuthContextType {
  login: () => Promise<void>
  logout: () => void
  identity: Identity | null
  principalId: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const MAX_TTL = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [principalId, setPrincipalId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      const client = await AuthClient.create()
      setAuthClient(client)

      const isAuth = await client.isAuthenticated()
      if (isAuth) {
        const id = client.getIdentity()
        setIdentity(id)
        setPrincipalId(id.getPrincipal().toText())
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Auth init error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async () => {
    if (!authClient) return

    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: getIIURL(),
        maxTimeToLive: MAX_TTL,
        derivationOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        onSuccess: () => {
          const id = authClient.getIdentity()
          setIdentity(id)
          setPrincipalId(id.getPrincipal().toText())
          setIsAuthenticated(true)
          resolve()
        },
        onError: (error) => {
          console.error("Login error:", error)
          reject(error)
        },
      })
    })
  }

  const logout = async () => {
    if (authClient) {
      await authClient.logout()
    }
    setIdentity(null)
    setPrincipalId(null)
    setIsAuthenticated(false)
  }

  const isAdmin = principalId ? ADMIN_PRINCIPALS.includes(principalId) : false

  return (
    <AuthContext.Provider value={{ login, logout, identity, principalId, isAuthenticated, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
