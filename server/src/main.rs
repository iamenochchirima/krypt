use actix_web::{middleware::Logger, App, HttpServer};
use actix_cors::Cors;
use env_logger::Env;
use dotenv::dotenv;

mod controllers;
mod routes;
mod config;
mod redis;
mod ic_agent;
mod middleware;
mod db;
mod storage;
mod services;

use config::AppConfig;
use routes::configure_routes;
use redis::RedisClient;
use ic_agent::BackendActor;
use db::create_pool;
use storage::R2Client;
use services::HeliusClient;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let config = AppConfig::from_env();

    let db_pool = create_pool().await.map_err(|e| {
        eprintln!("❌ Failed to connect to PostgreSQL: {}", e);
        std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("PostgreSQL connection failed: {}", e)
        )
    })?;
    println!("✅ PostgreSQL connection established successfully!");

    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await
        .map_err(|e| {
            eprintln!("❌ Database migration failed: {}", e);
            std::io::Error::new(std::io::ErrorKind::Other, format!("Migration failed: {}", e))
        })?;
    println!("✅ Database migrations completed!");

    if let Err(e) = RedisClient::initialize_global().await {
        eprintln!("❌ Failed to connect to Redis: {}", e);
        eprintln!("🔄 Server will continue without Redis...");
        return Err(std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("Redis connection failed: {}", e)
        ));
    } else {
        println!("✅ Redis connection established successfully!");
    }

    // Initialize Backend Actor (IC Agent)
    if let Err(e) = BackendActor::initialize_global(config.clone()).await {
        eprintln!("❌ Failed to initialize Backend Actor: {}", e);
        eprintln!("🔄 Server will continue without IC connection...");
        return Err(std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("IC Backend Actor initialization failed: {}", e)
        ));
    }

    let r2_client = R2Client::new().await.map_err(|e| {
        eprintln!("❌ Failed to initialize R2 client: {}", e);
        std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("R2 initialization failed: {}", e)
        )
    })?;
    println!("✅ R2 storage client initialized successfully!");

    if let Err(e) = HeliusClient::initialize_global(&config).await {
        eprintln!("⚠️ Failed to initialize Helius client: {}", e);
        eprintln!("🔄 NFT endpoints will be unavailable...");
    }

    println!("🚀 Server starting at http://0.0.0.0:{}", config.port);
    println!("🌍 Environment: {}", config.environment);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("https://krypt.fun")
            .allowed_origin("https://www.krypt.fun")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(actix_web::web::Data::new(db_pool.clone()))
            .app_data(actix_web::web::Data::new(r2_client.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .configure(configure_routes)
    })
    .bind(format!("0.0.0.0:{}", config.port))?
    .run()
    .await
}