import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ChainBalance {
  'balance' : number,
  'chain' : string,
  'address' : string,
}
export interface PaymentRecord {
  'id' : string,
  'from' : string,
  'chain' : string,
  'tx_signature' : string,
  'timestamp' : bigint,
  'amount' : number,
  'purpose' : string,
}
export interface PlatformWallets {
  'solana' : [] | [string],
  'ethereum' : [] | [string],
  'bitcoin' : [] | [string],
}
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE {
  'get_balances' : ActorMethod<[], Array<ChainBalance>>,
  'get_payments' : ActorMethod<[], Array<PaymentRecord>>,
  'get_platform_wallets' : ActorMethod<[], PlatformWallets>,
  'record_payment' : ActorMethod<[PaymentRecord], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
