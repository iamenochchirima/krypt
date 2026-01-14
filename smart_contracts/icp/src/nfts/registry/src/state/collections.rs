use ic_stable_structures::StableBTreeMap;
use canister_uuid::get_uuid;
use std::cell::RefCell;
use crate::types::{
    Blockchain, ChainData, Collection, CollectionStatus, CreateCollectionArgs, UpdateCollectionStatusArgs, UpdateSolanaStageArgs, UpdateMovementStageArgs
};
use super::memory::{ get_memory, COLLECTIONS_MEMORY_ID };
use candid::Principal;

thread_local! {
    static COLLECTIONS: RefCell<
        StableBTreeMap<String, Collection, super::memory::Memory>
    > = RefCell::new(StableBTreeMap::init(get_memory(COLLECTIONS_MEMORY_ID)));
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
