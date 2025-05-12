<p align="center">
    <img alt="p12_logo" src="./docs/p12_logo.png" />
</p>

# P12 GameFi Ecosystem - Infinity Force - Demo

A comprehensive GameFi platform that bridges traditional gaming with blockchain technology. P12 leverages Steam's gaming infrastructure to reward both gamers and developers through NFTs and token distribution.

<p align="center">
    <img alt="p12" src="./docs/readme_01.png" />
</p>

## 🎮 Features

- **Steam Integration**: Authenticate with Steam accounts and sync gaming data
- **Genesis NFTs**: Soul-bound tokens for gamers (5 tiers) and developers (4 tiers)
- **Token Rewards**: P12 token distribution based on gaming achievements and metrics
- **Cross-Chain Support**: BSC primary with Ethereum compatibility
- **Web3 Wallets**: Support for 15+ wallet providers including MetaMask, WalletConnect
- **GameFi Features**: Arcana system, leaderboards, predictions, and community events

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```

   This starts both frontend (Next.js) and backend (Express) servers concurrently.

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 🛠 Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Blockchain**: Ethers.js, Wagmi, Solidity
- **Authentication**: Steam OAuth, SIWE (Sign-In with Ethereum)

## 📁 Project Structure

```
├── pages/          # Next.js pages and API routes
├── components/     # React components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── store/          # Recoil state management
├── backend/        # Express.js backend server
├── abis/           # Smart contract ABIs
└── public/         # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production servers
- `npm run lint` - Run ESLint

## 📄 License

AGPL-3.0 License
