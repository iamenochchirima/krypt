import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BuyNFTArgs { 'listing_id' : string }
export interface CollectionInfo {
  'id' : Principal,
  'floor_price' : [] | [bigint],
  'status' : CollectionStatus,
  'creator' : Principal,
  'supply_cap' : [] | [bigint],
  'logo' : [] | [string],
  'name' : string,
  'description' : [] | [string],
  'created_at' : bigint,
  'total_volume' : bigint,
  'total_supply' : bigint,
  'symbol' : string,
}
export type CollectionStatus = { 'Paused' : null } |
  { 'AssetsPending' : null } |
  { 'Active' : null } |
  { 'Banned' : null };
export interface CreateCollectionArgs {
  'supply_cap' : [] | [bigint],
  'logo' : [] | [string],
  'description' : [] | [string],
  'collection_name' : string,
  'collection_symbol' : string,
  'collection_metadata' : Array<[string, string]>,
}
export interface CreateCollectionResponse {
  'transaction_id' : bigint,
  'collection_canister_id' : Principal,
}
export interface InitArgs {
  'admin' : Principal,
  'collection_creation_fee' : bigint,
  'marketplace_fee_percentage' : number,
}
export interface ListNFTArgs {
  'duration' : [] | [bigint],
  'token_id' : bigint,
  'collection_id' : Principal,
  'price' : bigint,
}
export interface ListingInfo {
  'status' : ListingStatus,
  'token_id' : bigint,
  'collection_id' : Principal,
  'created_at' : bigint,
  'seller' : Principal,
  'listing_id' : string,
  'price' : bigint,
  'expires_at' : [] | [bigint],
}
export type ListingStatus = { 'Sold' : null } |
  { 'Active' : null } |
  { 'Cancelled' : null } |
  { 'Expired' : null };
export interface MarketplaceConfig {
  'admin' : Principal,
  'collection_creation_fee' : bigint,
  'marketplace_fee_percentage' : number,
  'min_listing_price' : bigint,
  'supported_tokens' : Array<Principal>,
  'max_listing_duration' : bigint,
}
export type MarketplaceError = { 'InvalidInput' : string } |
  { 'TokenNotFound' : null } |
  { 'EncodingError' : string } |
  { 'InvalidPrice' : null } |
  { 'ListingNotActive' : null } |
  { 'InvalidCollectionName' : null } |
  { 'PaymentFailed' : string } |
  { 'CollectionNotFound' : null } |
  { 'SystemError' : string } |
  { 'InvalidFeePercentage' : null } |
  { 'TokenNotOwned' : null } |
  { 'CanisterInstallationFailed' : string } |
  { 'InvalidDescription' : null } |
  { 'InsufficientApproval' : null } |
  { 'NotAuthorized' : null } |
  { 'CanisterCreationFailed' : string } |
  { 'CannotBuyOwnListing' : null } |
  { 'InvalidDuration' : null } |
  { 'ListingExpired' : null } |
  { 'TransferFailed' : string } |
  { 'CollectionNameAlreadyExists' : null } |
  { 'InvalidLogoUrl' : null } |
  { 'InvalidCollectionSymbol' : null } |
  { 'InsufficientFunds' : null } |
  { 'ListingNotFound' : null } |
  { 'ListingAlreadyCancelled' : null };
export interface MarketplaceStats {
  'active_collections' : bigint,
  'collection_creation_fee' : bigint,
  'total_collections' : bigint,
  'marketplace_fee_percentage' : number,
  'total_volume' : bigint,
}
export interface PaginatedCollections {
  'collections' : Array<CollectionInfo>,
  'total_count' : bigint,
  'has_more' : boolean,
}
export interface PaginatedListings {
  'listings' : Array<ListingInfo>,
  'total_count' : bigint,
  'has_more' : boolean,
}
export type Result = { 'Ok' : null } |
  { 'Err' : MarketplaceError };
export type Result_1 = { 'Ok' : CreateCollectionResponse } |
  { 'Err' : MarketplaceError };
export type Result_2 = { 'Ok' : CollectionInfo } |
  { 'Err' : MarketplaceError };
export type Result_3 = { 'Ok' : ListingInfo } |
  { 'Err' : MarketplaceError };
export type Result_4 = { 'Ok' : string } |
  { 'Err' : MarketplaceError };
export interface SaleInfo {
  'transaction_hash' : string,
  'token_id' : bigint,
  'collection_id' : Principal,
  'sale_time' : bigint,
  'seller' : Principal,
  'buyer' : Principal,
  'listing_id' : string,
  'price' : bigint,
  'marketplace_fee' : bigint,
}
export interface _SERVICE {
  'activate_collection' : ActorMethod<[Principal], Result>,
  'buy_nft' : ActorMethod<[BuyNFTArgs], Result>,
  'cancel_listing' : ActorMethod<[string], Result>,
  'create_collection' : ActorMethod<[CreateCollectionArgs], Result_1>,
  'get_active_listings' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    PaginatedListings
  >,
  'get_admin' : ActorMethod<[], Principal>,
  'get_all_collections' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    PaginatedCollections
  >,
  'get_collection_by_name_query' : ActorMethod<[string], Result_2>,
  'get_collection_info' : ActorMethod<[Principal], Result_2>,
  'get_collections_by_creator_query' : ActorMethod<
    [Principal],
    Array<CollectionInfo>
  >,
  'get_listing' : ActorMethod<[string], Result_3>,
  'get_listings_by_collection' : ActorMethod<
    [Principal, [] | [bigint], [] | [bigint]],
    PaginatedListings
  >,
  'get_listings_by_seller' : ActorMethod<
    [Principal, [] | [bigint], [] | [bigint]],
    PaginatedListings
  >,
  'get_marketplace_config' : ActorMethod<[], MarketplaceConfig>,
  'get_marketplace_stats' : ActorMethod<[], MarketplaceStats>,
  'get_sales_history' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<SaleInfo>
  >,
  'get_user_collections' : ActorMethod<[Principal], Array<CollectionInfo>>,
  'list_nft' : ActorMethod<[ListNFTArgs], Result_4>,
  'transfer_admin' : ActorMethod<[Principal], Result>,
  'update_collection_creation_fee' : ActorMethod<[bigint], Result>,
  'update_collection_status' : ActorMethod<
    [Principal, CollectionStatus],
    Result
  >,
  'update_marketplace_config' : ActorMethod<[MarketplaceConfig], Result>,
  'update_marketplace_fee_percentage' : ActorMethod<[number], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
