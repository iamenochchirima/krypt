use candid::Principal;
use ic_cdk::{update, api::{msg_caller, time}};
use types::{
    AddAdminArgs, AdminStatus, AdminUser, BannedUser,
    BanUserArgs, Permission, UpdateAdminPermissionsArgs, UpdateAdminRoleArgs,
};
use types::user::{AddUserArgs, Interest, User};
use crate::state;
use crate::guards;

// ============ User Updates ============

#[update]
pub fn add_user(args: AddUserArgs) -> Result<(), String> {
    let caller = msg_caller();

    guards::require_not_banned(&caller)?;

    if state::user_exists(&caller) {
        return Err("User already exists".to_string());
    }

    if state::is_username_taken(&args.username) {
        return Err("Username already taken".to_string());
    }

    let interests: Vec<Interest> = args
        .interests
        .into_iter()
        .map(|i| Interest::new(&i))
        .collect::<Result<_, _>>()
        .map_err(|e| e.to_string())?;

    let user = User {
        principal: caller,
        username: args.username,
        chain_data: args.chain_data,
        image_url: args.image_url,
        email: args.email,
        referral_source: args.referral_source,
        referral_code: args.referral_code,
        interests,
        created_at: time(),
    };

    state::add_user(user)
}

// ============ Admin Management (Super Admin Only) ============

#[update]
pub fn add_admin(args: AddAdminArgs) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_super_admin(&caller)?;

    let admin = AdminUser {
        principal: args.principal,
        username: args.username,
        image_url: args.image_url,
        role: args.role.clone(),
        permissions: args.role.default_permissions(),
        added_by: caller,
        status: AdminStatus::Active,
        created_at: time(),
        updated_at: time(),
    };

    state::add_admin(admin)
}

#[update]
pub fn remove_admin(principal: Principal) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_super_admin(&caller)?;

    if principal == state::get_super_admin() {
        return Err("Cannot remove super admin".to_string());
    }

    state::remove_admin(&principal)?;
    Ok(())
}

#[update]
pub fn update_admin_role(args: UpdateAdminRoleArgs) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_super_admin(&caller)?;

    if args.principal == state::get_super_admin() {
        return Err("Cannot change super admin role".to_string());
    }

    state::update_admin_role(&args.principal, args.role)
}

#[update]
pub fn transfer_super_admin(new_super_admin: Principal) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_super_admin(&caller)?;

    if new_super_admin == caller {
        return Err("Already super admin".to_string());
    }

    state::update_super_admin(new_super_admin);
    Ok(())
}

// ============ Admin Management (Admin+) ============

#[update]
pub fn update_admin_permissions(args: UpdateAdminPermissionsArgs) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::ManageAdmins)?;

    let target_admin = state::get_admin(&args.principal)
        .ok_or_else(|| "Admin not found".to_string())?;

    if target_admin.is_super_admin() {
        return Err("Cannot modify super admin permissions".to_string());
    }

    let caller_admin = state::get_admin(&caller);
    if let Some(ca) = caller_admin {
        if !ca.role.can_manage_role(&target_admin.role) {
            return Err("Cannot modify admin with equal or higher role".to_string());
        }
    }

    state::update_admin_permissions(&args.principal, args.permissions)
}

#[update]
pub fn suspend_admin(principal: Principal) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::ManageAdmins)?;

    let target_admin = state::get_admin(&principal)
        .ok_or_else(|| "Admin not found".to_string())?;

    if target_admin.is_super_admin() {
        return Err("Cannot suspend super admin".to_string());
    }

    let caller_admin = state::get_admin(&caller);
    if let Some(ca) = caller_admin {
        if !ca.role.can_manage_role(&target_admin.role) {
            return Err("Cannot suspend admin with equal or higher role".to_string());
        }
    }

    state::suspend_admin(&principal)
}

#[update]
pub fn reactivate_admin(principal: Principal) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::ManageAdmins)?;

    state::reactivate_admin(&principal)
}

// ============ User Banning ============

#[update]
pub fn ban_user(args: BanUserArgs) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::BanUsers)?;

    if guards::is_admin(&args.principal) {
        return Err("Cannot ban an admin".to_string());
    }

    let banned = BannedUser {
        principal: args.principal,
        reason: args.reason,
        banned_by: caller,
        banned_at: time(),
    };

    state::ban_user(banned)
}

#[update]
pub fn unban_user(principal: Principal) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::BanUsers)?;

    state::unban_user(&principal)?;
    Ok(())
}

// ============ Platform Config ============

#[update]
pub fn update_platform_name(name: String) -> Result<(), String> {
    let caller = msg_caller();
    guards::require_permission(&caller, &Permission::ManagePlatformConfig)?;

    state::update_platform_name(name);
    Ok(())
}
