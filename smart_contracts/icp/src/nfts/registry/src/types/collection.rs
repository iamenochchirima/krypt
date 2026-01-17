use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;
use super::blockchain::Blockchain;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionStatusV0 {
    Draft,
    Active,
    Paused,
    Minting,
    Completed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionStatus {
    Draft,
    Active,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ChainData {
    Solana(SolanaCollectionData),
    ICP(ICPCollectionData),
    Ethereum(EthereumCollectionData),
    Movement(MovementCollectionData),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum SolanaNftStandard {
    Legacy,
    Core,
    Compressed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum SolanaCollectionData {
    Legacy(LegacyCollectionData),
    Core(CoreCollectionData),
    Compressed(CompressedCollectionData),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LegacyCollectionData {
    pub deployment_stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub authority: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CoreCollectionData {
    pub deployment_stage: SolanaDeploymentStage,
    pub collection_address: Option<String>,
    pub candy_machine_address: Option<String>,
    pub manifest_url: Option<String>,
    pub authority: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CompressedCollectionData {
    pub deployment_stage: SolanaDeploymentStage,
    pub merkle_tree_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub authority: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum SolanaDeploymentStage {
    FilesUploading,
    MetadataCreating,
    Deploying,
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

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum EthereumContractType {
    ERC721,
    ERC1155,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EthereumCollectionData {
    pub deployment_stage: EthereumDeploymentStage,
    pub contract_type: EthereumContractType,
    pub contract_address: Option<String>,
    pub chain_id: u64,
    pub chain_name: String,
    pub owner_address: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: bool,
    pub mint_price_wei: Option<u64>,
    pub max_supply: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum EthereumDeploymentStage {
    FilesUploading,
    ContractDeploying,
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
    CollectionDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InitialSale {
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub public_start_time: Option<u64>,
    pub ended: bool,
    pub config: InitialSaleConfig,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum InitialSaleConfig {
    Solana(SolanaSaleConfig),
    ICP(ICPSaleConfig),
    Ethereum(EthereumSaleConfig),
    Movement(MovementSaleConfig),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SolanaSaleConfig {
    pub sale_type: SolanaSaleType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum SolanaSaleType {
    FixedPrice,
    OpenEdition,
    DutchAuction,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ICPSaleConfig {
    pub sale_type: ICPSaleType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ICPSaleType {
    FixedPrice,
    OpenEdition,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EthereumSaleConfig {
    pub sale_type: EthereumSaleType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum EthereumSaleType {
    FixedPrice,
    OpenEdition,
    DutchAuction,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MovementSaleConfig {
    pub sale_type: MovementSaleType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum MovementSaleType {
    FixedPrice,
    OpenEdition,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct Socials {
    pub website: Option<String>,
    pub twitter: Option<String>,
    pub discord: Option<String>,
    pub telegram: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionCategory {
    Art,
    PFP,
    Gaming,
    Music,
    Photography,
    Utility,
    Metaverse,
    Other,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionV0 {
    pub id: String,
    pub slug: String,
    pub blockchain: Blockchain,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub total_supply: u64,
    pub royalty_bps: u16,
    pub mint_price: Option<u64>,
    pub metadata: Vec<(String, String)>,
    pub status: CollectionStatusV0,
    pub chain_data: ChainData,
    pub initial_sale: Option<InitialSale>,
    pub socials: Option<Socials>,
    pub category: Option<CollectionCategory>,
    pub tags: Vec<String>,
    pub is_verified: bool,
    pub is_featured: bool,
    pub created_at: u64,
    pub updated_at: u64,
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

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Collection {
    pub id: String,
    pub slug: String,
    pub blockchain: Blockchain,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub total_supply: u64,
    pub royalty_bps: u16,
    pub mint_price: Option<u64>,
    pub metadata: Vec<(String, String)>,
    pub status: CollectionStatus,
    pub chain_data: ChainData,
    pub initial_sale: Option<InitialSale>,
    pub socials: Option<Socials>,
    pub category: Option<CollectionCategory>,
    pub tags: Vec<String>,
    pub is_verified: bool,
    pub is_featured: bool,
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

    const BOUND: Bound = Bound::Unbounded;
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
    pub mint_price: Option<u64>,
    pub metadata: Vec<(String, String)>,
    pub chain_data: ChainData,
    pub socials: Option<Socials>,
    pub category: Option<CollectionCategory>,
    pub tags: Option<Vec<String>>,
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
    pub update_data: SolanaStageUpdateData,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum SolanaStageUpdateData {
    Legacy(LegacyStageUpdate),
    Core(CoreStageUpdate),
    Compressed(CompressedStageUpdate),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LegacyStageUpdate {
    pub stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub authority: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CoreStageUpdate {
    pub stage: SolanaDeploymentStage,
    pub collection_address: Option<String>,
    pub candy_machine_address: Option<String>,
    pub manifest_url: Option<String>,
    pub authority: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CompressedStageUpdate {
    pub stage: SolanaDeploymentStage,
    pub merkle_tree_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub authority: Option<String>,
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
pub struct UpdateEthereumStageArgs {
    pub collection_id: String,
    pub stage: EthereumDeploymentStage,
    pub contract_address: Option<String>,
    pub owner_address: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: Option<bool>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateInitialSaleArgs {
    pub collection_id: String,
    pub initial_sale: Option<InitialSale>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SetSaleEndedArgs {
    pub collection_id: String,
    pub ended: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateSocialsArgs {
    pub collection_id: String,
    pub socials: Option<Socials>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateCategoryArgs {
    pub collection_id: String,
    pub category: Option<CollectionCategory>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateTagsArgs {
    pub collection_id: String,
    pub tags: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SetVerifiedArgs {
    pub collection_id: String,
    pub is_verified: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SetFeaturedArgs {
    pub collection_id: String,
    pub is_featured: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateSlugArgs {
    pub collection_id: String,
    pub slug: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionsResult {
    pub collections: Vec<Collection>,
    pub total: u64,
}
