export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'super_admin' : IDL.Principal });
  const AdminRole = IDL.Variant({
    'Support' : IDL.Null,
    'SuperAdmin' : IDL.Null,
    'Admin' : IDL.Null,
    'Moderator' : IDL.Null,
  });
  const AddAdminArgs = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'image_url' : IDL.Opt(IDL.Text),
    'role' : AdminRole,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Chain = IDL.Variant({
    'ICP' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Solana' : IDL.Null,
    'Bitcoin' : IDL.Null,
    'Other' : IDL.Text,
  });
  const ChainData = IDL.Record({
    'chain' : Chain,
    'wallet_address' : IDL.Text,
    'wallet' : IDL.Text,
  });
  const AddUserArgs = IDL.Record({
    'username' : IDL.Text,
    'image_url' : IDL.Opt(IDL.Text),
    'interests' : IDL.Vec(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
    'referral_code' : IDL.Opt(IDL.Text),
    'referral_source' : IDL.Opt(IDL.Text),
    'chain_data' : ChainData,
  });
  const BanUserArgs = IDL.Record({
    'principal' : IDL.Principal,
    'reason' : IDL.Text,
  });
  const AdminStatus = IDL.Variant({
    'Active' : IDL.Null,
    'Suspended' : IDL.Null,
  });
  const Permission = IDL.Variant({
    'ApproveCollections' : IDL.Null,
    'ManageAdmins' : IDL.Null,
    'BanUsers' : IDL.Null,
    'RemoveCollections' : IDL.Null,
    'ViewAdmins' : IDL.Null,
    'VerifyCollections' : IDL.Null,
    'FeatureCollections' : IDL.Null,
    'ManagePlatformConfig' : IDL.Null,
  });
  const AdminUser = IDL.Record({
    'status' : AdminStatus,
    'permissions' : IDL.Vec(Permission),
    'updated_at' : IDL.Nat64,
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'image_url' : IDL.Opt(IDL.Text),
    'role' : AdminRole,
    'added_by' : IDL.Principal,
    'created_at' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Vec(AdminUser), 'Err' : IDL.Text });
  const BannedUser = IDL.Record({
    'principal' : IDL.Principal,
    'banned_at' : IDL.Nat64,
    'banned_by' : IDL.Principal,
    'reason' : IDL.Text,
  });
  const Result_2 = IDL.Variant({
    'Ok' : IDL.Vec(BannedUser),
    'Err' : IDL.Text,
  });
  const Interest = IDL.Record({ 'value' : IDL.Text });
  const User = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'image_url' : IDL.Opt(IDL.Text),
    'interests' : IDL.Vec(Interest),
    'created_at' : IDL.Nat64,
    'email' : IDL.Opt(IDL.Text),
    'referral_code' : IDL.Opt(IDL.Text),
    'referral_source' : IDL.Opt(IDL.Text),
    'chain_data' : ChainData,
  });
  const Config = IDL.Record({
    'platform_name' : IDL.Text,
    'initialized' : IDL.Bool,
    'super_admin' : IDL.Principal,
  });
  const Result_3 = IDL.Variant({ 'Ok' : User, 'Err' : IDL.Text });
  const UpdateAdminPermissionsArgs = IDL.Record({
    'permissions' : IDL.Vec(Permission),
    'principal' : IDL.Principal,
  });
  const UpdateAdminRoleArgs = IDL.Record({
    'principal' : IDL.Principal,
    'role' : AdminRole,
  });
  return IDL.Service({
    'add_admin' : IDL.Func([AddAdminArgs], [Result], []),
    'add_user' : IDL.Func([AddUserArgs], [Result], []),
    'ban_user' : IDL.Func([BanUserArgs], [Result], []),
    'get_admin' : IDL.Func([IDL.Principal], [IDL.Opt(AdminUser)], ['query']),
    'get_all_admins' : IDL.Func([], [Result_1], ['query']),
    'get_all_banned_users' : IDL.Func([], [Result_2], ['query']),
    'get_all_users' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'get_banned_user' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(BannedUser)],
        ['query'],
      ),
    'get_config' : IDL.Func([], [Config], ['query']),
    'get_latest_users' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(User), IDL.Nat64],
        ['query'],
      ),
    'get_super_admin' : IDL.Func([], [IDL.Principal], ['query']),
    'get_total_users' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_user' : IDL.Func([], [Result_3], ['query']),
    'get_user_by_principal' : IDL.Func([IDL.Principal], [Result_3], ['query']),
    'get_users_paginated' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Vec(User), IDL.Nat64],
        ['query'],
      ),
    'has_permission' : IDL.Func(
        [IDL.Principal, Permission],
        [IDL.Bool],
        ['query'],
      ),
    'is_admin' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'is_banned' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'is_email_in_use' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'is_super_admin' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'is_username_available' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'reactivate_admin' : IDL.Func([IDL.Principal], [Result], []),
    'remove_admin' : IDL.Func([IDL.Principal], [Result], []),
    'suspend_admin' : IDL.Func([IDL.Principal], [Result], []),
    'transfer_super_admin' : IDL.Func([IDL.Principal], [Result], []),
    'unban_user' : IDL.Func([IDL.Principal], [Result], []),
    'update_admin_permissions' : IDL.Func(
        [UpdateAdminPermissionsArgs],
        [Result],
        [],
      ),
    'update_admin_role' : IDL.Func([UpdateAdminRoleArgs], [Result], []),
    'update_platform_name' : IDL.Func([IDL.Text], [Result], []),
    'user_exists' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'super_admin' : IDL.Principal });
  return [InitArgs];
};
