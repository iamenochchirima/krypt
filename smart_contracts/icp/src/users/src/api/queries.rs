use candid::Principal;
use ic_cdk::{query, api::msg_caller};
use types::{AdminUser, BannedUser, Permission};
use types::user::User;
use crate::state::{self, Config};
use crate::guards;

// ============ User Queries ============

#[query]
pub fn get_user() -> Result<User, String> {
    let caller = msg_caller();
    state::get_user(&caller).ok_or_else(|| "User not found".to_string())
}

#[query]
pub fn get_user_by_principal(principal: Principal) -> Result<User, String> {
    state::get_user(&principal).ok_or_else(|| "User not found".to_string())
}

#[query]
pub fn get_all_users() -> Vec<User> {
    state::get_all_users()
}

#[query]
pub fn get_users_paginated(start: u64, length: u64) -> (Vec<User>, u64) {
    state::get_users_paginated(start, length)
}

#[query]
pub fn get_latest_users(length: u64) -> (Vec<User>, u64) {
    state::get_latest_users(length)
}

#[query]
pub fn get_total_users() -> u64 {
    state::get_total_users()
}

#[query]
pub fn is_username_available(username: String) -> bool {
    !state::is_username_taken(&username)
}

#[query]
pub fn is_email_in_use(email: String) -> bool {
    state::is_email_in_use(&email)
}

#[query]
pub fn user_exists(principal: Principal) -> bool {
    state::user_exists(&principal)
}

// ============ Admin Queries ============

#[query]
pub fn get_config() -> Config {
    state::get_config()
}

#[query]
pub fn get_super_admin() -> Principal {
    state::get_super_admin()
}

#[query]
pub fn get_admin(principal: Principal) -> Option<AdminUser> {
    state::get_admin(&principal)
}

#[query]
pub fn get_all_admins() -> Result<Vec<AdminUser>, String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::ViewAdmins)?;
    Ok(state::get_all_admins())
}

#[query]
pub fn is_admin(principal: Principal) -> bool {
    guards::is_admin(&principal)
}

#[query]
pub fn is_super_admin(principal: Principal) -> bool {
    guards::is_super_admin(&principal)
}

#[query]
pub fn has_permission(principal: Principal, permission: Permission) -> bool {
    guards::has_permission(&principal, &permission)
}

// ============ Banned User Queries ============

#[query]
pub fn is_banned(principal: Principal) -> bool {
    state::is_banned(&principal)
}

#[query]
pub fn get_banned_user(principal: Principal) -> Option<BannedUser> {
    state::get_banned_user(&principal)
}

#[query]
pub fn get_all_banned_users() -> Result<Vec<BannedUser>, String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::BanUsers)?;
    Ok(state::get_all_banned_users())
}
