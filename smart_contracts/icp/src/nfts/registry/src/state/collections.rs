use ic_cdk::{query, update, api::msg_caller};
use ic_stable_structures::StableBTreeMap;
use canister_uuid::get_uuid;
use std::cell::RefCell;
use crate::types::{
    Blockchain, ChainData, ChainDataV0, Collection, CollectionStatus, CollectionV0, CreateCollectionArgs, SolanaCollectionData, UpdateCollectionStatusArgs, UpdateSolanaStageArgs, UpdateMovementStageArgs, UpdateCasperStageArgs
};
use super::memory::{ get_memory, COLLECTIONS_MEMORY_ID, COLLECTIONS_MEMORY_ID_OLD };
use super::config::get_admin;
use candid::Principal;

thread_local! {
    static COLLECTIONS_OLD: RefCell<
        StableBTreeMap<String, CollectionV0, super::memory::Memory>
    > = RefCell::new(StableBTreeMap::init(get_memory(COLLECTIONS_MEMORY_ID_OLD)));

    static COLLECTIONS: RefCell<
        StableBTreeMap<String, Collection, super::memory::Memory>
    > = RefCell::new(StableBTreeMap::init(get_memory(COLLECTIONS_MEMORY_ID)));
}

#[update]
pub async fn migrate_collections() {
    COLLECTIONS_OLD.with(|old_collections| {
        COLLECTIONS.with(|new_collections| {
            let old = old_collections.borrow_mut();
            let mut new = new_collections.borrow_mut();

            for entry in old.iter() {
                let old_collection = entry.value();

                let chain_data = match &old_collection.chain_data {
                    ChainDataV0::Solana(data) =>
                        ChainData::Solana(SolanaCollectionData {
                            deployment_stage: data.deployment_stage.clone(),
                            candy_machine_address: data.candy_machine_address.clone(),
                            collection_mint: data.collection_mint.clone(),
                            candy_machine_authority: data.candy_machine_authority.clone(),
                            manifest_url: data.manifest_url.clone(),
                            files_uploaded: data.files_uploaded,
                            metadata_created: data.metadata_created,
                            candy_machine_items_uploaded: false,
                            candy_machine_config: data.candy_machine_config.clone(),
                        }),
                    ChainDataV0::ICP(data) => ChainData::ICP(data.clone()),
                    ChainDataV0::Ethereum(data) => ChainData::Ethereum(data.clone()),
                    ChainDataV0::Bitcoin(data) => ChainData::Bitcoin(data.clone()),
                    ChainDataV0::Movement(data) => ChainData::Movement(data.clone()),
                    ChainDataV0::Casper(data) => ChainData::Casper(data.clone()),
                };
                let new_collection = Collection {
                    id: old_collection.id.clone(),
                    blockchain: old_collection.blockchain.clone(),
                    creator: old_collection.creator.clone(),
                    name: old_collection.name.clone(),
                    symbol: old_collection.symbol.clone(),
                    description: old_collection.description.clone(),
                    image_url: old_collection.image_url.clone(),
                    banner_url: old_collection.banner_url.clone(),
                    total_supply: old_collection.total_supply,
                    floor_price: old_collection.floor_price,
                    total_volume: old_collection.total_volume,
                    owner_count: old_collection.owner_count,
                    listed_count: old_collection.listed_count,
                    royalty_bps: old_collection.royalty_bps,
                    metadata: old_collection.metadata.clone(),
                    status: old_collection.status.clone(),
                    chain_data,
                    created_at: old_collection.created_at,
                    updated_at: old_collection.updated_at,
                };

                new.insert(new_collection.id.clone(), new_collection);
            }
        });
    });
}

#[update]
pub fn clear_old_collections() -> Result<(), String> {
    let caller = msg_caller();
    let admin = get_admin();

    if caller != admin {
        return Err("Only admin can clear old collections".to_string());
    }

    COLLECTIONS_OLD.with(|old_collections| {
        let mut collections = old_collections.borrow_mut();
        let keys: Vec<String> = collections.iter().map(|entry| entry.key().clone()).collect();
        for key in keys {
            collections.remove(&key);
        }
    });

    Ok(())
}

#[query]
pub fn get_old_collections_count() -> u64 {
    COLLECTIONS_OLD.with(|old_collections| {
        old_collections.borrow().len()
    })
}

pub async fn add_collection(
    args: CreateCollectionArgs,
    creator: Principal
) -> Result<String, String> {
    let collection_id = get_uuid().await;

    let collection = Collection {
        id: collection_id.clone(),
        blockchain: args.blockchain,
        creator,
        name: args.name,
        symbol: args.symbol,
        description: args.description,
        image_url: args.image_url,
        banner_url: args.banner_url,
        total_supply: args.total_supply,
        floor_price: 0,
        total_volume: 0,
        owner_count: 0,
        listed_count: 0,
        royalty_bps: args.royalty_bps,
        metadata: args.metadata,
        status: CollectionStatus::Draft,
        chain_data: args.chain_data,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };

    COLLECTIONS.with(|c| {
        c.borrow_mut().insert(collection_id.clone(), collection);
    });

    Ok(collection_id)
}

pub fn get_collection(collection_id: &str) -> Option<Collection> {
    COLLECTIONS.with(|c| c.borrow().get(&collection_id.to_string()))
}

