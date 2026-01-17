export const idlFactory = ({ IDL }) => {
  const CommitmentLevel = IDL.Variant({
    'finalized' : IDL.Null,
    'confirmed' : IDL.Null,
    'processed' : IDL.Null,
  });
  const Ed25519KeyName = IDL.Variant({
    'MainnetTestKey1' : IDL.Null,
    'LocalDevelopment' : IDL.Null,
    'MainnetProdKey1' : IDL.Null,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const RpcEndpoint = IDL.Record({
    'url' : IDL.Text,
    'headers' : IDL.Opt(IDL.Vec(HttpHeader)),
  });
  const SolanaNetwork = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Custom' : RpcEndpoint,
    'Devnet' : IDL.Null,
  });
  const InitArgs = IDL.Record({
    'admin' : IDL.Principal,
    'solana_commitment_level' : IDL.Opt(CommitmentLevel),
    'ed25519_key_name' : IDL.Opt(Ed25519KeyName),
    'solana_network' : IDL.Opt(SolanaNetwork),
    'sol_rpc_canister_id' : IDL.Opt(IDL.Principal),
  });
  const TokenAmount = IDL.Record({
    'decimals' : IDL.Nat8,
    'uiAmount' : IDL.Opt(IDL.Float64),
    'uiAmountString' : IDL.Text,
    'amount' : IDL.Text,
  });
  return IDL.Service({
    'associated_token_account' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text],
        [IDL.Text],
        [],
      ),
    'create_associated_token_account' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text],
        [IDL.Text],
        [],
      ),
    'create_nonce_account' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
    'get_balance' : IDL.Func([IDL.Opt(IDL.Text)], [IDL.Nat], []),
    'get_nonce' : IDL.Func([IDL.Opt(IDL.Text)], [IDL.Text], []),
    'get_spl_token_balance' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Text],
        [TokenAmount],
        [],
      ),
    'nonce_account' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
    'send_sol' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'send_sol_with_durable_nonce' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'send_spl_token' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text, IDL.Text, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'solana_account' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => {
  const CommitmentLevel = IDL.Variant({
    'finalized' : IDL.Null,
    'confirmed' : IDL.Null,
    'processed' : IDL.Null,
  });
  const Ed25519KeyName = IDL.Variant({
    'MainnetTestKey1' : IDL.Null,
    'LocalDevelopment' : IDL.Null,
    'MainnetProdKey1' : IDL.Null,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const RpcEndpoint = IDL.Record({
    'url' : IDL.Text,
    'headers' : IDL.Opt(IDL.Vec(HttpHeader)),
  });
  const SolanaNetwork = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Custom' : RpcEndpoint,
    'Devnet' : IDL.Null,
  });
  const InitArgs = IDL.Record({
    'admin' : IDL.Principal,
    'solana_commitment_level' : IDL.Opt(CommitmentLevel),
    'ed25519_key_name' : IDL.Opt(Ed25519KeyName),
    'solana_network' : IDL.Opt(SolanaNetwork),
    'sol_rpc_canister_id' : IDL.Opt(IDL.Principal),
  });
  return [InitArgs];
};
