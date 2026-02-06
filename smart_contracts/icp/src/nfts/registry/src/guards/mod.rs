use candid::Principal;
use crate::state::config::get_admin;

pub fn require_not_anonymous(caller: &Principal) -> Result<(), String> {
    if *caller == Principal::anonymous() {
        Err("Anonymous callers are not allowed".to_string())
    } else {
        Ok(())
    }
}

pub fn require_admin(caller: &Principal) -> Result<(), String> {
    require_not_anonymous(caller)?;
    if *caller == get_admin() {
        Ok(())
    } else {
        Err("Not authorized: requires admin".to_string())
    }
}
