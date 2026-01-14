use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;
use super::blockchain::Blockchain;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionStatus {
    Draft,
    Active,
    Paused,
    Minting,
    Completed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ChainData {
    Solana(SolanaCollectionData),
    ICP(ICPCollectionData),
    Ethereum(EthereumCollectionData),
    Bitcoin(BitcoinCollectionData),
    Movement(MovementCollectionData),
    Casper(CasperCollectionData),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ChainDataV0 {
    Solana(SolanaCollectionDataV0),
    ICP(ICPCollectionData),
    Ethereum(EthereumCollectionData),
    Bitcoin(BitcoinCollectionData),
    Movement(MovementCollectionData),
    Casper(CasperCollectionData),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SolanaCollectionData {
    pub deployment_stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: bool,
    pub metadata_created: bool,
    pub candy_machine_items_uploaded: bool,
    pub candy_machine_authority: Option<String>,
    pub candy_machine_config: Option<CandyMachineConfig>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SolanaCollectionDataV0 {
    pub deployment_stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: bool,
    pub metadata_created: bool,
    pub candy_machine_authority: Option<String>,
    pub candy_machine_config: Option<CandyMachineConfig>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CandyMachineConfig {
    pub price: u64, 
    pub go_live_date: Option<u64>, 
    pub items_available: u64, 
    pub seller_fee_basis_points: u16,
    pub symbol: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum SolanaDeploymentStage {
    FilesUploading,
    FilesUploaded,
    MetadataCreating,
    MetadataCreated,
    CandyMachineDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ICPCollectionData {
    pub deployment_stage: ICPDeploymentStage,
    pub canister_id: Option<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ICPDeploymentStage {
    CanisterCreating,
    CanisterDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EthereumCollectionData {
    pub deployment_stage: EthereumDeploymentStage,
    pub contract_address: Option<String>,
    pub chain_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum EthereumDeploymentStage {
    ContractDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BitcoinCollectionData {
    pub deployment_stage: BitcoinDeploymentStage,
    pub inscription_ids: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum BitcoinDeploymentStage {
    InscriptionsCreating,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MovementCollectionData {
    pub deployment_stage: MovementDeploymentStage,
    pub collection_address: Option<String>,
    pub manifest_url: Option<String>,
    pub collection_created: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum MovementDeploymentStage {
    FilesUploading,
    FilesUploaded,
    CollectionDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CasperCollectionData {
    pub deployment_stage: CasperDeploymentStage,
    pub contract_hash: Option<String>,
    pub contract_package_hash: Option<String>,
    pub total_token_supply: u64,
    pub ownership_mode: u8,
    pub nft_metadata_kind: u8,
    pub json_schema: String,
    pub identifier_mode: u8,
    pub metadata_mutability: u8,
    pub minting_mode: Option<u8>,
    pub allow_minting: Option<bool>,
    pub nft_kind: Option<u8>,
    pub whitelist_mode: Option<u8>,
    pub holder_mode: Option<u8>,
    pub burn_mode: Option<u8>,
    pub owner_reverse_lookup_mode: Option<u8>,
    pub events_mode: Option<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CasperDeploymentStage {
    ContractPreparing,
    ContractDeploying,
    ContractDeployed,
    Minting,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionV0 {
    pub id: String,
    pub blockchain: Blockchain,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub total_supply: u64,
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
    pub status: CollectionStatus,
    pub chain_data: ChainDataV0,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Collection {
    pub id: String,
    pub blockchain: Blockchain,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub total_supply: u64,
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
    pub status: CollectionStatus,
    pub chain_data: ChainData,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for Collection {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2048,
        is_fixed_size: false,
    };
}

impl Storable for CollectionV0 {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2048,
        is_fixed_size: false,
    };
}


#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionArgs {
    pub blockchain: Blockchain,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub total_supply: u64,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
    pub chain_data: ChainData,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionStats {
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateCollectionStatusArgs {
    pub collection_id: String,
    pub status: CollectionStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateSolanaStageArgs {
    pub collection_id: String,
    pub stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: Option<bool>,
    pub metadata_created: Option<bool>,
    pub candy_machine_authority: Option<String>,
    pub candy_machine_config: Option<CandyMachineConfig>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateMovementStageArgs {
    pub collection_id: String,
    pub stage: MovementDeploymentStage,
    pub collection_address: Option<String>,
    pub manifest_url: Option<String>,
    pub collection_created: Option<bool>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateCasperStageArgs {
    pub collection_id: String,
    pub stage: CasperDeploymentStage,
    pub contract_hash: Option<String>,
    pub contract_package_hash: Option<String>,
    // Required CEP-78 parameters
    pub total_token_supply: Option<u64>,
    pub ownership_mode: Option<u8>,
    pub nft_metadata_kind: Option<u8>,
    pub json_schema: Option<String>,
    pub identifier_mode: Option<u8>,
    pub metadata_mutability: Option<u8>,
    // Optional configuration
    pub minting_mode: Option<u8>,
    pub allow_minting: Option<bool>,
    pub nft_kind: Option<u8>,
    pub whitelist_mode: Option<u8>,
    pub holder_mode: Option<u8>,
    pub burn_mode: Option<u8>,
    pub owner_reverse_lookup_mode: Option<u8>,
    pub events_mode: Option<u8>,
}
