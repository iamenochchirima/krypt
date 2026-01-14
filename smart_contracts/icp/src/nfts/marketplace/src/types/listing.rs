use candid::{CandidType, Decode, Encode, Nat, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ListingInfo {
    pub listing_id: String,
    pub token_id: Nat,
    pub collection_id: Principal,
    pub seller: Principal,
    pub price: Nat,
    pub created_at: u64,
    pub expires_at: Option<u64>,
    pub status: ListingStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ListNFTArgs {
    pub collection_id: Principal,
    pub token_id: Nat,
    pub price: Nat,
    pub duration: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BuyNFTArgs {
    pub listing_id: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginatedListings {
    pub listings: Vec<ListingInfo>,
    pub total_count: u64,
    pub has_more: bool,
}

impl Storable for ListingInfo {
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
