# Movement Smart Contracts

NFT Launchpad and Marketplace smart contracts for Movement Network.

## Project Structure

```
movement/
├── launchpad/          # NFT collection creation & minting (nft_launchpad::launchpad)
└── marketplace/        # NFT marketplace with escrow (marketplace_addr::marketplace)
```

## Prerequisites

1. Install Movement CLI:
```bash
curl -fsSL https://get.movementlabs.xyz/cli | sh
```

2. Initialize Movement (first time only):
```bash
movement init
```

3. Fund your account from faucet:
```bash
movement account fund-with-faucet --account default
# Or visit: https://faucet.movementlabs.xyz/
```

## Deploy Launchpad

```bash
cd launchpad

# Compile
movement move compile --named-addresses nft_launchpad=default

# Publish to testnet
movement move publish --named-addresses nft_launchpad=default --assume-yes
```

## Deploy Marketplace

```bash
cd marketplace

# Compile
movement move compile --named-addresses marketplace_addr=default

# Publish to testnet
movement move publish --named-addresses marketplace_addr=default --assume-yes
```

## Current Deployments (Testnet)

- **Launchpad:** `0x38a24fb18c1e8aadf7037a15bf279a71f9a9ca158e46e9b1ca1cfd6be0834828`
- **Marketplace:** `0x6f7ab492c91c86ee6f1c86bb1da9c4eae0de11e43ae7bd5e56b16a5696e458ff`

## Network Info

- **Testnet RPC:** `https://testnet.movementnetwork.xyz/v1`
- **Faucet:** `https://faucet.movementlabs.xyz/`
- **Explorer:** `https://explorer.movementnetwork.xyz/?network=testnet`
