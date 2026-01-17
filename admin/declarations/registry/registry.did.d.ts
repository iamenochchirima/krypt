import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Blockchain = { 'ICP' : null } |
  { 'Ethereum' : null } |
  { 'Solana' : null } |
  { 'Movement' : null };
export type ChainData = { 'ICP' : ICPCollectionData } |
  { 'Ethereum' : EthereumCollectionData } |
  { 'Solana' : SolanaCollectionData } |
  { 'Movement' : MovementCollectionData };
export interface Collection {
  'id' : string,
  'status' : CollectionStatus,
  'updated_at' : bigint,
  'creator' : Principal,
  'initial_sale' : [] | [InitialSale],
  'image_url' : string,
  'metadata' : Array<[string, string]>,
  'banner_url' : [] | [string],
  'name' : string,
  'slug' : string,
  'tags' : Array<string>,
  'socials' : [] | [Socials],
  'description' : string,
  'created_at' : bigint,
  'blockchain' : Blockchain,
  'mint_price' : [] | [bigint],
  'is_verified' : boolean,
  'is_featured' : boolean,
  'category' : [] | [CollectionCategory],
  'chain_data' : ChainData,
  'total_supply' : bigint,
  'symbol' : string,
  'royalty_bps' : number,
}
export type CollectionCategory = { 'Art' : null } |
  { 'PFP' : null } |
  { 'Gaming' : null } |
  { 'Music' : null } |
  { 'Other' : null } |
  { 'Metaverse' : null } |
  { 'Photography' : null } |
  { 'Utility' : null };
export type CollectionStatus = { 'Active' : null } |
  { 'Draft' : null };
export interface CollectionsResult {
  'total' : bigint,
  'collections' : Array<Collection>,
}
export interface CompressedCollectionData {
  'manifest_url' : [] | [string],
  'collection_mint' : [] | [string],
  'deployment_stage' : SolanaDeploymentStage,
  'merkle_tree_address' : [] | [string],
  'authority' : [] | [string],
}
export interface CompressedStageUpdate {
  'manifest_url' : [] | [string],
  'collection_mint' : [] | [string],
  'stage' : SolanaDeploymentStage,
  'merkle_tree_address' : [] | [string],
  'authority' : [] | [string],
}
export interface CoreCollectionData {
  'collection_address' : [] | [string],
  'manifest_url' : [] | [string],
  'candy_machine_address' : [] | [string],
  'deployment_stage' : SolanaDeploymentStage,
  'authority' : [] | [string],
}
export interface CoreStageUpdate {
  'collection_address' : [] | [string],
  'manifest_url' : [] | [string],
  'stage' : SolanaDeploymentStage,
  'candy_machine_address' : [] | [string],
  'authority' : [] | [string],
}
export interface CreateCollectionArgs {
  'image_url' : string,
  'metadata' : Array<[string, string]>,
  'banner_url' : [] | [string],
  'name' : string,
  'tags' : [] | [Array<string>],
  'socials' : [] | [Socials],
  'description' : string,
  'blockchain' : Blockchain,
  'mint_price' : [] | [bigint],
  'category' : [] | [CollectionCategory],
  'chain_data' : ChainData,
  'total_supply' : bigint,
  'symbol' : string,
  'royalty_bps' : number,
}
export interface EthereumCollectionData {
  'contract_type' : EthereumContractType,
  'files_uploaded' : boolean,
  'manifest_url' : [] | [string],
  'mint_price_wei' : [] | [bigint],
  'chain_id' : bigint,
  'deployment_stage' : EthereumDeploymentStage,
  'max_supply' : bigint,
  'chain_name' : string,
  'contract_address' : [] | [string],
  'owner_address' : [] | [string],
}
export type EthereumContractType = { 'ERC1155' : null } |
  { 'ERC721' : null };
export type EthereumDeploymentStage = { 'ContractDeploying' : null } |
  { 'Deployed' : null } |
  { 'FilesUploading' : null };
export interface ICPCollectionData {
  'canister_id' : [] | [Principal],
  'deployment_stage' : ICPDeploymentStage,
}
export type ICPDeploymentStage = { 'CanisterDeploying' : null } |
  { 'CanisterCreating' : null } |
  { 'Deployed' : null };
export interface ICPSaleConfig { 'sale_type' : ICPSaleType }
export type ICPSaleType = { 'OpenEdition' : null } |
  { 'FixedPrice' : null };
export interface InitArgs { 'admin' : Principal }
export interface InitialSale {
  'end_time' : [] | [bigint],
  'ended' : boolean,
  'start_time' : bigint,
  'config' : InitialSaleConfig,
  'public_start_time' : [] | [bigint],
}
export type InitialSaleConfig = { 'ICP' : ICPSaleConfig } |
  { 'Ethereum' : SolanaSaleConfig } |
  { 'Solana' : SolanaSaleConfig } |
  { 'Movement' : ICPSaleConfig };
export interface LegacyCollectionData {
  'manifest_url' : [] | [string],
  'collection_mint' : [] | [string],
  'candy_machine_address' : [] | [string],
  'deployment_stage' : SolanaDeploymentStage,
  'authority' : [] | [string],
}
export interface LegacyStageUpdate {
  'manifest_url' : [] | [string],
  'collection_mint' : [] | [string],
  'stage' : SolanaDeploymentStage,
  'candy_machine_address' : [] | [string],
  'authority' : [] | [string],
}
export interface MovementCollectionData {
  'collection_address' : [] | [string],
  'manifest_url' : [] | [string],
  'collection_created' : boolean,
  'deployment_stage' : MovementDeploymentStage,
}
export type MovementDeploymentStage = { 'Deployed' : null } |
  { 'FilesUploading' : null } |
  { 'CollectionDeploying' : null };
