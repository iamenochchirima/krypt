"use client"

import React, { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from "react"
import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent"
import { AuthClient } from "@dfinity/auth-client"
import { getIIURL, host, network } from "@/constants/urls"
import {
  usersCanisterId,
  identityCertifierCanisterId,
  usersIDL,
  identityCertifierIDL,
  USERS_SERVICE,
  IDENTITY_CERTIFIER_SERVICE
} from "@/constants/canisters-config"
import {
  apiInitAuth,
  apiVerifyIdentity,
  apiLogout,
  apiMe,
  ApiInitAuthResponse,
  ApiVerifyResponse,
  ApiMeResponse
} from "@/services/AuthService"

const ADMIN_PRINCIPALS = [
  "your-admin-principal-here",
]

const MAX_TTL = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000)

interface AuthContextType {
  login: () => Promise<void>
  logout: () => void
  identity: Identity | null
  principalId: string | null
  isAuthenticated: boolean
  isBackendAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  isAuthenticating: boolean
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [principalId, setPrincipalId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isBackendAuthenticated, setIsBackendAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [usersActor, setUsersActor] = useState<ActorSubclass<USERS_SERVICE> | null>(null)
  const [identityCertifierActor, setIdentityCertifierActor] = useState<ActorSubclass<IDENTITY_CERTIFIER_SERVICE> | null>(null)

  const authInProgress = useRef(false)

  useEffect(() => {
    initAuth()
  }, [])

  // Trigger server authentication when II is authenticated and actors are ready
  useEffect(() => {
    if (isAuthenticated && identityCertifierActor && !isBackendAuthenticated && !authInProgress.current) {
      authenticateWithServer()
    }
  }, [isAuthenticated, identityCertifierActor, isBackendAuthenticated])

  const initAuth = async () => {
    try {
      const client = await AuthClient.create()
      setAuthClient(client)

      const isAuth = await client.isAuthenticated()
      if (isAuth) {
        const id = client.getIdentity()
        await setupAuthenticatedState(id, client)
      }
    } catch (error) {
      console.error("Auth init error:", error)
      setError("Failed to initialize authentication")
    } finally {
      setIsLoading(false)
    }
  }

  const setupAuthenticatedState = async (id: Identity, client: AuthClient) => {
    try {
      const agent = await HttpAgent.create({
        identity: id,
        host: host,
      })

      if (network === "local") {
        await agent.fetchRootKey().catch((err) => {
          console.log("Error fetching root key: ", err)
        })
      }

      const principal = id.getPrincipal().toText()
      setPrincipalId(principal)
      setIdentity(id)

      // Create actors
      const _usersActor = Actor.createActor<USERS_SERVICE>(usersIDL, {
        agent,
        canisterId: usersCanisterId,
      })
      setUsersActor(_usersActor)

      const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
        agent,
        canisterId: identityCertifierCanisterId,
      })
      setIdentityCertifierActor(_identityCertifierActor)

      setIsAuthenticated(true)
    } catch (error) {
      console.error("Error setting up authenticated state:", error)
      setError("Failed to setup authentication")
    }
  }

  const checkExistingSession = useCallback(async (): Promise<boolean> => {
    try {
      const meResponse = await apiMe() as ApiMeResponse
      if (meResponse?.authenticated && meResponse.principal) {
        if (meResponse.principal === principalId) {
          setIsBackendAuthenticated(true)
          return true
        } else {
          // Principal mismatch - clear invalid session
          console.warn('Principal mismatch - clearing session')
          await apiLogout()
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error)
    }
    return false
  }, [principalId])

  const authenticateWithServer = useCallback(async (): Promise<boolean> => {
    if (!identityCertifierActor || !principalId) {
      return false
    }

    if (authInProgress.current) {
      console.log('Authentication already in progress')
      return false
    }

    authInProgress.current = true
    setIsAuthenticating(true)
    setError(null)

    try {
      // Step 1: Check if already authenticated
      const hasValidSession = await checkExistingSession()
      if (hasValidSession) {
        return true
      }

      // Step 2: Initialize authentication with server
      console.log('Initiating server authentication...')
      const initResponse = await apiInitAuth() as ApiInitAuthResponse

      if (!initResponse?.success || !initResponse.session_id) {
        throw new Error('Failed to initialize authentication session')
      }

      console.log('Authentication session created:', initResponse.session_id)

      // Step 3: Confirm identity on IC canister
      console.log('Confirming identity on-chain...')
      const confirmResult = await identityCertifierActor.confirmIdentity(initResponse.session_id)

      if (!('Ok' in confirmResult)) {
        const errorType = Object.keys(confirmResult)[0]
        throw new Error(`Identity confirmation failed: ${errorType}`)
      }

      console.log('Identity confirmed, verifying with server...')

      // Step 4: Verify identity with server (with retry)
      let verifyAttempts = 0
      const maxAttempts = 3
      let verifySuccess = false

      while (verifyAttempts < maxAttempts && !verifySuccess) {
        try {
          const verifyResponse = await apiVerifyIdentity(initResponse.session_id) as ApiVerifyResponse

          if (verifyResponse?.success && verifyResponse.principal) {
            console.log('Server verification successful')
            verifySuccess = true
            setIsBackendAuthenticated(true)
            break
          }
        } catch (error) {
          console.error(`Verify attempt ${verifyAttempts + 1} failed:`, error)
        }

        verifyAttempts++
        if (verifyAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (!verifySuccess) {
        throw new Error('Server verification failed after multiple attempts')
      }

      console.log('Server authentication completed successfully')
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error'
      console.error('Server authentication failed:', errorMessage)
      setError(errorMessage)
      return false
    } finally {
      authInProgress.current = false
      setIsAuthenticating(false)
    }
  }, [identityCertifierActor, principalId, checkExistingSession])

  const login = async () => {
    if (!authClient) return

    setError(null)

    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: getIIURL(),
        maxTimeToLive: MAX_TTL,
        derivationOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        onSuccess: async () => {
          const id = authClient.getIdentity()
          await setupAuthenticatedState(id, authClient)
          resolve()
        },
        onError: (error) => {
          console.error("Login error:", error)
          setError("Login failed")
          reject(error)
        },
      })
    })
  }

  const logout = async () => {
    if (authClient) {
      await authClient.logout()
    }

    // Clear server session
    try {
      await apiLogout()
    } catch (error) {
      console.error("Error logging out from server:", error)
    }

    // Reset all state
    setIdentity(null)
    setPrincipalId(null)
    setIsAuthenticated(false)
    setIsBackendAuthenticated(false)
    setUsersActor(null)
    setIdentityCertifierActor(null)
    setError(null)
    authInProgress.current = false
  }

  const clearError = () => setError(null)

  const isAdmin = principalId ? ADMIN_PRINCIPALS.includes(principalId) : false

  return (
    <AuthContext.Provider value={{
      login,
      logout,
      identity,
      principalId,
      isAuthenticated,
      isBackendAuthenticated,
      isAdmin,
      isLoading,
      isAuthenticating,
      error,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
