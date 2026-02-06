use actix_web::{HttpResponse, Responder, Result};
use serde_json::json;

pub async fn health_check() -> Result<impl Responder> {
    Ok(HttpResponse::Ok().json(json!({
        "status": "ok",
        "message": "Server is running",
        "timestamp": chrono::Utc::now().timestamp()
    })))
}

pub async fn api_info() -> Result<impl Responder> {
    Ok(HttpResponse::Ok().json(json!({
        "name": "Krypt API",
        "version": "1.0.0",
        "description": "Backend API for Krypt platform",
        "endpoints": {
            "health": "/health",
            "auth": "/api/auth",
            "users": "/api/users"
        }
    })))
}