export type Result = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : string } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : string };
export interface SetFeaturedArgs {
  'collection_id' : string,
  'is_featured' : boolean,
}
export interface SetSaleEndedArgs {
  'collection_id' : string,
  'ended' : boolean,
}
export interface SetVerifiedArgs {
  'collection_id' : string,
  'is_verified' : boolean,
}
export interface Socials {
  'twitter' : [] | [string],
  'website' : [] | [string],
  'discord' : [] | [string],
  'telegram' : [] | [string],
}
export type SolanaCollectionData = { 'Core' : CoreCollectionData } |
  { 'Compressed' : CompressedCollectionData } |
  { 'Legacy' : LegacyCollectionData };
export type SolanaDeploymentStage = { 'Deploying' : null } |
  { 'Deployed' : null } |
  { 'FilesUploading' : null } |
  { 'MetadataCreating' : null };
export interface SolanaSaleConfig { 'sale_type' : SolanaSaleType }
export type SolanaSaleType = { 'OpenEdition' : null } |
  { 'FixedPrice' : null } |
  { 'DutchAuction' : null };
export type SolanaStageUpdateData = { 'Core' : CoreStageUpdate } |
  { 'Compressed' : CompressedStageUpdate } |
  { 'Legacy' : LegacyStageUpdate };
export interface UpdateCategoryArgs {
  'collection_id' : string,
  'category' : [] | [CollectionCategory],
}
export interface UpdateCollectionStatusArgs {
  'status' : CollectionStatus,
  'collection_id' : string,
}
export interface UpdateEthereumStageArgs {
  'files_uploaded' : [] | [boolean],
  'manifest_url' : [] | [string],
  'collection_id' : string,
  'stage' : EthereumDeploymentStage,
  'contract_address' : [] | [string],
  'owner_address' : [] | [string],
}
export interface UpdateInitialSaleArgs {
  'initial_sale' : [] | [InitialSale],
  'collection_id' : string,
}
export interface UpdateMovementStageArgs {
  'collection_address' : [] | [string],
  'manifest_url' : [] | [string],
  'collection_id' : string,
  'collection_created' : [] | [boolean],
  'stage' : MovementDeploymentStage,
}
export interface UpdateSlugArgs { 'slug' : string, 'collection_id' : string }
export interface UpdateSocialsArgs {
  'collection_id' : string,
  'socials' : [] | [Socials],
}
export interface UpdateSolanaStageArgs {
  'update_data' : SolanaStageUpdateData,
  'collection_id' : string,
}
export interface UpdateTagsArgs {
  'tags' : Array<string>,
  'collection_id' : string,
}
export interface _SERVICE {
  'admin_migrate_collections' : ActorMethod<[], Result>,
  'admin_remove_collection' : ActorMethod<[string], Result_1>,
  'admin_set_featured' : ActorMethod<[SetFeaturedArgs], Result_2>,
  'admin_set_verified' : ActorMethod<[SetVerifiedArgs], Result_2>,
  'create_collection' : ActorMethod<[CreateCollectionArgs], Result_1>,
  'get_all_collections' : ActorMethod<[number, number], Array<Collection>>,
  'get_all_draft_collections' : ActorMethod<
    [number, number],
    Array<Collection>
  >,
  'get_collection' : ActorMethod<[string], [] | [Collection]>,
  'get_collection_by_slug' : ActorMethod<[string], [] | [Collection]>,
  'get_collections_by_blockchain' : ActorMethod<
    [Blockchain, number, number],
    Array<Collection>
  >,
  'get_collections_by_category' : ActorMethod<
    [CollectionCategory, number, number],
    Array<Collection>
  >,
  'get_collections_paginated' : ActorMethod<
    [bigint, bigint],
    CollectionsResult
  >,
  'get_creator_draft_collections' : ActorMethod<[Principal], Array<Collection>>,
  'get_ended_sales' : ActorMethod<[number, number], Array<Collection>>,
  'get_featured_collections' : ActorMethod<[number, number], Array<Collection>>,
  'get_latest_collections' : ActorMethod<[bigint], CollectionsResult>,
  'get_live_sales' : ActorMethod<[number, number], Array<Collection>>,
  'get_my_draft_collections' : ActorMethod<[], Array<Collection>>,
  'get_total_collections' : ActorMethod<[], bigint>,
  'get_upcoming_sales' : ActorMethod<[number, number], Array<Collection>>,
  'get_user_collections' : ActorMethod<[number, number], Array<Collection>>,
  'get_verified_collections' : ActorMethod<[number, number], Array<Collection>>,
  'set_sale_ended' : ActorMethod<[SetSaleEndedArgs], Result_2>,
  'update_category' : ActorMethod<[UpdateCategoryArgs], Result_2>,
  'update_collection_status' : ActorMethod<
    [UpdateCollectionStatusArgs],
    Result_2
  >,
  'update_ethereum_stage' : ActorMethod<[UpdateEthereumStageArgs], Result_2>,
  'update_initial_sale' : ActorMethod<[UpdateInitialSaleArgs], Result_2>,
  'update_movement_stage' : ActorMethod<[UpdateMovementStageArgs], Result_2>,
  'update_slug' : ActorMethod<[UpdateSlugArgs], Result_2>,
  'update_socials' : ActorMethod<[UpdateSocialsArgs], Result_2>,
  'update_solana_stage' : ActorMethod<[UpdateSolanaStageArgs], Result_2>,
  'update_tags' : ActorMethod<[UpdateTagsArgs], Result_2>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
