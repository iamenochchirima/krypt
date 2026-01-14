#!/usr/bin/env bash

function generate_did() {
  local canister=$1
  local canister_root=$2

  cargo build --manifest-path="$canister_root/Cargo.toml" \
    --target wasm32-unknown-unknown \
    --release --package "$canister"

  candid-extractor "target/wasm32-unknown-unknown/release/$canister.wasm" >"$canister_root/$canister.did"
}

# Users and Treasury
generate_did "users" "src/users"
generate_did "treasury" "src/treasury"

# NFT canisters
generate_did "registry" "src/nfts/registry"
generate_did "marketplace" "src/nfts/marketplace"

# X-Chain canister
generate_did "x_chain" "src/x_chain"
