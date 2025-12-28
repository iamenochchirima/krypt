use casper_event_standard::Event;
use casper_types::{ContractHash, account::AccountHash};

/// Event emitted when a new collection is created
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct CollectionCreated {
    pub collection_hash: ContractHash,
    pub creator: AccountHash,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
}

/// Event emitted when admin is transferred
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct AdminTransferred {
    pub old_admin: AccountHash,
    pub new_admin: AccountHash,
}

/// Event emitted when CEP-78 package hash is updated
#[derive(Event, Debug, Clone, PartialEq, Eq)]
pub struct Cep78HashUpdated {
    pub old_hash: ContractHash,
    pub new_hash: ContractHash,
}
