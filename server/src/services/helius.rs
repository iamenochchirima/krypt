use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::OnceCell;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

use crate::config::AppConfig;
use crate::redis::RedisClient;

static HELIUS_CLIENT: OnceCell<Arc<HeliusClient>> = OnceCell::const_new();

const CACHE_TTL_SECONDS: u64 = 300;
const LISTING_CACHE_TTL_SECONDS: u64 = 30;

const AUCTION_HOUSE_PROGRAM_ID: &str = "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk";
const LISTING_RECEIPT_DISCRIMINATOR: [u8; 8] = [240, 71, 225, 94, 22, 33, 230, 53];

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

    pub async fn get_auction_house_listings(
        &self,
        auction_house: &str,
        skip_cache: bool,
    ) -> Result<Vec<ListingReceipt>, HeliusError> {
        let cache_key = Self::cache_key("ah_listings", auction_house);

        if !skip_cache {
            if let Some(cached) = self.get_cached::<Vec<ListingReceipt>>(&cache_key).await {
                return Ok(cached);
            }
        }

        let discriminator_b64 = BASE64.encode(LISTING_RECEIPT_DISCRIMINATOR);
        let auction_house_bytes = bs58::decode(auction_house)
            .into_vec()
            .map_err(|_| HeliusError::Rpc {
                code: -1,
                message: "Invalid auction house address".to_string(),
            })?;
        let auction_house_b64 = BASE64.encode(&auction_house_bytes);

        let params = serde_json::json!([
            AUCTION_HOUSE_PROGRAM_ID,
            {
                "encoding": "base64",
                "filters": [
                    { "memcmp": { "offset": 0, "bytes": discriminator_b64, "encoding": "base64" } },
                    { "memcmp": { "offset": 72, "bytes": auction_house_b64, "encoding": "base64" } }
                ]
            }
        ]);

        let response: Vec<ProgramAccount> = self.rpc_call("getProgramAccounts", params).await?;

        let listings: Vec<ListingReceipt> = response
            .into_iter()
            .filter_map(|account| {
                let data = BASE64.decode(&account.account.data[0]).ok()?;
                parse_listing_receipt(&data, &account.pubkey)
            })
            .filter(|listing| !listing.canceled_at.is_some())
            .collect();

        let redis = RedisClient::instance().await;
        if let Ok(json) = serde_json::to_string(&listings) {
            let _ = redis.set_ex(&cache_key, &json, LISTING_CACHE_TTL_SECONDS).await;
        }

        Ok(listings)
    }

    pub async fn get_listings_for_collection(
        &self,
        auction_house: &str,
        collection_mint: &str,
        skip_cache: bool,
    ) -> Result<Vec<ListingReceipt>, HeliusError> {
        let all_listings = self.get_auction_house_listings(auction_house, skip_cache).await?;

        let collection_assets = self.get_assets_by_collection(collection_mint, 1, 1000, false).await?;
        let collection_mints: std::collections::HashSet<String> = collection_assets
            .items
            .iter()
            .map(|a| a.id.clone())
            .collect();

        let filtered: Vec<ListingReceipt> = all_listings
            .into_iter()
            .filter(|listing| collection_mints.contains(&listing.metadata))
            .collect();

        Ok(filtered)
    }

    pub async fn proxy_rpc(&self, body: serde_json::Value) -> Result<serde_json::Value, HeliusError> {
        let response = self
            .http
            .post(&self.rpc_url)
            .json(&body)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        Ok(response)
    }

    pub fn get_rpc_url(&self) -> &str {
        &self.rpc_url
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListingReceipt {
    pub address: String,
    pub trade_state: String,
    pub bookkeeper: String,
    pub auction_house: String,
    pub seller: String,
    pub metadata: String,
    pub purchase_receipt: Option<String>,
    pub price: u64,
    pub token_size: u64,
    pub created_at: i64,
    pub canceled_at: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct ProgramAccount {
    pubkey: String,
    account: AccountData,
}

#[derive(Debug, Deserialize)]
struct AccountData {
    data: Vec<String>,
}

fn parse_listing_receipt(data: &[u8], address: &str) -> Option<ListingReceipt> {
    if data.len() < 161 {
        return None;
    }

    let trade_state = bs58::encode(&data[8..40]).into_string();
    let bookkeeper = bs58::encode(&data[40..72]).into_string();
    let auction_house = bs58::encode(&data[72..104]).into_string();
    let seller = bs58::encode(&data[104..136]).into_string();
    let metadata = bs58::encode(&data[136..168]).into_string();

    let purchase_receipt = if data[168] == 1 && data.len() >= 201 {
        Some(bs58::encode(&data[169..201]).into_string())
    } else {
        None
    };

    let price_offset = if data[168] == 1 { 201 } else { 169 };
    if data.len() < price_offset + 16 {
        return None;
    }

    let price = u64::from_le_bytes(data[price_offset..price_offset + 8].try_into().ok()?);
    let token_size = u64::from_le_bytes(data[price_offset + 8..price_offset + 16].try_into().ok()?);

    let timestamp_offset = price_offset + 16;
    let created_at = if data.len() >= timestamp_offset + 8 {
        i64::from_le_bytes(data[timestamp_offset..timestamp_offset + 8].try_into().ok()?)
    } else {
        0
    };

    let canceled_offset = timestamp_offset + 8;
    let canceled_at = if data.len() >= canceled_offset + 9 && data[canceled_offset] == 1 {
        Some(i64::from_le_bytes(data[canceled_offset + 1..canceled_offset + 9].try_into().ok()?))
    } else {
        None
    };

    Some(ListingReceipt {
        address: address.to_string(),
        trade_state,
        bookkeeper,
        auction_house,
        seller,
        metadata,
        purchase_receipt,
        price,
        token_size,
        created_at,
        canceled_at,
    })
}
