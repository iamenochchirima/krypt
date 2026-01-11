import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AccountMeta {
  'is_signer' : boolean,
  'pubkey' : string,
  'is_writable' : boolean,
}
export interface BitcoinCollectionData {
  'deployment_stage' : BitcoinDeploymentStage,
  'inscription_ids' : Array<string>,
}
export type BitcoinDeploymentStage = { 'InscriptionsCreating' : null } |
  { 'Deployed' : null };
export type Blockchain = { 'ICP' : null } |
  { 'Ethereum' : null } |
  { 'Solana' : null } |
  { 'Bitcoin' : null } |
  { 'Movement' : null } |
  { 'Casper' : null };
export interface CandyMachineConfig {
  'seller_fee_basis_points' : number,
  'items_available' : bigint,
  'go_live_date' : [] | [bigint],
  'price' : bigint,
  'symbol' : string,
}
export interface CanisterSolanaInfo {
  'canister_id' : string,
  'main_solana_address' : string,
}
export interface CasperCollectionData {
  'contract_hash' : [] | [string],
  'holder_mode' : [] | [number],
  'events_mode' : [] | [number],
  'owner_reverse_lookup_mode' : [] | [number],
  'ownership_mode' : number,
  'burn_mode' : [] | [number],
  'metadata_mutability' : number,
  'json_schema' : string,
  'contract_package_hash' : [] | [string],
  'nft_kind' : [] | [number],
  'allow_minting' : [] | [boolean],
  'whitelist_mode' : [] | [number],
  'minting_mode' : [] | [number],
  'deployment_stage' : CasperDeploymentStage,
  'identifier_mode' : number,
  'total_token_supply' : bigint,
  'nft_metadata_kind' : number,
}
export type CasperDeploymentStage = { 'ContractDeploying' : null } |
  { 'Minting' : null } |
  { 'ContractPreparing' : null } |
  { 'Deployed' : null } |
  { 'ContractDeployed' : null };
export type ChainData = { 'ICP' : ICPCollectionData } |
  { 'Ethereum' : EthereumCollectionData } |
  { 'Solana' : SolanaCollectionData } |
  { 'Bitcoin' : BitcoinCollectionData } |
  { 'Movement' : MovementCollectionData } |
  { 'Casper' : CasperCollectionData };
export interface Collection {
  'id' : string,
  'floor_price' : bigint,
  'status' : CollectionStatus,
  'updated_at' : bigint,
  'creator' : Principal,
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
export interface CollectionSolanaAccounts {
  'collection_id' : string,
  'collection_mint' : [] | [string],
  'candy_machine_address' : string,
  'payer_address' : string,
}
export type CollectionStatus = { 'Minting' : null } |
  { 'Paused' : null } |
  { 'Active' : null } |
  { 'Draft' : null } |
  { 'Completed' : null };
export type CommitmentLevel = { 'finalized' : null } |
  { 'confirmed' : null } |
  { 'processed' : null };
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
export interface CreateListingArgs {
  'nft_id' : string,
  'nft_metadata' : NftMetadata,
  'collection_id' : string,
  'currency' : string,
  'seller_address' : string,
  'price' : bigint,
  'expires_at' : [] | [bigint],
}
export type Ed25519KeyName = { 'MainnetTestKey1' : null } |
  { 'LocalDevelopment' : null } |
  { 'MainnetProdKey1' : null };
export interface EthereumCollectionData {
  'chain_id' : bigint,
  'deployment_stage' : EthereumDeploymentStage,
  'contract_address' : [] | [string],
}
export type EthereumDeploymentStage = { 'ContractDeploying' : null } |
  { 'Deployed' : null };
export interface HttpHeader { 'value' : string, 'name' : string }
export interface ICPCollectionData {
  'canister_id' : [] | [Principal],
  'deployment_stage' : ICPDeploymentStage,
}
export type ICPDeploymentStage = { 'CanisterDeploying' : null } |
  { 'CanisterCreating' : null } |
  { 'Deployed' : null };
export interface InitArgs {
  'admin' : Principal,
  'solana_commitment_level' : [] | [CommitmentLevel],
  'ed25519_key_name' : [] | [Ed25519KeyName],
  'solana_network' : [] | [SolanaNetwork],
  'sol_rpc_canister_id' : [] | [Principal],
}
export interface InstructionData {
  'data' : Uint8Array | number[],
  'program_id' : string,
  'accounts' : Array<AccountMeta>,
}
export interface Listing {
  'id' : string,
  'nft_id' : string,
  'status' : ListingStatus,
  'updated_at' : bigint,
  'escrow_address' : [] | [string],
  'nft_metadata' : NftMetadata,
  'collection_id' : string,
  'seller' : Principal,
  'blockchain' : Blockchain,
  'currency' : string,
  'seller_address' : string,
  'price' : bigint,
  'expires_at' : [] | [bigint],
  'listed_at' : bigint,
}
export type ListingStatus = { 'Sold' : null } |
  { 'Active' : null } |
  { 'Cancelled' : null } |
  { 'Expired' : null };
export interface MovementCollectionData {
  'collection_address' : [] | [string],
  'manifest_url' : [] | [string],
  'collection_created' : boolean,
  'deployment_stage' : MovementDeploymentStage,
}
export type MovementDeploymentStage = { 'FilesUploaded' : null } |
  { 'Deployed' : null } |
  { 'FilesUploading' : null } |
  { 'CollectionDeploying' : null };
export interface NftAttribute { 'trait_type' : string, 'value' : string }
export interface NftMetadata {
  'image_url' : string,
  'name' : string,
  'attributes' : Array<NftAttribute>,
}
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : CanisterSolanaInfo } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : CollectionSolanaAccounts } |
  { 'Err' : string };
