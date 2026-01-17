"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";
import { RegistryService } from "@/services/RegistryService";

export function useRegistryCanister() {
  const { registryActor, isAuthenticated, isBackendAuthenticated } = useAuth();

  const registryService = useMemo(() => {
    if (!registryActor) return null;
    return new RegistryService(registryActor);
  }, [registryActor]);

  return {
    registryService,
    isReady: !!registryActor && isAuthenticated,
    isFullyAuthenticated: isBackendAuthenticated,
  };
}
