use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{ContractHash, URef, account::AccountHash, U512};

use crate::types::CollectionInfo;

/// Storage keys
pub const COLLECTIONS_DICT: &str = "collections";
pub const COLLECTION_COUNT: &str = "collection_count";
pub const CEP78_PACKAGE_HASH: &str = "cep78_package_hash";
pub const ADMIN: &str = "admin";
pub const CONTRACT_PACKAGE_HASH: &str = "contract_package_hash";

/// Initialize the collections dictionary
pub fn init_collections_dict() -> URef {
    storage::new_dictionary(COLLECTIONS_DICT).unwrap_or_revert()
}

/// Store a collection in the dictionary
pub fn store_collection(collection_hash: &ContractHash, info: &CollectionInfo) {
    let dict_uref = get_collections_dict_uref();
    let key = collection_hash.to_string();
    storage::dictionary_put(dict_uref, &key, info);
}

/// Get a collection from the dictionary
pub fn get_collection(collection_hash: &ContractHash) -> Option<CollectionInfo> {
    let dict_uref = get_collections_dict_uref();
    let key = collection_hash.to_string();
    storage::dictionary_get(dict_uref, &key)
        .unwrap_or_revert()
}

/// Get the collections dictionary URef
fn get_collections_dict_uref() -> URef {
    runtime::get_key(COLLECTIONS_DICT)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert()
}

/// Get the current collection count
pub fn get_collection_count() -> u64 {
    runtime::get_key(COLLECTION_COUNT)
        .and_then(|key| key.into_uref())
        .map(|uref| storage::read::<u64>(uref).unwrap_or_revert().unwrap_or_revert())
        .unwrap_or(0)
}

/// Increment and return the new collection count
pub fn increment_collection_count() -> u64 {
    let current_count = get_collection_count();
    let new_count = current_count + 1;
    set_collection_count(new_count);
    new_count
}

/// Set the collection count
fn set_collection_count(count: u64) {
    let uref = runtime::get_key(COLLECTION_COUNT)
        .and_then(|key| key.into_uref())
        .unwrap_or_else(|| storage::new_uref(count).into());

    storage::write(uref, count);
}

/// Get the admin account hash
pub fn get_admin() -> AccountHash {
    runtime::get_key(ADMIN)
        .unwrap_or_revert()
        .into_account()
        .unwrap_or_revert()
}

/// Set the admin account hash
pub fn set_admin(admin: AccountHash) {
    runtime::put_key(ADMIN, admin.into());
}

/// Get the CEP-78 package hash
pub fn get_cep78_package_hash() -> ContractHash {
    runtime::get_key(CEP78_PACKAGE_HASH)
        .unwrap_or_revert()
        .into_hash()
        .map(ContractHash::new)
        .unwrap_or_revert()
}

/// Set the CEP-78 package hash
pub fn set_cep78_package_hash(hash: ContractHash) {
    runtime::put_key(CEP78_PACKAGE_HASH, hash.into());
}

/// Check if caller is admin
pub fn is_admin() -> bool {
    let caller = runtime::get_caller();
    let admin = get_admin();
    caller == admin
}
