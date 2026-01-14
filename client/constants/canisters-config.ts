export type { _SERVICE as USERS_SERVICE } from "../declarations/users/users.did";
export type { _SERVICE as IDENTITY_CERTIFIER_SERVICE } from "../declarations/identity_certifier/identity_certifier.did";
export type { _SERVICE as MARKETPLACE_SERVICE } from "../declarations/marketplace/marketplace.did";
export type { _SERVICE as REGISTRY_SERVICE } from "../declarations/registry/registry.did";

export { idlFactory as usersIDL } from "../declarations/users/users.did.js";
export { idlFactory as marketplaceIDL } from "../declarations/marketplace/marketplace.did.js";
export { idlFactory as identityCertifierIDL } from "../declarations/identity_certifier/identity_certifier.did.js";
export { idlFactory as registryIDL } from "../declarations/registry/registry.did.js";

const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

interface CanisterConfigType {
  [key: string]: {
    [env: string]: string;
  };
}

let prodConfig: CanisterConfigType = {};
let localConfig: CanisterConfigType = {};

try {
  prodConfig = require("../../smart_contracts/icp/canister_ids.json");
} catch (error) {
  console.warn("Production canister config not found, using fallback");
}

try {
  if (network === "local") {
    localConfig = require("../../smart_contracts/icp/.dfx/local/canister_ids.json");
  }
} catch (error) {
  console.warn("Local canister config not found, using fallback");
}

export function getCanisterId(key: string): string {
  if (network === "ic") {
    const config: CanisterConfigType = prodConfig;
    if (config[key]) {
      return config[key]["ic"];
    } else {
      console.info(
        `Canister ID for key "${key}" not found in production config.`
      );
      return "";
    }
  } else {
    const config: CanisterConfigType = localConfig;
    if (config[key]) {
      return config[key]["local"];
    } else {
      console.error(
        `Canister ID for key "${key}" not found in local configuration.`
      );
      return "";
    }
  }
}

type Env = "ic" | "local";

interface CanisterConfig {
  usersCanisterId: string;
  identityCertifierCanisterId: string;
  internetIdentityCanisterId: string;
  marketplaceCanisterId: string;
  registryCanisterId: string;
}

const productionCanisters: CanisterConfig = {
  usersCanisterId: getCanisterId("users"),
  identityCertifierCanisterId: getCanisterId("identity_certifier"),
  internetIdentityCanisterId: "internet_identity",
  marketplaceCanisterId: getCanisterId("marketplace"),
  registryCanisterId: getCanisterId("registry"),
};

const localCanisters: CanisterConfig = {
  usersCanisterId: getCanisterId("users"),
  identityCertifierCanisterId: getCanisterId("identity_certifier"),
  internetIdentityCanisterId: getCanisterId("internet_identity"),
  marketplaceCanisterId: getCanisterId("marketplace"),
  registryCanisterId: getCanisterId("registry"),
};

const canisterConfigs: Record<Env, CanisterConfig> = {
  ic: productionCanisters,
  local: localCanisters,
};

export const {
  usersCanisterId,
  internetIdentityCanisterId,
  identityCertifierCanisterId,
  marketplaceCanisterId,
  registryCanisterId,
} = canisterConfigs[network as Env];
