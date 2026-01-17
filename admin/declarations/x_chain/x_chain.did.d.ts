import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type CommitmentLevel = { 'finalized' : null } |
  { 'confirmed' : null } |
  { 'processed' : null };
export type Ed25519KeyName = { 'MainnetTestKey1' : null } |
  { 'LocalDevelopment' : null } |
  { 'MainnetProdKey1' : null };
export interface HttpHeader { 'value' : string, 'name' : string }
export interface InitArgs {
  'admin' : Principal,
  'solana_commitment_level' : [] | [CommitmentLevel],
  'ed25519_key_name' : [] | [Ed25519KeyName],
  'solana_network' : [] | [SolanaNetwork],
  'sol_rpc_canister_id' : [] | [Principal],
}
export interface RpcEndpoint {
  'url' : string,
  'headers' : [] | [Array<HttpHeader>],
}
export type SolanaNetwork = { 'Mainnet' : null } |
  { 'Custom' : RpcEndpoint } |
  { 'Devnet' : null };
export interface TokenAmount {
  'decimals' : number,
  'uiAmount' : [] | [number],
  'uiAmountString' : string,
  'amount' : string,
}
export interface _SERVICE {
  'associated_token_account' : ActorMethod<[[] | [Principal], string], string>,
  'create_associated_token_account' : ActorMethod<
    [[] | [Principal], string],
    string
  >,
  'create_nonce_account' : ActorMethod<[[] | [Principal]], string>,
  'get_balance' : ActorMethod<[[] | [string]], bigint>,
  'get_nonce' : ActorMethod<[[] | [string]], string>,
  'get_spl_token_balance' : ActorMethod<[[] | [string], string], TokenAmount>,
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
  'solana_account' : ActorMethod<[[] | [Principal]], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
