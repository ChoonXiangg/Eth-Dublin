# 🚀 Setup Guide - Zero-Knowledge Passport Verification

**Quick setup guide for cloning and running the Eth Dublin Hackathon project**

## 🎯 For Immediate Demo (Hackathon Judges)

**Fastest way to see the project in action:**

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Eth-Dublin

# 2. Open the demo directly (no installation needed!)
# Navigate to WebApp/ folder and open comprehensive-test.html in browser
```

✅ **No dependencies required** - works immediately with MetaMask!

## 🛠️ For Full Development Setup

### Prerequisites
- **Node.js 16+** ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** 
- **MetaMask** browser extension

### One-Click Setup
```bash
# Clone repository
git clone <your-repo-url>
cd Eth-Dublin

# Run automated setup (installs everything!)
npm run setup

# Start all services
npm run dev:all
```

### Manual Setup (if automated fails)
```bash
# 1. Install root dependencies
npm install

# 2. Install mobile app dependencies
cd MobileApp
npm install
cd ..

# 3. Install blockchain dependencies
cd MobilePass  
npm install
cd ..

# 4. Compile smart contracts
cd MobilePass
npm run compile
cd ..
```

## 📦 What Gets Installed

### Root Project (Next.js Web App)
- React 19
- Next.js 15.1.8  
- Tailwind CSS
- Development tools

### MobileApp/ (React Native)
- React Native 0.72.6
- NFC Manager
- Ethers.js for blockchain
- MetaMask integration
- QR code generation

### MobilePass/ (Blockchain)
- Hardhat development environment
- OpenZeppelin contracts
- Ethereum testing tools
- Smart contract compilation

## 🚦 Available Commands

### Global Commands (from root)
```bash
npm run setup          # Install all dependencies
npm run dev:all        # Start all services
npm run build:all      # Build all projects
npm run test:all       # Run all tests
npm run clean          # Clean all build artifacts
```

### Individual Components
```bash
# Web App
npm run dev            # Start Next.js web server

# Mobile App  
cd MobileApp
npm start              # Start Metro bundler
npm run android        # Run Android app
npm run ios            # Run iOS app

# Blockchain
cd MobilePass
npm run compile        # Compile contracts
npm run deploy         # Deploy to local network
npm test               # Run blockchain tests
npx hardhat node       # Start local blockchain
```

## 🧪 Testing the Project

### Option 1: Static HTML Demo (Recommended for Demos)
```bash
# No setup required!
cd WebApp
# Open comprehensive-test.html in browser
```

**Features:**
- ✅ Real MetaMask integration
- ✅ Complete 8-step verification flow  
- ✅ 5 realistic test passports
- ✅ TEE + Blockchain simulation
- ✅ Professional UI with progress tracking

### Option 2: Next.js Web App
```bash
npm run dev
# Open http://localhost:3000
```

### Option 3: Full Stack (All Components)
```bash
# Terminal 1: Start blockchain
cd MobilePass && npx hardhat node

# Terminal 2: Deploy contracts  
cd MobilePass && npm run deploy

# Terminal 3: Start web app
npm run dev

# Terminal 4: Start mobile app
cd MobileApp && npm start
```

## 🔧 Environment Configuration

### Quick Start (Optional)
Copy environment templates:
```bash
# Root project
cp env.example .env.local

# Blockchain
cp MobilePass/env.example MobilePass/.env

# Mobile app
cp MobileApp/env.example MobileApp/.env
```

### Key Environment Variables
```env
# .env.local (root)
NEXT_PUBLIC_NETWORK_ID=31337
NEXT_PUBLIC_RPC_URL="http://localhost:8545"

# MobilePass/.env
PRIVATE_KEY="your-test-private-key"
LOCALHOST_RPC_URL="http://localhost:8545"

# MobileApp/.env  
RPC_URL="http://localhost:8545"
DEBUG_MODE=true
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. "npm not found" or "Node version too old"
```bash
# Install Node.js 16+ from https://nodejs.org/
node --version  # Should show 16.x.x or higher
```

#### 2. Setup script fails
```bash
# Try manual installation
npm install
cd MobileApp && npm install && cd ..
cd MobilePass && npm install && cd ..
```

#### 3. MetaMask connection issues
- Install MetaMask browser extension
- Create/unlock wallet
- Switch to localhost network (Chain ID: 31337)

#### 4. Mobile app won't start
```bash
cd MobileApp
# Clear cache
npx react-native start --reset-cache

# For Android development
# Install Android Studio
# Set ANDROID_HOME environment variable
```

#### 5. Smart contracts won't compile
```bash
cd MobilePass
# Clean and recompile
npx hardhat clean
npx hardhat compile
```

## 📱 Platform-Specific Setup

### Windows (Your current platform)
```powershell
# PowerShell commands
git clone <repo-url>
cd Eth-Dublin
npm run setup
```

### macOS/Linux
```bash
# Bash commands  
git clone <repo-url>
cd Eth-Dublin
npm run setup
```

### Android Development
- Install [Android Studio](https://developer.android.com/studio)
- Set up Android SDK
- Enable USB debugging on device

### iOS Development (macOS only)
- Install Xcode from App Store
- Install CocoaPods: `sudo gem install cocoapods`

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm run dev` starts web server at http://localhost:3000
- [ ] `WebApp/comprehensive-test.html` opens in browser
- [ ] MetaMask connects successfully
- [ ] Test passport can be selected
- [ ] Verification flow completes without errors
- [ ] Mobile app builds (if testing mobile features)
- [ ] Smart contracts compile in MobilePass

## 🏆 Demo Checklist

For hackathon presentation:

- [ ] Project cloned and setup complete
- [ ] `comprehensive-test.html` demo ready
- [ ] MetaMask installed and configured
- [ ] Backup: `simple-test.html` (no MetaMask required)
- [ ] All 5 test passports working
- [ ] Screenshots/screen recording ready

## 🆘 Get Help

If you encounter issues:

1. **Check Node.js version**: `node --version` (needs 16+)
2. **Try manual setup** instead of automated script
3. **Use HTML demo** (`comprehensive-test.html`) - works without full setup
4. **Check logs** for specific error messages
5. **Verify MetaMask** is installed and unlocked

## 🔗 Quick Links

- **Main Demo**: `WebApp/comprehensive-test.html`
- **Simple Demo**: `WebApp/simple-test.html` (no MetaMask)
- **Development Server**: http://localhost:3000 (after `npm run dev`)
- **Mobile App Guide**: `MobileApp/README.md`
- **Blockchain Guide**: `MobilePass/README.md`

---

🚀 **Ready to demonstrate Zero-Knowledge Passport Verification!** 🛂 