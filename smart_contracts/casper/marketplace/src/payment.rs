use alloc::string::ToString;

use casper_contract::{
    contract_api::{runtime, system},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{U512, URef, account::AccountHash};

use crate::{errors::Error, storage};

/// Calculate payment distribution for a purchase
/// Returns (marketplace_fee, royalty_amount, seller_amount)
pub fn calculate_payment_split(
    total_price: U512,
    royalty_numerator: u64,
    royalty_denominator: u64,
) -> (U512, U512, U512) {
    let (fee_num, fee_denom) = storage::get_marketplace_fee();

    // Calculate marketplace fee (2.5% by default)
    let marketplace_fee = (total_price * U512::from(fee_num)) / U512::from(fee_denom);

    // Calculate royalty
    let royalty_amount = if royalty_numerator > 0 && royalty_denominator > 0 {
        (total_price * U512::from(royalty_numerator)) / U512::from(royalty_denominator)
    } else {
        U512::zero()
    };

    // Seller gets the remainder
    let seller_amount = total_price - marketplace_fee - royalty_amount;

    (marketplace_fee, royalty_amount, seller_amount)
}

/// Distribute payment to marketplace, creator, and seller
pub fn distribute_payment(
    buyer_purse: URef,
    total_price: U512,
    marketplace_fee: U512,
    royalty_amount: U512,
    seller_amount: U512,
    creator: AccountHash,
    seller: AccountHash,
) {
    let marketplace_purse = storage::get_marketplace_purse();
    let fee_recipient = storage::get_fee_recipient();

    // Transfer marketplace fee to fee recipient
    if marketplace_fee > U512::zero() {
        system::transfer_from_purse_to_account(
            marketplace_purse,
            fee_recipient,
            marketplace_fee,
            None,
        )
        .unwrap_or_revert_with(Error::PaymentTransferFailed);
    }

    // Transfer royalty to creator
    if royalty_amount > U512::zero() {
        system::transfer_from_purse_to_account(
            marketplace_purse,
            creator,
            royalty_amount,
            None,
        )
        .unwrap_or_revert_with(Error::PaymentTransferFailed);
    }

    // Transfer remaining amount to seller
    if seller_amount > U512::zero() {
        system::transfer_from_purse_to_account(
            marketplace_purse,
            seller,
            seller_amount,
            None,
        )
        .unwrap_or_revert_with(Error::PaymentTransferFailed);
    }
}

/// Verify NFT ownership
pub fn verify_nft_ownership(
    collection_hash: &casper_types::ContractHash,
    token_id: u64,
    expected_owner: &AccountHash,
) -> Result<(), Error> {
    use casper_types::runtime_args;

    let owner: casper_types::Key = runtime::call_contract(
        *collection_hash,
        "owner_of",
        runtime_args! {
            "token_id" => token_id,
        },
    );

    let owner_account = owner.into_account()
        .ok_or(Error::NftTransferFailed)?;

    if owner_account == *expected_owner {
        Ok(())
    } else {
        Err(Error::NotAuthorized)
    }
}

/// Check if marketplace is approved to transfer NFT
pub fn is_approved_or_owner(
    collection_hash: &casper_types::ContractHash,
    token_id: u64,
    operator: &casper_types::Key,
    owner: &AccountHash,
) -> Result<bool, Error> {
    use casper_types::runtime_args;

    // Check if operator is the owner
    if let Some(operator_account) = operator.clone().into_account() {
        if operator_account == *owner {
            return Ok(true);
        }
    }

    // Check if operator is approved for this specific token
    let approved: Option<casper_types::Key> = runtime::call_contract(
        *collection_hash,
        "get_approved",
        runtime_args! {
            "token_id" => token_id,
        },
    );

    if let Some(approved_key) = approved {
        if approved_key == *operator {
            return Ok(true);
        }
    }

    // Check if operator has approval for all tokens
    let is_approved_for_all: bool = runtime::call_contract(
        *collection_hash,
        "is_approved_for_all",
        runtime_args! {
            "token_owner" => casper_types::Key::Account(*owner),
            "operator" => *operator,
        },
    );

    Ok(is_approved_for_all)
}

/// Transfer NFT using CEP-78 transfer function
pub fn transfer_nft(
    collection_hash: &casper_types::ContractHash,
    token_id: u64,
    source_key: casper_types::Key,
    target_key: casper_types::Key,
) -> Result<(), Error> {
    use casper_types::runtime_args;

    let _result: (String, casper_types::Key) = runtime::call_contract(
        *collection_hash,
        "transfer",
        runtime_args! {
            "token_id" => token_id,
            "source_key" => source_key,
            "target_key" => target_key,
        },
    );

    Ok(())
}

/// Approve marketplace to transfer NFT (called by seller before listing)
pub fn approve_marketplace(
    collection_hash: &casper_types::ContractHash,
    token_id: u64,
    spender: casper_types::Key,
) -> Result<(), Error> {
    use casper_types::runtime_args;

    runtime::call_contract::<()>(
        *collection_hash,
        "approve",
        runtime_args! {
            "token_id" => token_id,
            "spender" => spender,
        },
    );

    Ok(())
}
