# Krypt

Multi-chain NFT marketplace supporting ICP, Solana, Ethereum, Bitcoin and more.

## Prerequisites

- [dfx](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (Internet Computer SDK)
- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/)

## Setup & Run

### 1. Deploy Canisters

```bash
cd canisters
dfx start --clean --background
make deploy-all
```

### 2. Generate Declarations

```bash
make generate
```

### 3. Run Frontend

```bash
cd ../client
pnpm install
pnpm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Run Backend Server

```bash
cd ../server
cargo run
```

Backend server runs at `http://localhost:8080`

## Development Commands

### Canisters
```bash
cd canisters

# Deploy all canisters
make deploy-all

# Deploy specific canister
dfx deploy marketplace

# Generate TypeScript declarations
make generate

# Clean build artifacts
make clean
```

### Frontend
```bash
cd client

# Install dependencies
pnpm install

# Run dev server
pnpm run dev

# Build for production
pnpm build
```

### Backend
```bash
cd server

# Run development server
cargo run

# Build release
cargo build --release
```

## Project Structure

```
├── canisters/          # Internet Computer canisters
│   ├── src/
│   │   ├── marketplace/   # Unified marketplace canister
│   │   ├── users/         # User management
│   │   ├── treasury/      # Multi-chain treasury
│   │   └── ...
├── client/             # Next.js frontend
│   ├── app/
│   ├── declarations/   # Generated canister types
│   └── ...
└── server/             # Actix backend server
    └── src/
```

## Architecture

- **Canisters**: Smart contracts on Internet Computer
- **Frontend**: Next.js with TypeScript
- **Backend**: Rust Actix web server for off-chain operations

## Multi-Chain Support

- **ICP**: Native canister integration
- **Solana**: Chain Key ECDSA signing
- **Ethereum**: Chain Key ECDSA signing
- **Bitcoin**: Chain Key ECDSA signing
