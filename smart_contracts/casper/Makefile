.PHONY: all build build-launchpad build-marketplace test clean prepare

all: build

prepare:
	rustup target add wasm32-unknown-unknown

build: build-launchpad build-marketplace

build-launchpad:
	@echo "Building NFT Launchpad contract..."
	cd launchpad && cargo build --release --target wasm32-unknown-unknown
	@mkdir -p launchpad/build
	@cp launchpad/target/wasm32-unknown-unknown/release/nft_launchpad.wasm launchpad/build/
	@wasm-strip launchpad/build/nft_launchpad.wasm 2>/dev/null || true
	@echo "✓ Launchpad contract built: launchpad/build/nft_launchpad.wasm"

build-marketplace:
	@echo "Building NFT Marketplace contract..."
	cd marketplace && cargo build --release --target wasm32-unknown-unknown
	@mkdir -p marketplace/build
	@cp marketplace/target/wasm32-unknown-unknown/release/nft_marketplace.wasm marketplace/build/
	@wasm-strip marketplace/build/nft_marketplace.wasm 2>/dev/null || true
	@echo "✓ Marketplace contract built: marketplace/build/nft_marketplace.wasm"

test:
	cargo test --all

clean:
	cargo clean
	rm -rf launchpad/build marketplace/build

check:
	cargo check --all --target wasm32-unknown-unknown
