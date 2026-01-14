use candid::{Decode, Encode, Nat, Principal};
use ic_stable_structures::{StableCell, Storable, storable::Bound};
use std::borrow::Cow;
use std::cell::RefCell;

use crate::types::MarketplaceConfig;
use super::memory::{get_memory, CONFIG_MEMORY_ID, Memory};

impl Storable for MarketplaceConfig {
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

thread_local! {
    static CONFIG: RefCell<StableCell<MarketplaceConfig, Memory>> = RefCell::new(
        StableCell::init(get_memory(CONFIG_MEMORY_ID), MarketplaceConfig::default())
    );
}

pub fn init_config(admin: Principal, fee: Nat, fee_percentage: u16) {
    CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.admin = admin;
        config.collection_creation_fee = fee;
        config.marketplace_fee_percentage = fee_percentage;
        c.borrow_mut().set(config);
    });
}

pub fn get_config() -> MarketplaceConfig {
    CONFIG.with(|c| c.borrow().get().clone())
}

pub fn get_admin() -> Principal {
    CONFIG.with(|c| c.borrow().get().admin)
}

pub fn update_config(config: MarketplaceConfig) {
    CONFIG.with(|c| {
        c.borrow_mut().set(config);
    });
}

pub fn update_collection_creation_fee(fee: Nat) {
    CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.collection_creation_fee = fee;
        c.borrow_mut().set(config);
    });
}

pub fn update_marketplace_fee_percentage(percentage: u16) {
    CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.marketplace_fee_percentage = percentage;
        c.borrow_mut().set(config);
    });
}

pub fn transfer_admin(new_admin: Principal) {
    CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.admin = new_admin;
        c.borrow_mut().set(config);
    });
}
