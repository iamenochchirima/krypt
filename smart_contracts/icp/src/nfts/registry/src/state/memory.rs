use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::DefaultMemoryImpl;
use std::cell::RefCell;

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

pub const COLLECTIONS_V0_MEMORY_ID: MemoryId = MemoryId::new(0);
pub const COLLECTIONS_INDEX_MEMORY_ID: MemoryId = MemoryId::new(1);
pub const COLLECTIONS_INDEX_DATA_MEMORY_ID: MemoryId = MemoryId::new(2);
pub const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(3);
pub const COLLECTIONS_MEMORY_ID: MemoryId = MemoryId::new(4);

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
}

pub fn get_memory(memory_id: MemoryId) -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(memory_id))
}
