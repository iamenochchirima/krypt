use candid::{Nat, Principal};
use ic_cdk_macros::init;
use sol_rpc_types::{CommitmentLevel, TokenAmount};

pub mod state;
pub mod solana;
pub mod types;

use state::config::{Ed25519KeyName, SolanaNetwork};

#[derive(candid::CandidType, serde::Deserialize)]
pub struct InitArgs {
    pub admin: Principal,
    pub sol_rpc_canister_id: Option<Principal>,
    pub solana_network: Option<SolanaNetwork>,
    pub ed25519_key_name: Option<Ed25519KeyName>,
    pub solana_commitment_level: Option<CommitmentLevel>,
}

#[init]
fn init(args: InitArgs) {
    state::config::init_config(
        args.admin,
        args.sol_rpc_canister_id,
        args.solana_network,
        args.ed25519_key_name,
        args.solana_commitment_level,
    );
    ic_cdk::println!("X-Chain canister initialized with admin: {}", args.admin);
}

pub use solana::*;

ic_cdk::export_candid!();
