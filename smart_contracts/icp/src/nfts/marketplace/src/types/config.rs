use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InitArgs {
    pub collection_creation_fee: Nat,
    pub marketplace_fee_percentage: u16,
    pub admin: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketplaceConfig {
    pub collection_creation_fee: Nat,
    pub marketplace_fee_percentage: u16,
    pub max_listing_duration: u64,
    pub min_listing_price: Nat,
    pub supported_tokens: Vec<Principal>,
    pub admin: Principal,
}

impl Default for MarketplaceConfig {
    fn default() -> Self {
        Self {
            collection_creation_fee: Nat::from(100_000_000u64),
            marketplace_fee_percentage: 250,
            max_listing_duration: 30 * 24 * 60 * 60 * 1_000_000_000u64,
            min_listing_price: Nat::from(100_000u64),
            supported_tokens: vec![],
            admin: Principal::anonymous(),
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketplaceStats {
    pub total_collections: u64,
    pub total_volume: Nat,
    pub collection_creation_fee: Nat,
    pub marketplace_fee_percentage: u16,
    pub active_collections: u64,
}
