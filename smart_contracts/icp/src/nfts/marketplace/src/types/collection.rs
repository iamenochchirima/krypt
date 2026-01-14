use candid::{CandidType, Decode, Encode, Nat, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionArgs {
    pub collection_name: String,
    pub collection_symbol: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub supply_cap: Option<Nat>,
    pub collection_metadata: Vec<(String, String)>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionResponse {
    pub collection_canister_id: Principal,
    pub transaction_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionInfo {
    pub id: Principal,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub supply_cap: Option<Nat>,
    pub created_at: u64,
    pub status: CollectionStatus,
    pub total_supply: Nat,
    pub floor_price: Option<Nat>,
    pub total_volume: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionStatus {
    AssetsPending,
    Active,
    Paused,
    Banned,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginatedCollections {
    pub collections: Vec<CollectionInfo>,
    pub total_count: u64,
    pub has_more: bool,
}

impl Storable for CollectionInfo {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        Encode!(&self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}
