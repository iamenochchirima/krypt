export const idlFactory = ({ IDL }) => {
  const ChainBalance = IDL.Record({
    'balance' : IDL.Float64,
    'chain' : IDL.Text,
    'address' : IDL.Text,
  });
  const PaymentRecord = IDL.Record({
    'id' : IDL.Text,
    'from' : IDL.Text,
    'chain' : IDL.Text,
    'tx_signature' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'amount' : IDL.Float64,
    'purpose' : IDL.Text,
  });
  const PlatformWallets = IDL.Record({
    'solana' : IDL.Opt(IDL.Text),
    'ethereum' : IDL.Opt(IDL.Text),
    'bitcoin' : IDL.Opt(IDL.Text),
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'get_balances' : IDL.Func([], [IDL.Vec(ChainBalance)], ['query']),
    'get_payments' : IDL.Func([], [IDL.Vec(PaymentRecord)], ['query']),
    'get_platform_wallets' : IDL.Func([], [PlatformWallets], ['query']),
    'record_payment' : IDL.Func([PaymentRecord], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
