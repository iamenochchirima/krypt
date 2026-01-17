use candid::Principal;
use ic_stable_structures::{StableBTreeMap, StableLog};
use std::cell::RefCell;
use types::user::User;

use super::memory::{
    get_memory, Memory, MEMORY_MANAGER, USERS_MEMORY_ID,
    USERS_INDEX_MEMORY_ID, USERS_INDEX_DATA_MEMORY_ID,
};

thread_local! {
    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(USERS_MEMORY_ID))
    );

    static USERS_INDEX: RefCell<StableLog<Vec<u8>, Memory, Memory>> = RefCell::new(
        StableLog::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_INDEX_MEMORY_ID)),
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_INDEX_DATA_MEMORY_ID))
        )
    );
}

pub fn add_user(user: User) -> Result<(), String> {
    let principal = user.principal;

    USERS.with(|u| {
        let mut users = u.borrow_mut();
        if users.contains_key(&principal) {
            return Err("User already exists".to_string());
        }
        users.insert(principal, user);
        Ok(())
    })?;

    USERS_INDEX.with(|log| {
        log.borrow_mut()
            .append(&principal.as_slice().to_vec())
            .expect("Failed to append to users index");
    });

    Ok(())
}

pub fn get_user(principal: &Principal) -> Option<User> {
    USERS.with(|u| u.borrow().get(principal))
}

pub fn get_all_users() -> Vec<User> {
    USERS.with(|u| {
        u.borrow()
            .iter()
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn update_user(user: User) -> Result<(), String> {
    USERS.with(|u| {
        let mut users = u.borrow_mut();
        if !users.contains_key(&user.principal) {
            return Err("User not found".to_string());
        }
        users.insert(user.principal, user);
        Ok(())
    })
}

pub fn remove_user(principal: &Principal) -> Result<User, String> {
    USERS.with(|u| {
        u.borrow_mut()
            .remove(principal)
            .ok_or_else(|| "User not found".to_string())
    })
}

pub fn user_exists(principal: &Principal) -> bool {
    USERS.with(|u| u.borrow().contains_key(principal))
}

pub fn is_username_taken(username: &str) -> bool {
    USERS.with(|u| {
        u.borrow()
            .iter()
            .any(|entry| entry.value().username == username)
    })
}

pub fn is_email_in_use(email: &str) -> bool {
    USERS.with(|u| {
        u.borrow()
            .iter()
            .any(|entry| entry.value().email.as_ref().map_or(false, |e| e == email))
    })
}

pub fn get_total_users() -> u64 {
    USERS_INDEX.with(|log| log.borrow().len())
}

fn get_user_by_index(index: u64) -> Option<User> {
    let principal_bytes = USERS_INDEX.with(|log| log.borrow().get(index))?;
    let principal = Principal::from_slice(&principal_bytes);
    USERS.with(|u| u.borrow().get(&principal))
}

pub fn get_users_paginated(start: u64, length: u64) -> (Vec<User>, u64) {
    let total = get_total_users();

    if total == 0 || start >= total {
        return (vec![], total);
    }

    let end = (start + length).min(total);
    let mut users = Vec::with_capacity((end - start) as usize);

    for index in start..end {
        if let Some(user) = get_user_by_index(index) {
            users.push(user);
        }
    }

    (users, total)
}

pub fn get_latest_users(length: u64) -> (Vec<User>, u64) {
    let total = get_total_users();

    if total == 0 {
        return (vec![], 0);
    }

    let length = length.min(total);
    let start = total.saturating_sub(length);

    let mut users = Vec::with_capacity(length as usize);
    for index in start..total {
        if let Some(user) = get_user_by_index(index) {
            users.push(user);
        }
    }

    users.reverse();
    (users, total)
}
