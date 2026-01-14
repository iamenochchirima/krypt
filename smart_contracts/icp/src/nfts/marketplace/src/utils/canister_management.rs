use candid::{CandidType, Encode, Nat, Principal};
use ic_cdk::api::management_canister::main::{
    create_canister, install_code, CanisterInstallMode, CanisterSettings, CreateCanisterArgument,
    InstallCodeArgument,
};
use serde::Serialize;

pub const CORE_NFT_WASM: &[u8] = include_bytes!("../../../../../wasm/core_nft.wasm");
pub const CREATE_CANISTER_CYCLES: u128 = 1_000_000_000_000;

#[derive(CandidType, Clone)]
pub struct NFTCollectionInitArgs {
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub supply_cap: Option<Nat>,
    pub owner: Principal,
}

#[derive(CandidType, Serialize)]
enum InitArg {
    Init(InitArgs),
    Upgrade,
}

#[derive(CandidType, Serialize)]
struct InitArgs {
    name: String,
    symbol: String,
    description: Option<String>,
    logo: Option<String>,
    supply_cap: Option<Nat>,
    max_query_batch_size: Option<Nat>,
    max_update_batch_size: Option<Nat>,
    default_take_value: Option<Nat>,
    max_take_value: Option<Nat>,
    max_memo_size: Option<Nat>,
    atomic_batch_transfers: Option<bool>,
    tx_window: Option<Nat>,
    permitted_drift: Option<Nat>,
    collection_metadata: Vec<(String, String)>,
    commit_hash: String,
    version: Version,
    test_mode: bool,
    max_canister_storage_threshold: Option<Nat>,
    permissions: Permissions,
    approval_init: ApprovalInit,
}

#[derive(CandidType, Serialize)]
struct Version {
    major: u32,
    minor: u32,
    patch: u32,
}

#[derive(CandidType, Serialize)]
struct Permissions {
    user_permissions: Vec<(Principal, Vec<Permission>)>,
}

#[derive(CandidType, Serialize)]
enum Permission {
    Minting,
    UpdateMetadata,
    UpdateCollectionMetadata,
    UpdateUploads,
    ManageAuthorities,
    ReadUploads,
}

#[derive(CandidType, Serialize)]
struct ApprovalInit {
    max_approvals_per_token_or_collection: Option<Nat>,
    max_revoke_approvals: Option<Nat>,
}

pub async fn deploy_nft_collection(
    owner: Principal,
    init_args: NFTCollectionInitArgs,
) -> Result<Principal, String> {
    let settings = CanisterSettings {
        compute_allocation: None,
        controllers: Some(vec![ic_cdk::id(), owner]),
        memory_allocation: None,
        freezing_threshold: None,
        reserved_cycles_limit: None,
        log_visibility: None,
        wasm_memory_limit: None,
    };

    let create_arg = CreateCanisterArgument {
        settings: Some(settings),
    };

    let canister_result = create_canister(create_arg, CREATE_CANISTER_CYCLES).await;
    let canister_id = match canister_result {
        Ok((record,)) => record.canister_id,
        Err((code, message)) => {
            return Err(format!(
                "Failed to create canister: {:?} - {}",
                code, message
            ));
        }
    };

    let nft_init_args = InitArgs {
        name: init_args.name.clone(),
        symbol: init_args.symbol.clone(),
        description: init_args.description.clone(),
        logo: init_args.logo.clone(),
        supply_cap: init_args.supply_cap.clone(),
        max_query_batch_size: Some(Nat::from(100u64)),
        max_update_batch_size: Some(Nat::from(100u64)),
        default_take_value: Some(Nat::from(10u64)),
        max_take_value: Some(Nat::from(1000u64)),
        max_memo_size: Some(Nat::from(256u64)),
        atomic_batch_transfers: Some(true),
        tx_window: Some(Nat::from(10_000_000_000u64)),
        permitted_drift: Some(Nat::from(2_000_000_000u64)),
        collection_metadata: vec![],
        commit_hash: "marketplace".to_string(),
        version: Version {
            major: 1,
            minor: 0,
            patch: 0,
        },
        test_mode: false,
        max_canister_storage_threshold: Some(Nat::from(500_000_000u64)),
        permissions: Permissions {
            user_permissions: vec![(
                init_args.owner,
                vec![
                    Permission::Minting,
                    Permission::UpdateMetadata,
                    Permission::UpdateCollectionMetadata,
                    Permission::UpdateUploads,
                    Permission::ManageAuthorities,
                    Permission::ReadUploads,
                ],
            )],
        },
        approval_init: ApprovalInit {
            max_approvals_per_token_or_collection: Some(Nat::from(100u64)),
            max_revoke_approvals: Some(Nat::from(100u64)),
        },
    };

    let init_struct = InitArg::Init(nft_init_args);
    let install_arg =
        Encode!(&init_struct).map_err(|e| format!("Failed to encode init args: {}", e))?;

    let install_code_arg = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: CORE_NFT_WASM.to_vec(),
        arg: install_arg,
    };

    match install_code(install_code_arg).await {
        Ok(()) => Ok(canister_id),
        Err((code, message)) => Err(format!("Failed to install code: {:?} - {}", code, message)),
    }
}
