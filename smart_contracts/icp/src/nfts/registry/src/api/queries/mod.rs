use ic_cdk::api::msg_caller;
use ic_cdk::query;
use ic_cdk::println;
use candid::Principal;
use crate::types::*;
use crate::state;

#[query]
pub fn get_collection(collection_id: String) -> Option<Collection> {
    state::get_collection(&collection_id)
}

#[query]
pub fn get_all_collections(page: u32, limit: u32) -> Vec<Collection> {
    state::get_all_collections(page, limit)
}

#[query]
pub fn get_collections_by_blockchain(blockchain: Blockchain, page: u32, limit: u32) -> Vec<Collection> {
    state::get_collections_by_blockchain(&blockchain, page, limit)
}

#[query]
pub fn get_creator_draft_collections(creator: Principal) -> Vec<Collection> {
    state::get_draft_collections(&creator)
}

#[query]
pub fn get_all_draft_collections(page: u32, limit: u32) -> Vec<Collection> {
    state::get_all_draft_collections(page, limit)
}

#[query]
pub fn get_user_collections(page: u32, limit: u32) -> Vec<Collection> {
    let caller = msg_caller();
    println!("User principal: {}", caller.to_text());
    state::get_user_collections(&caller, page, limit)
}

#[query]
pub fn get_my_draft_collections() -> Vec<Collection> {
    let caller = msg_caller();
    state::get_draft_collections(&caller)
}

#[query]
pub fn get_upcoming_sales(page: u32, limit: u32) -> Vec<Collection> {
    state::get_upcoming_sales(page, limit)
}

#[query]
pub fn get_live_sales(page: u32, limit: u32) -> Vec<Collection> {
    state::get_live_sales(page, limit)
}

#[query]
pub fn get_ended_sales(page: u32, limit: u32) -> Vec<Collection> {
    state::get_ended_sales(page, limit)
}

#[query]
pub fn get_featured_collections(page: u32, limit: u32) -> Vec<Collection> {
    state::get_featured_collections(page, limit)
}

#[query]
pub fn get_verified_collections(page: u32, limit: u32) -> Vec<Collection> {
    state::get_verified_collections(page, limit)
}

#[query]
pub fn get_collections_by_category(category: CollectionCategory, page: u32, limit: u32) -> Vec<Collection> {
    state::get_collections_by_category(&category, page, limit)
}

#[query]
pub fn get_collection_by_slug(slug: String) -> Option<Collection> {
    state::get_collection_by_slug(&slug)
}

#[query]
pub fn get_total_collections() -> u64 {
    state::get_total_collections()
}

#[query]
pub fn get_collections_paginated(start: u64, length: u64) -> CollectionsResult {
    let (collections, total) = state::get_collections_paginated(start, length);
    CollectionsResult { collections, total }
}

#[query]
pub fn get_latest_collections(length: u64) -> CollectionsResult {
    let (collections, total) = state::get_latest_collections(length);
    CollectionsResult { collections, total }
}
