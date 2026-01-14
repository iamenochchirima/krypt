use ic_cdk::api::msg_caller;
use ic_cdk::update;
use crate::types::*;
use crate::state;

#[update]
pub async fn create_collection(args: CreateCollectionArgs) -> Result<String, String> {
    let caller = msg_caller();
    state::add_collection(args, caller).await
}

#[update]
pub fn update_collection_status(args: UpdateCollectionStatusArgs) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_collection_status(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_solana_stage(args: UpdateSolanaStageArgs) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_solana_stage(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_movement_stage(args: UpdateMovementStageArgs) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_movement_stage(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn admin_remove_collection(collection_id: String) -> Result<String, String> {
    let removed = state::remove_collection(&collection_id)?;
    Ok(removed.id)
}
