# WarmWeb

WarmWeb demonstrates how FileCoin can support static website deployments with the use of AI. This decentralized application (dApp) showcases the future of web hosting by combining AI-powered website generation with decentralized storage on the Filecoin network.

## Overview

WarmWeb demonstrates:
- **AI-Powered Website Generation**: Create static websites from simple text prompts using AI
- **Decentralized Storage**: Store generated websites on Filecoin through Synapse
- **Wallet Integration**: Connect to Filecoin networks (Mainnet/Calibration) with web3 wallets
- **Smart Contract Interaction**: Deposit funds and manage storage through USDFC tokens
- **Transparent Deployment**: Download and verify the exact artifacts stored on Filecoin

## Prerequisites

- Node.js 18+ and npm
- A web3 wallet (like MetaMask)
- Basic understanding of React and TypeScript
- Get some tFIL tokens on Filecoin Calibration testnet [link to faucet](https://faucet.calibnet.chainsafe-fil.io/funds.html)
- Get some USDFC tokens on Filecoin Calibration testnet [link to faucet](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc)

## Getting Started

1. Clone this repository:
```bash
git clone https://github.com/warmweb/warmweb-upload-dapp-try2.git
cd warmweb-upload-dapp-try2
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env.local
```
Edit `.env.local` to customize the WarmWeb server URL if needed as well as OPEN_API_KEY:
```
NEXT_PUBLIC_WARMWEB_SERVER_URL=https://warmweb.xyz
OPENAI_API_KEY=sk-proj-open_api_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view WarmWeb.

## Key Components

### AI-Powered Website Generation
WarmWeb's core feature transforms text prompts into fully functional static websites:
- **Natural Language Input**: Describe your website in plain English
- **Instant Preview**: See your generated website before deployment
- **Responsive Design**: Auto-generated websites work on all devices
- **Filecoin Branding**: Websites showcase Filecoin ecosystem integration

### Decentralized Storage via Filecoin
All generated websites are stored on Filecoin's decentralized network:
- **Synapse Integration**: Uses Filecoin Synapse for reliable storage marketplace
- **USDFC Payment**: Pay for storage using USDFC stablecoin
- **PieceCID Tracking**: Get unique identifiers for website retrieval
- **Transparent Artifacts**: Download exact files stored on the network

### Wallet Connection
WarmWeb uses RainbowKit for seamless wallet connection, configured for Filecoin networks:
- Filecoin Mainnet
- Filecoin Calibration (testnet)

### Smart Contract Management
The application handles all blockchain interactions automatically:
- Balance checking for tFIL and USDFC tokens
- Automatic storage payment and approval flows
- Real-time transaction monitoring and status updates

## How WarmWeb Works

WarmWeb demonstrates the seamless integration of AI and decentralized storage through an intuitive workflow.

### Quick Start Flow

1. **Connect Wallet** → Use RainbowKit to connect to Filecoin Calibration testnet
2. **Navigate** → Go to `/site-gen` in the app
3. **Generate Site** → Enter a text prompt describing your website → Click "Build Preview"
4. **Setup Storage** (first-time users only):
   - Deposit USDFC: Click "Deposit USDFC" button (requires 5+ USDFC)
   - Approve Warm Storage: Click "Approve Warm Storage" button
5. **Store with Synapse** → Click "Store with Synapse" → Copy the returned PieceCID
6. **Verify Artifact** (optional) → Click "Download ZIP" to get the exact file stored on Filecoin

### Requirements

- **tFIL tokens** for gas fees (≥0.1 tFIL) → [Get tFIL](https://faucet.calibnet.chainsafe-fil.io/funds.html)
- **USDFC tokens** for storage fees (≥5 USDFC) → [Get USDFC](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc)

### Features

#### 📋 Smart Checklist
The app shows a real-time checklist of upload requirements:
- ✅ Wallet connected (Calibration)
- ✅ tFIL for fees present (≥0.1)
- ✅ USDFC ≥5 deposited
- ✅ Warm Storage approved (rate + lockup)
- ✅ Ready to upload

#### 🔧 One-Click Fixes
Missing requirements show "Fix" buttons:
- **"Deposit USDFC"** → Automatically deposits 5 USDFC to Synapse
- **"Approve Warm Storage"** → Sets up rate and lockup allowances
- **"Get tFIL"** → Direct link to Calibration faucet

#### 📦 Artifact Transparency
- **Server-side ZIP generation** ensures consistency
- **Download ZIP** provides the exact artifact stored on Filecoin
- **File structure**: `index.html` + `assets/main.js` (boot script)

#### 🐛 Debug Mode (Development)
In development mode, a collapsible debug section shows:
- Current network and signer address
- Real-time balances and allowances
- Upload payload size and status
- Raw debug object for troubleshooting

### Technical Implementation

The Site Gen feature demonstrates:
- **Text-to-HTML generation** with embedded CSS and Filecoin branding
- **ZIP artifact creation** using JSZip (client + server-side)
- **Synapse Warm Storage integration** with robust error handling
- **Pre-flight checks** for balances, deposits, and allowances
- **Network-aware token handling** (tFIL vs FIL, testnet vs mainnet)
- **Progressive enhancement** with fallbacks and user guidance

### Storage Process

1. **HTML Generation** → Creates responsive website from user prompt
2. **ZIP Creation** → Packages HTML + JavaScript boot script
3. **Balance Checks** → Verifies tFIL for gas and USDFC for storage
4. **Allowance Setup** → Ensures Warm Storage permissions (first-time only)
5. **Filecoin Upload** → Stores ZIP via Synapse with progress tracking
6. **PieceCID Return** → Provides unique identifier for retrieval

### Error Handling

The app provides human-readable error messages:
- **"Insufficient tFIL for gas fees"** → Links to faucet
- **"USDFC deposit needed"** → Shows fix button
- **"Warm Storage not approved"** → Guides through approval
- **"Network not supported"** → Suggests switching to Calibration

### Notes

- **Filecoin Calibration testnet only** (mainnet support can be enabled)
- **First-time setup required** for USDFC deposit and Warm Storage approval
- **Gas fees paid in tFIL**, storage fees paid in USDFC
- **IPFS upload is separate** and not part of this Synapse-first flow
- **Artifact verification** ensures transparency of stored content

## Learn More

- [System Architecture](./SYS_ARCHI.md) - Detailed technical architecture and data flows
- [Filecoin synapse-sdk](https://github.com/FilOzone/synapse-sdk)
- [USDFC Token Documentation](https://docs.secured.finance/usdfc-stablecoin/getting-started)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)
- Best practices in React!
  - [Tanstack Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
  - [Tanstack Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
