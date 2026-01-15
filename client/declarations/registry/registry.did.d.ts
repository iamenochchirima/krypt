import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Blockchain = { 'ICP' : null } |
  { 'Ethereum' : null } |
  { 'Solana' : null } |
  { 'Movement' : null };
export interface CandyMachineConfig {
  'seller_fee_basis_points' : number,
  'items_available' : bigint,
  'go_live_date' : [] | [bigint],
  'price' : bigint,
  'symbol' : string,
}
export type ChainData = { 'ICP' : ICPCollectionData } |
  { 'Ethereum' : EthereumCollectionData } |
  { 'Solana' : SolanaCollectionData } |
  { 'Movement' : MovementCollectionData };
export interface Collection {
  'id' : string,
  'floor_price' : bigint,
  'status' : CollectionStatus,
  'updated_at' : bigint,
  'creator' : Principal,
  'initial_sale' : [] | [InitialSale],
  'image_url' : string,
  'metadata' : Array<[string, string]>,
  'banner_url' : [] | [string],
  'owner_count' : number,
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'blockchain' : Blockchain,
  'listed_count' : number,
  'total_volume' : bigint,
  'chain_data' : ChainData,
  'total_supply' : bigint,
  'symbol' : string,
  'royalty_bps' : number,
}
export type CollectionStatus = { 'Minting' : null } |
  { 'Paused' : null } |
  { 'Active' : null } |
  { 'Draft' : null } |
  { 'Completed' : null };
export interface CreateCollectionArgs {
  'image_url' : string,
  'metadata' : Array<[string, string]>,
  'banner_url' : [] | [string],
  'name' : string,
  'description' : string,
  'blockchain' : Blockchain,
  'chain_data' : ChainData,
  'total_supply' : bigint,
  'symbol' : string,
  'royalty_bps' : number,
}
export interface EthereumCollectionData {
  'chain_id' : bigint,
  'deployment_stage' : EthereumDeploymentStage,
  'contract_address' : [] | [string],
}
export type EthereumDeploymentStage = { 'ContractDeploying' : null } |
  { 'Deployed' : null };
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
export interface MovementCollectionData {
  'collection_address' : [] | [string],
  'manifest_url' : [] | [string],
  'collection_created' : boolean,
  'deployment_stage' : MovementDeploymentStage,
}
export type MovementDeploymentStage = { 'Deployed' : null } |
  { 'FilesUploading' : null } |
  { 'CollectionDeploying' : null };
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : null } |
  { 'Err' : string };
export interface SetSaleEndedArgs {
  'collection_id' : string,
  'ended' : boolean,
}
export interface SolanaCollectionData {
  'files_uploaded' : boolean,
  'metadata_created' : boolean,
  'manifest_url' : [] | [string],
  'candy_machine_config' : [] | [CandyMachineConfig],
  'collection_mint' : [] | [string],
  'candy_machine_address' : [] | [string],
  'deployment_stage' : SolanaDeploymentStage,
  'candy_machine_items_uploaded' : boolean,
  'candy_machine_authority' : [] | [string],
}
export type SolanaDeploymentStage = { 'CandyMachineDeploying' : null } |
  { 'Deployed' : null } |
  { 'FilesUploading' : null } |
  { 'MetadataCreating' : null };
export interface SolanaSaleConfig { 'sale_type' : SolanaSaleType }
export type SolanaSaleType = { 'OpenEdition' : null } |
  { 'FixedPrice' : null } |
  { 'DutchAuction' : null };
export interface UpdateCollectionStatusArgs {
  'status' : CollectionStatus,
  'collection_id' : string,
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
export interface UpdateSolanaStageArgs {
  'files_uploaded' : [] | [boolean],
  'metadata_created' : [] | [boolean],
  'manifest_url' : [] | [string],
  'collection_id' : string,
  'candy_machine_config' : [] | [CandyMachineConfig],
  'collection_mint' : [] | [string],
  'stage' : SolanaDeploymentStage,
  'candy_machine_address' : [] | [string],
  'candy_machine_authority' : [] | [string],
}
export interface _SERVICE {
  'admin_remove_collection' : ActorMethod<[string], Result>,
  'create_collection' : ActorMethod<[CreateCollectionArgs], Result>,
  'get_all_collections' : ActorMethod<[number, number], Array<Collection>>,
  'get_all_draft_collections' : ActorMethod<
    [number, number],
    Array<Collection>
  >,
  'get_collection' : ActorMethod<[string], [] | [Collection]>,
  'get_collections_by_blockchain' : ActorMethod<
    [Blockchain, number, number],
    Array<Collection>
  >,
  'get_creator_draft_collections' : ActorMethod<[Principal], Array<Collection>>,
  'get_ended_sales' : ActorMethod<[number, number], Array<Collection>>,
  'get_live_sales' : ActorMethod<[number, number], Array<Collection>>,
  'get_my_draft_collections' : ActorMethod<[], Array<Collection>>,
  'get_upcoming_sales' : ActorMethod<[number, number], Array<Collection>>,
  'get_user_collections' : ActorMethod<[number, number], Array<Collection>>,
  'set_sale_ended' : ActorMethod<[SetSaleEndedArgs], Result_1>,
  'update_collection_status' : ActorMethod<
    [UpdateCollectionStatusArgs],
    Result_1
  >,
  'update_initial_sale' : ActorMethod<[UpdateInitialSaleArgs], Result_1>,
  'update_movement_stage' : ActorMethod<[UpdateMovementStageArgs], Result_1>,
  'update_solana_stage' : ActorMethod<[UpdateSolanaStageArgs], Result_1>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
