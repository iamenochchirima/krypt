#![no_std]
#![no_main]

extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec::Vec;

use casper_contract::{
    contract_api::{runtime, storage, system},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_event_standard::emit;
use casper_types::{
    CLType, CLValue, ContractHash, EntryPoint, EntryPointAccess, EntryPointType,
    EntryPoints, Key, Parameter, U512, URef, account::AccountHash,
};

mod errors;
mod events;
mod payment;
mod storage_mod;
mod types;

use errors::Error;
use events::{AdminTransferred, FeeRecipientUpdated, FeeUpdated, NftDelisted, NftListed, NftPurchased};
use payment::{calculate_payment_split, distribute_payment, transfer_nft};
use storage_mod as storage;
use types::{Listing, ListingStatus};

/// Entry point: List an NFT for sale
#[no_mangle]
pub extern "C" fn list_nft() {
    let token_hash: Key = runtime::get_named_arg("token_hash");
    let collection_hash: ContractHash = runtime::get_named_arg("collection_hash");
    let price: U512 = runtime::get_named_arg("price");

    // Validate price
    if price == U512::zero() {
        runtime::revert(Error::InvalidPrice);
    }

    let seller = runtime::get_caller();
    let listed_at = runtime::get_blocktime();

    // Generate unique listing ID
    let listing_id = generate_listing_id(&seller, &token_hash, listed_at);

    // TODO: Transfer NFT to marketplace (escrow)
    // transfer_nft(&collection_hash, &token_hash, &seller, &runtime::get_caller()).unwrap_or_revert();

    // Create listing
    let listing = Listing {
        listing_id: listing_id.clone(),
        token_hash,
        collection_hash,
        seller,
        price,
        listed_at,
        status: ListingStatus::Active,
    };

    // Store listing
    storage::store_listing(&listing);
    storage::add_seller_listing(&seller, &listing_id);

    // Emit event
    emit(NftListed {
        listing_id: listing_id.clone(),
        token_hash,
        collection_hash,
        seller,
        price,
    });

    // Return listing ID
    runtime::ret(CLValue::from_t(listing_id).unwrap_or_revert());
}

/// Entry point: Purchase an NFT
#[no_mangle]
pub extern "C" fn purchase() {
    let listing_id: String = runtime::get_named_arg("listing_id");

    // Get listing
    let listing = storage::get_listing(&listing_id)
        .unwrap_or_revert_with(Error::ListingNotFound);

    // Validate listing is active
    if listing.status != ListingStatus::Active {
        runtime::revert(Error::ListingNotActive);
    }

    let buyer = runtime::get_caller();

    // TODO: Get royalty info from collection
    let royalty_numerator = 5u64; // Placeholder: 5%
    let royalty_denominator = 100u64;
    let creator = listing.seller; // Placeholder: use seller as creator

    // Calculate payment split
    let (marketplace_fee, royalty_amount, seller_amount) =
        calculate_payment_split(listing.price, royalty_numerator, royalty_denominator);

    // Get buyer's main purse
    let buyer_purse = system::get_main_purse();

    // Transfer payment from buyer to marketplace purse
    let marketplace_purse = storage::get_marketplace_purse();
    system::transfer_from_purse_to_purse(
        buyer_purse,
        marketplace_purse,
        listing.price,
        None,
    )
    .unwrap_or_revert_with(Error::PaymentTransferFailed);

    // Distribute payment
    distribute_payment(
        buyer_purse,
        listing.price,
        marketplace_fee,
        royalty_amount,
        seller_amount,
        creator,
        listing.seller,
    );

    // TODO: Transfer NFT to buyer
    // transfer_nft(&listing.collection_hash, &listing.token_hash, &listing.seller, &buyer)
    //     .unwrap_or_revert_with(Error::NftTransferFailed);

    // Update listing status
    storage::update_listing_status(&listing_id, ListingStatus::Sold);

    // Remove from seller's listings
    storage::remove_seller_listing(&listing.seller, &listing_id);

    // Emit event
    emit(NftPurchased {
        listing_id,
        token_hash: listing.token_hash,
        seller: listing.seller,
        buyer,
        price: listing.price,
    });
}

/// Entry point: Cancel a listing
#[no_mangle]
pub extern "C" fn cancel_listing() {
    let listing_id: String = runtime::get_named_arg("listing_id");

    // Get listing
    let listing = storage::get_listing(&listing_id)
        .unwrap_or_revert_with(Error::ListingNotFound);

    // Validate caller is seller
    let caller = runtime::get_caller();
    if caller != listing.seller {
        runtime::revert(Error::NotAuthorized);
    }

    // Validate listing is active
    if listing.status != ListingStatus::Active {
        runtime::revert(Error::ListingNotActive);
    }

    // TODO: Transfer NFT back to seller
    // transfer_nft(&listing.collection_hash, &listing.token_hash, &caller, &listing.seller)
    //     .unwrap_or_revert_with(Error::NftTransferFailed);

    // Update listing status
    storage::update_listing_status(&listing_id, ListingStatus::Cancelled);

    // Remove from seller's listings
    storage::remove_seller_listing(&listing.seller, &listing_id);

    // Emit event
    emit(NftDelisted {
        listing_id,
        token_hash: listing.token_hash,
        seller: listing.seller,
    });
}

/// Entry point: Get listing details
#[no_mangle]
pub extern "C" fn get_listing() {
    let listing_id: String = runtime::get_named_arg("listing_id");

    let listing = storage::get_listing(&listing_id)
        .unwrap_or_revert_with(Error::ListingNotFound);

    runtime::ret(CLValue::from_t(listing).unwrap_or_revert());
}

/// Entry point: Get seller's listings
#[no_mangle]
pub extern "C" fn get_seller_listings() {
    let seller: AccountHash = runtime::get_named_arg("seller");

    let listings = storage::get_seller_listings(&seller);

    runtime::ret(CLValue::from_t(listings).unwrap_or_revert());
}

/// Entry point: Get marketplace fee configuration
#[no_mangle]
pub extern "C" fn get_marketplace_fee() {
    let (numerator, denominator) = storage::get_marketplace_fee();
    let fee_recipient = storage::get_fee_recipient();

    runtime::ret(CLValue::from_t((numerator, denominator, fee_recipient)).unwrap_or_revert());
}

/// Entry point: Update marketplace fee (admin only)
#[no_mangle]
pub extern "C" fn update_marketplace_fee() {
    if !storage::is_admin() {
        runtime::revert(Error::NotAuthorized);
    }

    let new_numerator: u64 = runtime::get_named_arg("new_numerator");
    let new_denominator: u64 = runtime::get_named_arg("new_denominator");

    // Validate fee
    if new_numerator > new_denominator {
        runtime::revert(Error::InvalidFee);
    }

    let (old_numerator, old_denominator) = storage::get_marketplace_fee();

    storage::set_marketplace_fee(new_numerator, new_denominator);

    emit(FeeUpdated {
        old_numerator,
        old_denominator,
        new_numerator,
        new_denominator,
    });
}

/// Entry point: Update fee recipient (admin only)
#[no_mangle]
pub extern "C" fn update_fee_recipient() {
    if !storage::is_admin() {
        runtime::revert(Error::NotAuthorized);
    }

    let new_recipient: AccountHash = runtime::get_named_arg("new_recipient");
    let old_recipient = storage::get_fee_recipient();

    storage::set_fee_recipient(new_recipient);

    emit(FeeRecipientUpdated {
        old_recipient,
        new_recipient,
    });
}

/// Entry point: Transfer admin (admin only)
#[no_mangle]
pub extern "C" fn transfer_admin() {
    if !storage::is_admin() {
        runtime::revert(Error::NotAuthorized);
    }

    let new_admin: AccountHash = runtime::get_named_arg("new_admin");
    let old_admin = storage::get_admin();

    storage::set_admin(new_admin);

    emit(AdminTransferred {
        old_admin,
        new_admin,
    });
}

/// Generate a unique listing ID
fn generate_listing_id(seller: &AccountHash, token_hash: &Key, timestamp: u64) -> String {
    // Simple hash-based ID generation
    // In production, use a proper hash function
    alloc::format!("{:?}_{:?}_{}", seller, token_hash, timestamp)
}

/// Install the contract
#[no_mangle]
pub extern "C" fn call() {
    let admin: AccountHash = runtime::get_caller();

    // Define entry points
    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        "list_nft",
        vec![
            Parameter::new("token_hash", CLType::Key),
            Parameter::new("collection_hash", CLType::Key),
            Parameter::new("price", CLType::U512),
        ],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "purchase",
        vec![Parameter::new("listing_id", CLType::String)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "cancel_listing",
        vec![Parameter::new("listing_id", CLType::String)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_listing",
        vec![Parameter::new("listing_id", CLType::String)],
        CLType::Any,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_seller_listings",
        vec![Parameter::new("seller", CLType::Key)],
        CLType::Any,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_marketplace_fee",
        vec![],
        CLType::Any,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "update_marketplace_fee",
        vec![
            Parameter::new("new_numerator", CLType::U64),
            Parameter::new("new_denominator", CLType::U64),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "update_fee_recipient",
        vec![Parameter::new("new_recipient", CLType::Key)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "transfer_admin",
        vec![Parameter::new("new_admin", CLType::Key)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    // Create contract package
    let (contract_hash, _contract_version) = storage::new_contract(
        entry_points,
        None,
        Some("nft_marketplace_contract_package_hash".to_string()),
        Some("nft_marketplace_contract_access_uref".to_string()),
    );

    // Create marketplace purse for holding funds during transactions
    let marketplace_purse = system::create_purse();

    // Initialize storage
    storage::init_listings_dict();
    storage::init_seller_listings_dict();
    storage::set_marketplace_fee(250, 10000); // 2.5%
    storage::set_fee_recipient(admin);
    storage::set_admin(admin);
    storage::set_marketplace_purse(marketplace_purse);

    // Store contract hash
    runtime::put_key("nft_marketplace_contract_hash", contract_hash.into());
}
