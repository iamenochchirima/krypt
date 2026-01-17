import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddAdminArgs {
  'principal' : Principal,
  'username' : string,
  'image_url' : [] | [string],
  'role' : AdminRole,
}
export interface AddUserArgs {
  'username' : string,
  'image_url' : [] | [string],
  'interests' : Array<string>,
  'email' : [] | [string],
  'referral_code' : [] | [string],
  'referral_source' : [] | [string],
  'chain_data' : ChainData,
}
export type AdminRole = { 'Support' : null } |
  { 'SuperAdmin' : null } |
  { 'Admin' : null } |
  { 'Moderator' : null };
export type AdminStatus = { 'Active' : null } |
  { 'Suspended' : null };
export interface AdminUser {
  'status' : AdminStatus,
  'permissions' : Array<Permission>,
  'updated_at' : bigint,
  'principal' : Principal,
  'username' : string,
  'image_url' : [] | [string],
  'role' : AdminRole,
  'added_by' : Principal,
  'created_at' : bigint,
}
export interface BanUserArgs { 'principal' : Principal, 'reason' : string }
export interface BannedUser {
  'principal' : Principal,
  'banned_at' : bigint,
  'banned_by' : Principal,
  'reason' : string,
}
export type Chain = { 'ICP' : null } |
  { 'Ethereum' : null } |
  { 'Solana' : null } |
  { 'Bitcoin' : null } |
  { 'Other' : string };
export interface ChainData {
  'chain' : Chain,
  'wallet_address' : string,
  'wallet' : string,
}
export interface Config {
  'platform_name' : string,
  'initialized' : boolean,
  'super_admin' : Principal,
}
export interface InitArgs { 'super_admin' : Principal }
export interface Interest { 'value' : string }
export type Permission = { 'ApproveCollections' : null } |
  { 'ManageAdmins' : null } |
  { 'BanUsers' : null } |
  { 'RemoveCollections' : null } |
  { 'ViewAdmins' : null } |
  { 'VerifyCollections' : null } |
  { 'FeatureCollections' : null } |
  { 'ManagePlatformConfig' : null };
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : Array<AdminUser> } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Array<BannedUser> } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : User } |
  { 'Err' : string };
export interface UpdateAdminPermissionsArgs {
  'permissions' : Array<Permission>,
  'principal' : Principal,
}
export interface UpdateAdminRoleArgs {
  'principal' : Principal,
  'role' : AdminRole,
}
export interface User {
  'principal' : Principal,
  'username' : string,
  'image_url' : [] | [string],
  'interests' : Array<Interest>,
  'created_at' : bigint,
  'email' : [] | [string],
  'referral_code' : [] | [string],
  'referral_source' : [] | [string],
  'chain_data' : ChainData,
}
export interface _SERVICE {
  'add_admin' : ActorMethod<[AddAdminArgs], Result>,
  'add_user' : ActorMethod<[AddUserArgs], Result>,
  'ban_user' : ActorMethod<[BanUserArgs], Result>,
  'get_admin' : ActorMethod<[Principal], [] | [AdminUser]>,
  'get_all_admins' : ActorMethod<[], Result_1>,
  'get_all_banned_users' : ActorMethod<[], Result_2>,
  'get_all_users' : ActorMethod<[], Array<User>>,
  'get_banned_user' : ActorMethod<[Principal], [] | [BannedUser]>,
  'get_config' : ActorMethod<[], Config>,
  'get_latest_users' : ActorMethod<[bigint], [Array<User>, bigint]>,
  'get_super_admin' : ActorMethod<[], Principal>,
  'get_total_users' : ActorMethod<[], bigint>,
  'get_user' : ActorMethod<[], Result_3>,
  'get_user_by_principal' : ActorMethod<[Principal], Result_3>,
  'get_users_paginated' : ActorMethod<[bigint, bigint], [Array<User>, bigint]>,
  'has_permission' : ActorMethod<[Principal, Permission], boolean>,
  'is_admin' : ActorMethod<[Principal], boolean>,
  'is_banned' : ActorMethod<[Principal], boolean>,
  'is_email_in_use' : ActorMethod<[string], boolean>,
  'is_super_admin' : ActorMethod<[Principal], boolean>,
  'is_username_available' : ActorMethod<[string], boolean>,
  'reactivate_admin' : ActorMethod<[Principal], Result>,
  'remove_admin' : ActorMethod<[Principal], Result>,
  'suspend_admin' : ActorMethod<[Principal], Result>,
  'transfer_super_admin' : ActorMethod<[Principal], Result>,
  'unban_user' : ActorMethod<[Principal], Result>,
  'update_admin_permissions' : ActorMethod<
    [UpdateAdminPermissionsArgs],
    Result
  >,
  'update_admin_role' : ActorMethod<[UpdateAdminRoleArgs], Result>,
  'update_platform_name' : ActorMethod<[string], Result>,
  'user_exists' : ActorMethod<[Principal], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
