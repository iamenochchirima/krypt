use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::Serialize;
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum AdminRole {
    SuperAdmin,
    Admin,
    Moderator,
    Support,
}

impl AdminRole {
    pub fn default_permissions(&self) -> Vec<Permission> {
        match self {
            AdminRole::SuperAdmin => Permission::all(),
            AdminRole::Admin => vec![
                Permission::ApproveCollections,
                Permission::VerifyCollections,
                Permission::FeatureCollections,
                Permission::RemoveCollections,
                Permission::BanUsers,
                Permission::ViewAdmins,
            ],
            AdminRole::Moderator => vec![
                Permission::ApproveCollections,
                Permission::VerifyCollections,
                Permission::BanUsers,
                Permission::ViewAdmins,
            ],
            AdminRole::Support => vec![Permission::ViewAdmins],
        }
    }

    pub fn can_manage_role(&self, target_role: &AdminRole) -> bool {
        match self {
            AdminRole::SuperAdmin => true,
            AdminRole::Admin => matches!(target_role, AdminRole::Moderator | AdminRole::Support),
            _ => false,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum Permission {
    ManageAdmins,
    ViewAdmins,
    ApproveCollections,
    VerifyCollections,
    FeatureCollections,
    RemoveCollections,
    BanUsers,
    ManagePlatformConfig,
}

impl Permission {
    pub fn all() -> Vec<Permission> {
        vec![
            Permission::ManageAdmins,
            Permission::ViewAdmins,
            Permission::ApproveCollections,
            Permission::VerifyCollections,
            Permission::FeatureCollections,
            Permission::RemoveCollections,
            Permission::BanUsers,
            Permission::ManagePlatformConfig,
        ]
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum AdminStatus {
    Active,
    Suspended,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AdminUser {
    pub principal: Principal,
    pub username: String,
    pub image_url: Option<String>,
    pub role: AdminRole,
    pub permissions: Vec<Permission>,
    pub added_by: Principal,
    pub status: AdminStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

impl AdminUser {
    pub fn is_active(&self) -> bool {
        self.status == AdminStatus::Active
    }

    pub fn has_permission(&self, permission: &Permission) -> bool {
        self.role == AdminRole::SuperAdmin || self.permissions.contains(permission)
    }

    pub fn is_super_admin(&self) -> bool {
        self.role == AdminRole::SuperAdmin
    }
}

impl Storable for AdminUser {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BannedUser {
    pub principal: Principal,
    pub reason: String,
    pub banned_by: Principal,
    pub banned_at: u64,
}

impl Storable for BannedUser {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AddAdminArgs {
    pub principal: Principal,
    pub username: String,
    pub image_url: Option<String>,
    pub role: AdminRole,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateAdminRoleArgs {
    pub principal: Principal,
    pub role: AdminRole,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateAdminPermissionsArgs {
    pub principal: Principal,
    pub permissions: Vec<Permission>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BanUserArgs {
    pub principal: Principal,
    pub reason: String,
}
