use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;

use crate::services::HeliusClient;

const DEFAULT_AUCTION_HOUSE: &str = "9iyTqHkzCxiUUiguLpa3otxbRTcj7DhXSmewY9fnSX8n";

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct CollectionQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub refresh: Option<bool>,
}

pub async fn get_collection_nfts(
    collection_mint: web::Path<String>,
    query: web::Query<CollectionQuery>,
) -> impl Responder {
    let client = match HeliusClient::instance() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                "error": format!("Helius client not available: {}", e)
            }))
        }
    };

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(50).min(100);
    let skip_cache = query.refresh.unwrap_or(false);

    match client.get_assets_by_collection(&collection_mint, page, limit, skip_cache).await {
        Ok(assets) => HttpResponse::Ok().json(assets),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch collection NFTs: {}", e)
        })),
    }
}

pub async fn get_asset(asset_id: web::Path<String>) -> impl Responder {
    let client = match HeliusClient::instance() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                "error": format!("Helius client not available: {}", e)
            }))
        }
    };

    match client.get_asset(&asset_id).await {
        Ok(asset) => HttpResponse::Ok().json(asset),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch asset: {}", e)
        })),
    }
}

pub async fn get_assets_by_owner(
    owner: web::Path<String>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let client = match HeliusClient::instance() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                "error": format!("Helius client not available: {}", e)
            }))
        }
    };

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(50).min(100);

    match client.get_assets_by_owner(&owner, page, limit).await {
        Ok(assets) => HttpResponse::Ok().json(assets),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch owner assets: {}", e)
        })),
    }
}

#[derive(Debug, Deserialize)]
pub struct ListingsQuery {
    pub auction_house: Option<String>,
    pub refresh: Option<bool>,
}

pub async fn get_listings(
    query: web::Query<ListingsQuery>,
) -> impl Responder {
    let client = match HeliusClient::instance() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                "error": format!("Helius client not available: {}", e)
            }))
        }
    };

    let auction_house = query.auction_house.as_deref().unwrap_or(DEFAULT_AUCTION_HOUSE);
    let skip_cache = query.refresh.unwrap_or(false);

    match client.get_auction_house_listings(auction_house, skip_cache).await {
        Ok(listings) => HttpResponse::Ok().json(serde_json::json!({
            "listings": listings,
            "total": listings.len()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch listings: {}", e)
        })),
    }
}

pub async fn get_collection_listings(
    collection_mint: web::Path<String>,
    query: web::Query<ListingsQuery>,
) -> impl Responder {
    let client = match HeliusClient::instance() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                "error": format!("Helius client not available: {}", e)
            }))
        }
    };

    let auction_house = query.auction_house.as_deref().unwrap_or(DEFAULT_AUCTION_HOUSE);
    let skip_cache = query.refresh.unwrap_or(false);

    match client.get_listings_for_collection(auction_house, &collection_mint, skip_cache).await {
        Ok(listings) => HttpResponse::Ok().json(serde_json::json!({
            "listings": listings,
            "total": listings.len()
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch collection listings: {}", e)
        })),
    }
}

pub async fn solana_rpc_proxy(body: web::Json<serde_json::Value>) -> impl Responder {
    let client = match HeliusClient::instance() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                "error": format!("Helius client not available: {}", e)
            }))
        }
    };

    match client.proxy_rpc(body.into_inner()).await {
        Ok(response) => HttpResponse::Ok().json(response),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("RPC error: {}", e)
        })),
    }
}
