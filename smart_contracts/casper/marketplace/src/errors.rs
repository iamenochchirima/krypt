/// Error codes for the NFT Marketplace contract
pub enum Error {
    /// Listing not found
    ListingNotFound = 1,
    /// Not authorized to perform this operation
    NotAuthorized = 2,
    /// Invalid price (must be > 0)
    InvalidPrice = 3,
    /// Invalid fee configuration
    InvalidFee = 4,
    /// Insufficient payment
    InsufficientPayment = 5,
    /// Listing is not active
    ListingNotActive = 6,
    /// NFT transfer failed
    NftTransferFailed = 7,
    /// Payment transfer failed
    PaymentTransferFailed = 8,
}

impl From<Error> for u16 {
    fn from(error: Error) -> Self {
        error as u16
    }
}
