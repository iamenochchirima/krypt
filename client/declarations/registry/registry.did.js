export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'admin' : IDL.Principal });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const Blockchain = IDL.Variant({
    'ICP' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Solana' : IDL.Null,
    'Movement' : IDL.Null,
  });
  const ICPDeploymentStage = IDL.Variant({
    'CanisterDeploying' : IDL.Null,
    'CanisterCreating' : IDL.Null,
    'Deployed' : IDL.Null,
  });
  const ICPCollectionData = IDL.Record({
    'canister_id' : IDL.Opt(IDL.Principal),
    'deployment_stage' : ICPDeploymentStage,
  });
  const EthereumDeploymentStage = IDL.Variant({
    'ContractDeploying' : IDL.Null,
    'Deployed' : IDL.Null,
  });
  const EthereumCollectionData = IDL.Record({
    'chain_id' : IDL.Nat64,
    'deployment_stage' : EthereumDeploymentStage,
    'contract_address' : IDL.Opt(IDL.Text),
  });
  const CandyMachineConfig = IDL.Record({
    'seller_fee_basis_points' : IDL.Nat16,
    'items_available' : IDL.Nat64,
    'go_live_date' : IDL.Opt(IDL.Nat64),
    'price' : IDL.Nat64,
    'symbol' : IDL.Text,
  });
  const SolanaDeploymentStage = IDL.Variant({
    'CandyMachineDeploying' : IDL.Null,
    'Deployed' : IDL.Null,
    'FilesUploading' : IDL.Null,
    'MetadataCreating' : IDL.Null,
  });
  const SolanaCollectionData = IDL.Record({
    'files_uploaded' : IDL.Bool,
    'metadata_created' : IDL.Bool,
    'manifest_url' : IDL.Opt(IDL.Text),
    'candy_machine_config' : IDL.Opt(CandyMachineConfig),
    'collection_mint' : IDL.Opt(IDL.Text),
    'candy_machine_address' : IDL.Opt(IDL.Text),
    'deployment_stage' : SolanaDeploymentStage,
    'candy_machine_items_uploaded' : IDL.Bool,
    'candy_machine_authority' : IDL.Opt(IDL.Text),
  });
  const MovementDeploymentStage = IDL.Variant({
    'Deployed' : IDL.Null,
    'FilesUploading' : IDL.Null,
    'CollectionDeploying' : IDL.Null,
  });
  const MovementCollectionData = IDL.Record({
    'collection_address' : IDL.Opt(IDL.Text),
    'manifest_url' : IDL.Opt(IDL.Text),
    'collection_created' : IDL.Bool,
    'deployment_stage' : MovementDeploymentStage,
  });
  const ChainData = IDL.Variant({
    'ICP' : ICPCollectionData,
    'Ethereum' : EthereumCollectionData,
    'Solana' : SolanaCollectionData,
    'Movement' : MovementCollectionData,
  });
  const CreateCollectionArgs = IDL.Record({
    'image_url' : IDL.Text,
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'banner_url' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'blockchain' : Blockchain,
    'chain_data' : ChainData,
    'total_supply' : IDL.Nat64,
    'symbol' : IDL.Text,
    'royalty_bps' : IDL.Nat16,
  });
  const CollectionStatus = IDL.Variant({
    'Minting' : IDL.Null,
    'Paused' : IDL.Null,
    'Active' : IDL.Null,
    'Draft' : IDL.Null,
    'Completed' : IDL.Null,
  });
  const Collection = IDL.Record({
    'id' : IDL.Text,
    'floor_price' : IDL.Nat64,
    'status' : CollectionStatus,
    'updated_at' : IDL.Nat64,
    'creator' : IDL.Principal,
    'image_url' : IDL.Text,
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'banner_url' : IDL.Opt(IDL.Text),
    'owner_count' : IDL.Nat32,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'blockchain' : Blockchain,
    'listed_count' : IDL.Nat32,
    'total_volume' : IDL.Nat64,
    'chain_data' : ChainData,
    'total_supply' : IDL.Nat64,
    'symbol' : IDL.Text,
    'royalty_bps' : IDL.Nat16,
  });
  const UpdateCollectionStatusArgs = IDL.Record({
    'status' : CollectionStatus,
    'collection_id' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const UpdateMovementStageArgs = IDL.Record({
    'collection_address' : IDL.Opt(IDL.Text),
    'manifest_url' : IDL.Opt(IDL.Text),
    'collection_id' : IDL.Text,
    'collection_created' : IDL.Opt(IDL.Bool),
    'stage' : MovementDeploymentStage,
  });
  const UpdateSolanaStageArgs = IDL.Record({
    'files_uploaded' : IDL.Opt(IDL.Bool),
    'metadata_created' : IDL.Opt(IDL.Bool),
    'manifest_url' : IDL.Opt(IDL.Text),
    'collection_id' : IDL.Text,
    'candy_machine_config' : IDL.Opt(CandyMachineConfig),
    'collection_mint' : IDL.Opt(IDL.Text),
    'stage' : SolanaDeploymentStage,
    'candy_machine_address' : IDL.Opt(IDL.Text),
    'candy_machine_authority' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'admin_remove_collection' : IDL.Func([IDL.Text], [Result], []),
    'create_collection' : IDL.Func([CreateCollectionArgs], [Result], []),
    'get_all_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_all_draft_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_collection' : IDL.Func([IDL.Text], [IDL.Opt(Collection)], ['query']),
    'get_collections_by_blockchain' : IDL.Func(
        [Blockchain, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_creator_draft_collections' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_my_draft_collections' : IDL.Func([], [IDL.Vec(Collection)], ['query']),
    'get_user_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'update_collection_status' : IDL.Func(
        [UpdateCollectionStatusArgs],
        [Result_1],
        [],
      ),
    'update_movement_stage' : IDL.Func(
        [UpdateMovementStageArgs],
        [Result_1],
        [],
      ),
    'update_solana_stage' : IDL.Func([UpdateSolanaStageArgs], [Result_1], []),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'admin' : IDL.Principal });
  return [InitArgs];
};
