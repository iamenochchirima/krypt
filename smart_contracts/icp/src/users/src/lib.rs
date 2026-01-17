use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

pub mod api;
pub mod guards;
pub mod state;

pub use state::config::Config;
pub use types::{
    AddAdminArgs, AdminUser, BannedUser, BanUserArgs, Permission,
    UpdateAdminPermissionsArgs, UpdateAdminRoleArgs,
};
pub use types::user::{AddUserArgs, User};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InitArgs {
    pub super_admin: Principal,
}

#[ic_cdk::init]
fn init(args: InitArgs) {
    state::init_config(args.super_admin);
    ic_cdk::println!("Users canister initialized with super admin: {}", args.super_admin);
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("Users canister upgraded");
}

ic_cdk::export_candid!();
