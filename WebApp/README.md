# 🌐 WebApp - Passport Verification Interface

This directory contains the web interface for testing the passport verification system.

## 📁 Test Interfaces

### **Core Testing Files** 🚀
- **`comprehensive-test.html`** - Main comprehensive testing interface with full passport verification flow
- **`working-test.html`** - Simple working test with basic passport verification  
- **`quick-test.html`** - Quick MetaMask connection and signing test
- **`simple-test.html`** - No-signature test that works without MetaMask

### **Reference Implementation** 🔬
- **`real-test.html`** - Real implementation with actual blockchain interactions
- **`web-test.html`** - UI mockup for mobile app interface testing

## 🎯 **Which Test to Use?**

### **For Demos & Presentations:**
```
simple-test.html - No MetaMask popups required
```

### **For Development & Testing:**
```
working-test.html - Basic functionality with minimal setup
comprehensive-test.html - Full end-to-end testing with all features
```

### **For Debugging Connection Issues:**
```
quick-test.html - Test just wallet connection and signing
```

### **For Real Blockchain Testing:**
```
real-test.html - Actual smart contract interactions
```

## 🚀 How to Run

1. **Start the HTTP server** (from this directory):
   ```bash
   npx http-server . -p 8080 --cors
   ```

2. **Start the blockchain** (from ../MobilePass directory):
   ```bash
   cd ../MobilePass
   npx hardhat node
   ```

3. **Choose your test interface**:
   - **Simple Demo**: http://localhost:8080/simple-test.html
   - **Working Test**: http://localhost:8080/working-test.html  
   - **Full Test**: http://localhost:8080/comprehensive-test.html
   - **Real Blockchain**: http://localhost:8080/real-test.html

## 📋 **Supporting Files**

- **`contract-info.json`** - Smart contract deployment information
- **`mock-passport-data.json`** - Test passport data for simulations
- **`services/`** - Service layer implementations (WalletService, NFCService, TEEService)
- **`COMPREHENSIVE_TEST_GUIDE.md`** - Detailed testing instructions
- **`REAL_TESTING_GUIDE.md`** - Real blockchain testing guide

## 🔗 Dependencies

The web interface connects to:
- **Smart Contract**: Deployed on local Hardhat network
- **MetaMask**: For wallet connection and transaction signing (except simple-test.html)
- **Local Blockchain**: Running on http://127.0.0.1:8545

## 🎯 Perfect for Hackathon Demos

This interface demonstrates:
- ✅ Real MetaMask wallet connection
- ✅ Real blockchain transactions  
- ✅ Cryptographic identity verification
- ✅ Professional UI with real-time feedback
- ✅ No-signature demo mode for presentations 