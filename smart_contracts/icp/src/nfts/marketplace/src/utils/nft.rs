use candid::{CandidType, Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use serde::{Deserialize, Serialize};
use crate::errors::MarketplaceError;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct IsApprovedArg {
    pub spender: Account,
    pub from_subaccount: Option<[u8; 32]>,
    pub token_id: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferFromArg {
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: Account,
    pub to: Account,
    pub token_id: Nat,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransferFromError {
    GenericError { message: String, error_code: Nat },
    Duplicate { duplicate_of: Nat },
    NonExistingTokenId,
    Unauthorized,
    CreatedInFuture { ledger_time: u64 },
    InvalidRecipient,
    GenericBatchError { message: String, error_code: Nat },
    TooOld,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransferFromResult {
    Ok(Nat),
    Err(TransferFromError),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum Icrc37TransferFromResponse {
    Ok(Vec<Option<TransferFromResult>>),
    Err(TransferFromError),
}

pub async fn verify_token_ownership(
    collection_id: Principal,
    token_id: Nat,
    owner: Principal,
) -> Result<(), MarketplaceError> {
    let result: Result<(Vec<Option<Account>>,), _> = ic_cdk::call(
        collection_id,
        "icrc7_owner_of",
        (vec![token_id],),
    )
    .await;

    match result {
        Ok((owners,)) => {
            if let Some(Some(token_owner)) = owners.first() {
                if token_owner.owner == owner {
                    Ok(())
                } else {
                    Err(MarketplaceError::TokenNotOwned)
                }
            } else {
                Err(MarketplaceError::TokenNotFound)
            }
        }
        Err(_) => Err(MarketplaceError::SystemError(
            "Failed to verify token ownership".to_string(),
        )),
    }
}

pub async fn verify_marketplace_approval(
    collection_id: Principal,
    token_id: Nat,
    _owner: Principal,
) -> Result<(), MarketplaceError> {
    let marketplace_canister = ic_cdk::api::id();

    let is_approved_arg = IsApprovedArg {
        spender: Account {
            owner: marketplace_canister,
            subaccount: None,
        },
        from_subaccount: None,
        token_id,
    };

    let result: Result<(Vec<bool>,), _> = ic_cdk::call(
        collection_id,
        "icrc37_is_approved",
        (vec![is_approved_arg],),
    )
    .await;

    match result {
        Ok((approvals,)) => {
            if approvals.first() == Some(&true) {
                Ok(())
            } else {
                Err(MarketplaceError::InsufficientApproval)
            }
        }
        Err(e) => Err(MarketplaceError::SystemError(format!(
            "Failed to verify approval: {:?}",
            e
        ))),
    }
}

pub async fn transfer_nft(
    collection_id: Principal,
    token_id: Nat,
    from: Principal,
    to: Principal,
) -> Result<(), MarketplaceError> {
    let transfer_arg = TransferFromArg {
        spender_subaccount: None,
        from: Account {
            owner: from,
            subaccount: None,
        },
        to: Account {
            owner: to,
            subaccount: None,
        },
        token_id,
        memo: None,
        created_at_time: None,
    };

    let result: Result<(Icrc37TransferFromResponse,), _> = ic_cdk::call(
        collection_id,
        "icrc37_transfer_from",
        (vec![transfer_arg],),
    )
    .await;

    match result {
        Ok((Icrc37TransferFromResponse::Ok(transfer_results),)) => {
            match transfer_results.first() {
                Some(Some(TransferFromResult::Ok(_))) => Ok(()),
                Some(Some(TransferFromResult::Err(e))) => {
                    Err(MarketplaceError::TransferFailed(format!(
                        "NFT transfer error: {:?}",
                        e
                    )))
                }
                Some(None) => Ok(()),
                None => Ok(()),
            }
        }
        Ok((Icrc37TransferFromResponse::Err(e),)) => Err(MarketplaceError::TransferFailed(
            format!("NFT transfer batch error: {:?}", e),
        )),
        Err(call_error) => Err(MarketplaceError::TransferFailed(format!(
            "Transfer call failed: {:?}",
            call_error
        ))),
    }
}
