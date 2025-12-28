use casper_event_standard::Event;
use casper_types::{ContractHash, Key, U512, account::AccountHash};

/// Event emitted when an NFT is listed
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct NftListed {
    pub listing_id: String,
    pub token_hash: Key,
    pub collection_hash: ContractHash,
    pub seller: AccountHash,
    pub price: U512,
}

/// Event emitted when an NFT is purchased
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct NftPurchased {
    pub listing_id: String,
    pub token_hash: Key,
    pub seller: AccountHash,
    pub buyer: AccountHash,
    pub price: U512,
}

/// Event emitted when a listing is cancelled
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct NftDelisted {
    pub listing_id: String,
    pub token_hash: Key,
    pub seller: AccountHash,
}

/// Event emitted when marketplace fee is updated
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct FeeUpdated {
    pub old_numerator: u64,
    pub old_denominator: u64,
    pub new_numerator: u64,
    pub new_denominator: u64,
}

/// Event emitted when fee recipient is updated
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct FeeRecipientUpdated {
    pub old_recipient: AccountHash,
    pub new_recipient: AccountHash,
}

/// Event emitted when admin is transferred
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct AdminTransferred {
    pub old_admin: AccountHash,
    pub new_admin: AccountHash,
}
