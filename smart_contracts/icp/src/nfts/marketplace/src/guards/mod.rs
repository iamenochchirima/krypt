use candid::Principal;
use crate::errors::MarketplaceError;
use crate::state;

pub fn require_not_anonymous(caller: &Principal) -> Result<(), MarketplaceError> {
    if *caller == Principal::anonymous() {
        Err(MarketplaceError::AnonymousCallerNotAllowed)
    } else {
        Ok(())
    }
}

pub fn require_admin(caller: &Principal) -> Result<(), MarketplaceError> {
    require_not_anonymous(caller)?;
    if *caller == state::get_admin() {
        Ok(())
    } else {
        Err(MarketplaceError::NotAuthorized)
    }
}
