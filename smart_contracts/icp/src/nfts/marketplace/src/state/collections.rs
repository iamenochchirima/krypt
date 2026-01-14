use candid::{Decode, Encode, Nat, Principal};
use ic_stable_structures::StableBTreeMap;
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use std::borrow::Cow;
use std::cell::RefCell;

use crate::types::{CollectionInfo, CollectionStatus};
use super::memory::{get_memory, COLLECTIONS_MEMORY_ID, USER_COLLECTIONS_MEMORY_ID, Memory};

#[derive(Clone, Debug)]
pub struct UserCollections(pub Vec<Principal>);

impl Storable for UserCollections {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(&self.0).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        UserCollections(Decode!(bytes.as_ref(), Vec<Principal>).unwrap())
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self.0).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    static COLLECTIONS: RefCell<StableBTreeMap<Principal, CollectionInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(COLLECTIONS_MEMORY_ID))
    );

    static USER_COLLECTIONS: RefCell<StableBTreeMap<Principal, UserCollections, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(USER_COLLECTIONS_MEMORY_ID))
    );
}

pub fn add_collection(collection: CollectionInfo) {
    let creator = collection.creator;
    let collection_id = collection.id;

    COLLECTIONS.with(|c| {
        c.borrow_mut().insert(collection_id, collection);
    });

    USER_COLLECTIONS.with(|uc| {
        let mut user_cols = uc.borrow_mut();
        let mut cols = user_cols.get(&creator).map(|c| c.0).unwrap_or_default();
        cols.push(collection_id);
        user_cols.insert(creator, UserCollections(cols));
    });
}

pub fn get_collection(collection_id: &Principal) -> Option<CollectionInfo> {
    COLLECTIONS.with(|c| c.borrow().get(collection_id))
}

pub fn collection_exists(collection_id: &Principal) -> bool {
    COLLECTIONS.with(|c| c.borrow().contains_key(collection_id))
}

pub fn collection_name_exists(name: &str) -> bool {
    COLLECTIONS.with(|c| {
        c.borrow().iter().any(|entry| entry.value().name == name)
    })
}

pub fn find_collection_by_name(name: &str) -> Option<CollectionInfo> {
    COLLECTIONS.with(|c| {
        c.borrow().iter().find(|entry| entry.value().name == name).map(|entry| entry.value())
    })
}

pub fn get_all_collections(start: u64, limit: u64) -> Vec<CollectionInfo> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .skip(start as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_total_collections() -> u64 {
    COLLECTIONS.with(|c| c.borrow().len())
}

pub fn get_active_collections_count() -> u64 {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| entry.value().status == CollectionStatus::Active)
            .count() as u64
    })
}

pub fn get_collections_by_creator(creator: &Principal) -> Vec<CollectionInfo> {
    USER_COLLECTIONS.with(|uc| {
        let user_cols = uc.borrow();
        let collection_ids = user_cols.get(creator).map(|c| c.0).unwrap_or_default();

        COLLECTIONS.with(|c| {
            let cols = c.borrow();
            collection_ids.iter()
                .filter_map(|id| cols.get(id))
                .collect()
        })
    })
}

pub fn update_collection(collection_id: Principal, collection: CollectionInfo) {
    COLLECTIONS.with(|c| {
        c.borrow_mut().insert(collection_id, collection);
    });
}

pub fn update_collection_status(collection_id: &Principal, status: CollectionStatus) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(collection_id) {
            collection.status = status;
            collections.insert(*collection_id, collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn update_collection_volume(collection_id: &Principal, price: Nat, new_floor: Option<Nat>) {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();
        if let Some(mut collection) = collections.get(collection_id) {
            collection.total_volume = collection.total_volume + price;
            if let Some(floor) = new_floor {
                collection.floor_price = Some(floor);
            }
            collections.insert(*collection_id, collection);
        }
    });
}

pub fn get_total_volume() -> Nat {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .fold(Nat::from(0u64), |acc, entry| acc + entry.value().total_volume.clone())
    })
}
