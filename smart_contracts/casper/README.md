# Casper NFT Launchpad & Marketplace Smart Contracts

Smart contracts for deploying NFT collections and trading NFTs on the Casper blockchain.

## Contracts

### 1. NFT Launchpad (`launchpad/`)
Factory contract for deploying CEP-78 NFT collection instances with custom parameters.

**Features:**
- Permissionless collection deployment
- CEP-78 standard integration
- Royalty configuration
- Collection registry and discovery

### 2. NFT Marketplace (`marketplace/`)
Decentralized marketplace for listing and trading NFTs.

**Features:**
- Fixed-price listings with escrow
- 2.5% marketplace fee
- Creator royalty support
- Secure payment distribution

## Prerequisites

- Rust 1.63.0 or later
- `wasm32-unknown-unknown` target
- `casper-client` CLI tool (for deployment)
- Optional: `wasm-strip` (for optimization)

## Installation

```bash
# Install Rust target for WebAssembly
make prepare

# Or manually:
rustup target add wasm32-unknown-unknown
```

## Building

```bash
# Build all contracts
make build

# Build individual contracts
make build-launchpad
make build-marketplace

# Check compilation without building
make check
```

Built contracts will be in:
- `launchpad/build/nft_launchpad.wasm`
- `marketplace/build/nft_marketplace.wasm`

## Testing

```bash
# Run all tests
make test
```

## Deployment

### 1. Deploy CEP-78 Contract (One-time)

First, deploy the official CEP-78 contract to get its package hash:

```bash
casper-client put-deploy \
  --node-address https://testnet.casper.network \
  --chain-name casper-test \
  --secret-key ~/.casper/testnet/secret_key.pem \
  --session-path cep78-deployment/cep78-installer.wasm \
  --payment-amount 200000000000
```

### 2. Deploy NFT Launchpad

```bash
casper-client put-deploy \
  --node-address https://testnet.casper.network \
  --chain-name casper-test \
  --secret-key ~/.casper/testnet/secret_key.pem \
  --session-path launchpad/build/nft_launchpad.wasm \
  --session-arg "cep78_package_hash:key='<CEP78_PACKAGE_HASH>'" \
  --payment-amount 150000000000
```

### 3. Deploy NFT Marketplace

```bash
casper-client put-deploy \
  --node-address https://testnet.casper.network \
  --chain-name casper-test \
  --secret-key ~/.casper/testnet/secret_key.pem \
  --session-path marketplace/build/nft_marketplace.wasm \
  --payment-amount 150000000000
```

## Network Configuration

### Testnet
- Node Address: `https://testnet.casper.network`
- Chain Name: `casper-test`
- Explorer: `https://testnet.cspr.live`

### Mainnet
- Node Address: `https://node.mainnet.casper.network`
- Chain Name: `casper`
- Explorer: `https://cspr.live`

## Contract Interaction

### Create NFT Collection

```bash
casper-client put-deploy \
  --node-address https://testnet.casper.network \
  --chain-name casper-test \
  --secret-key ~/.casper/testnet/secret_key.pem \
  --session-hash <LAUNCHPAD_CONTRACT_HASH> \
  --session-entry-point create_collection \
  --session-arg "name:string='My Collection'" \
  --session-arg "symbol:string='MYC'" \
  --session-arg "description:string='My NFT Collection'" \
  --session-arg "uri:string='https://example.com/metadata'" \
  --session-arg "total_supply:u64='10000'" \
  --session-arg "royalty_numerator:u64='5'" \
  --session-arg "royalty_denominator:u64='100'" \
  --payment-amount 100000000000
```

### List NFT on Marketplace

```bash
casper-client put-deploy \
  --node-address https://testnet.casper.network \
  --chain-name casper-test \
  --secret-key ~/.casper/testnet/secret_key.pem \
  --session-hash <MARKETPLACE_CONTRACT_HASH> \
  --session-entry-point list_nft \
  --session-arg "token_hash:key='<NFT_TOKEN_HASH>'" \
  --session-arg "collection_hash:key='<COLLECTION_HASH>'" \
  --session-arg "price:u512='1000000000'" \
  --payment-amount 50000000000
```

### Purchase NFT

```bash
casper-client put-deploy \
  --node-address https://testnet.casper.network \
  --chain-name casper-test \
  --secret-key ~/.casper/testnet/secret_key.pem \
  --session-hash <MARKETPLACE_CONTRACT_HASH> \
  --session-entry-point purchase \
  --session-arg "listing_id:string='<LISTING_ID>'" \
  --payment-amount 50000000000
```

## Architecture

### CEP-78 Integration (Factory Pattern)
```
Launchpad Contract → Stores CEP-78 package hash → Deploys instances → Tracks in registry
```

### Payment Distribution (Purchase Flow)
```
Buyer pays → Marketplace purse
  ├─ 2.5% → Platform fee recipient
  ├─ Royalty% → Collection creator
  └─ Remainder → Seller
```

## Project Structure

```
casper/
├── launchpad/
│   ├── src/
│   │   ├── main.rs          # Entry points + call()
│   │   ├── lib.rs           # Module exports
│   │   ├── storage.rs       # Dictionary helpers
│   │   ├── types.rs         # CollectionInfo struct
│   │   ├── errors.rs        # Error codes
│   │   └── events.rs        # Event definitions
│   ├── Cargo.toml
│   └── build/               # Compiled WASM
├── marketplace/
│   ├── src/
│   │   ├── main.rs          # Entry points + call()
│   │   ├── lib.rs           # Module exports
│   │   ├── storage.rs       # Dictionary helpers
│   │   ├── payment.rs       # CSPR distribution logic
│   │   ├── types.rs         # Listing struct
│   │   ├── errors.rs        # Error codes
│   │   └── events.rs        # Event definitions
│   ├── Cargo.toml
│   └── build/               # Compiled WASM
├── Cargo.toml               # Workspace config
├── Makefile                 # Build automation
└── README.md                # This file
```

## License

MIT
