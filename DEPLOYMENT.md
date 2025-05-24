# 🚀 Deployment Guide - Zero-Knowledge Passport Verification

This guide covers deployment for different environments and use cases.

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Demo Deployment](#demo-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Git
- MetaMask browser extension

### Quick Start
```bash
# Clone repository
git clone <your-repo-url>
cd Eth-Dublin

# Automated setup (recommended)
npm run setup

# Start all services
npm run dev:all
```

### Manual Setup
```bash
# Install root dependencies
npm install

# Install Mobile App dependencies
cd MobileApp && npm install && cd ..

# Install Blockchain dependencies
cd MobilePass && npm install && cd ..

# Compile contracts
cd MobilePass && npm run compile && cd ..
```

## 🎯 Demo Deployment

### For Hackathon Judges/Presentations

#### Option 1: Static HTML Demo (Recommended)
```bash
# Navigate to WebApp directory
cd WebApp

# Open comprehensive-test.html in browser
# No additional setup required - works immediately
```

**Features:**
- ✅ No dependency installation needed
- ✅ Works offline
- ✅ Real MetaMask integration
- ✅ Complete verification flow simulation

#### Option 2: Next.js Web App
```bash
# Start web application
npm run dev

# Open http://localhost:3000
```

## 🌐 Production Deployment

### Web Application (Next.js)

#### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts for domain setup
```

#### Manual Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start

# Or serve static files
npm run export
```

### Blockchain Infrastructure

#### Local Hardhat Network
```bash
cd MobilePass

# Start local blockchain
npx hardhat node

# Deploy contracts (in new terminal)
npm run deploy
```

#### Testnet Deployment
```bash
cd MobilePass

# Configure .env file (see Environment Variables section)
# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Mobile Application

#### Android Deployment
```bash
cd MobileApp

# Generate release APK
npm run android --release

# Or build AAB for Play Store
cd android && ./gradlew bundleRelease
```

#### iOS Deployment
```bash
cd MobileApp

# Build for iOS
npm run ios --release

# Or open in Xcode for App Store deployment
open ios/PassportVerification.xcworkspace
```

## 🔐 Environment Variables

### Root Project (.env.local)
```env
# Next.js Configuration
NEXT_PUBLIC_APP_NAME="Zero-Knowledge Passport Verification"
NEXT_PUBLIC_NETWORK_ID=31337
NEXT_PUBLIC_RPC_URL="http://localhost:8545"

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"
```

### Blockchain (.env in MobilePass/)
```env
# Private Keys (use test keys only!)
PRIVATE_KEY="your-private-key-here"

# Network Configuration
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your-infura-key"
MAINNET_RPC_URL="https://mainnet.infura.io/v3/your-infura-key"

# API Keys
INFURA_PROJECT_ID="your-infura-project-id"
ETHERSCAN_API_KEY="your-etherscan-api-key"

# Contract Addresses (populated after deployment)
IDENTITY_VERIFICATION_CONTRACT="0x..."
```

### Mobile App (.env in MobileApp/)
```env
# Blockchain Configuration
RPC_URL="http://localhost:8545"
CONTRACT_ADDRESS="0x..."

# NFC Configuration
NFC_TIMEOUT=5000
NFC_TECH_LIST="IsoDep,NfcA,NfcB,NfcF,NfcV"

# Development
DEBUG_MODE=true
LOG_LEVEL="debug"
```

## 📱 Platform-Specific Setup

### Android Development
```bash
# Install Android Studio
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Install React Native CLI
npm install -g react-native-cli

# Start emulator and run app
cd MobileApp
npm run android
```

### iOS Development (macOS only)
```bash
# Install Xcode from App Store
# Install CocoaPods
sudo gem install cocoapods

# Install pods (from MobileApp/ios directory)
cd MobileApp/ios && pod install && cd ..

# Run on iOS
npm run ios
```

## 🔧 Advanced Configuration

### Custom Network Configuration
```javascript
// hardhat.config.js modifications
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Docker Deployment
```dockerfile
# Dockerfile for web app
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run with Docker
docker build -t passport-verification .
docker run -p 3000:3000 passport-verification
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Node.js Version Conflicts
```bash
# Check Node version
node --version

# Should be 16+
# Install nvm for version management
nvm install 16
nvm use 16
```

#### 2. Mobile App Build Failures
```bash
# Clean React Native cache
cd MobileApp
npx react-native clean

# Reset Metro bundler
npx react-native start --reset-cache
```

#### 3. MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Check network ID matches (31337 for local development)
- Clear browser cache if experiencing issues

#### 4. Smart Contract Deployment Failures
```bash
cd MobilePass

# Clean compilation artifacts
npx hardhat clean

# Recompile contracts
npx hardhat compile

# Restart local node if needed
npx hardhat node
```

#### 5. NFC Issues (Mobile)
- Ensure device has NFC capability
- Check NFC is enabled in device settings
- Test with real NFC-enabled passport for full functionality

### Debugging Commands

```bash
# Check all dependencies
npm list

# Verify contract compilation
cd MobilePass && npx hardhat compile

# Test blockchain connectivity
cd MobilePass && npx hardhat console --network localhost

# Mobile app logs
cd MobileApp && npx react-native log-android
# or
cd MobileApp && npx react-native log-ios
```

## 📊 Performance Monitoring

### Web App Monitoring
```bash
# Bundle analysis
npm run build
npm run analyze

# Lighthouse audit
lighthouse http://localhost:3000
```

### Blockchain Monitoring
```bash
# Gas usage reports
cd MobilePass
npx hardhat test --gas-reporter
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Smart contracts compiled
- [ ] Security audit completed
- [ ] Performance optimized

### Deployment Steps
- [ ] Deploy smart contracts
- [ ] Update contract addresses in apps
- [ ] Deploy web application
- [ ] Build mobile applications
- [ ] Configure monitoring
- [ ] Test end-to-end functionality

### Post-deployment
- [ ] Verify all components working
- [ ] Monitor logs for errors
- [ ] Test user flows
- [ ] Document any issues
- [ ] Setup automated backups

## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MetaMask Developer Docs](https://docs.metamask.io/guide/)

---

🏆 **Ready for production deployment!** 🚀 