pub fn get_all_collections(page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_collections_by_blockchain(
    blockchain: &Blockchain,
    page: u32,
    limit: u32
) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| &entry.value().blockchain == blockchain)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn update_collection_stats(
    collection_id: &str,
    floor_price: Option<u64>,
    total_volume: Option<u64>,
    owner_count: Option<u32>,
    listed_count: Option<u32>
) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&collection_id.to_string()) {
            if let Some(fp) = floor_price {
                collection.floor_price = fp;
            }
            if let Some(tv) = total_volume {
                collection.total_volume = tv;
            }
            if let Some(oc) = owner_count {
                collection.owner_count = oc;
            }
            if let Some(lc) = listed_count {
                collection.listed_count = lc;
            }
            collection.updated_at = ic_cdk::api::time();

            collections.insert(collection_id.to_string(), collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_collection_status(args: UpdateCollectionStatusArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.status = args.status;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_solana_stage(args: UpdateSolanaStageArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&args.collection_id) {
            if let ChainData::Solana(ref mut data) = collection.chain_data {
                data.deployment_stage = args.stage;
                if let Some(addr) = args.candy_machine_address {
                    data.candy_machine_address = Some(addr);
                }
                if let Some(mint) = args.collection_mint {
                    data.collection_mint = Some(mint);
                }
                if let Some(url) = args.manifest_url {
                    data.manifest_url = Some(url);
                }
                if let Some(uploaded) = args.files_uploaded {
                    data.files_uploaded = uploaded;
                }
                if let Some(created) = args.metadata_created {
                    data.metadata_created = created;
                }
                if let Some(authority) = args.candy_machine_authority {
                    data.candy_machine_authority = Some(authority);
                }
                if let Some(config) = args.candy_machine_config {
                    data.candy_machine_config = Some(config);
                }
                collection.updated_at = ic_cdk::api::time();
                collections.insert(args.collection_id, collection);
                Ok(())
            } else {
                Err("Collection is not a Solana collection".to_string())
            }
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_movement_stage(args: UpdateMovementStageArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&args.collection_id) {
            if let ChainData::Movement(ref mut data) = collection.chain_data {
                data.deployment_stage = args.stage;
                if let Some(addr) = args.collection_address {
                    data.collection_address = Some(addr);
                }
                if let Some(url) = args.manifest_url {
                    data.manifest_url = Some(url);
                }
                if let Some(created) = args.collection_created {
                    data.collection_created = created;
                }
                collection.updated_at = ic_cdk::api::time();
                collections.insert(args.collection_id, collection);
                Ok(())
            } else {
                Err("Collection is not a Movement collection".to_string())
            }
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_casper_stage(args: UpdateCasperStageArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&args.collection_id) {
            if let ChainData::Casper(ref mut data) = collection.chain_data {
                data.deployment_stage = args.stage;
                if let Some(hash) = args.contract_hash {
                    data.contract_hash = Some(hash);
                }
                if let Some(pkg_hash) = args.contract_package_hash {
                    data.contract_package_hash = Some(pkg_hash);
                }
                // Required CEP-78 parameters
                if let Some(supply) = args.total_token_supply {
                    data.total_token_supply = supply;
                }
                if let Some(mode) = args.ownership_mode {
                    data.ownership_mode = mode;
                }
                if let Some(kind) = args.nft_metadata_kind {
                    data.nft_metadata_kind = kind;
                }
                if let Some(schema) = args.json_schema {
                    data.json_schema = schema;
                }
                if let Some(id_mode) = args.identifier_mode {
                    data.identifier_mode = id_mode;
                }
                if let Some(mutability) = args.metadata_mutability {
                    data.metadata_mutability = mutability;
                }
                // Optional configuration
                if let Some(mint_mode) = args.minting_mode {
                    data.minting_mode = Some(mint_mode);
                }
                if let Some(allow) = args.allow_minting {
                    data.allow_minting = Some(allow);
                }
                if let Some(kind) = args.nft_kind {
                    data.nft_kind = Some(kind);
                }
                if let Some(wl_mode) = args.whitelist_mode {
                    data.whitelist_mode = Some(wl_mode);
                }
                if let Some(h_mode) = args.holder_mode {
                    data.holder_mode = Some(h_mode);
                }
                if let Some(b_mode) = args.burn_mode {
                    data.burn_mode = Some(b_mode);
                }
                if let Some(lookup) = args.owner_reverse_lookup_mode {
                    data.owner_reverse_lookup_mode = Some(lookup);
                }
                if let Some(events) = args.events_mode {
                    data.events_mode = Some(events);
                }
                collection.updated_at = ic_cdk::api::time();
                collections.insert(args.collection_id, collection);
                Ok(())
            } else {
                Err("Collection is not a Casper collection".to_string())
            }
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn get_user_collections(creator: &Principal, page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| &entry.value().creator == creator)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_draft_collections(creator: &Principal) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| {
                let col = entry.value();
                &col.creator == creator && col.status == CollectionStatus::Draft
            })
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_all_draft_collections(page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| entry.value().status == CollectionStatus::Draft)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn remove_collection(collection_id: &str) -> Result<Collection, String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        collections
            .remove(&collection_id.to_string())
            .ok_or_else(|| "Collection not found".to_string())
    })
}
