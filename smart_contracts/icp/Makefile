create-canisters:
	dfx canister create --all

deploy-frontend:
	dfx deploy internet_identity

deploy-backend:
	dfx deploy users
	dfx deploy identity_certifier --argument '(principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae")'
	dfx deploy treasury
	dfx deploy registry --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx deploy x_chain --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx deploy marketplace --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; collection_creation_fee = 100_000_000 : nat; marketplace_fee_percentage = 250 : nat16 })'
	dfx generate users
	dfx generate treasury
	dfx generate registry
	dfx generate x_chain
	dfx generate marketplace

generate:
	dfx generate
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av --delete src/declarations/ ../../client/declarations/
	rsync -av --delete src/declarations/ ../../admin/declarations/

deploy-registry:
	dfx deploy registry --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate registry
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/registry/ ../../client/declarations/registry/
	rsync -av src/declarations/registry/ ../../admin/declarations/registry/

deploy-registry-live:
	dfx deploy registry --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })' --network ic

deploy-x_chain:
	dfx deploy x_chain --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate x_chain
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/x_chain/ ../../client/declarations/x_chain/
	rsync -av src/declarations/x_chain/ ../../admin/declarations/x_chain/

deploy-x_chain-live:
	dfx deploy x_chain --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; ed25519_key_name = opt variant { MainnetTestKey1 } })' --network ic

deploy-marketplace:
	dfx deploy marketplace --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; collection_creation_fee = 100_000_000 : nat; marketplace_fee_percentage = 250 : nat16 })'
	dfx generate marketplace
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/marketplace/ ../../client/declarations/marketplace/
	rsync -av src/declarations/marketplace/ ../../admin/declarations/marketplace/

deploy-marketplace-live:
	dfx deploy marketplace --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; collection_creation_fee = 100_000_000 : nat; marketplace_fee_percentage = 250 : nat16 })' --network ic

deploy-users:
	dfx deploy users
	dfx generate users
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/users/ ../../client/declarations/users/
	rsync -av src/declarations/users/ ../../admin/declarations/users/

deploy-treasury:
	dfx deploy treasury
	dfx generate treasury
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/treasury/ ../../client/declarations/treasury/
	rsync -av src/declarations/treasury/ ../../admin/declarations/treasury/

deploy-identity-certifier:
	dfx deploy identity_certifier --argument '(principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae")'
	dfx generate identity_certifier
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/identity_certifier/ ../../client/declarations/identity_certifier/
	rsync -av src/declarations/identity_certifier/ ../../admin/declarations/identity_certifier/

deploy-all: create-canisters deploy-backend deploy-frontend generate

run-frontend:
	pnpm install
	pnpm run dev

clean:
	rm -rf .dfx
	rm -rf dist
	rm -rf node_modules
	rm -rf src/declarations
	rm -f .env
	cargo clean

deploy-all-live: deploy-backend

reinstall-registry:
	dfx canister install registry --mode reinstall --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate registry
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/registry/ ../../client/declarations/registry/
	rsync -av src/declarations/registry/ ../../admin/declarations/registry/

reinstall-registry-live:
	dfx canister install registry --mode reinstall --yes --network ic --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'

reinstall-x_chain:
	dfx canister install x_chain --mode reinstall --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate x_chain
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/x_chain/ ../../client/declarations/x_chain/
	rsync -av src/declarations/x_chain/ ../../admin/declarations/x_chain/

reinstall-x_chain-live:
	dfx canister install x_chain --mode reinstall --yes --network ic --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; ed25519_key_name = opt variant { MainnetTestKey1 } })'

reinstall-marketplace:
	dfx canister install marketplace --mode reinstall --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; collection_creation_fee = 100_000_000 : nat; marketplace_fee_percentage = 250 : nat16 })'
	dfx generate marketplace
	mkdir -p ../../client/declarations
	mkdir -p ../../admin/declarations
	rsync -av src/declarations/marketplace/ ../../client/declarations/marketplace/
	rsync -av src/declarations/marketplace/ ../../admin/declarations/marketplace/

reinstall-marketplace-live:
	dfx canister install marketplace --mode reinstall --yes --network ic --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; collection_creation_fee = 100_000_000 : nat; marketplace_fee_percentage = 250 : nat16 })'

build:
	cargo build --target wasm32-unknown-unknown --release --package registry
	cargo build --target wasm32-unknown-unknown --release --package x_chain
	cargo build --target wasm32-unknown-unknown --release --package marketplace

build-registry:
	cargo build --target wasm32-unknown-unknown --release --package registry

build-x_chain:
	cargo build --target wasm32-unknown-unknown --release --package x_chain

build-marketplace:
	cargo build --target wasm32-unknown-unknown --release --package marketplace
