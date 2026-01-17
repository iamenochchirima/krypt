use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::DefaultMemoryImpl;
use std::cell::RefCell;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

pub const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(0);
pub const USERS_MEMORY_ID: MemoryId = MemoryId::new(1);
pub const USERS_INDEX_MEMORY_ID: MemoryId = MemoryId::new(2);
pub const USERS_INDEX_DATA_MEMORY_ID: MemoryId = MemoryId::new(3);
pub const ADMINS_MEMORY_ID: MemoryId = MemoryId::new(4);
pub const BANNED_USERS_MEMORY_ID: MemoryId = MemoryId::new(5);

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

pub fn get_memory(memory_id: MemoryId) -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(memory_id))
}
