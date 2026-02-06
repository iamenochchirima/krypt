use candid::{Nat, Principal};
use ic_cdk::update;
use num_traits::ToPrimitive;
use canister_uuid::get_uuid;

use crate::constants::ICP_LEDGER_CANISTER_ID;
use crate::errors::MarketplaceError;
use crate::guards::{require_not_anonymous, require_admin};
use crate::state;
use crate::types::*;
use crate::utils::*;

#[update]
pub async fn create_collection(
    args: CreateCollectionArgs,
) -> Result<CreateCollectionResponse, MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_not_anonymous(&caller)?;
    let current_time = ic_cdk::api::time();

    validate_collection_args(&args)?;

    if state::collection_name_exists(&args.collection_name) {
        return Err(MarketplaceError::CollectionNameAlreadyExists);
    }

    let config = state::get_config();
    let fee_amount = config.collection_creation_fee.0.to_u64().unwrap_or(0);
    let mut fee_collected = false;

    if fee_amount > 0 {
        let marketplace_canister = ic_cdk::api::id();
        let transfer_args =
            get_transfer_from_args(marketplace_canister.to_text(), caller, fee_amount);

        transfer_tokens_from(transfer_args, ICP_LEDGER_CANISTER_ID)
            .await
            .map_err(MarketplaceError::PaymentFailed)?;

        fee_collected = true;
    }

    let nft_init_args = NFTCollectionInitArgs {
        name: args.collection_name.clone(),
        symbol: args.collection_symbol.clone(),
        description: args.description.clone(),
        logo: args.logo.clone(),
        supply_cap: args.supply_cap.clone(),
        owner: caller,
    };

    let collection_canister_id = match deploy_nft_collection(caller, nft_init_args).await {
        Ok(canister_id) => canister_id,
        Err(e) => {
            if fee_collected {
                let ledger = Principal::from_text(ICP_LEDGER_CANISTER_ID).unwrap();
                let _ = transfer_icrc1_tokens(caller, fee_amount, ledger).await;
            }
            return Err(MarketplaceError::CanisterCreationFailed(e));
        }
    };

    let collection_info = CollectionInfo {
        id: collection_canister_id,
        creator: caller,
        name: args.collection_name.clone(),
        symbol: args.collection_symbol.clone(),
        description: args.description.clone(),
        logo: args.logo.clone(),
        supply_cap: args.supply_cap.clone(),
        created_at: current_time,
        status: CollectionStatus::AssetsPending,
        total_supply: Nat::from(0u64),
        floor_price: None,
        total_volume: Nat::from(0u64),
    };

    state::add_collection(collection_info);

    Ok(CreateCollectionResponse {
        collection_canister_id,
        transaction_id: current_time,
    })
}

#[update]
pub async fn activate_collection(collection_id: Principal) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_not_anonymous(&caller)?;

    let collection =
        state::get_collection(&collection_id).ok_or(MarketplaceError::CollectionNotFound)?;

    if collection.creator != caller {
        return Err(MarketplaceError::NotAuthorized);
    }

    if collection.status != CollectionStatus::AssetsPending {
        return Err(MarketplaceError::InvalidInput(
            "Collection is not in AssetsPending status".to_string(),
        ));
    }

    state::update_collection_status(&collection_id, CollectionStatus::Active)
        .map_err(|e| MarketplaceError::SystemError(e))?;

    Ok(())
}

#[update]
pub async fn update_collection_status(
    collection_id: Principal,
    status: CollectionStatus,
) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_not_anonymous(&caller)?;

    let collection =
        state::get_collection(&collection_id).ok_or(MarketplaceError::CollectionNotFound)?;

    let admin = state::get_admin();

    if collection.creator != caller && admin != caller {
        return Err(MarketplaceError::NotAuthorized);
    }

    state::update_collection_status(&collection_id, status)
        .map_err(|e| MarketplaceError::SystemError(e))?;

    Ok(())
}

#[update]
pub async fn get_user_collections(user: Principal) -> Vec<CollectionInfo> {
    state::get_collections_by_creator(&user)
}

