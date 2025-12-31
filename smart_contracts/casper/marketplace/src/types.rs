use casper_types::{
    bytesrepr::{FromBytes, ToBytes},
    CLTyped, ContractHash, Key, U512, account::AccountHash,
};

/// Listing status
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum ListingStatus {
    Active = 0,
    Sold = 1,
    Cancelled = 2,
}

impl ToBytes for ListingStatus {
    fn to_bytes(&self) -> Result<Vec<u8>, casper_types::bytesrepr::Error> {
        (*self as u8).to_bytes()
    }

    fn serialized_length(&self) -> usize {
        1
    }
}

impl FromBytes for ListingStatus {
    fn from_bytes(bytes: &[u8]) -> Result<(Self, &[u8]), casper_types::bytesrepr::Error> {
        let (value, remainder) = u8::from_bytes(bytes)?;
        let status = match value {
            0 => ListingStatus::Active,
            1 => ListingStatus::Sold,
            2 => ListingStatus::Cancelled,
            _ => return Err(casper_types::bytesrepr::Error::Formatting),
        };
        Ok((status, remainder))
    }
}

impl CLTyped for ListingStatus {
    fn cl_type() -> casper_types::CLType {
        casper_types::CLType::U8
    }
}

/// NFT listing information
#[derive(Clone, Debug)]
pub struct Listing {
    /// Unique listing identifier
    pub listing_id: String,
    /// NFT token ID (CEP-78 identifier)
    pub token_id: u64,
    /// NFT token hash (Key) - for compatibility
    pub token_hash: Key,
    /// Collection contract hash
    pub collection_hash: ContractHash,
    /// Seller's account hash
    pub seller: AccountHash,
    /// Price in CSPR (motes)
    pub price: U512,
    /// Timestamp when listed
    pub listed_at: u64,
    /// Current status
    pub status: ListingStatus,
}

impl ToBytes for Listing {
    fn to_bytes(&self) -> Result<Vec<u8>, casper_types::bytesrepr::Error> {
        let mut buffer = Vec::new();
        buffer.extend(self.listing_id.to_bytes()?);
        buffer.extend(self.token_id.to_bytes()?);
        buffer.extend(self.token_hash.to_bytes()?);
        buffer.extend(self.collection_hash.to_bytes()?);
        buffer.extend(self.seller.to_bytes()?);
        buffer.extend(self.price.to_bytes()?);
        buffer.extend(self.listed_at.to_bytes()?);
        buffer.extend(self.status.to_bytes()?);
        Ok(buffer)
    }

    fn serialized_length(&self) -> usize {
        self.listing_id.serialized_length()
            + self.token_id.serialized_length()
            + self.token_hash.serialized_length()
            + self.collection_hash.serialized_length()
            + self.seller.serialized_length()
            + self.price.serialized_length()
            + self.listed_at.serialized_length()
            + self.status.serialized_length()
    }
}

impl FromBytes for Listing {
    fn from_bytes(bytes: &[u8]) -> Result<(Self, &[u8]), casper_types::bytesrepr::Error> {
        let (listing_id, remainder) = String::from_bytes(bytes)?;
        let (token_id, remainder) = u64::from_bytes(remainder)?;
        let (token_hash, remainder) = Key::from_bytes(remainder)?;
        let (collection_hash, remainder) = ContractHash::from_bytes(remainder)?;
        let (seller, remainder) = AccountHash::from_bytes(remainder)?;
        let (price, remainder) = U512::from_bytes(remainder)?;
        let (listed_at, remainder) = u64::from_bytes(remainder)?;
        let (status, remainder) = ListingStatus::from_bytes(remainder)?;

        Ok((
            Listing {
                listing_id,
                token_id,
                token_hash,
                collection_hash,
                seller,
                price,
                listed_at,
                status,
            },
            remainder,
        ))
    }
}

impl CLTyped for Listing {
    fn cl_type() -> casper_types::CLType {
        casper_types::CLType::Any
    }
}
