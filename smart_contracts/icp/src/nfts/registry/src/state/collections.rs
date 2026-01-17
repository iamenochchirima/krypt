use ic_stable_structures::{StableBTreeMap, StableLog};
use canister_uuid::get_uuid;
use std::cell::RefCell;
use crate::types::{
    Blockchain, ChainData, Collection, CollectionV0, CollectionStatus, CollectionStatusV0,
    CreateCollectionArgs, UpdateCollectionStatusArgs, UpdateSolanaStageArgs,
    UpdateMovementStageArgs, UpdateEthereumStageArgs, UpdateInitialSaleArgs, SetSaleEndedArgs,
    UpdateSocialsArgs, UpdateCategoryArgs, UpdateTagsArgs, SetVerifiedArgs, SetFeaturedArgs,
    UpdateSlugArgs, CollectionCategory,
};
use super::memory::{
    get_memory, Memory, MEMORY_MANAGER, COLLECTIONS_V0_MEMORY_ID, COLLECTIONS_MEMORY_ID,
    COLLECTIONS_INDEX_MEMORY_ID, COLLECTIONS_INDEX_DATA_MEMORY_ID
};
use candid::Principal;

fn generate_slug(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<&str>>()
        .join("-")
}

fn is_slug_taken(slug: &str) -> bool {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .any(|entry| entry.value().slug == slug)
    })
}

fn generate_unique_slug(name: &str) -> String {
    let base_slug = generate_slug(name);
    if !is_slug_taken(&base_slug) {
        return base_slug;
    }

    let mut counter = 1;
    loop {
        let slug = format!("{}-{}", base_slug, counter);
        if !is_slug_taken(&slug) {
            return slug;
        }
        counter += 1;
    }
}

thread_local! {
    // V0 collections map - uses the old memory ID (0) to read existing data
    static COLLECTIONS_V0: RefCell<StableBTreeMap<String, CollectionV0, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(COLLECTIONS_V0_MEMORY_ID))
    );

    // New collections map - uses new memory ID (4) for migrated data
    static COLLECTIONS: RefCell<StableBTreeMap<String, Collection, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(COLLECTIONS_MEMORY_ID))
    );

    static COLLECTIONS_INDEX: RefCell<StableLog<Vec<u8>, Memory, Memory>> = RefCell::new(
        StableLog::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(COLLECTIONS_INDEX_MEMORY_ID)),
            MEMORY_MANAGER.with(|m| m.borrow().get(COLLECTIONS_INDEX_DATA_MEMORY_ID))
        )
    );
}

