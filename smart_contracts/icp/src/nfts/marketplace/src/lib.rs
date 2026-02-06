use candid::{Nat, Principal};
use ic_cdk_macros::init;

pub mod types;
pub mod state;
pub mod api;
pub mod utils;
pub mod constants;
pub mod errors;
pub mod guards;

use types::*;
use errors::MarketplaceError;

#[init]
fn init(args: InitArgs) {
    state::init_config(args.admin, args.collection_creation_fee, args.marketplace_fee_percentage);
    ic_cdk::println!("Marketplace canister initialized with admin: {}", args.admin);
}

pub use api::*;

ic_cdk::export_candid!();
