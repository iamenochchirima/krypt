use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use num_traits::ToPrimitive;

use crate::constants::{ICP_LEDGER_CANISTER_ID, MARKETPLACE_TREASURY_PRINCIPAL_ID};
use crate::errors::MarketplaceError;

async fn transfer_tokens(arg: TransferArg, ledger_id: Principal) -> Result<BlockIndex, String> {
    ic_cdk::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(
        ledger_id,
        "icrc1_transfer",
        (arg,),
    )
    .await
    .map_err(|e| format!("failed to call ledger: {:?}", e))?
    .0
    .map_err(|e| format!("ledger transfer error {:?}", e))
}

pub async fn transfer_tokens_from(
    arg: TransferFromArgs,
    ledger_id: &str,
) -> Result<BlockIndex, String> {
    let ledger_principal =
        Principal::from_text(ledger_id).map_err(|e| format!("Could not decode the principal: {:?}", e))?;

    let result = ic_cdk::call::<(TransferFromArgs,), (Result<BlockIndex, TransferFromError>,)>(
        ledger_principal,
        "icrc2_transfer_from",
        (arg,),
    )
    .await
    .map_err(|e| format!("failed to call ledger: {:?}", e))?
    .0;

    result.map_err(|e| format!("ledger transfer error {:?}", e))
}

pub fn get_transfer_from_args(to: String, from: Principal, amount: u64) -> TransferFromArgs {
    TransferFromArgs {
        to: Account {
            owner: Principal::from_text(to).unwrap(),
            subaccount: None,
        },
        from: Account {
            owner: from,
            subaccount: None,
        },
        fee: None,
        memo: None,
        spender_subaccount: None,
        created_at_time: Some(ic_cdk::api::time()),
        amount: NumTokens::from(amount),
    }
}

pub async fn transfer_icrc1_tokens(
    to_principal: Principal,
    amount_e8s: u64,
    ledger: Principal,
) -> Result<BlockIndex, String> {
    let transfer_arg = TransferArg {
        to: Account {
            owner: to_principal,
            subaccount: None,
        },
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: Some(ic_cdk::api::time()),
        amount: NumTokens::from(amount_e8s),
    };

    transfer_tokens(transfer_arg, ledger).await
}

pub async fn process_sale_payment(
    buyer: Principal,
    seller: Principal,
    seller_amount: Nat,
    marketplace_fee: Nat,
) -> Result<(), MarketplaceError> {
    let seller_amount_u64 = seller_amount.0.to_u64().unwrap_or(0);
    let fee_amount_u64 = marketplace_fee.0.to_u64().unwrap_or(0);

    let seller_transfer_args = get_transfer_from_args(seller.to_text(), buyer, seller_amount_u64);

    transfer_tokens_from(seller_transfer_args, ICP_LEDGER_CANISTER_ID)
        .await
        .map_err(|e| MarketplaceError::PaymentFailed(format!("Seller payment failed: {}", e)))?;

    if fee_amount_u64 > 0 {
        let fee_transfer_args = get_transfer_from_args(
            MARKETPLACE_TREASURY_PRINCIPAL_ID.to_string(),
            buyer,
            fee_amount_u64,
        );

        transfer_tokens_from(fee_transfer_args, ICP_LEDGER_CANISTER_ID)
            .await
            .map_err(|e| MarketplaceError::PaymentFailed(format!("Fee payment failed: {}", e)))?;
    }

    Ok(())
}

pub fn calculate_marketplace_fee(price: &Nat, fee_percentage: u16) -> Nat {
    let fee_basis_points = Nat::from(fee_percentage as u64);
    let basis_points_total = Nat::from(10_000u64);

    (price.clone() * fee_basis_points) / basis_points_total
}
