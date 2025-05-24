# 🛂 Zero-Knowledge Passport Verification - Eth Dublin Hackathon

A comprehensive blockchain-based passport verification system using Zero-Knowledge Proofs, Trusted Execution Environment (TEE), and NFC passport scanning.

## 🏗️ Project Architecture

- **🌐 Web App**: Next.js web interface with React 19 and Tailwind CSS
- **📱 Mobile App**: React Native app for NFC passport scanning with MetaMask integration  
- **⛓️ Blockchain**: Hardhat infrastructure with IdentityVerification.sol smart contract
- **🧪 Test Interface**: Static HTML files for comprehensive testing and demos

## 🚀 Quick Start (One-Click Setup)

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Method 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd Eth-Dublin

# Run the setup script (installs all dependencies)
npm run setup

# Start all services
npm run dev:all
```

### Method 2: Manual Setup
```bash
# 1. Install root dependencies (Next.js web app)
npm install

# 2. Install Mobile App dependencies
cd MobileApp && npm install && cd ..

# 3. Install Blockchain dependencies  
cd MobilePass && npm install && cd ..
```

## 📦 Project Components

### 🌐 Web Application (Root)
**Tech Stack**: Next.js 15.1.8, React 19, Tailwind CSS
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 📱 Mobile Application
**Tech Stack**: React Native 0.72.6, NFC Manager, Ethers.js
```bash
cd MobileApp

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios
```

### ⛓️ Blockchain Infrastructure
**Tech Stack**: Hardhat, Ethers.js, OpenZeppelin
```bash
cd MobilePass

# Compile smart contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npm run deploy
```

### 🧪 Test Interface
**Location**: `WebApp/` directory
- `comprehensive-test.html` - Full end-to-end demonstration
- `working-test.html` - Basic test with MetaMask integration
- `simple-test.html` - Demo version without MetaMask popups
- `real-test.html` - Actual blockchain implementation

## 🛠️ Development Scripts

### Root Package Scripts
```bash
npm run dev          # Start Next.js web app
npm run setup        # Install all dependencies across projects
npm run dev:all      # Start all services concurrently
npm run build:all    # Build all projects
npm run test:all     # Run all tests
npm run clean        # Clean all node_modules and build artifacts
```

### Individual Project Scripts
```bash
# Mobile App
cd MobileApp
npm start            # Start Metro bundler
npm run android      # Run Android app
npm run ios          # Run iOS app
npm test             # Run tests

# Blockchain
cd MobilePass  
npm run compile      # Compile contracts
npm run deploy       # Deploy contracts
npm test             # Run blockchain tests
```

## 🔧 Environment Setup

### Required Software
- **Node.js**: Version 16 or higher
- **npm/yarn**: Latest version
- **React Native CLI**: `npm install -g react-native-cli`
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **MetaMask**: Browser extension for wallet integration

### Environment Variables
Create `.env` files as needed:

```env
# MobilePass/.env
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_id_here
```

## 🧪 Testing the Project

### 1. Web Interface Testing
```bash
# Start web app
npm run dev

# Open browser to http://localhost:3000
# Navigate to /test for testing interface
```

### 2. Static HTML Testing
```bash
# Navigate to WebApp directory
cd WebApp

# Open any HTML file in browser:
# - comprehensive-test.html (recommended for demos)
# - working-test.html (basic functionality)
# - simple-test.html (no MetaMask required)
```

### 3. Mobile App Testing
```bash
cd MobileApp
npm start
npm run android  # or npm run ios
```

### 4. Blockchain Testing
```bash
cd MobilePass
npm test
npm run deploy
```

## 🚀 Demo Flow

### For Hackathon Judges/Demo:
1. **Open `WebApp/comprehensive-test.html`** - Best showcase
2. **Connect MetaMask wallet**
3. **Select test passport** (5 realistic options available)
4. **Run full verification test** - Shows complete TEE + Blockchain flow
5. **Watch real-time progress** - 8-step verification process

### Key Demo Features:
- ✅ **Real MetaMask Integration** - Actual wallet connection & signing
- ✅ **Realistic NFC Simulation** - ICAO 9303 compliant scanning
- ✅ **TEE Verification Process** - Cryptographic validation simulation  
- ✅ **Blockchain Storage** - Hash and proof storage
- ✅ **Progress Tracking** - Step-by-step visual progress
- ✅ **Success Notifications** - Professional completion confirmations

## 📁 Project Structure
```
Eth-Dublin/
├── 📁 app/              # Next.js pages and components
├── 📁 public/           # Static assets
├── 📁 WebApp/           # HTML test interfaces
├── 📁 MobileApp/        # React Native mobile app
├── 📁 MobilePass/       # Hardhat blockchain infrastructure
├── 📄 package.json     # Root dependencies
├── 📄 README.md         # This file
└── 📄 setup.js          # Automated setup script
```

## 🔒 Security Features

- **TEE Integration**: Trusted Execution Environment for secure passport processing
- **Zero-Knowledge Proofs**: Privacy-preserving identity verification
- **NFC Security**: Secure passport chip reading
- **Blockchain Storage**: Immutable verification records
- **MetaMask Integration**: Secure wallet-based authentication

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is part of the Eth Dublin Hackathon submission.

## 🏆 Hackathon Submission

**Team**: [Your Team Name]  
**Hackathon**: Eth Dublin  
**Category**: Privacy & Identity  
**Demo**: `WebApp/comprehensive-test.html`

---

🚀 **Ready to verify identities securely with Zero-Knowledge Proofs!** 🔒
