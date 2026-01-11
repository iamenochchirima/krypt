use ic_cdk::api::msg_caller;
use ic_cdk::update;
use crate::types::*;
use crate::state;
use crate::solana::candy_machine;

#[update]
pub async fn create_collection(args: CreateCollectionArgs) -> Result<String, String> {
    let caller = msg_caller();
   return state::add_collection(args, caller).await;
}

#[update]
pub async fn create_listing(args: CreateListingArgs, blockchain: Blockchain) -> Result<String, String> {
    let caller = msg_caller();
    state::add_listing(args, caller, blockchain).await
}

#[update]
pub fn update_listing(args: UpdateListingArgs, collection_id: String) -> Result<(), String> {
    state::update_listing(args, &collection_id)
}

#[update]
pub fn cancel_listing(collection_id: String, listing_id: String) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(listing) = state::get_listing(&collection_id, &listing_id) {
        if listing.seller != caller {
            return Err("Not authorized".to_string());
        }

        state::update_listing(
            UpdateListingArgs {
                listing_id: listing_id.clone(),
                price: None,
                status: Some(ListingStatus::Cancelled),
            },
            &collection_id,
        )
    } else {
        Err("Listing not found".to_string())
    }
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
pub fn update_casper_stage(args: UpdateCasperStageArgs) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_casper_stage(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub async fn sign_and_send_solana_transaction(
    collection_id: String,
    serialized_message: Vec<u8>,
    transaction_type: TransactionType,
    user_wallet_address: Option<String>,
) -> Result<String, String> {
    let caller = msg_caller();

    let collection = state::get_collection(&collection_id)
        .ok_or("Collection not found")?;

    if collection.creator != caller {
        return Err("Not authorized".to_string());
    }

    let signature = candy_machine::sign_and_send_transaction(
        collection_id.clone(),
        serialized_message,
        transaction_type.clone(),
        user_wallet_address.clone(),
    ).await?;

    match transaction_type {
        TransactionType::CreateCandyMachine => {
            // Update state to track candy machine creation
            // Note: candy_machine_address will be set after we get it from the transaction
            ic_cdk::println!("Candy Machine creation transaction sent: {}", signature);
        }
        TransactionType::TransferAuthority => {
            if let Some(new_authority) = user_wallet_address {
                state::update_solana_stage(UpdateSolanaStageArgs {
                    collection_id: collection_id.clone(),
                    stage: SolanaDeploymentStage::Deployed,
                    candy_machine_address: None,
                    candy_machine_authority: Some(new_authority),
                    collection_mint: None,
                    manifest_url: None,
                    candy_machine_config: None,
                    files_uploaded: None,
                    metadata_created: None,
                })?;
            }
        }
        TransactionType::UpdateCandyMachine => {
            ic_cdk::println!("Candy Machine update transaction sent: {}", signature);
        }
    }

    Ok(signature)
}

#[update]
pub async fn create_candy_machine_from_instruction(
    collection_id: String,
    instructions_data: Vec<InstructionData>,
) -> Result<String, String> {
    let caller = msg_caller();

    let collection = state::get_collection(&collection_id)
        .ok_or("Collection not found")?;

    if collection.creator != caller {
        return Err("Not authorized".to_string());
    }

    let signature = candy_machine::create_candy_machine_from_instruction(
        collection_id.clone(),
        instructions_data,
    ).await?;

    ic_cdk::println!("Candy Machine creation transaction sent: {}", signature);

    Ok(signature)
}

#[update]
pub fn update_candy_machine_address(
    collection_id: String,
    candy_machine_address: String,
) -> Result<(), String> {
    let caller = msg_caller();

    let collection = state::get_collection(&collection_id)
        .ok_or("Collection not found")?;

    if collection.creator != caller {
        return Err("Not authorized".to_string());
    }

    state::update_solana_stage(UpdateSolanaStageArgs {
        collection_id,
        stage: SolanaDeploymentStage::Deployed,
        candy_machine_address: Some(candy_machine_address),
        candy_machine_authority: None,
        collection_mint: None,
        manifest_url: None,
        candy_machine_config: None,
        files_uploaded: None,
        metadata_created: None,
    })
}

#[update]
pub async fn add_items_to_candy_machine(
    collection_id: String,
    instruction_data: InstructionData,
) -> Result<String, String> {
    let caller = msg_caller();

    let collection = state::get_collection(&collection_id)
        .ok_or("Collection not found")?;

    if collection.creator != caller {
        return Err("Not authorized".to_string());
    }

    candy_machine::add_items_to_candy_machine(collection_id, instruction_data).await
}

#[update]
pub fn admin_remove_collection(collection_id: String) -> Result<String, String> {
    let removed = state::remove_collection(&collection_id)?;
    Ok(removed.id)
}
