use candid::{Nat, Principal};
use ic_cdk::query;

use crate::errors::MarketplaceError;
use crate::state;
use crate::types::*;

#[query]
pub fn get_collection_info(collection_id: Principal) -> Result<CollectionInfo, MarketplaceError> {
    state::get_collection(&collection_id).ok_or(MarketplaceError::CollectionNotFound)
}

#[query]
pub fn get_collections_by_creator_query(creator: Principal) -> Vec<CollectionInfo> {
    state::get_collections_by_creator(&creator)
}

#[query]
pub fn get_all_collections(start: Option<u64>, limit: Option<u64>) -> PaginatedCollections {
    let start_idx = start.unwrap_or(0);
    let limit_val = limit.unwrap_or(100).min(100);

    let collections = state::get_all_collections(start_idx, limit_val);
    let total_count = state::get_total_collections();

    PaginatedCollections {
        collections,
        total_count,
        has_more: (start_idx + limit_val) < total_count,
    }
}

#[query]
pub fn get_collection_by_name_query(name: String) -> Result<CollectionInfo, MarketplaceError> {
    state::find_collection_by_name(&name).ok_or(MarketplaceError::CollectionNotFound)
}

#[query]
pub fn get_listing(listing_id: String) -> Result<ListingInfo, MarketplaceError> {
    state::get_listing(&listing_id).ok_or(MarketplaceError::ListingNotFound)
}

#[query]
pub fn get_active_listings(start: Option<u64>, limit: Option<u64>) -> PaginatedListings {
    let start_idx = start.unwrap_or(0);
    let limit_val = limit.unwrap_or(100).min(100);

    let listings = state::get_active_listings(start_idx, limit_val);
    let total_count = state::get_active_listings_count();

    PaginatedListings {
        listings,
        total_count,
        has_more: (start_idx + limit_val) < total_count,
    }
}

#[query]
pub fn get_listings_by_collection(
    collection_id: Principal,
    start: Option<u64>,
    limit: Option<u64>,
) -> PaginatedListings {
    let start_idx = start.unwrap_or(0);
    let limit_val = limit.unwrap_or(100).min(100);

    let listings = state::get_listings_by_collection(&collection_id, start_idx, limit_val);
    let total_count = state::get_listings_by_collection_count(&collection_id);

    PaginatedListings {
        listings,
        total_count,
        has_more: (start_idx + limit_val) < total_count,
    }
}

#[query]
pub fn get_listings_by_seller(
    seller: Principal,
    start: Option<u64>,
    limit: Option<u64>,
) -> PaginatedListings {
    let start_idx = start.unwrap_or(0);
    let limit_val = limit.unwrap_or(100).min(100);

    let listings = state::get_listings_by_seller(&seller, start_idx, limit_val);
    let total_count = state::get_listings_by_seller_count(&seller);

    PaginatedListings {
        listings,
        total_count,
        has_more: (start_idx + limit_val) < total_count,
    }
}

#[query]
pub fn get_sales_history(start: Option<u64>, limit: Option<u64>) -> Vec<SaleInfo> {
    let start_idx = start.unwrap_or(0);
    let limit_val = limit.unwrap_or(100).min(100);

    state::get_sales_history(start_idx, limit_val)
}

#[query]
pub fn get_marketplace_stats() -> MarketplaceStats {
    let config = state::get_config();
    let total_collections = state::get_total_collections();
    let total_volume = state::get_total_volume();

    MarketplaceStats {
        total_collections,
        total_volume,
        collection_creation_fee: config.collection_creation_fee,
        marketplace_fee_percentage: config.marketplace_fee_percentage,
        active_collections: state::get_active_collections_count(),
    }
}

#[query]
pub fn get_marketplace_config() -> MarketplaceConfig {
    state::get_config()
}

#[query]
pub fn get_admin() -> Principal {
    state::get_admin()
}
