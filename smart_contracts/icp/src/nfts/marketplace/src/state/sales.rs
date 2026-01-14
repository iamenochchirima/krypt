use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;

use crate::types::SaleInfo;
use super::memory::{get_memory, SALES_MEMORY_ID, Memory};

thread_local! {
    static SALES: RefCell<StableBTreeMap<String, SaleInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(get_memory(SALES_MEMORY_ID))
    );
}

pub fn add_sale(sale: SaleInfo) {
    let key = sale.listing_id.clone();
    SALES.with(|s| {
        s.borrow_mut().insert(key, sale);
    });
}

pub fn get_sale(listing_id: &str) -> Option<SaleInfo> {
    SALES.with(|s| s.borrow().get(&listing_id.to_string()))
}

pub fn get_sales_history(start: u64, limit: u64) -> Vec<SaleInfo> {
    SALES.with(|s| {
        s.borrow()
            .iter()
            .skip(start as usize)
            .take(limit as usize)
            .map(|entry| entry.value())
            .collect()
    })
}

pub fn get_total_sales() -> u64 {
    SALES.with(|s| s.borrow().len())
}
