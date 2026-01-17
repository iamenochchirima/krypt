use candid::{CandidType, Decode, Encode, Deserialize, Principal};
use ic_stable_structures::{storable::Bound, StableCell, Storable};
use serde::Serialize;
use std::borrow::Cow;
use std::cell::RefCell;

use super::memory::{get_memory, Memory, CONFIG_MEMORY_ID};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    pub super_admin: Principal,
    pub platform_name: String,
    pub initialized: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            super_admin: Principal::anonymous(),
            platform_name: String::from("CryptoDotFun"),
            initialized: false,
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

thread_local! {
    static CONFIG: RefCell<StableCell<Config, Memory>> = RefCell::new(
        StableCell::init(get_memory(CONFIG_MEMORY_ID), Config::default())
    );
}

pub fn init_config(super_admin: Principal) {
    CONFIG.with(|c| {
        let config = Config {
            super_admin,
            platform_name: String::from("CryptoDotFun"),
            initialized: true,
        };
        c.borrow_mut().set(config);
    });
}

pub fn read_config<R>(f: impl FnOnce(&Config) -> R) -> R {
    CONFIG.with(|c| f(c.borrow().get()))
}

pub fn get_super_admin() -> Principal {
    read_config(|c| c.super_admin)
}

pub fn get_config() -> Config {
    read_config(|c| c.clone())
}

pub fn is_initialized() -> bool {
    read_config(|c| c.initialized)
}

pub fn update_super_admin(new_super_admin: Principal) {
    CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.super_admin = new_super_admin;
        c.borrow_mut().set(config);
    });
}

pub fn update_platform_name(name: String) {
    CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.platform_name = name;
        c.borrow_mut().set(config);
    });
}
