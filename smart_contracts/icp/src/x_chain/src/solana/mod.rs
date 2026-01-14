mod ed25519;
pub mod solana_wallet;
pub mod spl;
pub mod interface;
pub mod candy_machine;

use crate::state::config::{
    self, Ed25519KeyName, SolanaNetwork,
};
use candid::Principal;
use ic_cdk::api::msg_caller;
use ic_ed25519::PublicKey;
use sol_rpc_client::{ed25519::Ed25519KeyId, IcRuntime, SolRpcClient};
use sol_rpc_types::{
    ConsensusStrategy, RpcEndpoint, RpcSource, RpcSources, SolanaCluster,
};

pub fn client() -> SolRpcClient<IcRuntime> {
    let rpc_sources = config::get_solana_network().into();
    let consensus_strategy = match rpc_sources {
        RpcSources::Custom(_) => ConsensusStrategy::Equality,
        RpcSources::Default(_) => ConsensusStrategy::Threshold {
            min: 2,
            total: Some(3),
        },
    };
    config::get_sol_rpc_canister_id()
        .map(|canister_id| SolRpcClient::builder(IcRuntime, canister_id))
        .unwrap_or(SolRpcClient::builder_for_ic())
        .with_rpc_sources(rpc_sources)
        .with_consensus_strategy(consensus_strategy)
        .with_default_commitment_level(config::get_solana_commitment_level())
        .build()
}

impl From<SolanaNetwork> for RpcSources {
    fn from(network: SolanaNetwork) -> Self {
        match network {
            SolanaNetwork::Mainnet => Self::Default(SolanaCluster::Mainnet),
            SolanaNetwork::Devnet => Self::Default(SolanaCluster::Devnet),
            SolanaNetwork::Custom(endpoint) => Self::Custom(vec![RpcSource::Custom(endpoint)]),
        }
    }
}

impl From<Ed25519KeyName> for Ed25519KeyId {
    fn from(key_id: Ed25519KeyName) -> Self {
        match key_id {
            Ed25519KeyName::LocalDevelopment => Self::LocalDevelopment,
            Ed25519KeyName::MainnetTestKey1 => Self::MainnetTestKey1,
            Ed25519KeyName::MainnetProdKey1 => Self::MainnetProdKey1,
        }
    }
}

pub async fn lazy_call_ed25519_public_key() -> ed25519::Ed25519ExtendedPublicKey {
    if let Some(cached) = config::get_ed25519_public_key() {
        let public_key = PublicKey::deserialize_raw(&cached.public_key_bytes).unwrap();
        return ed25519::Ed25519ExtendedPublicKey {
            public_key,
            chain_code: cached.chain_code,
        };
    }

    let public_key = ed25519::get_ed25519_public_key(
        config::get_ed25519_key_name(),
        &Default::default(),
    )
    .await;

    let serialized_key = config::Ed25519ExtendedPublicKey {
        public_key_bytes: public_key.public_key.serialize_raw().to_vec(),
        chain_code: public_key.chain_code,
    };
    config::set_ed25519_public_key(serialized_key);

    public_key
}

pub fn validate_caller_not_anonymous() -> Principal {
    let principal = msg_caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}
