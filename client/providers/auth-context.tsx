"use client";
import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { SessionData, useSessionData } from "./useSessionData";
import { WalletType } from "./types";
import { AuthClient } from "@dfinity/auth-client";
import { aidFromPrincipal } from "./util";
import { host, network } from "@/constants/urls";
import { identityCertifierCanisterId, usersCanisterId, usersIDL, identityCertifierIDL, USERS_SERVICE, IDENTITY_CERTIFIER_SERVICE } from "@/constants/canisters-config";
import { apiLogout } from "@/services/AuthService";
import { useServerAuth } from "../hooks/useServerAuth";
import { User } from "../../canisters/src/declarations/users/users.did";

interface AuthContextType {
  login: (walletType: WalletType) => Promise<void>;
  logout: () => void;
  autoLogin: () => void;
  identity: any;
  principalId: string | null;
  sessionData: SessionData | null;
  user: User | null;
  isAuthenticated: boolean;
  fetchingUser: boolean;
  usersActor: ActorSubclass<USERS_SERVICE> | null;
  identityCertifierActor: ActorSubclass<IDENTITY_CERTIFIER_SERVICE> | null;
  setUser: (user: User | null) => void;
  serverAuthError: string | null;
  clearServerAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<any>(null);
  const { sessionData, updateSessionData, deleteSessionData, syncSessionData } =
    useSessionData();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [usersActor, setUsersActor] =
    useState<ActorSubclass<USERS_SERVICE> | null>(null);
  const [identityCertifierActor, setIdentityCertifierActor] = useState<ActorSubclass<IDENTITY_CERTIFIER_SERVICE> | null>(null);

  const {
    isAuthenticating: isServerAuthenticating,
    isAuthenticated: isServerAuthenticated,
    error: serverAuthError,
    user,
    authenticateWithServer,
    checkExistingSession,
    resetAuth: resetServerAuth,
    clearError: clearServerAuthError,
    setUser
  } = useServerAuth({
    identityCertifierActor,
    usersActor,
    sessionData,
    updateSessionData
  });

  useEffect(() => {
    if (!isAuthenticated || !identityCertifierActor || !sessionData || !usersActor) {
      return;
    }

    if (sessionData.isBackendAuthenticated) {
      checkExistingSession();
      return;
    }

    if (!isServerAuthenticating && !isServerAuthenticated && !serverAuthError) {
      authenticateWithServer();
    }
  }, [
    isAuthenticated 
  ]);


  useEffect(() => {
    const session = localStorage.getItem("session-data")
    if (session) {
      const sessionData: SessionData = JSON.parse(session);
      if (sessionData.connectedWalletType === WalletType.InternetIdentity) {
        updateInternetIdentityClient();
      }
    }
  }, []);

  const login = async (walletType: WalletType) => {
    const result = await getPrincipalAddress(walletType);
    if (!result) {
      throw new Error("Failed to get principal address.");
    }
    const { principalAddress, aid, chainAddress } = result;
    updateSessionData({
      connected: true,
      isBackendAuthenticated: false,
      connectedWalletType: walletType,
      principalId: principalAddress,
      aid: aid,
      chainAddress: chainAddress,
      setTime: Date.now(),
    });
    updateClient(walletType);
  };

  const logout = async () => {
    const session = localStorage.getItem("session-data");
    if (session) {
      const sessionData = JSON.parse(session);
      if (sessionData.connectedWalletType === WalletType.InternetIdentity) {
        const iiClient = await AuthClient.create();
        iiClient.logout();
      }
    }

    resetServerAuth();
    deleteSessionData();
    setIsAuthenticated(false);
    setIdentity(null);
    setPrincipalId(null);
    setUsersActor(null);
    setIdentityCertifierActor(null);
    apiLogout();
  };

  const autoLogin = () => {
    syncSessionData();
  };

  const updateClient = async (walletType: WalletType) => {
    if (walletType === WalletType.InternetIdentity) {
      await updateInternetIdentityClient();
    }
  };

  const updateInternetIdentityClient = async () => {
    try {
      const authClient = await AuthClient.create();
      setAuthClient(authClient);
      const isAuthenticated = await authClient.isAuthenticated();
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        const agent = await HttpAgent.create({
          identity,
          host: host,
        });

        if (network === "local") {
          agent.fetchRootKey().catch((err) => {
            console.log("Error fetching root key: ", err);
          });
        }
        setPrincipalId(identity.getPrincipal().toText());
        const _backendActor = Actor.createActor<USERS_SERVICE>(usersIDL, {
          agent,
          canisterId: usersCanisterId,
        });
        setUsersActor(_backendActor);
        const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
          agent,
          canisterId: identityCertifierCanisterId,
        });
        setIdentityCertifierActor(_identityCertifierActor);
        setIdentity(identity);
        setIsAuthenticated(isAuthenticated);
        syncSessionData();
      }
    } catch (error) {
      console.log("Error in updateInternetIdentityClient: ", error);
    }
  };

  const getPrincipalAddress = async (walletType: WalletType) => {
    if (walletType === WalletType.InternetIdentity) {
      return getInternetIdentityPrincipalAddress();
    }
    return null;
  };

  const getInternetIdentityPrincipalAddress = async () => {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const principalAddress = identity.getPrincipal().toText();
    const aid = aidFromPrincipal(identity.getPrincipal());
    return { principalAddress, aid, chainAddress: principalAddress };
  };

  const value: AuthContextType = {
    login,
    logout,
    autoLogin,
    identity,
    principalId,
    sessionData,
    user,
    isAuthenticated,
    usersActor,
    identityCertifierActor,
    fetchingUser: isServerAuthenticating,
    setUser,
    serverAuthError,
    clearServerAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