#[update]
pub async fn list_nft(args: ListNFTArgs) -> Result<String, MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_not_anonymous(&caller)?;
    let current_time = ic_cdk::api::time();

    validate_listing_args(&args)?;

    if !state::collection_exists(&args.collection_id) {
        return Err(MarketplaceError::CollectionNotFound);
    }

    verify_token_ownership(args.collection_id, args.token_id.clone(), caller).await?;
    verify_marketplace_approval(args.collection_id, args.token_id.clone(), caller).await?;

    let expires_at = args.duration.map(|duration| current_time + duration);
    let listing_id = get_uuid().await;

    let listing_info = ListingInfo {
        listing_id: listing_id.clone(),
        token_id: args.token_id.clone(),
        collection_id: args.collection_id,
        seller: caller,
        price: args.price.clone(),
        created_at: current_time,
        expires_at,
        status: ListingStatus::Active,
    };

    state::add_listing(listing_info);

    Ok(listing_id)
}

#[update]
pub async fn buy_nft(args: BuyNFTArgs) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_not_anonymous(&caller)?;
    let current_time = ic_cdk::api::time();

    let listing_info =
        state::get_listing(&args.listing_id).ok_or(MarketplaceError::ListingNotFound)?;

    if listing_info.status != ListingStatus::Active {
        return Err(MarketplaceError::ListingNotActive);
    }

    if let Some(expires_at) = listing_info.expires_at {
        if current_time > expires_at {
            state::update_listing_status(&args.listing_id, ListingStatus::Expired)
                .map_err(|e| MarketplaceError::SystemError(e))?;
            return Err(MarketplaceError::ListingExpired);
        }
    }

    if caller == listing_info.seller {
        return Err(MarketplaceError::CannotBuyOwnListing);
    }

    let config = state::get_config();
    let marketplace_fee = calculate_marketplace_fee(&listing_info.price, config.marketplace_fee_percentage);
    let seller_amount = listing_info.price.clone() - marketplace_fee.clone();

    process_sale_payment(caller, listing_info.seller, seller_amount, marketplace_fee.clone()).await?;

    transfer_nft(
        listing_info.collection_id,
        listing_info.token_id.clone(),
        listing_info.seller,
        caller,
    )
    .await?;

    state::update_listing_status(&args.listing_id, ListingStatus::Sold)
        .map_err(|e| MarketplaceError::SystemError(e))?;

    let sale_info = SaleInfo {
        listing_id: args.listing_id.clone(),
        token_id: listing_info.token_id.clone(),
        collection_id: listing_info.collection_id,
        seller: listing_info.seller,
        buyer: caller,
        price: listing_info.price.clone(),
        marketplace_fee: marketplace_fee.clone(),
        sale_time: current_time,
        transaction_hash: format!("{}_{}", args.listing_id, current_time),
    };

    state::add_sale(sale_info);

    let new_floor = Some(listing_info.price.clone());
    state::update_collection_volume(&listing_info.collection_id, listing_info.price.clone(), new_floor);

    Ok(())
}

#[update]
pub async fn cancel_listing(listing_id: String) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_not_anonymous(&caller)?;

    let listing_info =
        state::get_listing(&listing_id).ok_or(MarketplaceError::ListingNotFound)?;

    if caller != listing_info.seller {
        return Err(MarketplaceError::NotAuthorized);
    }

    if listing_info.status != ListingStatus::Active {
        return Err(MarketplaceError::ListingAlreadyCancelled);
    }

    state::update_listing_status(&listing_id, ListingStatus::Cancelled)
        .map_err(|e| MarketplaceError::SystemError(e))?;

    Ok(())
}

#[update]
pub fn update_marketplace_config(config: MarketplaceConfig) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_admin(&caller)?;

    state::update_config(config);
    Ok(())
}

#[update]
pub fn update_collection_creation_fee(fee: Nat) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_admin(&caller)?;

    state::update_collection_creation_fee(fee);
    Ok(())
}

#[update]
pub fn update_marketplace_fee_percentage(percentage: u16) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_admin(&caller)?;

    if percentage > 1000 {
        return Err(MarketplaceError::InvalidFeePercentage);
    }

    state::update_marketplace_fee_percentage(percentage);
    Ok(())
}

#[update]
pub fn transfer_admin(new_admin: Principal) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    require_admin(&caller)?;

    state::transfer_admin(new_admin);
    Ok(())
}
