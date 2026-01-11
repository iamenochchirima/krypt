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
  const AccountMeta = IDL.Record({
    'is_signer' : IDL.Bool,
    'pubkey' : IDL.Text,
    'is_writable' : IDL.Bool,
  });
  const InstructionData = IDL.Record({
    'data' : IDL.Vec(IDL.Nat8),
    'program_id' : IDL.Text,
    'accounts' : IDL.Vec(AccountMeta),
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Blockchain = IDL.Variant({
    'ICP' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Solana' : IDL.Null,
    'Bitcoin' : IDL.Null,
    'Movement' : IDL.Null,
    'Casper' : IDL.Null,
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
    'MetadataCreated' : IDL.Null,
    'FilesUploaded' : IDL.Null,
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
  const BitcoinDeploymentStage = IDL.Variant({
    'InscriptionsCreating' : IDL.Null,
    'Deployed' : IDL.Null,
  });
  const BitcoinCollectionData = IDL.Record({
    'deployment_stage' : BitcoinDeploymentStage,
    'inscription_ids' : IDL.Vec(IDL.Text),
  });
  const MovementDeploymentStage = IDL.Variant({
    'FilesUploaded' : IDL.Null,
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
  const CasperDeploymentStage = IDL.Variant({
    'ContractDeploying' : IDL.Null,
    'Minting' : IDL.Null,
    'ContractPreparing' : IDL.Null,
    'Deployed' : IDL.Null,
    'ContractDeployed' : IDL.Null,
  });
  const CasperCollectionData = IDL.Record({
    'contract_hash' : IDL.Opt(IDL.Text),
    'holder_mode' : IDL.Opt(IDL.Nat8),
    'events_mode' : IDL.Opt(IDL.Nat8),
    'owner_reverse_lookup_mode' : IDL.Opt(IDL.Nat8),
    'ownership_mode' : IDL.Nat8,
    'burn_mode' : IDL.Opt(IDL.Nat8),
    'metadata_mutability' : IDL.Nat8,
    'json_schema' : IDL.Text,
    'contract_package_hash' : IDL.Opt(IDL.Text),
    'nft_kind' : IDL.Opt(IDL.Nat8),
    'allow_minting' : IDL.Opt(IDL.Bool),
    'whitelist_mode' : IDL.Opt(IDL.Nat8),
    'minting_mode' : IDL.Opt(IDL.Nat8),
    'deployment_stage' : CasperDeploymentStage,
    'identifier_mode' : IDL.Nat8,
    'total_token_supply' : IDL.Nat64,
    'nft_metadata_kind' : IDL.Nat8,
  });
  const ChainData = IDL.Variant({
    'ICP' : ICPCollectionData,
    'Ethereum' : EthereumCollectionData,
    'Solana' : SolanaCollectionData,
    'Bitcoin' : BitcoinCollectionData,
    'Movement' : MovementCollectionData,
    'Casper' : CasperCollectionData,
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
  const NftAttribute = IDL.Record({
    'trait_type' : IDL.Text,
    'value' : IDL.Text,
  });
  const NftMetadata = IDL.Record({
    'image_url' : IDL.Text,
    'name' : IDL.Text,
    'attributes' : IDL.Vec(NftAttribute),
  });
  const CreateListingArgs = IDL.Record({
    'nft_id' : IDL.Text,
    'nft_metadata' : NftMetadata,
    'collection_id' : IDL.Text,
    'currency' : IDL.Text,
    'seller_address' : IDL.Text,
    'price' : IDL.Nat64,
    'expires_at' : IDL.Opt(IDL.Nat64),
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
  const CanisterSolanaInfo = IDL.Record({
    'canister_id' : IDL.Text,
    'main_solana_address' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'Ok' : CanisterSolanaInfo, 'Err' : IDL.Text });
  const ListingStatus = IDL.Variant({
    'Sold' : IDL.Null,
    'Active' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const Listing = IDL.Record({
    'id' : IDL.Text,
    'nft_id' : IDL.Text,
    'status' : ListingStatus,
    'updated_at' : IDL.Nat64,
    'escrow_address' : IDL.Opt(IDL.Text),
    'nft_metadata' : NftMetadata,
    'collection_id' : IDL.Text,
    'seller' : IDL.Principal,
    'blockchain' : Blockchain,
    'currency' : IDL.Text,
    'seller_address' : IDL.Text,
    'price' : IDL.Nat64,
    'expires_at' : IDL.Opt(IDL.Nat64),
    'listed_at' : IDL.Nat64,
  });
  const CollectionSolanaAccounts = IDL.Record({
    'collection_id' : IDL.Text,
    'collection_mint' : IDL.Opt(IDL.Text),
    'candy_machine_address' : IDL.Text,
    'payer_address' : IDL.Text,
  });
  const Result_3 = IDL.Variant({
    'Ok' : CollectionSolanaAccounts,
    'Err' : IDL.Text,
  });
  const TokenAmount = IDL.Record({
    'decimals' : IDL.Nat8,
    'uiAmount' : IDL.Opt(IDL.Float64),
    'uiAmountString' : IDL.Text,
    'amount' : IDL.Text,
  });
  const TransactionType = IDL.Variant({
    'UpdateCandyMachine' : IDL.Null,
    'TransferAuthority' : IDL.Null,
    'CreateCandyMachine' : IDL.Null,
  });
  const UpdateCasperStageArgs = IDL.Record({
    'contract_hash' : IDL.Opt(IDL.Text),
    'holder_mode' : IDL.Opt(IDL.Nat8),
    'events_mode' : IDL.Opt(IDL.Nat8),
    'owner_reverse_lookup_mode' : IDL.Opt(IDL.Nat8),
    'collection_id' : IDL.Text,
    'ownership_mode' : IDL.Opt(IDL.Nat8),
    'burn_mode' : IDL.Opt(IDL.Nat8),
    'metadata_mutability' : IDL.Opt(IDL.Nat8),
    'json_schema' : IDL.Opt(IDL.Text),
    'contract_package_hash' : IDL.Opt(IDL.Text),
    'nft_kind' : IDL.Opt(IDL.Nat8),
    'allow_minting' : IDL.Opt(IDL.Bool),
    'stage' : CasperDeploymentStage,
    'whitelist_mode' : IDL.Opt(IDL.Nat8),
    'minting_mode' : IDL.Opt(IDL.Nat8),
    'identifier_mode' : IDL.Opt(IDL.Nat8),
    'total_token_supply' : IDL.Opt(IDL.Nat64),
    'nft_metadata_kind' : IDL.Opt(IDL.Nat8),
  });
  const UpdateCollectionStatusArgs = IDL.Record({
    'status' : CollectionStatus,
    'collection_id' : IDL.Text,
  });
  const UpdateListingArgs = IDL.Record({
    'status' : IDL.Opt(ListingStatus),
    'listing_id' : IDL.Text,
    'price' : IDL.Opt(IDL.Nat64),
  });
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
    'add_items_to_candy_machine' : IDL.Func(
        [IDL.Text, InstructionData],
        [Result],
        [],
      ),
    'admin_remove_collection' : IDL.Func([IDL.Text], [Result], []),
    'associated_token_account' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text],
        [IDL.Text],
        [],
      ),
    'cancel_listing' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'clear_old_collections' : IDL.Func([], [Result_1], []),
    'create_associated_token_account' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Text],
        [IDL.Text],
        [],
      ),
    'create_candy_machine_from_instruction' : IDL.Func(
        [IDL.Text, IDL.Vec(InstructionData)],
        [Result],
        [],
      ),
    'create_collection' : IDL.Func([CreateCollectionArgs], [Result], []),
    'create_listing' : IDL.Func([CreateListingArgs, Blockchain], [Result], []),
    'create_nonce_account' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
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
    'get_balance' : IDL.Func([IDL.Opt(IDL.Text)], [IDL.Nat], []),
    'get_canister_solana_info' : IDL.Func([], [Result_2], ['query']),
    'get_collection' : IDL.Func([IDL.Text], [IDL.Opt(Collection)], ['query']),
    'get_collection_listing_count' : IDL.Func(
        [IDL.Text],
        [IDL.Nat32],
        ['query'],
      ),
    'get_collection_listings' : IDL.Func(
        [IDL.Text, IDL.Nat32, IDL.Nat32, IDL.Opt(ListingStatus)],
        [IDL.Vec(Listing)],
        ['query'],
      ),
    'get_collection_solana_accounts' : IDL.Func(
        [IDL.Text],
        [Result_3],
        ['query'],
      ),
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
    'get_listing' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Opt(Listing)],
        ['query'],
      ),
    'get_my_draft_collections' : IDL.Func([], [IDL.Vec(Collection)], ['query']),
    'get_nonce' : IDL.Func([IDL.Opt(IDL.Text)], [IDL.Text], []),
    'get_old_collections_count' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_spl_token_balance' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Text],
        [TokenAmount],
        [],
      ),
    'get_user_collections' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Collection)],
        ['query'],
      ),
    'get_user_listings' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Listing)],
        ['query'],
      ),
    'migrate_collections' : IDL.Func([], [], []),
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
    'sign_and_send_solana_transaction' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8), TransactionType, IDL.Opt(IDL.Text)],
        [Result],
        [],
      ),
    'solana_account' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
    'update_candy_machine_address' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'update_casper_stage' : IDL.Func([UpdateCasperStageArgs], [Result_1], []),
    'update_collection_status' : IDL.Func(
        [UpdateCollectionStatusArgs],
        [Result_1],
        [],
      ),
    'update_listing' : IDL.Func([UpdateListingArgs, IDL.Text], [Result_1], []),
    'update_movement_stage' : IDL.Func(
        [UpdateMovementStageArgs],
        [Result_1],
        [],
      ),
    'update_solana_stage' : IDL.Func([UpdateSolanaStageArgs], [Result_1], []),
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
