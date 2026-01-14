// Utility functions

pub fn validate_price(price: u64) -> Result<(), String> {
    if price == 0 {
        return Err("Price must be greater than 0".to_string());
    }
    Ok(())
}

pub fn validate_collection_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Collection name cannot be empty".to_string());
    }
    if name.len() > 100 {
        return Err("Collection name too long".to_string());
    }
    Ok(())
}

pub fn validate_symbol(symbol: &str) -> Result<(), String> {
    if symbol.is_empty() {
        return Err("Symbol cannot be empty".to_string());
    }
    if symbol.len() > 10 {
        return Err("Symbol too long".to_string());
    }
    Ok(())
}
