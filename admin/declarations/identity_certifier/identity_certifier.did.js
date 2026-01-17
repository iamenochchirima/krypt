export const idlFactory = ({ IDL }) => {
  const Response = IDL.Variant({
    'Ok' : IDL.Null,
    'NotConfirmed' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'Expired' : IDL.Null,
    'InvalidSession' : IDL.Null,
  });
  const NanosecondsTimeStamp = IDL.Nat;
  const IcIdentityVerifier = IDL.Service({
    'confirmIdentity' : IDL.Func([IDL.Text], [Response], []),
    'documentation' : IDL.Func([], [IDL.Text], ['query']),
    'initiateAuth' : IDL.Func(
        [IDL.Text, IDL.Opt(NanosecondsTimeStamp)],
        [Response],
        [],
      ),
    'verifyIdentity' : IDL.Func(
        [IDL.Text],
        [Response, IDL.Opt(IDL.Principal)],
        [],
      ),
  });
  return IcIdentityVerifier;
};
export const init = ({ IDL }) => { return [IDL.Principal]; };
