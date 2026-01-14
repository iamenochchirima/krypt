use ic_stable_structures::{StableCell, Storable, storable::Bound};
use std::cell::RefCell;
use std::borrow::Cow;
use candid::{CandidType, Decode, Encode, Principal};
use serde::{Deserialize, Serialize};
use super::memory::{get_memory, CONFIG_MEMORY_ID};

thread_local! {
    static CONFIG: RefCell<StableCell<Config, super::memory::Memory>> = RefCell::new(
        StableCell::init(get_memory(CONFIG_MEMORY_ID), Config::default())
    );
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub admin: Principal,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            admin: Principal::anonymous(),
        }
    }
}

impl Storable for Config {
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

pub fn init_config(admin: Principal) {
    CONFIG.with(|c| {
        c.borrow_mut().set(Config { admin });
    });
}

pub fn read_config<R>(f: impl FnOnce(&Config) -> R) -> R {
    CONFIG.with(|c| f(c.borrow().get()))
}

pub fn get_admin() -> Principal {
    read_config(|c| c.admin)
}
