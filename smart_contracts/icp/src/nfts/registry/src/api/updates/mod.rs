use ic_cdk::api::msg_caller;
use ic_cdk::update;
use crate::types::*;
use crate::state;
use crate::guards::{require_not_anonymous, require_admin};

#[update]
pub async fn create_collection(args: CreateCollectionArgs) -> Result<String, String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;
    state::add_collection(args, caller).await
}

#[update]
pub fn update_collection_status(args: UpdateCollectionStatusArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

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
    require_not_anonymous(&caller)?;

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
    require_not_anonymous(&caller)?;

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
pub fn update_ethereum_stage(args: UpdateEthereumStageArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_ethereum_stage(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn admin_remove_collection(collection_id: String) -> Result<String, String> {
    let caller = msg_caller();
    require_admin(&caller)?;

    let removed = state::remove_collection(&collection_id)?;
    Ok(removed.id)
}

#[update]
pub fn update_initial_sale(args: UpdateInitialSaleArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_initial_sale(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn set_sale_ended(args: SetSaleEndedArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::set_sale_ended(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_socials(args: UpdateSocialsArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_socials(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_category(args: UpdateCategoryArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_category(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_tags(args: UpdateTagsArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_tags(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn admin_set_verified(args: SetVerifiedArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_admin(&caller)?;

    state::set_verified(args)
}

#[update]
pub fn admin_set_featured(args: SetFeaturedArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_admin(&caller)?;

    state::set_featured(args)
}

#[update]
pub fn update_slug(args: UpdateSlugArgs) -> Result<(), String> {
    let caller = msg_caller();
    require_not_anonymous(&caller)?;

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_slug(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn admin_migrate_collections() -> Result<u64, String> {
    let caller = msg_caller();
    require_admin(&caller)?;

    state::migrate_collections_v0_to_v1()
}
