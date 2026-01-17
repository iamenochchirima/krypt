"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";
import { UsersService } from "@/services/UsersService";

export function useUsersCanister() {
  const { usersActor, isAuthenticated, isBackendAuthenticated } = useAuth();

  const usersService = useMemo(() => {
    if (!usersActor) return null;
    return new UsersService(usersActor);
  }, [usersActor]);

  return {
    usersService,
    isReady: !!usersActor && isAuthenticated,
    isFullyAuthenticated: isBackendAuthenticated,
  };
}
