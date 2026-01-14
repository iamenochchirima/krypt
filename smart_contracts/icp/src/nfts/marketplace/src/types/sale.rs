use candid::{CandidType, Decode, Encode, Nat, Principal};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SaleInfo {
    pub listing_id: String,
    pub token_id: Nat,
    pub collection_id: Principal,
    pub seller: Principal,
    pub buyer: Principal,
    pub price: Nat,
    pub marketplace_fee: Nat,
    pub sale_time: u64,
    pub transaction_hash: String,
}

impl Storable for SaleInfo {
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
