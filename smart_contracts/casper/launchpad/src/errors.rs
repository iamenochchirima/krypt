/// Error codes for the NFT Launchpad contract
pub enum Error {
    /// Invalid royalty configuration (numerator > denominator)
    InvalidRoyalty = 1,
    /// Collection not found in registry
    CollectionNotFound = 2,
    /// Unauthorized operation (admin only)
    Unauthorized = 3,
    /// Invalid collection parameters
    InvalidParameters = 4,
    /// Collection name already exists
    CollectionAlreadyExists = 5,
}

impl From<Error> for u16 {
    fn from(error: Error) -> Self {
        error as u16
    }
}
