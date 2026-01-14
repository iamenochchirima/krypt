use ic_stable_structures::{StableCell, Storable, storable::Bound};
use std::cell::RefCell;
use std::borrow::Cow;
use candid::{CandidType, Decode, Encode, Principal};
use serde::{Deserialize, Serialize};
use sol_rpc_types::CommitmentLevel;
use super::memory::{get_memory, CONFIG_MEMORY_ID};

thread_local! {
    static CONFIG: RefCell<StableCell<Config, super::memory::Memory>> = RefCell::new(
        StableCell::init(get_memory(CONFIG_MEMORY_ID), Config::default())
    );
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub admin: Principal,
    pub sol_rpc_canister_id: Option<Principal>,
    pub solana_network: SolanaNetwork,
    pub solana_commitment_level: CommitmentLevel,
    pub ed25519_key_name: Ed25519KeyName,
    pub ed25519_public_key: Option<Ed25519ExtendedPublicKey>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Default, PartialEq, Eq, Clone)]
pub enum SolanaNetwork {
    Mainnet,
    #[default]
    Devnet,
    Custom(RpcEndpoint),
}

#[derive(CandidType, Serialize, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum Ed25519KeyName {
    #[default]
    LocalDevelopment,
    MainnetTestKey1,
    MainnetProdKey1,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Ed25519ExtendedPublicKey {
    pub public_key_bytes: Vec<u8>,
    pub chain_code: [u8; 32],
}

use sol_rpc_types::RpcEndpoint;

impl Default for Config {
    fn default() -> Self {
        Self {
            admin: Principal::anonymous(),
            sol_rpc_canister_id: None,
            solana_network: SolanaNetwork::default(),
            solana_commitment_level: CommitmentLevel::default(),
            ed25519_key_name: Ed25519KeyName::default(),
            ed25519_public_key: None,
        }
    }
}

impl Storable for Config {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

pub fn init_config(
    admin: Principal,
    sol_rpc_canister_id: Option<Principal>,
    solana_network: Option<SolanaNetwork>,
    ed25519_key_name: Option<Ed25519KeyName>,
    solana_commitment_level: Option<CommitmentLevel>,
) {
    CONFIG.with(|c| {
        c.borrow_mut().set(Config {
            admin,
            sol_rpc_canister_id,
            solana_network: solana_network.unwrap_or_default(),
            solana_commitment_level: solana_commitment_level.unwrap_or_default(),
            ed25519_key_name: ed25519_key_name.unwrap_or_default(),
            ed25519_public_key: None,
        });
    });
}

pub fn read_config<R>(f: impl FnOnce(&Config) -> R) -> R {
    CONFIG.with(|c| f(c.borrow().get()))
}

pub fn mutate_config<F, R>(f: F) -> R
where
    F: FnOnce(&mut Config) -> R,
{
    CONFIG.with(|c| {
        let mut cell = c.borrow_mut();
        let mut config = cell.get().clone();
        let result = f(&mut config);
        cell.set(config);
        result
    })
}

pub fn get_admin() -> Principal {
    read_config(|c| c.admin)
}

pub fn get_sol_rpc_canister_id() -> Option<Principal> {
    read_config(|c| c.sol_rpc_canister_id)
}

pub fn get_solana_network() -> SolanaNetwork {
    read_config(|c| c.solana_network.clone())
}

pub fn get_solana_commitment_level() -> CommitmentLevel {
    read_config(|c| c.solana_commitment_level.clone())
}

pub fn get_ed25519_key_name() -> Ed25519KeyName {
    read_config(|c| c.ed25519_key_name)
}

pub fn get_ed25519_public_key() -> Option<Ed25519ExtendedPublicKey> {
    read_config(|c| c.ed25519_public_key.clone())
}

pub fn set_ed25519_public_key(key: Ed25519ExtendedPublicKey) {
    mutate_config(|c| c.ed25519_public_key = Some(key));
}
