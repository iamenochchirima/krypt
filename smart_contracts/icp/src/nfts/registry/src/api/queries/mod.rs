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
