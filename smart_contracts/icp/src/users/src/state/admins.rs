use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;
use types::{AdminRole, AdminStatus, AdminUser, Permission};

use super::memory::{get_memory, Memory, ADMINS_MEMORY_ID};

thread_local! {
    static ADMINS: RefCell<StableBTreeMap<Principal, AdminUser, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(ADMINS_MEMORY_ID))
    );
}

pub fn add_admin(admin: AdminUser) -> Result<(), String> {
    ADMINS.with(|a| {
        let mut admins = a.borrow_mut();
        if admins.contains_key(&admin.principal) {
            return Err("Admin already exists".to_string());
        }
        admins.insert(admin.principal, admin);
        Ok(())
    })
}

pub fn get_admin(principal: &Principal) -> Option<AdminUser> {
    ADMINS.with(|a| a.borrow().get(principal))
}

pub fn get_all_admins() -> Vec<AdminUser> {
    ADMINS.with(|a| {
        a.borrow()
            .iter()
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn remove_admin(principal: &Principal) -> Result<AdminUser, String> {
    ADMINS.with(|a| {
        a.borrow_mut()
            .remove(principal)
            .ok_or_else(|| "Admin not found".to_string())
    })
}

pub fn update_admin_role(principal: &Principal, role: AdminRole) -> Result<(), String> {
    ADMINS.with(|a| {
        let mut admins = a.borrow_mut();
        if let Some(mut admin) = admins.get(principal) {
            admin.role = role.clone();
            admin.permissions = role.default_permissions();
            admin.updated_at = ic_cdk::api::time();
            admins.insert(*principal, admin);
            Ok(())
        } else {
            Err("Admin not found".to_string())
        }
    })
}

pub fn update_admin_permissions(principal: &Principal, permissions: Vec<Permission>) -> Result<(), String> {
    ADMINS.with(|a| {
        let mut admins = a.borrow_mut();
        if let Some(mut admin) = admins.get(principal) {
            admin.permissions = permissions;
            admin.updated_at = ic_cdk::api::time();
            admins.insert(*principal, admin);
            Ok(())
        } else {
            Err("Admin not found".to_string())
        }
    })
}

pub fn suspend_admin(principal: &Principal) -> Result<(), String> {
    ADMINS.with(|a| {
        let mut admins = a.borrow_mut();
        if let Some(mut admin) = admins.get(principal) {
            admin.status = AdminStatus::Suspended;
            admin.updated_at = ic_cdk::api::time();
            admins.insert(*principal, admin);
            Ok(())
        } else {
            Err("Admin not found".to_string())
        }
    })
}

pub fn reactivate_admin(principal: &Principal) -> Result<(), String> {
    ADMINS.with(|a| {
        let mut admins = a.borrow_mut();
        if let Some(mut admin) = admins.get(principal) {
            admin.status = AdminStatus::Active;
            admin.updated_at = ic_cdk::api::time();
            admins.insert(*principal, admin);
            Ok(())
        } else {
            Err("Admin not found".to_string())
        }
    })
}

pub fn is_admin(principal: &Principal) -> bool {
    ADMINS.with(|a| a.borrow().contains_key(principal))
}

pub fn has_permission(principal: &Principal, permission: &Permission) -> bool {
    if let Some(admin) = get_admin(principal) {
        admin.is_active() && admin.has_permission(permission)
    } else {
        false
    }
}
