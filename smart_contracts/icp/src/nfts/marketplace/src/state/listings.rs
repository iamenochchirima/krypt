use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;

use crate::types::{ListingInfo, ListingStatus};
use super::memory::{get_memory, LISTINGS_MEMORY_ID, Memory};

thread_local! {
    static LISTINGS: RefCell<StableBTreeMap<String, ListingInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(LISTINGS_MEMORY_ID))
    );
}

pub fn add_listing(listing: ListingInfo) {
    let key = listing.listing_id.clone();
    LISTINGS.with(|l| {
        l.borrow_mut().insert(key, listing);
    });
}

pub fn get_listing(listing_id: &str) -> Option<ListingInfo> {
    LISTINGS.with(|l| l.borrow().get(&listing_id.to_string()))
}

pub fn update_listing_status(listing_id: &str, status: ListingStatus) -> Result<(), String> {
    let key = listing_id.to_string();
    LISTINGS.with(|l| {
        let mut listings = l.borrow_mut();
        if let Some(mut listing) = listings.get(&key) {
            listing.status = status;
            listings.insert(key, listing);
            Ok(())
        } else {
            Err("Listing not found".to_string())
        }
    })
}

pub fn get_active_listings(start: u64, limit: u64) -> Vec<ListingInfo> {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|entry| entry.value().status == ListingStatus::Active)
            .skip(start as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_active_listings_count() -> u64 {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|entry| entry.value().status == ListingStatus::Active)
            .count() as u64
    })
}

pub fn get_listings_by_collection(collection_id: &Principal, start: u64, limit: u64) -> Vec<ListingInfo> {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|entry| {
                let listing = entry.value();
                listing.collection_id == *collection_id && listing.status == ListingStatus::Active
            })
            .skip(start as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_listings_by_collection_count(collection_id: &Principal) -> u64 {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|entry| {
                let listing = entry.value();
                listing.collection_id == *collection_id && listing.status == ListingStatus::Active
            })
            .count() as u64
    })
}

pub fn get_listings_by_seller(seller: &Principal, start: u64, limit: u64) -> Vec<ListingInfo> {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|entry| entry.value().seller == *seller)
            .skip(start as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_listings_by_seller_count(seller: &Principal) -> u64 {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|entry| entry.value().seller == *seller)
            .count() as u64
    })
}

pub fn get_total_listings() -> u64 {
    LISTINGS.with(|l| l.borrow().len())
}
