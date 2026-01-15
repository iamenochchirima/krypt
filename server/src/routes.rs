use actix_web::web::{self, ServiceConfig};
use crate::controllers::{
    health_check, api_info,
    auth::{initiate_auth, verify_auth, auth_status, logout},
    protected::{protected_endpoint, user_profile},
    users::{test_connection},
    drafts::{create_draft, get_draft, get_user_drafts, update_draft, delete_draft},
    uploads::{upload_draft_image, batch_upload_nft_assets},
    nfts::{get_collection_nfts, get_asset, get_assets_by_owner, get_listings, get_collection_listings, solana_rpc_proxy},
};

pub fn configure_routes(cfg: &mut ServiceConfig) {
    cfg
        .route("/", web::get().to(api_info))
        
        .route("/health", web::get().to(health_check))
        
        .service(
            web::scope("/api/auth")
                .route("/initiate", web::post().to(initiate_auth))
                .route("/verify", web::get().to(verify_auth))
                .route("/status", web::get().to(auth_status))
                .route("/logout", web::post().to(logout))
        )
        
        .service(
            web::scope("/api/protected")
                .route("/test", web::get().to(protected_endpoint))
                .route("/profile", web::get().to(user_profile))
        )
        
        .service(
            web::scope("/api/users")

        )
        
        .service(
            web::scope("/api/ic")
                .route("/test", web::get().to(test_connection))
        )

        .service(
            web::scope("/api/drafts")
                .route("", web::post().to(create_draft))
                .route("/user/{user_id}", web::get().to(get_user_drafts))
                .route("/{draft_id}", web::get().to(get_draft))
                .route("/{draft_id}", web::put().to(update_draft))
                .route("/{draft_id}", web::delete().to(delete_draft))
        )

        .service(
            web::scope("/api/uploads")
                .route("/draft-image", web::post().to(upload_draft_image))
                .route("/batch-nft-assets", web::post().to(batch_upload_nft_assets))
        )

        .service(
            web::scope("/api/nfts")
                .route("/collection/{mint}", web::get().to(get_collection_nfts))
                .route("/asset/{id}", web::get().to(get_asset))
                .route("/owner/{address}", web::get().to(get_assets_by_owner))
                .route("/listings", web::get().to(get_listings))
                .route("/listings/collection/{mint}", web::get().to(get_collection_listings))
        )

        .service(
            web::resource("/api/solana/rpc")
                .route(web::post().to(solana_rpc_proxy))
        );
}
