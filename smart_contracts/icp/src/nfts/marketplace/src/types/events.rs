use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketplaceEvent {
    CollectionCreated {
        collection_id: Principal,
        creator: Principal,
        name: String,
        timestamp: u64,
    },
    CollectionActivated {
        collection_id: Principal,
        creator: Principal,
        timestamp: u64,
    },
    ItemListed {
        listing_id: String,
        collection_id: Principal,
        token_id: Nat,
        seller: Principal,
        price: Nat,
        timestamp: u64,
    },
    ItemSold {
        listing_id: String,
        collection_id: Principal,
        token_id: Nat,
        seller: Principal,
        buyer: Principal,
        price: Nat,
        timestamp: u64,
    },
    ListingCancelled {
        listing_id: String,
        collection_id: Principal,
        token_id: Nat,
        seller: Principal,
        timestamp: u64,
    },
}
