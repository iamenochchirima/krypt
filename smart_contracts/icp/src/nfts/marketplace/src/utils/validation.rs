use candid::Nat;
use crate::types::{CreateCollectionArgs, ListNFTArgs};
use crate::errors::MarketplaceError;

pub fn validate_collection_args(args: &CreateCollectionArgs) -> Result<(), MarketplaceError> {
    if args.collection_name.is_empty() || args.collection_name.len() > 100 {
        return Err(MarketplaceError::InvalidCollectionName);
    }

    if args.collection_symbol.is_empty() || args.collection_symbol.len() > 10 {
        return Err(MarketplaceError::InvalidCollectionSymbol);
    }

    if let Some(ref description) = args.description {
        if description.len() > 1000 {
            return Err(MarketplaceError::InvalidDescription);
        }
    }

    if let Some(ref logo) = args.logo {
        if logo.len() > 500 {
            return Err(MarketplaceError::InvalidLogoUrl);
        }
    }

    Ok(())
}

pub fn validate_listing_args(args: &ListNFTArgs) -> Result<(), MarketplaceError> {
    if args.price == Nat::from(0u64) {
        return Err(MarketplaceError::InvalidPrice);
    }

    let min_price = Nat::from(100_000u64);
    if args.price < min_price {
        return Err(MarketplaceError::InvalidPrice);
    }

    if let Some(duration) = args.duration {
        let max_duration = 30 * 24 * 60 * 60 * 1_000_000_000u64;
        if duration > max_duration {
            return Err(MarketplaceError::InvalidDuration);
        }
    }

    Ok(())
}
