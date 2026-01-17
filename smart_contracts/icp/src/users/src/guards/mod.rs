use candid::Principal;
use types::Permission;
use crate::state::{self, get_super_admin};

pub fn is_super_admin(caller: &Principal) -> bool {
    *caller == get_super_admin()
}

pub fn is_admin(caller: &Principal) -> bool {
    is_super_admin(caller) || state::is_admin(caller)
}

pub fn has_permission(caller: &Principal, permission: &Permission) -> bool {
    is_super_admin(caller) || state::has_permission(caller, permission)
}

pub fn require_super_admin(caller: &Principal) -> Result<(), String> {
    if is_super_admin(caller) {
        Ok(())
    } else {
        Err("Not authorized: requires super admin".to_string())
    }
}

pub fn require_admin(caller: &Principal) -> Result<(), String> {
    if is_admin(caller) {
        Ok(())
    } else {
        Err("Not authorized: requires admin".to_string())
    }
}

pub fn require_permission(caller: &Principal, permission: &Permission) -> Result<(), String> {
    if has_permission(caller, permission) {
        Ok(())
    } else {
        Err(format!("Not authorized: requires {:?} permission", permission))
    }
}

pub fn require_not_banned(caller: &Principal) -> Result<(), String> {
    if state::is_banned(caller) {
        Err("User is banned".to_string())
    } else {
        Ok(())
    }
}
