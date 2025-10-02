# 🛡️ FlowShield

> **Your On-Chain Privacy Shield** - Privacy-preserving transactions on the Aptos blockchain

[![Made for Aptos](https://img.shields.io/badge/Made%20for-Aptos-00D4AA?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMjIgMTJMMTIgMjJMMiAxMkwxMiAyWiIgZmlsbD0iIzAwRDRBQSIvPgo8L3N2Zz4K)](https://aptoslabs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Move](https://img.shields.io/badge/Move-Language-FF6B35?style=flat-square)](https://move-language.github.io/move/)

---

## 🌟 Overview

**FlowShield** is a cutting-edge privacy mixer built on the Aptos blockchain that enables users to break the link between their wallet addresses. By depositing funds from one address and withdrawing to another, users can maintain financial privacy while leveraging the security and efficiency of the Move programming language.

### ✨ Key Features

- 🔒 **Zero-Knowledge Privacy** - Break on-chain transaction links
- 🛡️ **Move Security** - Built with Aptos' secure Move language
- ⚡ **Low Fees** - Leverage Aptos' high-speed, low-cost network  
- 🎯 **Fixed Pools** - Support for 0.1, 1, 10, and 100 APT denominations
- 🔐 **Client-Side Secrets** - Private keys never leave your browser
- 📱 **Responsive Design** - Beautiful UI built with shadcn/ui

---

## 🏗️ Architecture

### Smart Contract (`contracts/`)
- **Language**: Move
- **Framework**: Aptos Framework
- **Contract Address**: `0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd`
- **Key Functions**:
  - `deposit()` - Commit funds to privacy pool
  - `withdraw_direct()` - Withdraw to connected wallet
  - Pool management and event emission

### Frontend (`web/`)
- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Wallet Integration**: Aptos Wallet Adapter
- **Key Features**:
  - Landing page with project explanation
  - Privacy mixer interface at `/shield`
  - Secret note generation and management

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Aptos CLI (for contract deployment)
- Petra Wallet or compatible Aptos wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pintoinfant/flowshield.git
   cd flowshield
   ```

2. **Install web dependencies**
   ```bash
   cd web
   npm install
   ```

3. **Install contract dependencies**
   ```bash
   cd ../contracts
   npm install
   ```

4. **Start the development server**
   ```bash
   cd ../web
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### Contract Deployment

1. **Compile the contract**
   ```bash
   cd contracts
   npm run move:compile
   ```

2. **Deploy to testnet**
   ```bash
   npm run move:publish
   ```

3. **Initialize pools**
   ```bash
   # Add pool denominations (0.1, 1, 10, 100 APT)
   # This should be done via the smart contract functions
   aptos move run \                            
      --function-id 'default::privacy_pool::add_pool' \
      --type-args '0x1::aptos_coin::AptosCoin' \
      --args u64:100000000 "string:0.1 APT Pool" \
      --assume-yes
   ```

---

## 💡 How It Works

### Privacy Mechanism

1. **Deposit Phase**
   - User selects a fixed amount (0.1, 1, 10, or 100 APT)
   - Generate a random secret and compute its hash
   - Deposit funds to the smart contract with the secret hash
   - Receive a secret note: `flowshield-{amount}-{secret}`

2. **Privacy Pool**
   - Multiple users deposit into the same denomination pools
   - Funds are mixed, making it impossible to trace individual deposits

3. **Withdraw Phase**
   - From any wallet, use the secret note to withdraw
   - Smart contract verifies the secret without revealing links
   - Funds are released to the new wallet address

### Security Features

- **Move Language Security**: Prevents reentrancy and common smart contract vulnerabilities
- **Client-Side Secrets**: Private keys generated in browser, never transmitted
- **Commitment Scheme**: Uses cryptographic hashes for deposit verification
- **Pool Isolation**: Different denominations maintain separate anonymity sets

---

## 🎯 Project Structure

```
flowshield/
├── contracts/                   # Move smart contracts
│   ├── contract/
│   │   ├── sources/
│   │   │   └── privacy_pool.move    # Main privacy mixer contract
│   │   ├── Move.toml                # Move package configuration
│   │   └── tests/                   # Contract tests
│   ├── scripts/                     # Deployment scripts
│   └── package.json
│
├── web/                        # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── shield/
│   │   │   └── page.tsx             # Privacy mixer app
│   │   └── layout.tsx               # Root layout
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── header.tsx               # Navigation header
│   │   ├── deposit-view.tsx         # Deposit interface
│   │   ├── withdraw-view.tsx        # Withdraw interface
│   │   └── secret-note-modal.tsx    # Secret management
│   └── package.json
│
└── README.md                   # This file
```

---

## 🎨 Screenshots

### Landing Page
Professional marketing page explaining FlowShield's value proposition with smooth navigation to the app.

### Privacy Mixer Interface
Clean, intuitive interface for depositing and withdrawing funds with comprehensive security warnings.

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the `web/` directory:

```env
NEXT_PUBLIC_APTOS_NETWORK=devnet
NEXT_PUBLIC_MODULE_ADDRESS=0x2267d403073795ada7cb1da76029e92c2b0b693ecfbdc31e1ea65c57584d33bd
```

### Wallet Configuration

The app supports:
- Petra Wallet (Recommended)
- Martian Wallet
- Pontem Wallet
- Other Aptos-compatible wallets

---

## ⚠️ Security Disclaimer

> **Important**: This project is a hackathon submission and has not undergone a formal security audit. Use at your own risk and only with funds you can afford to lose.

### Known Limitations

- No formal security audit
- Limited anonymity set (depends on pool usage)
- Frontend-only secret generation
- Testnet deployment only

---


## 🛠️ Development

### Available Scripts

**Web Application:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Smart Contracts:**
```bash
npm run move:compile # Compile Move contracts
npm run move:test    # Run Move tests
npm run move:publish # Deploy to blockchain
npm run move:upgrade # Upgrade existing deployment
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Team

Built with ❤️ for the Aptos ecosystem.

### Connect With Us

- 🌐 **Website**: [Coming Soon]
- 🐦 **Twitter**: [@FlowShield]
- 💬 **Discord**: [FlowShield Community]
- 📧 **Email**: team@flowshield.xyz

---

## 🙏 Acknowledgments

- **Aptos Foundation** for the robust blockchain infrastructure
- **Move Language Team** for the security-focused programming language
- **shadcn/ui** for the beautiful component library

---

<div align="center">

**FlowShield** - *Privacy is not a luxury, it's a fundamental right.*

[🚀 Launch App](http://localhost:3000) | [📖 Documentation](./docs) | [🐛 Report Bug](./issues) | [💡 Feature Request](./issues)

*Made for Aptos Hackathon 2025*

</div>
