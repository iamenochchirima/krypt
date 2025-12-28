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

/// Transfer NFT from one account to another
/// Note: This is a placeholder - actual implementation depends on CEP-78 contract
pub fn transfer_nft(
    _collection_hash: &casper_types::ContractHash,
    _token_hash: &casper_types::Key,
    _from: &AccountHash,
    _to: &AccountHash,
) -> Result<(), Error> {
    // TODO: Call CEP-78 contract's transfer entry point
    // runtime::call_contract::<()>(
    //     collection_hash,
    //     "transfer",
    //     runtime_args! {
    //         "token_id" => token_hash,
    //         "target" => to,
    //     }
    // );

    Ok(())
}
