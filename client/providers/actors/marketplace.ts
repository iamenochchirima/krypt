import {
  MARKETPLACE_SERVICE,
  marketplaceCanisterId,
  marketplaceIDL,
  REGISTRY_SERVICE,
  registryCanisterId,
  registryIDL,
} from "@/constants/canisters-config";
import { host, network } from "@/constants/urls";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";

export const getICPMarketplaceActor = async (
  identity: any
): Promise<ActorSubclass<MARKETPLACE_SERVICE>> => {
  const agent = await HttpAgent.create({
    host: host,
    identity,
  });

  if (network === "local") {
    agent.fetchRootKey().catch((err) => {
      console.log("Error fetching root key: ", err);
    });
  }

  const canister = Actor.createActor<MARKETPLACE_SERVICE>(marketplaceIDL, {
    agent,
    canisterId: marketplaceCanisterId,
  });
  return canister;
};

export const getRegistryActor = async (
  identity: any
): Promise<ActorSubclass<REGISTRY_SERVICE>> => {
  const agent = await HttpAgent.create({
    host: host,
    identity,
  });

  if (network === "local") {
    agent.fetchRootKey().catch((err) => {
      console.log("Error fetching root key: ", err);
    });
  }

  const canister = Actor.createActor<REGISTRY_SERVICE>(registryIDL, {
    agent,
    canisterId: registryCanisterId,
  });
  return canister;
};
