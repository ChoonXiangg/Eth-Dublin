# 🌐 WebApp - Passport Verification Interface

This directory contains the web interface for testing the passport verification system.

## 📁 Contents

- `real-test.html` - Main testing interface with real MetaMask integration
- `web-test.html` - Alternative testing interface
- `contract-info.json` - Smart contract deployment information
- `services/` - Service layer implementations (WalletService, NFCService, TEEService)
- `REAL_TESTING_GUIDE.md` - Comprehensive testing guide

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

3. **Open the test interface**:
   - Go to: http://localhost:8080/real-test.html
   - Connect MetaMask
   - Test passport verification flow

## 🔗 Dependencies

The web interface connects to:
- **Smart Contract**: Deployed on local Hardhat network
- **MetaMask**: For wallet connection and transaction signing
- **Local Blockchain**: Running on http://127.0.0.1:8545

## 🎯 Perfect for Hackathon Demos

This interface demonstrates:
- ✅ Real MetaMask wallet connection
- ✅ Real blockchain transactions
- ✅ Cryptographic identity verification
- ✅ Professional UI with real-time feedback 