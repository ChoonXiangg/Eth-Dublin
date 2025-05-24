# Testing Guide for Passport Verification Mobile App

## 🎯 Current Status
✅ **Basic Setup**: Dependencies and file structure verified  
✅ **Crypto Functions**: SHA-256 hashing working  
✅ **Ethers.js**: Wallet creation and basic blockchain functions  
✅ **TypeScript**: Compilation ready  

## 🧪 Testing Approaches

### 1. **Unit Testing (Currently Working)**
```bash
# Run the basic functionality test
node simple-test.js
```
**What it tests**: Dependencies, file structure, basic crypto operations

### 2. **Web-Based Testing (Easiest for UI)**
Since React Native components are similar to React, we can test the UI logic in a web browser first.

**Setup Web Testing**:
```bash
# Create a web version for testing
npm install react react-dom @types/react @types/react-dom
```

### 3. **React Native Simulator Testing**
For this, you need proper React Native development setup.

**Requirements**:
- Xcode (for iOS simulator)
- Android Studio (for Android emulator)
- React Native CLI properly configured

**Commands**:
```bash
# Start Metro bundler
npx react-native start

# Run on iOS simulator (requires Xcode)
npx react-native run-ios

# Run on Android emulator (requires Android Studio)
npx react-native run-android
```

### 4. **Expo Testing (Recommended for Quick Testing)**
Expo provides an easier way to test React Native apps.

**Setup**:
```bash
npm install -g @expo/cli
expo init PassportVerificationApp --template blank-typescript
# Then copy our components
```

## 🔄 What We Can Test Right Now

### A. **Service Logic Testing**
Our services are working! You can test:

1. **Wallet Service**: 
   - Mock wallet connection ✅
   - Address generation ✅
   - Basic ethers.js functionality ✅

2. **TEE Service**:
   - Passport verification simulation ✅
   - Identity hash signing ✅
   - Cryptographic operations ✅

3. **NFC Service**:
   - Mock NFC scanning ✅
   - Data parsing logic ✅
   - Integration with TEE ✅

### B. **UI Components Testing**
The App.tsx contains:
- ✅ Connect Wallet button
- ✅ NFC scanning interface
- ✅ Success modals
- ✅ Responsive design

## 📱 Testing Scenarios

### Scenario 1: **Wallet Connection Flow**
```javascript
// This is currently working in mock mode
1. User clicks "Connect Wallet"
2. Mock wallet address is generated
3. UI shows "Wallet Connected" 
4. Wallet address is displayed
```

### Scenario 2: **NFC Scanning Flow**
```javascript
// This is simulated with mock data
1. User ensures wallet is connected
2. User taps the NFC scanning area
3. Mock passport data is generated
4. TEE verification is simulated
5. Success/failure message is shown
```

### Scenario 3: **Error Handling**
```javascript
// Test error conditions
1. Scanning without wallet connected → Error message
2. Invalid passport data → Verification failure
3. Network issues → Appropriate error handling
```

## 🚀 How to Test Each Component

### **Option A: Quick Web Testing**
1. Create a simple HTML file to test React components
2. Test UI interactions without device dependencies
3. Verify styling and user experience

### **Option B: Component Testing**
1. Test individual services with mock data
2. Verify cryptographic functions
3. Check integration between services

### **Option C: Full App Testing**
1. Set up React Native development environment
2. Test on iOS simulator or Android emulator
3. Test with real NFC on physical device

## 🔧 Current Limitations

### **What's Mock/Simulated**:
- 🔄 Wallet connection (uses mock address)
- 🔄 NFC passport scanning (generates mock data)
- 🔄 TEE verification (simulated processing)
- 🔄 Blockchain transactions (no real contract deployed)

### **What Would Need Real Implementation**:
- 📱 Actual NFC passport reading (ICAO 9303 standard)
- 🔒 Real TEE integration (Intel SGX, ARM TrustZone)
- 🌐 MetaMask wallet connection via WalletConnect
- ⛓️ Deployed smart contract on testnet/mainnet

## 📋 Testing Checklist

### **Basic Functionality** ✅
- [x] Services can be imported
- [x] Mock data generation works
- [x] Crypto operations functional
- [x] File structure correct

### **UI Testing** (Recommended Next)
- [ ] App renders correctly
- [ ] Button interactions work
- [ ] Modal displays properly
- [ ] Responsive design on different screen sizes

### **Integration Testing** (Future)
- [ ] Wallet connection with real MetaMask
- [ ] NFC scanning on physical device
- [ ] Smart contract deployment and interaction
- [ ] End-to-end verification flow

## 🎯 Recommended Testing Order

1. **✅ DONE**: Basic unit tests (simple-test.js)
2. **NEXT**: Create web version for UI testing
3. **THEN**: Set up React Native simulator
4. **FINALLY**: Test on real device with NFC

## 💡 Quick Start Testing

### **Test the UI Right Now**:
```bash
# Create a simple React web version
npx create-react-app test-ui --template typescript
# Copy App.tsx and adapt for web testing
```

### **Test Real NFC** (Future):
- Need iPhone 7+ or Android with NFC
- Need real passport with NFC chip
- Need proper development certificates

Would you like me to help you set up any of these testing approaches? 