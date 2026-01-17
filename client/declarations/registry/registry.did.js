export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'admin' : IDL.Principal });
  const Result = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const SetFeaturedArgs = IDL.Record({
    'collection_id' : IDL.Text,
    'is_featured' : IDL.Bool,
  });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const SetVerifiedArgs = IDL.Record({
    'collection_id' : IDL.Text,
    'is_verified' : IDL.Bool,
  });
  const Socials = IDL.Record({
    'twitter' : IDL.Opt(IDL.Text),
    'website' : IDL.Opt(IDL.Text),
    'discord' : IDL.Opt(IDL.Text),
    'telegram' : IDL.Opt(IDL.Text),
  });
  const Blockchain = IDL.Variant({
    'ICP' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Solana' : IDL.Null,
    'Movement' : IDL.Null,
  });
  const CollectionCategory = IDL.Variant({
    'Art' : IDL.Null,
    'PFP' : IDL.Null,
    'Gaming' : IDL.Null,
    'Music' : IDL.Null,
    'Other' : IDL.Null,
    'Metaverse' : IDL.Null,
    'Photography' : IDL.Null,
    'Utility' : IDL.Null,
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
    'FilesUploading' : IDL.Null,
  });
  const EthereumCollectionData = IDL.Record({
    'files_uploaded' : IDL.Bool,
    'manifest_url' : IDL.Opt(IDL.Text),
    'mint_price_wei' : IDL.Opt(IDL.Nat64),
    'chain_id' : IDL.Nat64,
    'deployment_stage' : EthereumDeploymentStage,
    'max_supply' : IDL.Nat64,
    'chain_name' : IDL.Text,
    'contract_address' : IDL.Opt(IDL.Text),
    'owner_address' : IDL.Opt(IDL.Text),
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
    'tags' : IDL.Opt(IDL.Vec(IDL.Text)),
    'socials' : IDL.Opt(Socials),
    'description' : IDL.Text,
    'blockchain' : Blockchain,
    'mint_price' : IDL.Opt(IDL.Nat64),
    'category' : IDL.Opt(CollectionCategory),
    'chain_data' : ChainData,
    'total_supply' : IDL.Nat64,
    'symbol' : IDL.Text,
    'royalty_bps' : IDL.Nat16,
  });
  const CollectionStatus = IDL.Variant({
    'Active' : IDL.Null,
    'Draft' : IDL.Null,
  });
  const ICPSaleType = IDL.Variant({
    'OpenEdition' : IDL.Null,
    'FixedPrice' : IDL.Null,
  });
  const ICPSaleConfig = IDL.Record({ 'sale_type' : ICPSaleType });
  const SolanaSaleType = IDL.Variant({
    'OpenEdition' : IDL.Null,
    'FixedPrice' : IDL.Null,
    'DutchAuction' : IDL.Null,
  });
  const SolanaSaleConfig = IDL.Record({ 'sale_type' : SolanaSaleType });
  const InitialSaleConfig = IDL.Variant({
    'ICP' : ICPSaleConfig,
    'Ethereum' : SolanaSaleConfig,
    'Solana' : SolanaSaleConfig,
    'Movement' : ICPSaleConfig,
  });
  const InitialSale = IDL.Record({
    'end_time' : IDL.Opt(IDL.Nat64),
    'ended' : IDL.Bool,
    'start_time' : IDL.Nat64,
    'config' : InitialSaleConfig,
    'public_start_time' : IDL.Opt(IDL.Nat64),
  });
  const Collection = IDL.Record({
    'id' : IDL.Text,
    'status' : CollectionStatus,
    'updated_at' : IDL.Nat64,
    'creator' : IDL.Principal,
    'initial_sale' : IDL.Opt(InitialSale),
    'image_url' : IDL.Text,
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'banner_url' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'slug' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'socials' : IDL.Opt(Socials),
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'blockchain' : Blockchain,
    'mint_price' : IDL.Opt(IDL.Nat64),
    'is_verified' : IDL.Bool,
    'is_featured' : IDL.Bool,
    'category' : IDL.Opt(CollectionCategory),
    'chain_data' : ChainData,
    'total_supply' : IDL.Nat64,
    'symbol' : IDL.Text,
    'royalty_bps' : IDL.Nat16,
  });
  const CollectionsResult = IDL.Record({
    'total' : IDL.Nat64,
    'collections' : IDL.Vec(Collection),
  });
  const SetSaleEndedArgs = IDL.Record({
    'collection_id' : IDL.Text,
    'ended' : IDL.Bool,
  });
  const UpdateCategoryArgs = IDL.Record({
    'collection_id' : IDL.Text,
    'category' : IDL.Opt(CollectionCategory),
  });
  const UpdateCollectionStatusArgs = IDL.Record({
    'status' : CollectionStatus,
    'collection_id' : IDL.Text,
  });
  const UpdateEthereumStageArgs = IDL.Record({
    'files_uploaded' : IDL.Opt(IDL.Bool),
    'manifest_url' : IDL.Opt(IDL.Text),
    'collection_id' : IDL.Text,
    'stage' : EthereumDeploymentStage,
    'contract_address' : IDL.Opt(IDL.Text),
    'owner_address' : IDL.Opt(IDL.Text),
  });
  const UpdateInitialSaleArgs = IDL.Record({
    'initial_sale' : IDL.Opt(InitialSale),
    'collection_id' : IDL.Text,
  });
  const UpdateMovementStageArgs = IDL.Record({
    'collection_address' : IDL.Opt(IDL.Text),
    'manifest_url' : IDL.Opt(IDL.Text),
    'collection_id' : IDL.Text,
    'collection_created' : IDL.Opt(IDL.Bool),
    'stage' : MovementDeploymentStage,
  });
  const UpdateSlugArgs = IDL.Record({
    'slug' : IDL.Text,
    'collection_id' : IDL.Text,
  });
  const UpdateSocialsArgs = IDL.Record({
    'collection_id' : IDL.Text,
    'socials' : IDL.Opt(Socials),
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
  const UpdateTagsArgs = IDL.Record({
    'tags' : IDL.Vec(IDL.Text),
    'collection_id' : IDL.Text,
  });
  return IDL.Service({
    'admin_migrate_collections' : IDL.Func([], [Result], []),
    'admin_remove_collection' : IDL.Func([IDL.Text], [Result_1], []),
    'admin_set_featured' : IDL.Func([SetFeaturedArgs], [Result_2], []),
    'admin_set_verified' : IDL.Func([SetVerifiedArgs], [Result_2], []),
    'create_collection' : IDL.Func([CreateCollectionArgs], [Result_1], []),
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
    'get_collection_by_slug' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(Collection)],
        ['query'],
      ),
    'get_collections_by_blockchain' : IDL.Func(
        [Blockchain, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_collections_by_category' : IDL.Func(
        [CollectionCategory, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_collections_paginated' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [CollectionsResult],
        ['query'],
      ),
    'get_creator_draft_collections' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_ended_sales' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_featured_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_latest_collections' : IDL.Func(
        [IDL.Nat64],
        [CollectionsResult],
        ['query'],
      ),
    'get_live_sales' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_my_draft_collections' : IDL.Func([], [IDL.Vec(Collection)], ['query']),
    'get_total_collections' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_upcoming_sales' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_user_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_verified_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'set_sale_ended' : IDL.Func([SetSaleEndedArgs], [Result_2], []),
    'update_category' : IDL.Func([UpdateCategoryArgs], [Result_2], []),
    'update_collection_status' : IDL.Func(
        [UpdateCollectionStatusArgs],
        [Result_2],
        [],
      ),
    'update_ethereum_stage' : IDL.Func(
        [UpdateEthereumStageArgs],
        [Result_2],
        [],
      ),
    'update_initial_sale' : IDL.Func([UpdateInitialSaleArgs], [Result_2], []),
    'update_movement_stage' : IDL.Func(
        [UpdateMovementStageArgs],
        [Result_2],
        [],
      ),
    'update_slug' : IDL.Func([UpdateSlugArgs], [Result_2], []),
    'update_socials' : IDL.Func([UpdateSocialsArgs], [Result_2], []),
    'update_solana_stage' : IDL.Func([UpdateSolanaStageArgs], [Result_2], []),
    'update_tags' : IDL.Func([UpdateTagsArgs], [Result_2], []),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'admin' : IDL.Principal });
  return [InitArgs];
};
