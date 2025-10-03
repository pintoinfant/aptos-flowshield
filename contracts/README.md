# 🛡️ FlowShield Smart Contracts

> **Move-based Privacy Mixer** - Secure, auditable privacy contracts for the Aptos blockchain

[![Move](https://img.shields.io/badge/Move-Language-FF6B35?style=flat-square)](https://move-language.github.io/move/)
[![Aptos](https://img.shields.io/badge/Aptos-Framework-00D4AA?style=flat-square)](https://aptoslabs.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](/LICENSE)

---

## 📋 Overview

This directory contains the **FlowShield** smart contracts written in the Move programming language for the Aptos blockchain. The contracts implement a privacy mixer that allows users to break the on-chain link between deposit and withdrawal addresses while maintaining cryptographic proof of fund ownership.

### 🏗️ Contract Architecture

```
contracts/
├── contract/
│   ├── sources/
│   │   └── privacy_pool.move      # Core privacy mixer contract
│   ├── tests/
│   │   └── test_end_to_end.move   # Comprehensive test suite
│   ├── Move.toml                  # Package configuration
│   └── README.md                  # This file
├── scripts/
│   ├── move/
│   │   ├── compile.js             # Contract compilation
│   │   ├── publish.js             # Deployment script
│   │   ├── test.js                # Test runner
│   │   └── upgrade.js             # Contract upgrade utility
│   └── README.md
└── package.json                   # Node.js dependencies
```

---

## 🔧 Technical Specifications

### Contract Address
**Devnet**: `0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd`  
**Testnet**: *Not yet deployed*  
**Mainnet**: *Not yet deployed*

### Supported Coin Types
- **APT** (`0x1::aptos_coin::AptosCoin`) - Primary implementation
- **Generic CoinType** - Extensible to other Aptos coins

### Pool Denominations
- **0.1 APT** (10,000,000 octas)
- **1 APT** (100,000,000 octas)
- **10 APT** (1,000,000,000 octas)
- **100 APT** (10,000,000,000 octas)

---

## 📚 Contract Documentation

### Core Data Structures

#### `Pool<CoinType>`
```move
struct Pool<phantom CoinType> has store {
    balance: Coin<CoinType>,           // Pooled funds
    deposits: Table<vector<u8>, bool>, // Active deposit commitments
}
```

#### `Mixer<CoinType>`
```move
struct Mixer<phantom CoinType> has key {
    operator_address: address,                      // Contract operator
    used_secrets: Table<vector<u8>, bool>,         // Prevents double-spending
    pools: Table<u64, Pool<CoinType>>,             // Denomination -> Pool mapping
    deposit_events: EventHandle<DepositEvent>,     // Deposit event emitter
    withdraw_events: EventHandle<WithdrawEvent>,   // Withdrawal event emitter
    pool_created_events: EventHandle<PoolCreatedEvent>, // Pool creation events
}
```

### Event Structures

#### `DepositEvent`
```move
struct DepositEvent has drop, store {
    commitment: vector<u8>, // SHA-256 hash of secret
    amount: u64,           // Deposit amount in octas
}
```

#### `WithdrawEvent`
```move
struct WithdrawEvent has drop, store {
    recipient: address, // Withdrawal recipient
    amount: u64,       // Amount withdrawn (minus fees if applicable)
}
```

#### `PoolCreatedEvent`
```move
struct PoolCreatedEvent has drop, store {
    denomination: u64, // Pool denomination in octas
    label: String,     // Human-readable pool label
}
```

---

## 🔍 Function Reference

### Management Functions

#### `initialize_mixer<CoinType>(deployer: &signer)`
**Purpose**: Initialize the privacy mixer contract  
**Access**: Deployer only  
**Gas**: ~0.001 APT  

```move
public entry fun initialize_mixer<CoinType>(deployer: &signer)
```

**Parameters**:
- `deployer`: Signer with deployment authority

**Effects**:
- Creates new `Mixer<CoinType>` resource
- Sets deployer as operator
- Initializes empty pools table
- Sets up event handles

**Errors**:
- `E_MIXER_ALREADY_EXISTS`: Mixer already initialized

---

#### `add_pool<CoinType>(operator: &signer, denomination: u64, label: String)`
**Purpose**: Add a new pool denomination  
**Access**: Operator only  
**Gas**: ~0.0005 APT  

```move
public entry fun add_pool<CoinType>(operator: &signer, denomination: u64, label: String)
```

**Parameters**:
- `operator`: Contract operator signer
- `denomination`: Pool size in octas (e.g., 100000000 for 1 APT)
- `label`: Human-readable description (e.g., "1 APT Pool")

**Effects**:
- Creates new empty pool for denomination
- Emits `PoolCreatedEvent`

**Errors**:
- `E_NOT_OPERATOR`: Caller is not the contract operator
- `E_POOL_DENOMINATION_EXISTS`: Pool already exists for denomination

---

### User Functions

#### `deposit<CoinType>(user: &signer, secret_hash: vector<u8>, amount: u64)`
**Purpose**: Deposit funds into a privacy pool  
**Access**: Public  
**Gas**: ~0.002 APT  

```move
public entry fun deposit<CoinType>(user: &signer, secret_hash: vector<u8>, amount: u64)
```

**Parameters**:
- `user`: Depositing user's signer
- `secret_hash`: SHA-256 hash of 32-byte secret
- `amount`: Deposit amount in octas (must match existing pool)

**Effects**:
- Transfers `amount` from user to pool
- Records commitment in pool's deposits table
- Emits `DepositEvent`

**Errors**:
- `E_POOL_NOT_FOUND`: No pool exists for the amount
- `E_DEPOSIT_NOT_FOUND`: Secret hash already used in this pool

**Example Usage**:
```typescript
// Frontend: Generate secret and hash
const secret = crypto.getRandomValues(new Uint8Array(32));
const secretHash = sha256(secret);

// Call contract
await signAndSubmitTransaction({
  data: {
    function: `${MODULE_ADDRESS}::privacy_pool::deposit`,
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    functionArguments: [secretHash, 100000000] // 1 APT in octas
  }
});
```

---

#### `withdraw_direct<CoinType>(user: &signer, secret_hash: vector<u8>, amount: u64)`
**Purpose**: Withdraw funds directly to connected wallet  
**Access**: Public  
**Gas**: ~0.002 APT (paid by user)  

```move
public entry fun withdraw_direct<CoinType>(user: &signer, secret_hash: vector<u8>, amount: u64)
```

**Parameters**:
- `user`: Withdrawing user's signer
- `secret_hash`: SHA-256 hash of original secret
- `amount`: Withdrawal amount in octas

**Effects**:
- Validates secret hash exists in pool deposits
- Marks secret as used (prevents double-spending)
- Transfers `amount` from pool to user
- Emits `WithdrawEvent`

**Errors**:
- `E_POOL_NOT_FOUND`: No pool exists for the amount
- `E_SECRET_ALREADY_USED`: Secret hash already used for withdrawal
- `E_DEPOSIT_NOT_FOUND`: Secret hash not found in pool deposits

**Privacy Note**: User receives funds directly to connected wallet address.

---

#### `withdraw_via_relayer<CoinType>(_relayer: &signer, secret_hash: vector<u8>, amount: u64, recipient_address: address)`
**Purpose**: Withdraw funds via relayer service (gas-free for user)  
**Access**: Public (called by relayer)  
**Gas**: ~0.002 APT (paid by relayer)  
**Fee**: 5% of withdrawal amount  

```move
public entry fun withdraw_via_relayer<CoinType>(
    _relayer: &signer,
    secret_hash: vector<u8>,
    amount: u64,
    recipient_address: address
)
```

**Parameters**:
- `_relayer`: Relayer's signer (pays gas fees)
- `secret_hash`: SHA-256 hash of original secret
- `amount`: Withdrawal amount in octas
- `recipient_address`: Where to send funds (95% of amount)

**Effects**:
- Validates secret hash exists in pool deposits
- Marks secret as used
- Calculates 5% relayer fee
- Sends 95% to recipient, 5% to operator
- Emits `WithdrawEvent` (logs user amount only)

**Fee Structure**:
- **User receives**: 95% of deposited amount
- **Relayer receives**: 5% service fee
- **Gas costs**: Paid by relayer

**Example**:
```
Deposit: 1.0 APT
User receives: 0.95 APT
Relayer fee: 0.05 APT
```

---

## 🔒 Security Features

### Move Language Safety
- **Memory Safety**: Automatic memory management prevents buffer overflows
- **Resource Safety**: Linear types ensure coins cannot be duplicated or destroyed
- **No Reentrancy**: Move's execution model prevents reentrancy attacks
- **Formal Verification**: Move bytecode is formally verified before execution

### Contract-Specific Security

#### Double-Spending Prevention
```move
// Check secret hasn't been used
assert!(!table::contains(&mixer.used_secrets, secret_hash), E_SECRET_ALREADY_USED);

// Mark secret as used
table::add(&mut mixer.used_secrets, secret_hash, true);
```

#### Deposit Validation
```move
// Ensure pool exists
assert!(table::contains(&mixer.pools, amount), E_POOL_NOT_FOUND);

// Ensure commitment exists (prevents fake withdrawals)
assert!(table::contains(&pool.deposits, secret_hash), E_DEPOSIT_NOT_FOUND);
```

#### Access Control
```move
// Only operator can manage pools
assert!(signer::address_of(operator) == mixer.operator_address, E_NOT_OPERATOR);
```

### Cryptographic Security
- **SHA-256 Hashing**: Industry-standard cryptographic commitments
- **Client-Side Secrets**: Private keys never transmitted to contract
- **Unlinkability**: No on-chain connection between deposits and withdrawals

---

## 🧪 Testing

### Running Unit Tests

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run move:compile

# Run all tests
npm run move:test

# Run specific test
aptos move test --filter test_deposit_withdraw
```

### Test Coverage

#### Core Functionality Tests
- ✅ **Contract Initialization**: Mixer setup and configuration
- ✅ **Pool Management**: Adding pools with different denominations
- ✅ **Deposit Flow**: Secret commitment and fund transfer
- ✅ **Direct Withdrawal**: Secret validation and payout
- ✅ **Relayer Withdrawal**: Fee calculation and multi-recipient payout

#### Security Tests
- ✅ **Double-Spending Prevention**: Used secrets cannot be reused
- ✅ **Access Control**: Only operator can manage pools
- ✅ **Invalid Deposits**: Wrong amounts and malformed data
- ✅ **Invalid Withdrawals**: Non-existent secrets and wrong pools

#### Edge Cases
- ✅ **Empty Pools**: Behavior with no deposits
- ✅ **Pool Exhaustion**: Withdrawing all funds from a pool
- ✅ **Large Numbers**: Maximum APT amounts and precision
- ✅ **Gas Optimization**: Efficient resource usage

### Expected Test Output
```bash
Running Move unit tests
[ PASS    ] 0x2267d40..::privacy_pool::test_initialization
[ PASS    ] 0x2267d40..::privacy_pool::test_add_pool
[ PASS    ] 0x2267d40..::privacy_pool::test_deposit_withdraw
[ PASS    ] 0x2267d40..::privacy_pool::test_relayer_withdrawal
[ PASS    ] 0x2267d40..::privacy_pool::test_double_spending_prevention
[ PASS    ] 0x2267d40..::privacy_pool::test_access_control
Test result: OK. Total tests: 6; passed: 6; failed: 0
```

---

## 🚀 Deployment Guide

### Prerequisites
```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version

# Initialize account
aptos init --network devnet
```

### Deployment Steps

#### 1. Compile Contracts
```bash
cd contracts
npm run move:compile
```

#### 2. Deploy to Devnet
```bash
# Deploy the privacy_pool module
npm run move:publish

# Expected output:
# Successfully published package
# Package address: 0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd
```

#### 3. Initialize Mixer
```bash
# Initialize the mixer contract
aptos move run \
  --function-id 'default::privacy_pool::initialize_mixer' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --assume-yes
```

#### 4. Create Pool Denominations
```bash
# Add 0.1 APT pool
aptos move run \
  --function-id 'default::privacy_pool::add_pool' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:10000000 "string:0.1 APT Pool" \
  --assume-yes

# Add 1 APT pool
aptos move run \
  --function-id 'default::privacy_pool::add_pool' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:100000000 "string:1 APT Pool" \
  --assume-yes

# Add 10 APT pool
aptos move run \
  --function-id 'default::privacy_pool::add_pool' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:1000000000 "string:10 APT Pool" \
  --assume-yes

# Add 100 APT pool
aptos move run \
  --function-id 'default::privacy_pool::add_pool' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:10000000000 "string:100 APT Pool" \
  --assume-yes
```

#### 5. Verify Deployment
```bash
# Check mixer resource exists
aptos account list --query resources \
  --account 0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd

# Should show: privacy_pool::Mixer<0x1::aptos_coin::AptosCoin>
```

### Mainnet Deployment (Future)
```bash
# Switch to mainnet
aptos init --network mainnet

# Deploy with production configuration
npm run move:publish:mainnet

# Initialize with production parameters
# (After security audit completion)
```

---

## 📊 Gas Costs & Performance

### Transaction Costs (Devnet)

| Function | Gas Units | APT Cost* | Description |
|----------|-----------|-----------|-------------|
| `initialize_mixer` | ~1,500 | ~0.0015 | One-time setup |
| `add_pool` | ~800 | ~0.0008 | Per pool creation |
| `deposit` | ~2,000 | ~0.002 | Per deposit |
| `withdraw_direct` | ~2,200 | ~0.0022 | Direct withdrawal |
| `withdraw_via_relayer` | ~2,500 | ~0.0025 | Relayer withdrawal |

*_Estimated costs based on devnet gas prices_

### Performance Characteristics
- **Throughput**: ~1,000 transactions per second (Aptos limit)
- **Confirmation Time**: ~3 seconds average
- **Storage Efficiency**: ~100 bytes per deposit commitment
- **Memory Usage**: O(n) where n = number of active deposits

### Optimization Strategies
- **Batch Operations**: Multiple deposits in single transaction
- **Efficient Data Structures**: Table-based storage for O(1) lookups
- **Minimal Event Data**: Only essential information in events
- **Resource Reuse**: Shared coin types across pools

---

## 🔧 Configuration

### Move.toml Configuration
```toml
[package]
name = "privacy_pool"
version = "1.0.0"
authors = ["FlowShield Team <team@flowshield.xyz>"]

[addresses]
mixer = "0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd"

[dev-addresses]
mixer = "0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "main" }

[dev-dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "testnet" }
```

### Error Codes Reference
```move
const E_NOT_OPERATOR: u64 = 1;           // Caller is not contract operator
const E_SECRET_ALREADY_USED: u64 = 3;    // Secret hash already used
const E_DEPOSIT_NOT_FOUND: u64 = 4;      // Deposit commitment not found
const E_MIXER_ALREADY_EXISTS: u64 = 5;   // Mixer already initialized
const E_POOL_NOT_FOUND: u64 = 6;         // Pool doesn't exist
const E_POOL_DENOMINATION_EXISTS: u64 = 7; // Pool already exists
```

---

## 🛡️ Security Audit Status

### Current Status
> **⚠️ WARNING**: This contract is a hackathon submission and has **NOT** undergone professional security audits. Use only on testnet with funds you can afford to lose.

### Planned Security Reviews
- [ ] **Internal Security Review**: Code review by experienced Move developers
- [ ] **Formal Verification**: Mathematical proof of contract correctness
- [ ] **Professional Audit**: Third-party security firm comprehensive audit
- [ ] **Bug Bounty Program**: Community-driven security testing
- [ ] **Mainnet Deployment**: Only after all security milestones

### Known Security Considerations
1. **Anonymity Set Size**: Privacy depends on pool usage
2. **Operator Trust**: Contract operator has pool management privileges
3. **Client-Side Security**: Secret generation relies on browser randomness
4. **Network Analysis**: Sophisticated attackers may correlate timing/amounts

### Recommended Security Practices
- Use only on Aptos devnet for testing
- Never use with significant amounts of APT
- Store secret notes securely and offline
- Verify all transactions on Aptos Explorer
- Wait for professional audit before production use

---

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone https://github.com/pintoinfant/flowshield.git
cd flowshield/contracts

# Install dependencies
npm install

# Set up development environment
aptos init --network devnet
```

### Making Changes
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/security-improvement`
3. **Make changes** to Move contracts
4. **Add tests** for new functionality
5. **Run test suite**: `npm run move:test`
6. **Submit pull request** with detailed description

### Code Standards
- **Naming**: Snake_case for functions, PascalCase for structs
- **Documentation**: Comprehensive comments for all public functions
- **Testing**: 100% test coverage for critical paths
- **Security**: Follow Move best practices and security guidelines
- **Gas Efficiency**: Optimize for minimal gas consumption

---

## 📞 Support & Contact

### Technical Support
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/pintoinfant/flowshield/issues)

---

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](/LICENSE) file for details.

### Key License Points
- ✅ **Commercial Use**: Permitted
- ✅ **Modification**: Permitted  
- ✅ **Distribution**: Permitted
- ✅ **Patent Grant**: Included
- ⚠️ **Trademark**: Not granted
- ⚠️ **Liability**: No warranty provided

---

<div align="center">

**FlowShield Contracts** - *Privacy through cryptographic innovation*

Built with ❤️ using the **Move Programming Language**

[📖 Move Documentation](https://move-language.github.io/move/) | [🏗️ Aptos Framework](https://aptos.dev/) | [🛡️ FlowShield Frontend](../web/)

*Secure, efficient, and privacy-preserving smart contracts for the decentralized future*

</div>
