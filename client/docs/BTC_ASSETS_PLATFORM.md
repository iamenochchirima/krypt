# BTC Assets Platform

A high-performance trading platform for Bitcoin-native assets, leveraging Internet Computer (ICP) for instant trades while maintaining Bitcoin L1 settlement. Currently supporting **Bitcoin Runes**, with plans to expand to other Bitcoin asset standards.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [User Flows](#user-flows)
- [Technical Specifications](#technical-specifications)
- [Security Model](#security-model)
- [Fee Structure](#fee-structure)
- [API Reference](#api-reference)
- [Development Phases](#development-phases)

---

## Overview

### The Problem

Trading Bitcoin-native assets on L1 is slow (10-minute blocks), expensive (high fees), and fragmented across multiple platforms. Users want the speed of centralized exchanges with the trustlessness of Bitcoin.

### The Solution

Our platform keeps all trading activity on ICP canisters, achieving 2-second finality for trades while using Bitcoin L1 only for:

- **Deposits**: BTC enters the system via ckBTC minter
- **Withdrawals**: BTC exits to user's Bitcoin wallet
- **Asset Minting**: Tokens "ascend" to become real Bitcoin assets (Runes) at market cap threshold

### Supported Asset Types

| Asset Type | Status | Description |
|------------|--------|-------------|
| **Runes** | Active | Bitcoin fungible token standard |
| BRC-20 | Planned | JSON-based fungible tokens |
| Ordinals | Planned | Bitcoin NFTs |

### Key Benefits

| Feature | Traditional DEX | Our Platform |
|---------|----------------|--------------|
| Trade Speed | 10+ minutes | ~2 seconds |
| Gas Costs | High per trade | Zero (covered by platform) |
| Slippage | High on small pools | Predictable via bonding curve |
| Token Launch | Complex setup | One-click creation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐ │
│  │   BITCOIN    │     │    ICP CANISTER     │     │    OFF-CHAIN     │ │
│  │   NETWORK    │     │    (Main State)     │     │    SERVICES      │ │
│  ├──────────────┤     ├─────────────────────┤     ├──────────────────┤ │
│  │              │     │                     │     │                  │ │
│  │ • ckBTC      │◄───►│ • User Balances     │◄───►│ • Event Indexer  │ │
│  │   Minter     │     │ • Token States      │     │ • PostgreSQL DB  │ │
│  │              │     │ • Trading Logic     │     │ • REST API       │ │
│  │ • Rune       │◄────│ • Bonding Curves    │     │ • WebSocket Feed │ │
│  │   Etching    │     │ • AMM Pools         │     │ • Frontend CDN   │ │
│  │              │     │ • Event Log         │     │                  │ │
│  │ • Final      │◄────│ • Threshold ECDSA   │     │                  │ │
│  │   Settlement │     │                     │     │                  │ │
│  │              │     │                     │     │                  │ │
│  └──────────────┘     └─────────────────────┘     └──────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Principle

Single canister holds all state. Trades are internal ledger updates. Bitcoin L1 only touched for deposits, withdrawals, and asset minting at ascension.

### Why Single Canister?

Instead of deploying separate ICRC-2 token canisters for each token (which would mean 20,000+ canisters), we use an internal ledger model:

| Approach | Canisters | Latency | Atomicity | Cost |
|----------|-----------|---------|-----------|------|
| ICRC-2 per token | 20,000+ | High (inter-canister) | Complex | Expensive |
| Internal Ledger | 1 | Low | Simple | Cheap |

**Trade-off**: Users trust platform custody. Less composable with other ICP DeFi protocols.

---

## Core Concepts

### fastBTC

Internal representation of BTC within the platform. 1 fastBTC = 1 BTC. Used for:
- Trading on bonding curves
- Providing AMM liquidity
- Platform fees

fastBTC is backed 1:1 by ckBTC held in the canister.

### Bonding Curves

Tokens launch with a bonding curve that determines price based on supply:

```
Price = f(Supply)
```

- **Early buyers** get tokens cheaper
- **Price rises** as supply increases
- **Every token** has BTC backing in the reserve
- **Selling** burns tokens and returns BTC from reserve

### Ascension

When a token reaches a market cap threshold (e.g., 0.5 BTC), it "ascends":

1. Bonding curve trading freezes
2. Portion of tokens + 0.2 BTC locked into AMM pool
3. Unique 4-character ID generated (e.g., `RXTM`)
4. Asset minted on Bitcoin L1 (Rune etched with full supply, no open minting)
5. Token becomes tradeable on AMM and withdrawable to Bitcoin

### AMM Pools (Post-Ascension)

After ascension, tokens trade on constant-product AMM:

```
token_reserve × btc_reserve = k
```

Price is determined by ratio of reserves. Large trades experience slippage.

---

## User Flows

### 1. Authentication

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Bitcoin Wallet │────►│  SIWB Canister  │────►│  IC Identity    │
│  Signs Message  │     │  Verifies Sig   │     │  Session Key    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

Users sign a message with their Bitcoin wallet. The Sign In With Bitcoin (SIWB) canister verifies the signature and creates a delegated IC identity with session keys, enabling frictionless trading without wallet popups.

### 2. Deposit BTC

```
User sends BTC ──► ckBTC Minter ──► Platform detects ──► Credits fastBTC
```

**Tiered Confirmations:**

| Amount | Confirmations Required |
|--------|----------------------|
| < 0.1 BTC | 1 |
| 0.1 - 1 BTC | 2 |
| 1 - 5 BTC | 3 |
| > 5 BTC | 6 |

Users can trade immediately. Withdrawals locked until 6 confirmations.

### 3. Create Token

```typescript
{
  name: "My Token",
  ticker: "MYTKN",
  logo: "ipfs://...",
  socials: { twitter: "@mytoken", website: "https://..." }
}
```

Platform generates ticker format: `MYTKN•ID•XXXX•KRYPT`

The `XXXX` is replaced with a unique 4-character ID at ascension.

**Creation Fee**: ~0.00003 BTC

### 4. Buy Tokens (Pre-Ascension)

```
User specifies BTC ──► Curve calculates tokens ──► Mint tokens ──► Add BTC to reserve
```

### 5. Sell Tokens (Pre-Ascension)

```
User specifies tokens ──► Curve calculates BTC ──► Burn tokens ──► Return BTC from reserve
```

### 6. Trade on AMM (Post-Ascension)

```
Buy:  Send BTC ──► Receive tokens ──► k stays constant
Sell: Send tokens ──► Receive BTC ──► k stays constant
```

### 7. Withdraw BTC

```
User requests ──► Deduct fastBTC ──► Burn ckBTC ──► BTC sent to L1 address
```

Requires user's deposit to have 6 confirmations.

### 8. Withdraw Runes (Post-Ascension)

```
User requests ──► Deduct token balance ──► Construct Runestone ──► Sign with tECDSA ──► Broadcast
```

### 9. Deposit Runes (Post-Ascension)

```
User sends Runes to platform ──► Detect incoming ──► Match rune_id ──► Credit balance
```

---

## Technical Specifications

### Data Structures

```rust
// User account
type UserAccount = record {
  principal: Principal;
  bitcoin_address: text;
  fastbtc_balance: nat;
  token_balances: vec record { token_id: nat64; balance: nat };
  deposit_confirmations: nat8;
  created_at: nat64;
};

// Token state
type Token = record {
  id: nat64;
  name: text;
  ticker: text;
  logo_url: text;
  creator: Principal;
  supply: nat;
  reserve_btc: nat;
  curve_params: BondingCurveParams;
  ascended: bool;
  asset_id: opt text;        // Rune ID after ascension
  asset_type: AssetType;     // Rune, BRC20, etc.
  amm_pool: opt AmmPool;
  created_at: nat64;
};

// Asset types (extensible)
type AssetType = variant {
  Rune;
  BRC20;
  Ordinal;
};

// AMM Pool (post-ascension)
type AmmPool = record {
  token_reserve: nat;
  btc_reserve: nat;
  k: nat;
  lp_tokens: nat;
  fee_bps: nat16;
};
```

### Bonding Curve Formula

Modified constant-product curve for pre-ascension trading:

```
price = reserve_btc / supply
tokens_out = supply * (sqrt(1 + btc_in/reserve_btc) - 1)
```

### Threshold ECDSA

For signing Bitcoin transactions (Rune withdrawals, etching):

```rust
let sig = sign_with_ecdsa(SignWithEcdsaArgument {
  message_hash: tx_hash,
  derivation_path: vec![b"btc".to_vec(), user_id.to_vec()],
  key_id: EcdsaKeyId {
    curve: EcdsaCurve::Secp256k1,
    name: "key_1".to_string(),
  },
}).await;
```

### Event System

Every operation emits an event for off-chain indexing:

```rust
type Event = variant {
  UserRegistered: record { principal: Principal; bitcoin_address: text; timestamp: nat64 };
  Deposit: record { user: Principal; amount: nat; tx_hash: text; timestamp: nat64 };
  DepositConfirmed: record { user: Principal; amount: nat; confirmations: nat8; timestamp: nat64 };
  TokenCreated: record { token_id: nat64; name: text; ticker: text; creator: Principal; timestamp: nat64 };
  Trade: TradeEvent;
  Ascension: record { token_id: nat64; asset_id: text; amm_pool: AmmPool; timestamp: nat64 };
  Withdrawal: record { user: Principal; amount: nat; destination: text; timestamp: nat64 };
  AssetDeposit: record { user: Principal; asset_id: text; amount: nat; timestamp: nat64 };
  AssetWithdrawal: record { user: Principal; asset_id: text; amount: nat; destination: text; timestamp: nat64 };
};
```

---

## Security Model

### Critical Invariants

```
1. sum(user_fastbtc_balances) == platform_total_fastbtc
2. sum(user_token_balances) + amm_reserve == token_total_supply
3. platform_total_fastbtc <= ckbtc_balance + confirmed_pending_deposits
4. No negative balances anywhere (use Nat, not Int)
```

### Audit Checklist

| Area | Verification |
|------|--------------|
| No inflation | Tokens only created via curve buys, no admin mint |
| No balance manipulation | Only owner can decrease their balance |
| Atomicity | Trade fully completes or fully reverts |
| Access control | Users only touch own balances, minimal admin functions |
| BTC backing | `total_fastbtc <= ckbtc_balance` always |

### Double-Spend Mitigation

1. **Tiered confirmations** based on deposit size
2. **Withdrawal lock** until 6 confirmations
3. **Velocity limits** on new accounts
4. **Pattern detection** for suspicious activity
5. **Insurance fund** from fees covers rare losses

### Why Full Premine at Ascension?

External minting would:
- Bypass bonding curve (no price discovery)
- Create tokens without BTC backing
- Break internal accounting (supply mismatch)

Full premine ensures 1:1 match between internal ledger and L1 asset supply.

---

## Fee Structure

| Operation | Fee |
|-----------|-----|
| Token Creation | ~0.00003 BTC |
| Buy/Sell (Bonding Curve) | 1% |
| AMM Swap | 1% |
| BTC Withdrawal | Network fee only |
| Asset Withdrawal | Network fee + 0.1% |

---

## API Reference

### Canister Methods

```candid
service : {
  // Authentication
  "register": (BitcoinSignature) -> (Result);
  "get_user": (Principal) -> (opt UserAccount) query;

  // Deposits & Withdrawals
  "get_deposit_address": () -> (text) query;
  "request_btc_withdrawal": (text, nat) -> (Result);
  "request_asset_withdrawal": (nat64, text, nat) -> (Result);

  // Token Operations
  "create_token": (CreateTokenArgs) -> (Result_1);
  "get_token": (nat64) -> (opt Token) query;
  "list_tokens": (opt nat64, opt nat64) -> (vec Token) query;

  // Trading
  "buy_tokens": (nat64, nat, nat) -> (Result);  // token_id, btc_amount, min_tokens_out
  "sell_tokens": (nat64, nat, nat) -> (Result); // token_id, token_amount, min_btc_out
  "swap": (nat64, SwapDirection, nat, nat) -> (Result); // AMM swap post-ascension

  // Queries
  "get_price": (nat64) -> (nat) query;
  "get_quote": (nat64, nat, bool) -> (nat) query;
  "get_events": (nat64, nat64) -> (vec Event) query;
}
```

### REST API (Off-chain)

```
GET  /api/tokens                    # List all tokens
GET  /api/tokens/:id                # Get token details
GET  /api/tokens/:id/trades         # Get trade history
GET  /api/tokens/:id/chart          # Get OHLCV data
GET  /api/users/:address            # Get user profile
GET  /api/users/:address/holdings   # Get user holdings
WS   /api/ws                        # Real-time trades & prices
```

---

## Development Phases

### Phase 1: Foundation
- [ ] Core canister structure
- [ ] Authentication (SIWB integration)
- [ ] Data structures & state management
- [ ] Event system

### Phase 2: BTC Integration
- [ ] ckBTC deposit monitoring
- [ ] fastBTC crediting with tiered confirmations
- [ ] BTC withdrawal via ckBTC minter

### Phase 3: Token Trading
- [ ] Token creation flow
- [ ] Bonding curve buy/sell
- [ ] Slippage protection
- [ ] Price quotes

### Phase 4: Ascension & AMM
- [ ] Ascension trigger logic
- [ ] AMM pool initialization
- [ ] Constant-product swaps

### Phase 5: Bitcoin L1 Integration (Runes)
- [ ] Threshold ECDSA setup
- [ ] Rune etching at ascension
- [ ] Rune withdrawals
- [ ] Rune deposits

### Phase 6: Production Infrastructure
- [ ] Off-chain indexer
- [ ] PostgreSQL database
- [ ] REST API & WebSocket
- [ ] Frontend application

---

## Glossary

| Term | Definition |
|------|------------|
| **fastBTC** | Internal BTC representation, 1:1 with ckBTC |
| **ckBTC** | Chain-key Bitcoin, ICP's native BTC wrapper |
| **Bonding Curve** | Pricing mechanism where price = f(supply) |
| **Ascension** | Process of token becoming a real Bitcoin asset |
| **AMM** | Automated Market Maker using constant-product formula |
| **Rune** | Bitcoin fungible token standard |
| **tECDSA** | Threshold ECDSA, distributed signing on ICP |
| **Runestone** | Bitcoin transaction containing Rune protocol data |
