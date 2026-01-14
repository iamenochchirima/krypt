use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::OnceCell;

use crate::config::AppConfig;
use crate::redis::RedisClient;

static HELIUS_CLIENT: OnceCell<Arc<HeliusClient>> = OnceCell::const_new();

const CACHE_TTL_SECONDS: u64 = 300;

#[derive(Debug, thiserror::Error)]
pub enum HeliusError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("RPC error: {code} - {message}")]
    Rpc { code: i64, message: String },
    #[error("Client not initialized")]
    NotInitialized,
}

#[derive(Debug, Serialize)]
struct RpcRequest<T: Serialize> {
    jsonrpc: &'static str,
    id: &'static str,
    method: &'static str,
    params: T,
}

#[derive(Debug, Deserialize)]
struct RpcResponse<T> {
    result: Option<T>,
    error: Option<RpcError>,
}

#[derive(Debug, Deserialize)]
struct RpcError {
    code: i64,
    message: String,
}

#[derive(Debug, Serialize)]
pub struct GetAssetsByGroupParams {
    #[serde(rename = "groupKey")]
    pub group_key: String,
    #[serde(rename = "groupValue")]
    pub group_value: String,
    pub page: u32,
    pub limit: u32,
}

#[derive(Debug, Serialize)]
pub struct GetAssetParams {
    pub id: String,
}

#[derive(Debug, Serialize)]
pub struct GetAssetsByOwnerParams {
    #[serde(rename = "ownerAddress")]
    pub owner_address: String,
    pub page: u32,
    pub limit: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetList {
    pub total: u32,
    pub limit: u32,
    pub page: u32,
    pub items: Vec<Asset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub content: Option<AssetContent>,
    pub authorities: Option<Vec<Authority>>,
    pub compression: Option<Compression>,
    pub grouping: Option<Vec<Grouping>>,
    pub royalty: Option<Royalty>,
    pub ownership: Option<Ownership>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetContent {
    pub json_uri: Option<String>,
    pub metadata: Option<AssetMetadata>,
    pub links: Option<AssetLinks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMetadata {
    pub name: Option<String>,
    pub symbol: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetLinks {
    pub image: Option<String>,
    pub external_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Authority {
    pub address: String,
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Compression {
    pub compressed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Grouping {
    pub group_key: String,
    pub group_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Royalty {
    pub basis_points: u32,
    pub primary_sale_happened: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ownership {
    pub owner: String,
    pub frozen: bool,
}

pub struct HeliusClient {
    http: Client,
    rpc_url: String,
}

impl HeliusClient {
    pub fn new(config: &AppConfig) -> Self {
        Self {
            http: Client::new(),
            rpc_url: config.helius_rpc_url.clone(),
        }
    }

    pub async fn initialize_global(config: &AppConfig) -> Result<(), HeliusError> {
        let client = Self::new(config);
        HELIUS_CLIENT.set(Arc::new(client)).map_err(|_| HeliusError::NotInitialized)?;
        println!("✅ Helius client initialized!");
        Ok(())
    }

    pub fn instance() -> Result<&'static Arc<HeliusClient>, HeliusError> {
        HELIUS_CLIENT.get().ok_or(HeliusError::NotInitialized)
    }

    async fn rpc_call<P: Serialize, R: for<'de> Deserialize<'de>>(
        &self,
        method: &'static str,
        params: P,
    ) -> Result<R, HeliusError> {
        let request = RpcRequest {
            jsonrpc: "2.0",
            id: "helius-client",
            method,
            params,
        };

        let response = self
            .http
            .post(&self.rpc_url)
            .json(&request)
            .send()
            .await?
            .json::<RpcResponse<R>>()
            .await?;

        if let Some(error) = response.error {
            return Err(HeliusError::Rpc {
                code: error.code,
                message: error.message,
            });
        }

        response.result.ok_or(HeliusError::Rpc {
            code: -1,
            message: "No result in response".to_string(),
        })
    }

    fn cache_key(prefix: &str, id: &str) -> String {
        format!("helius:{}:{}", prefix, id)
    }

    async fn get_cached<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Option<T> {
        let redis = RedisClient::instance().await;
        if let Ok(Some(data)) = redis.get(key).await {
            serde_json::from_str(&data).ok()
        } else {
            None
        }
    }

    async fn set_cached<T: Serialize>(&self, key: &str, value: &T) {
        let redis = RedisClient::instance().await;
        if let Ok(json) = serde_json::to_string(value) {
            let _ = redis.set_ex(key, &json, CACHE_TTL_SECONDS).await;
        }
    }

    pub async fn get_assets_by_collection(
        &self,
        collection_mint: &str,
        page: u32,
        limit: u32,
        skip_cache: bool,
    ) -> Result<AssetList, HeliusError> {
        let cache_key = Self::cache_key("collection", &format!("{}:{}:{}", collection_mint, page, limit));

        if !skip_cache {
            if let Some(cached) = self.get_cached::<AssetList>(&cache_key).await {
                if cached.total > 0 {
                    return Ok(cached);
                }
            }
        }

        let result: AssetList = self
            .rpc_call(
                "getAssetsByGroup",
                GetAssetsByGroupParams {
                    group_key: "collection".to_string(),
                    group_value: collection_mint.to_string(),
                    page,
                    limit,
                },
            )
            .await?;

        if result.total > 0 {
            self.set_cached(&cache_key, &result).await;
        }
        Ok(result)
    }

    pub async fn get_asset(&self, asset_id: &str) -> Result<Asset, HeliusError> {
        let cache_key = Self::cache_key("asset", asset_id);

        if let Some(cached) = self.get_cached(&cache_key).await {
            return Ok(cached);
        }

        let result: Asset = self
            .rpc_call("getAsset", GetAssetParams { id: asset_id.to_string() })
            .await?;

        self.set_cached(&cache_key, &result).await;
        Ok(result)
    }

    pub async fn get_assets_by_owner(
        &self,
        owner: &str,
        page: u32,
        limit: u32,
    ) -> Result<AssetList, HeliusError> {
        let cache_key = Self::cache_key("owner", &format!("{}:{}:{}", owner, page, limit));

        if let Some(cached) = self.get_cached(&cache_key).await {
            return Ok(cached);
        }

        let result: AssetList = self
            .rpc_call(
                "getAssetsByOwner",
                GetAssetsByOwnerParams {
                    owner_address: owner.to_string(),
                    page,
                    limit,
                },
            )
            .await?;

        self.set_cached(&cache_key, &result).await;
        Ok(result)
    }
}
