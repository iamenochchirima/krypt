import {
  MARKETPLACE_SERVICE,
  marketplaceCanisterId,
  marketplaceIDL,
  REGISTRY_SERVICE,
  registryCanisterId,
  registryIDL,
  ICRC7_NFT_SERVICE,
  icrc7NftIDL,
  ICRC2_SERVICE,
  icrc2IDL,
} from "@/constants/canisters-config";
import { host, network } from "@/constants/urls";
import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";

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

/**
 * Get an ICRC7 NFT collection canister actor
 * @param identity - The user's identity
 * @param collectionCanisterId - The canister ID of the NFT collection
 */
export const getICRC7NftActor = async (
  identity: Identity,
  collectionCanisterId: string
): Promise<ActorSubclass<ICRC7_NFT_SERVICE>> => {
  const agent = await HttpAgent.create({
    host: host,
    identity,
  });

  if (network === "local") {
    agent.fetchRootKey().catch((err) => {
      console.log("Error fetching root key: ", err);
    });
  }

  const canister = Actor.createActor<ICRC7_NFT_SERVICE>(icrc7NftIDL, {
    agent,
    canisterId: collectionCanisterId,
  });
  return canister;
};

/**
 * Get an ICRC2 token canister actor
 * @param identity - The user's identity
 * @param canisterId - The canister ID of the token
 */
export const getICRC2Actor = async (
  identity: Identity,
  canisterId: string
): Promise<ActorSubclass<ICRC2_SERVICE>> => {
  const agent = await HttpAgent.create({
    host: host,
    identity,
  });

  if (network === "local") {
    agent.fetchRootKey().catch((err) => {
      console.log("Error fetching root key: ", err);
    });
  }

  const canister = Actor.createActor<ICRC2_SERVICE>(icrc2IDL, {
    agent,
    canisterId: canisterId,
  });
  return canister;
};
