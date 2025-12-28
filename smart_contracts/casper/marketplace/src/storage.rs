use alloc::string::{String, ToString};
use alloc::vec::Vec;

use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{URef, account::AccountHash};

use crate::types::{Listing, ListingStatus};

/// Storage keys
pub const LISTINGS_DICT: &str = "listings";
pub const SELLER_LISTINGS_DICT: &str = "seller_listings";
pub const MARKETPLACE_FEE_NUMERATOR: &str = "marketplace_fee_numerator";
pub const MARKETPLACE_FEE_DENOMINATOR: &str = "marketplace_fee_denominator";
pub const FEE_RECIPIENT: &str = "fee_recipient";
pub const ADMIN: &str = "admin";
pub const CONTRACT_PACKAGE_HASH: &str = "contract_package_hash";
pub const MARKETPLACE_PURSE: &str = "marketplace_purse";

/// Initialize the listings dictionary
pub fn init_listings_dict() -> URef {
    storage::new_dictionary(LISTINGS_DICT).unwrap_or_revert()
}

/// Initialize the seller listings dictionary
pub fn init_seller_listings_dict() -> URef {
    storage::new_dictionary(SELLER_LISTINGS_DICT).unwrap_or_revert()
}

/// Store a listing in the dictionary
pub fn store_listing(listing: &Listing) {
    let dict_uref = get_listings_dict_uref();
    storage::dictionary_put(dict_uref, &listing.listing_id, listing);
}

/// Get a listing from the dictionary
pub fn get_listing(listing_id: &str) -> Option<Listing> {
    let dict_uref = get_listings_dict_uref();
    storage::dictionary_get(dict_uref, listing_id)
        .unwrap_or_revert()
}

/// Update listing status
pub fn update_listing_status(listing_id: &str, status: ListingStatus) {
    if let Some(mut listing) = get_listing(listing_id) {
        listing.status = status;
        store_listing(&listing);
    }
}

/// Get the listings dictionary URef
fn get_listings_dict_uref() -> URef {
    runtime::get_key(LISTINGS_DICT)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert()
}

/// Add a listing to a seller's listing array
pub fn add_seller_listing(seller: &AccountHash, listing_id: &str) {
    let dict_uref = get_seller_listings_dict_uref();
    let seller_key = seller.to_string();

    let mut listings: Vec<String> = storage::dictionary_get(dict_uref, &seller_key)
        .unwrap_or_revert()
        .unwrap_or_else(Vec::new);

    listings.push(listing_id.to_string());
    storage::dictionary_put(dict_uref, &seller_key, listings);
}

/// Remove a listing from a seller's listing array
pub fn remove_seller_listing(seller: &AccountHash, listing_id: &str) {
    let dict_uref = get_seller_listings_dict_uref();
    let seller_key = seller.to_string();

    if let Some(mut listings) = storage::dictionary_get::<Vec<String>>(dict_uref, &seller_key)
        .unwrap_or_revert() {
        listings.retain(|id| id != listing_id);
        storage::dictionary_put(dict_uref, &seller_key, listings);
    }
}

/// Get all listings for a seller
pub fn get_seller_listings(seller: &AccountHash) -> Vec<String> {
    let dict_uref = get_seller_listings_dict_uref();
    let seller_key = seller.to_string();

    storage::dictionary_get(dict_uref, &seller_key)
        .unwrap_or_revert()
        .unwrap_or_else(Vec::new)
}

/// Get the seller listings dictionary URef
fn get_seller_listings_dict_uref() -> URef {
    runtime::get_key(SELLER_LISTINGS_DICT)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert()
}

/// Get marketplace fee configuration
pub fn get_marketplace_fee() -> (u64, u64) {
    let numerator = runtime::get_key(MARKETPLACE_FEE_NUMERATOR)
        .and_then(|key| key.into_uref())
        .map(|uref| storage::read::<u64>(uref).unwrap_or_revert().unwrap_or_revert())
        .unwrap_or(250); // Default 2.5%

    let denominator = runtime::get_key(MARKETPLACE_FEE_DENOMINATOR)
        .and_then(|key| key.into_uref())
        .map(|uref| storage::read::<u64>(uref).unwrap_or_revert().unwrap_or_revert())
        .unwrap_or(10000);

    (numerator, denominator)
}

/// Set marketplace fee
pub fn set_marketplace_fee(numerator: u64, denominator: u64) {
    let num_uref = runtime::get_key(MARKETPLACE_FEE_NUMERATOR)
        .and_then(|key| key.into_uref())
        .unwrap_or_else(|| storage::new_uref(numerator).into());

    let denom_uref = runtime::get_key(MARKETPLACE_FEE_DENOMINATOR)
        .and_then(|key| key.into_uref())
        .unwrap_or_else(|| storage::new_uref(denominator).into());

    storage::write(num_uref, numerator);
    storage::write(denom_uref, denominator);
}

/// Get fee recipient
pub fn get_fee_recipient() -> AccountHash {
    runtime::get_key(FEE_RECIPIENT)
        .unwrap_or_revert()
        .into_account()
        .unwrap_or_revert()
}

/// Set fee recipient
pub fn set_fee_recipient(recipient: AccountHash) {
    runtime::put_key(FEE_RECIPIENT, recipient.into());
}

/// Get admin
pub fn get_admin() -> AccountHash {
    runtime::get_key(ADMIN)
        .unwrap_or_revert()
        .into_account()
        .unwrap_or_revert()
}

/// Set admin
pub fn set_admin(admin: AccountHash) {
    runtime::put_key(ADMIN, admin.into());
}

/// Check if caller is admin
pub fn is_admin() -> bool {
    let caller = runtime::get_caller();
    let admin = get_admin();
    caller == admin
}

/// Get marketplace purse
pub fn get_marketplace_purse() -> URef {
    runtime::get_key(MARKETPLACE_PURSE)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert()
}

/// Set marketplace purse
pub fn set_marketplace_purse(purse: URef) {
    runtime::put_key(MARKETPLACE_PURSE, purse.into());
}
