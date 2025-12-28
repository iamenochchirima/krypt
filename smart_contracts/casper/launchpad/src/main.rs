#![no_std]
#![no_main]

extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec::Vec;

use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_event_standard::emit;
use casper_types::{
    runtime_args, CLType, CLValue, ContractHash, EntryPoint, EntryPointAccess, EntryPointType,
    EntryPoints, Parameter, RuntimeArgs, account::AccountHash,
};

mod errors;
mod events;
mod storage_mod;
mod types;

use errors::Error;
use events::{AdminTransferred, Cep78HashUpdated, CollectionCreated};
use storage_mod as storage;
use types::CollectionInfo;

/// Entry point: Create a new NFT collection
#[no_mangle]
pub extern "C" fn create_collection() {
    let name: String = runtime::get_named_arg("name");
    let symbol: String = runtime::get_named_arg("symbol");
    let description: String = runtime::get_named_arg("description");
    let uri: String = runtime::get_named_arg("uri");
    let total_supply: u64 = runtime::get_named_arg("total_supply");
    let royalty_numerator: u64 = runtime::get_named_arg("royalty_numerator");
    let royalty_denominator: u64 = runtime::get_named_arg("royalty_denominator");

    // Validate royalty
    if royalty_numerator > royalty_denominator {
        runtime::revert(Error::InvalidRoyalty);
    }

    // Validate basic parameters
    if name.is_empty() || symbol.is_empty() {
        runtime::revert(Error::InvalidParameters);
    }

    let creator = runtime::get_caller();
    let created_at = runtime::get_blocktime();

    // TODO: Call CEP-78 installer to deploy collection
    // For now, we'll use a placeholder hash
    // In production, this would call the CEP-78 contract via runtime::call_contract()
    let collection_hash = ContractHash::default(); // Placeholder

    // Store collection info
    let collection_info = CollectionInfo {
        collection_hash,
        creator,
        name: name.clone(),
        symbol: symbol.clone(),
        description,
        uri,
        total_supply,
        royalty_numerator,
        royalty_denominator,
        created_at,
    };

    storage::store_collection(&collection_hash, &collection_info);
    storage::increment_collection_count();

    // Emit event
    emit(CollectionCreated {
        collection_hash,
        creator,
        name,
        symbol,
        total_supply,
    });

    // Return collection hash
    runtime::ret(CLValue::from_t(collection_hash).unwrap_or_revert());
}

/// Entry point: Get collection info
#[no_mangle]
pub extern "C" fn get_collection() {
    let collection_hash: ContractHash = runtime::get_named_arg("collection_hash");

    let collection_info = storage::get_collection(&collection_hash)
        .unwrap_or_revert_with(Error::CollectionNotFound);

    runtime::ret(CLValue::from_t(collection_info).unwrap_or_revert());
}

/// Entry point: Get all collections by creator
#[no_mangle]
pub extern "C" fn get_collections_by_creator() {
    let creator: AccountHash = runtime::get_named_arg("creator");

    // Note: In production, this should use an off-chain indexer
    // For now, returning empty vector as placeholder
    let collections: Vec<CollectionInfo> = Vec::new();

    runtime::ret(CLValue::from_t(collections).unwrap_or_revert());
}

/// Entry point: Get total collection count
#[no_mangle]
pub extern "C" fn get_collection_count() {
    let count = storage::get_collection_count();
    runtime::ret(CLValue::from_t(count).unwrap_or_revert());
}

/// Entry point: Update CEP-78 package hash (admin only)
#[no_mangle]
pub extern "C" fn update_cep78_hash() {
    if !storage::is_admin() {
        runtime::revert(Error::Unauthorized);
    }

    let new_hash: ContractHash = runtime::get_named_arg("new_hash");
    let old_hash = storage::get_cep78_package_hash();

    storage::set_cep78_package_hash(new_hash);

    emit(Cep78HashUpdated {
        old_hash,
        new_hash,
    });
}

/// Entry point: Transfer admin rights
#[no_mangle]
pub extern "C" fn transfer_admin() {
    if !storage::is_admin() {
        runtime::revert(Error::Unauthorized);
    }

    let new_admin: AccountHash = runtime::get_named_arg("new_admin");
    let old_admin = storage::get_admin();

    storage::set_admin(new_admin);

    emit(AdminTransferred {
        old_admin,
        new_admin,
    });
}

/// Install the contract
#[no_mangle]
pub extern "C" fn call() {
    let cep78_package_hash: ContractHash = runtime::get_named_arg("cep78_package_hash");
    let admin: AccountHash = runtime::get_caller();

    // Define entry points
    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        "create_collection",
        vec![
            Parameter::new("name", CLType::String),
            Parameter::new("symbol", CLType::String),
            Parameter::new("description", CLType::String),
            Parameter::new("uri", CLType::String),
            Parameter::new("total_supply", CLType::U64),
            Parameter::new("royalty_numerator", CLType::U64),
            Parameter::new("royalty_denominator", CLType::U64),
        ],
        CLType::Key,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_collection",
        vec![Parameter::new("collection_hash", CLType::Key)],
        CLType::Any,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_collections_by_creator",
        vec![Parameter::new("creator", CLType::Key)],
        CLType::Any,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_collection_count",
        vec![],
        CLType::U64,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "update_cep78_hash",
        vec![Parameter::new("new_hash", CLType::Key)],
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
        Some("nft_launchpad_contract_package_hash".to_string()),
        Some("nft_launchpad_contract_access_uref".to_string()),
    );

    // Initialize storage
    storage::init_collections_dict();
    runtime::put_key(storage::COLLECTION_COUNT, storage::new_uref(0u64).into());
    storage::set_admin(admin);
    storage::set_cep78_package_hash(cep78_package_hash);

    // Store contract hash
    runtime::put_key("nft_launchpad_contract_hash", contract_hash.into());
}
