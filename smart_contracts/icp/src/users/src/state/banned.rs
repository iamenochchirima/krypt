use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;
use types::BannedUser;

use super::memory::{get_memory, Memory, BANNED_USERS_MEMORY_ID};

thread_local! {
    static BANNED_USERS: RefCell<StableBTreeMap<Principal, BannedUser, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(BANNED_USERS_MEMORY_ID))
    );
}

pub fn ban_user(banned_user: BannedUser) -> Result<(), String> {
    BANNED_USERS.with(|b| {
        let mut banned = b.borrow_mut();
        if banned.contains_key(&banned_user.principal) {
            return Err("User already banned".to_string());
        }
        banned.insert(banned_user.principal, banned_user);
        Ok(())
    })
}

pub fn unban_user(principal: &Principal) -> Result<BannedUser, String> {
    BANNED_USERS.with(|b| {
        b.borrow_mut()
            .remove(principal)
            .ok_or_else(|| "User not banned".to_string())
    })
}

pub fn is_banned(principal: &Principal) -> bool {
    BANNED_USERS.with(|b| b.borrow().contains_key(principal))
}

pub fn get_banned_user(principal: &Principal) -> Option<BannedUser> {
    BANNED_USERS.with(|b| b.borrow().get(principal))
}

pub fn get_all_banned_users() -> Vec<BannedUser> {
    BANNED_USERS.with(|b| {
        b.borrow()
            .iter()
            .map(|entry| entry.value())
            .collect()
    })
}