export interface RpcEndpoint {
  'url' : string,
  'headers' : [] | [Array<HttpHeader>],
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
  { 'MetadataCreated' : null } |
  { 'FilesUploaded' : null } |
  { 'Deployed' : null } |
  { 'FilesUploading' : null } |
  { 'MetadataCreating' : null };
export type SolanaNetwork = { 'Mainnet' : null } |
  { 'Custom' : RpcEndpoint } |
  { 'Devnet' : null };
export interface TokenAmount {
  'decimals' : number,
  'uiAmount' : [] | [number],
  'uiAmountString' : string,
  'amount' : string,
}
export type TransactionType = { 'UpdateCandyMachine' : null } |
  { 'TransferAuthority' : null } |
  { 'CreateCandyMachine' : null };
export interface UpdateCasperStageArgs {
  'contract_hash' : [] | [string],
  'holder_mode' : [] | [number],
  'events_mode' : [] | [number],
  'owner_reverse_lookup_mode' : [] | [number],
  'collection_id' : string,
  'ownership_mode' : [] | [number],
  'burn_mode' : [] | [number],
  'metadata_mutability' : [] | [number],
  'json_schema' : [] | [string],
  'contract_package_hash' : [] | [string],
  'nft_kind' : [] | [number],
  'allow_minting' : [] | [boolean],
  'stage' : CasperDeploymentStage,
  'whitelist_mode' : [] | [number],
  'minting_mode' : [] | [number],
  'identifier_mode' : [] | [number],
  'total_token_supply' : [] | [bigint],
  'nft_metadata_kind' : [] | [number],
}
export interface UpdateCollectionStatusArgs {
  'status' : CollectionStatus,
  'collection_id' : string,
}
export interface UpdateListingArgs {
  'status' : [] | [ListingStatus],
  'listing_id' : string,
  'price' : [] | [bigint],
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
  'add_items_to_candy_machine' : ActorMethod<[string, InstructionData], Result>,
  'admin_remove_collection' : ActorMethod<[string], Result>,
  'associated_token_account' : ActorMethod<[[] | [Principal], string], string>,
  'cancel_listing' : ActorMethod<[string, string], Result_1>,
  'clear_old_collections' : ActorMethod<[], Result_1>,
  'create_associated_token_account' : ActorMethod<
    [[] | [Principal], string],
    string
  >,
  'create_candy_machine_from_instruction' : ActorMethod<
    [string, Array<InstructionData>],
    Result
  >,
  'create_collection' : ActorMethod<[CreateCollectionArgs], Result>,
  'create_listing' : ActorMethod<[CreateListingArgs, Blockchain], Result>,
  'create_nonce_account' : ActorMethod<[[] | [Principal]], string>,
  'get_all_collections' : ActorMethod<[number, number], Array<Collection>>,
  'get_all_draft_collections' : ActorMethod<
    [number, number],
    Array<Collection>
  >,
  'get_balance' : ActorMethod<[[] | [string]], bigint>,
  'get_canister_solana_info' : ActorMethod<[], Result_2>,
  'get_collection' : ActorMethod<[string], [] | [Collection]>,
  'get_collection_listing_count' : ActorMethod<[string], number>,
  'get_collection_listings' : ActorMethod<
    [string, number, number, [] | [ListingStatus]],
    Array<Listing>
  >,
  'get_collection_solana_accounts' : ActorMethod<[string], Result_3>,
  'get_collections_by_blockchain' : ActorMethod<
    [Blockchain, number, number],
    Array<Collection>
  >,
  'get_creator_draft_collections' : ActorMethod<[Principal], Array<Collection>>,
  'get_listing' : ActorMethod<[string, string], [] | [Listing]>,
  'get_my_draft_collections' : ActorMethod<[], Array<Collection>>,
  'get_nonce' : ActorMethod<[[] | [string]], string>,
  'get_old_collections_count' : ActorMethod<[], bigint>,
  'get_spl_token_balance' : ActorMethod<[[] | [string], string], TokenAmount>,
  'get_user_collections' : ActorMethod<[number, number], Array<Collection>>,
  'get_user_listings' : ActorMethod<[number, number], Array<Listing>>,
  'migrate_collections' : ActorMethod<[], undefined>,
  'nonce_account' : ActorMethod<[[] | [Principal]], string>,
  'send_sol' : ActorMethod<[[] | [Principal], string, bigint], string>,
  'send_sol_with_durable_nonce' : ActorMethod<
    [[] | [Principal], string, bigint],
    string
  >,
  'send_spl_token' : ActorMethod<
    [[] | [Principal], string, string, bigint],
    string
  >,
  'sign_and_send_solana_transaction' : ActorMethod<
    [string, Uint8Array | number[], TransactionType, [] | [string]],
    Result
  >,
  'solana_account' : ActorMethod<[[] | [Principal]], string>,
  'update_candy_machine_address' : ActorMethod<[string, string], Result_1>,
  'update_casper_stage' : ActorMethod<[UpdateCasperStageArgs], Result_1>,
  'update_collection_status' : ActorMethod<
    [UpdateCollectionStatusArgs],
    Result_1
  >,
  'update_listing' : ActorMethod<[UpdateListingArgs, string], Result_1>,
  'update_movement_stage' : ActorMethod<[UpdateMovementStageArgs], Result_1>,
  'update_solana_stage' : ActorMethod<[UpdateSolanaStageArgs], Result_1>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
