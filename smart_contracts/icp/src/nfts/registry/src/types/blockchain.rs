use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Hash)]
pub enum Blockchain {
    ICP,
    Solana,
    Ethereum,
    Bitcoin,
    Movement,
    Casper,
}

impl Blockchain {
    pub fn as_str(&self) -> &str {
        match self {
            Blockchain::ICP => "icp",
            Blockchain::Solana => "solana",
            Blockchain::Ethereum => "ethereum",
            Blockchain::Bitcoin => "bitcoin",
            Blockchain::Movement => "movement",
            Blockchain::Casper => "casper",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "icp" => Some(Blockchain::ICP),
            "solana" => Some(Blockchain::Solana),
            "ethereum" => Some(Blockchain::Ethereum),
            "bitcoin" => Some(Blockchain::Bitcoin),
            "movement" => Some(Blockchain::Movement),
            "casper" => Some(Blockchain::Casper),
            _ => None,
        }
    }
}

impl std::fmt::Display for Blockchain {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}
