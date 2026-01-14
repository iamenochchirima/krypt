use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketplaceError {
    CollectionNameAlreadyExists,
    InvalidCollectionName,
    InvalidCollectionSymbol,
    InvalidDescription,
    InvalidLogoUrl,
    PaymentFailed(String),
    InsufficientFunds,
    CanisterCreationFailed(String),
    CanisterInstallationFailed(String),
    NotAuthorized,
    CollectionNotFound,
    InvalidInput(String),
    EncodingError(String),
    SystemError(String),
    TokenNotFound,
    TokenNotOwned,
    ListingNotFound,
    ListingExpired,
    ListingAlreadyCancelled,
    InvalidPrice,
    InvalidDuration,
    InsufficientApproval,
    TransferFailed(String),
    ListingNotActive,
    CannotBuyOwnListing,
    InvalidFeePercentage,
}