pub async fn add_collection(
    args: CreateCollectionArgs,
    creator: Principal
) -> Result<String, String> {
    let collection_id = get_uuid().await;
    let slug = generate_unique_slug(&args.name);

    let collection = Collection {
        id: collection_id.clone(),
        slug,
        blockchain: args.blockchain,
        creator,
        name: args.name,
        symbol: args.symbol,
        description: args.description,
        image_url: args.image_url,
        banner_url: args.banner_url,
        total_supply: args.total_supply,
        royalty_bps: args.royalty_bps,
        mint_price: args.mint_price,
        metadata: args.metadata,
        status: CollectionStatus::Draft,
        chain_data: args.chain_data,
        initial_sale: None,
        socials: args.socials,
        category: args.category,
        tags: args.tags.unwrap_or_default(),
        is_verified: false,
        is_featured: false,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };

    COLLECTIONS.with(|c| {
        c.borrow_mut().insert(collection_id.clone(), collection);
    });

    COLLECTIONS_INDEX.with(|log| {
        log.borrow_mut().append(&collection_id.as_bytes().to_vec())
            .expect("failed to append to collections index");
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

pub fn update_ethereum_stage(args: UpdateEthereumStageArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&args.collection_id) {
            if let ChainData::Ethereum(ref mut data) = collection.chain_data {
                data.deployment_stage = args.stage;
                if let Some(addr) = args.contract_address {
                    data.contract_address = Some(addr);
                }
                if let Some(owner) = args.owner_address {
                    data.owner_address = Some(owner);
                }
                if let Some(url) = args.manifest_url {
                    data.manifest_url = Some(url);
                }
                if let Some(uploaded) = args.files_uploaded {
                    data.files_uploaded = uploaded;
                }
                collection.updated_at = ic_cdk::api::time();
                collections.insert(args.collection_id, collection);
                Ok(())
            } else {
                Err("Collection is not an Ethereum collection".to_string())
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

pub fn update_initial_sale(args: UpdateInitialSaleArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.initial_sale = args.initial_sale;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn set_sale_ended(args: SetSaleEndedArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            if let Some(ref mut sale) = collection.initial_sale {
                sale.ended = args.ended;
                collection.updated_at = ic_cdk::api::time();
                collections.insert(args.collection_id, collection);
                Ok(())
            } else {
                Err("Collection has no initial sale".to_string())
            }
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn get_upcoming_sales(page: u32, limit: u32) -> Vec<Collection> {
    let now = ic_cdk::api::time();
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| {
                if let Some(ref sale) = entry.value().initial_sale {
                    !sale.ended && sale.start_time > now
                } else {
                    false
                }
            })
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_live_sales(page: u32, limit: u32) -> Vec<Collection> {
    let now = ic_cdk::api::time();
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| {
                if let Some(ref sale) = entry.value().initial_sale {
                    if sale.ended {
                        return false;
                    }
                    let started = now >= sale.start_time;
                    let not_ended = sale.end_time.map(|end| now < end).unwrap_or(true);
                    started && not_ended
                } else {
                    false
                }
            })
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_ended_sales(page: u32, limit: u32) -> Vec<Collection> {
    let now = ic_cdk::api::time();
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| {
                if let Some(ref sale) = entry.value().initial_sale {
                    sale.ended || sale.end_time.map(|end| now >= end).unwrap_or(false)
                } else {
                    false
                }
            })
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn update_socials(args: UpdateSocialsArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.socials = args.socials;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_category(args: UpdateCategoryArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.category = args.category;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_tags(args: UpdateTagsArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.tags = args.tags;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn set_verified(args: SetVerifiedArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.is_verified = args.is_verified;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn set_featured(args: SetFeaturedArgs) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(&args.collection_id) {
            collection.is_featured = args.is_featured;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn get_featured_collections(page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| entry.value().is_featured)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_verified_collections(page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| entry.value().is_verified)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_collections_by_category(category: &CollectionCategory, page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| entry.value().category.as_ref() == Some(category))
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_collection_by_slug(slug: &str) -> Option<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .find(|entry| entry.value().slug == slug)
            .map(|entry| entry.value())
    })
}

pub fn update_slug(args: UpdateSlugArgs) -> Result<(), String> {
    let new_slug = generate_slug(&args.slug);

    if new_slug.is_empty() {
        return Err("Invalid slug".to_string());
    }

    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(&args.collection_id) {
            if collection.slug != new_slug && is_slug_taken(&new_slug) {
                return Err("Slug already taken".to_string());
            }

            collection.slug = new_slug;
            collection.updated_at = ic_cdk::api::time();
            collections.insert(args.collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn get_total_collections() -> u64 {
    COLLECTIONS_INDEX.with(|log| log.borrow().len())
}

fn get_collection_by_index(index: u64) -> Option<Collection> {
    let collection_id = COLLECTIONS_INDEX.with(|log| {
        log.borrow().get(index).map(|bytes| {
            String::from_utf8(bytes).expect("invalid collection id in log")
        })
    })?;

    COLLECTIONS.with(|c| c.borrow().get(&collection_id))
}

pub fn get_collections_paginated(start: u64, length: u64) -> (Vec<Collection>, u64) {
    let total = get_total_collections();

    if total == 0 || start >= total {
        return (vec![], total);
    }

    let end = (start + length).min(total);
    let mut collections = Vec::with_capacity((end - start) as usize);

    for index in start..end {
        if let Some(collection) = get_collection_by_index(index) {
            collections.push(collection);
        }
    }

    (collections, total)
}

pub fn get_latest_collections(length: u64) -> (Vec<Collection>, u64) {
    let total = get_total_collections();

    if total == 0 {
        return (vec![], 0);
    }

    let length = length.min(total);
    let start = total.saturating_sub(length);

    let mut collections = Vec::with_capacity(length as usize);
    for index in start..total {
        if let Some(collection) = get_collection_by_index(index) {
            collections.push(collection);
        }
    }

    collections.reverse();
    (collections, total)
}

// Migration function to convert V0 collections to new format
fn convert_status_v0_to_new(status: CollectionStatusV0) -> CollectionStatus {
    match status {
        CollectionStatusV0::Draft => CollectionStatus::Draft,
        CollectionStatusV0::Active => CollectionStatus::Active,
        CollectionStatusV0::Paused => CollectionStatus::Draft,
        CollectionStatusV0::Minting => CollectionStatus::Active,
        CollectionStatusV0::Completed => CollectionStatus::Active,
    }
}

fn convert_collection_v0_to_new(v0: CollectionV0) -> Collection {
    Collection {
        id: v0.id,
        slug: v0.slug,
        blockchain: v0.blockchain,
        creator: v0.creator,
        name: v0.name,
        symbol: v0.symbol,
        description: v0.description,
        image_url: v0.image_url,
        banner_url: v0.banner_url,
        total_supply: v0.total_supply,
        royalty_bps: v0.royalty_bps,
        mint_price: v0.mint_price,
        metadata: v0.metadata,
        status: convert_status_v0_to_new(v0.status),
        chain_data: v0.chain_data,
        initial_sale: v0.initial_sale,
        socials: v0.socials,
        category: v0.category,
        tags: v0.tags,
        is_verified: v0.is_verified,
        is_featured: v0.is_featured,
        created_at: v0.created_at,
        updated_at: v0.updated_at,
    }
}

pub fn migrate_collections_v0_to_v1() -> Result<u64, String> {
    let mut migrated_count = 0u64;

    // Get all V0 collections
    let v0_collections: Vec<(String, CollectionV0)> = COLLECTIONS_V0.with(|c| {
        c.borrow()
            .iter()
            .map(|entry| (entry.key().clone(), entry.value()))
            .collect()
    });

    // Convert and insert into new COLLECTIONS map
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        for (id, v0_collection) in v0_collections {
            let new_collection = convert_collection_v0_to_new(v0_collection);
            collections.insert(id, new_collection);
            migrated_count += 1;
        }
    });

    Ok(migrated_count)
}
