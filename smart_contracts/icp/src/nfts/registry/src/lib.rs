use candid::Principal;
use ic_cdk_macros::init;

pub mod types;
pub mod state;
pub mod api;
pub mod utils;
pub mod guards;

use types::*;

#[derive(candid::CandidType, serde::Deserialize)]
pub struct InitArgs {
    pub admin: Principal,
}

#[init]
fn init(args: InitArgs) {
    state::config::init_config(args.admin);
    ic_cdk::println!("Registry canister initialized with admin: {}", args.admin);
}

pub use api::*;

ic_cdk::export_candid!();
