use casper_types::{bytesrepr::{FromBytes, ToBytes}, CLTyped, ContractHash, account::AccountHash};

/// Collection information stored in the registry
#[derive(Clone, Debug)]
pub struct CollectionInfo {
    /// The deployed CEP-78 collection contract hash
    pub collection_hash: ContractHash,
    /// Creator's account hash
    pub creator: AccountHash,
    /// Collection name
    pub name: String,
    /// Collection symbol
    pub symbol: String,
    /// Collection description
    pub description: String,
    /// Collection metadata URI
    pub uri: String,
    /// Total supply (0 for unlimited)
    pub total_supply: u64,
    /// Royalty numerator (e.g., 5 for 5%)
    pub royalty_numerator: u64,
    /// Royalty denominator (e.g., 100 for percentage)
    pub royalty_denominator: u64,
    /// Timestamp when collection was created
    pub created_at: u64,
}

impl ToBytes for CollectionInfo {
    fn to_bytes(&self) -> Result<Vec<u8>, casper_types::bytesrepr::Error> {
        let mut buffer = Vec::new();
        buffer.extend(self.collection_hash.to_bytes()?);
        buffer.extend(self.creator.to_bytes()?);
        buffer.extend(self.name.to_bytes()?);
        buffer.extend(self.symbol.to_bytes()?);
        buffer.extend(self.description.to_bytes()?);
        buffer.extend(self.uri.to_bytes()?);
        buffer.extend(self.total_supply.to_bytes()?);
        buffer.extend(self.royalty_numerator.to_bytes()?);
        buffer.extend(self.royalty_denominator.to_bytes()?);
        buffer.extend(self.created_at.to_bytes()?);
        Ok(buffer)
    }

    fn serialized_length(&self) -> usize {
        self.collection_hash.serialized_length()
            + self.creator.serialized_length()
            + self.name.serialized_length()
            + self.symbol.serialized_length()
            + self.description.serialized_length()
            + self.uri.serialized_length()
            + self.total_supply.serialized_length()
            + self.royalty_numerator.serialized_length()
            + self.royalty_denominator.serialized_length()
            + self.created_at.serialized_length()
    }
}

impl FromBytes for CollectionInfo {
    fn from_bytes(bytes: &[u8]) -> Result<(Self, &[u8]), casper_types::bytesrepr::Error> {
        let (collection_hash, remainder) = ContractHash::from_bytes(bytes)?;
        let (creator, remainder) = AccountHash::from_bytes(remainder)?;
        let (name, remainder) = String::from_bytes(remainder)?;
        let (symbol, remainder) = String::from_bytes(remainder)?;
        let (description, remainder) = String::from_bytes(remainder)?;
        let (uri, remainder) = String::from_bytes(remainder)?;
        let (total_supply, remainder) = u64::from_bytes(remainder)?;
        let (royalty_numerator, remainder) = u64::from_bytes(remainder)?;
        let (royalty_denominator, remainder) = u64::from_bytes(remainder)?;
        let (created_at, remainder) = u64::from_bytes(remainder)?;

        Ok((
            CollectionInfo {
                collection_hash,
                creator,
                name,
                symbol,
                description,
                uri,
                total_supply,
                royalty_numerator,
                royalty_denominator,
                created_at,
            },
            remainder,
        ))
    }
}

impl CLTyped for CollectionInfo {
    fn cl_type() -> casper_types::CLType {
        casper_types::CLType::Any
    }
}
