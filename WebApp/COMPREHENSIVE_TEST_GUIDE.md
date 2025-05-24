# 🧪 Comprehensive Passport Verification Test Guide

This guide will walk you through conducting a complete end-to-end test of the passport verification system using realistic dummy passports.

## 📋 Prerequisites

Before starting the test, ensure you have:

### 1. **Blockchain Environment**
```bash
# Navigate to MobilePass directory
cd MobilePass

# Start local Hardhat blockchain (in one terminal)
npx hardhat node

# Deploy smart contract (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### 2. **Web Server**
```bash
# Navigate to WebApp directory
cd WebApp

# Start HTTP server
npx http-server . -p 8080 --cors
```

### 3. **MetaMask Setup**
- Install MetaMask browser extension
- Add local Hardhat network:
  - **Network Name**: Hardhat Local
  - **RPC URL**: http://127.0.0.1:8545
  - **Chain ID**: 31337
  - **Currency**: ETH
- Import a test account using one of Hardhat's private keys

## 🎯 Test Objectives

This comprehensive test validates:

1. **Wallet Connection**: MetaMask integration with local blockchain
2. **Passport Selection**: Choose from realistic dummy passports  
3. **NFC Simulation**: Realistic passport scanning process
4. **TEE Verification**: Secure passport validation
5. **Identity Hash Generation**: Cryptographic identity creation
6. **Blockchain Transaction**: On-chain identity storage
7. **Off-chain Storage**: Encrypted private data handling
8. **Test Summary**: Comprehensive result reporting

## 🏃‍♂️ Running the Test

### Step 1: Access the Test Interface

1. Open your browser
2. Navigate to: `http://localhost:8080/comprehensive-test.html`
3. You should see the comprehensive test interface

### Step 2: Connect Your Wallet

1. Click **"Connect MetaMask"** button
2. Approve the connection in MetaMask
3. Ensure you're on the Hardhat Local network
4. Verify your wallet address appears

### Step 3: Select a Test Passport

Choose from available dummy passports:

#### **Test Passport 001 - John Doe (USA)**
- **Name**: JOHN MICHAEL DOE
- **Document**: PA123456789
- **Country**: USA
- **Birth**: 1990-05-15
- **Expires**: 2032-03-10

#### **Test Passport 002 - Emily Smith (GBR)**
- **Name**: EMILY ANNE SMITH  
- **Document**: PB987654321
- **Country**: GBR
- **Birth**: 1985-08-22
- **Expires**: 2031-11-15

### Step 4: Run the Full Test

1. Click **"🚀 Start Full Test"** button
2. Watch the progress indicators
3. Monitor real-time logs for detailed feedback
4. Wait for test completion

## 📊 Understanding Test Progress

The interface shows 8 test steps:

### 🔗 Step 1: Wallet Connection
- **Purpose**: Establish blockchain connection
- **Success**: Green checkmark, wallet address displayed
- **Logs**: Connection details and network info

### 📄 Step 2: Passport Selection  
- **Purpose**: Choose dummy passport for testing
- **Success**: Passport details displayed
- **Logs**: Selected passport information

### 📱 Step 3: NFC Scanning Simulation
- **Purpose**: Simulate realistic passport reading
- **Duration**: ~6-8 seconds with realistic stages
- **Stages**: 
  - Detecting NFC field
  - Establishing connection
  - Performing Basic Access Control (BAC)
  - Reading Data Groups (DG1, DG2, DG14, DG15)
  - Verifying data integrity
  - Performing Active Authentication

### 🔒 Step 4: TEE Verification
- **Purpose**: Validate passport authenticity in secure environment
- **Checks**:
  - Passport structure validation
  - Digital signature verification
  - Certificate chain validation
  - Document date validation
  - TEE attestation generation

### 🆔 Step 5: Identity Hash Generation
- **Purpose**: Create cryptographic identity from passport data
- **Method**: SHA-256 hash of key passport fields
- **Output**: Deterministic 32-byte hash

### ⛓️ Step 6: Blockchain Transaction
- **Purpose**: Store identity hash on blockchain
- **Contract**: IdentityVerification.sol
- **Function**: `verifyIdentity()`
- **Result**: Transaction hash and block confirmation

### 🔐 Step 7: Off-chain Data Storage
- **Purpose**: Encrypt and store private passport data
- **Method**: AES encryption with wallet-derived keys
- **Storage**: Local storage (IPFS in production)

### 📈 Step 8: Test Completion
- **Purpose**: Generate comprehensive test summary
- **Output**: Detailed verification results
- **Export**: JSON file with all test data

## 🛠️ Available Test Controls

### **Primary Controls**
- **🚀 Start Full Test**: Complete end-to-end verification
- **📱 Scan Only**: Test just the NFC scanning simulation
- **🔍 Check Status**: View stored test data for current wallet
- **🧹 Clear Test Data**: Remove stored data for current wallet

### **Quick Actions**
- **🔄 Switch Passport**: Change selected test passport
- **📂 View Stored Data**: Display previously stored test results
- **📤 Export Results**: Download test results as JSON
- **🔄 Reset All**: Clear all data and restart interface

## 📝 Understanding the Logs

The real-time log panel shows detailed information:

### **Log Types**
- **🔵 Info** (Blue): General information and progress
- **🟢 Success** (Green): Successful operations
- **🟡 Warning** (Yellow): Important notices
- **🔴 Error** (Red): Failures and issues

### **Key Log Messages**
```
✅ Wallet connected successfully: 0xf39F...
📋 Selected passport: Primary Test Passport
📱 Starting enhanced mock NFC passport scan...
🔒 Starting FULL MOCK verification process...
⛓️ Step 5: Blockchain Transaction
🎉 FULL MOCK VERIFICATION COMPLETED SUCCESSFULLY!
```

## 📈 Test Results Summary

Upon successful completion, you'll see:

### **Summary Cards**
- **Test Type**: Full Mock Verification
- **Passport Used**: Selected test passport name
- **Passport Holder**: Full name from passport
- **Document Number**: Passport document number
- **Issuing Country**: Country code
- **Identity Hash**: Generated cryptographic hash
- **Verification Status**: SUCCESS
- **Completed At**: Timestamp

### **Verification Steps Completed**
- ✅ NFC Scanning Simulation
- ✅ TEE Passport Verification  
- ✅ Identity Hash Generation
- ✅ TEE Signature Creation
- ✅ Wallet Connection Validation
- ✅ Blockchain Transaction
- ✅ Off-chain Data Encryption
- ✅ Test Summary Generation

## 🔬 Testing Different Scenarios

### **Test Multiple Passports**
1. Complete test with John Doe passport
2. Click "🔄 Switch Passport"
3. Select Emily Smith passport
4. Run full test again
5. Compare results

### **Test Scan-Only Mode**
1. Select a passport
2. Click "📱 Scan Only"
3. Observe NFC simulation without blockchain interaction

### **Test Data Persistence**
1. Complete a full test
2. Click "🔍 Check Status"
3. Verify stored data is retrieved
4. Test "🧹 Clear Test Data" functionality

### **Test Error Scenarios**
1. Try starting test without wallet connection
2. Try starting test without passport selection
3. Observe error handling and user feedback

## 📊 Expected Results

A successful test should show:

### **Blockchain Verification**
- Transaction hash in logs
- Gas usage estimation
- Block confirmation
- Contract interaction success

### **Cryptographic Operations**
- Identity hash generation
- TEE signature creation
- Data encryption for off-chain storage

### **Data Flow**
- Passport data → Identity hash → Blockchain storage
- Personal data → Encryption → Off-chain storage
- Test results → Summary → Export capability

## 🐛 Troubleshooting

### **Common Issues**

#### **MetaMask Connection Fails**
- Ensure MetaMask is installed and unlocked
- Check network is set to Hardhat Local (Chain ID 31337)
- Verify RPC URL: http://127.0.0.1:8545

#### **"Contract info not found" Error**  
- Verify Hardhat node is running on port 8545
- Ensure contract is deployed (check contract-info.json exists)
- Restart HTTP server if CORS issues occur

#### **Transaction Fails**
- Check wallet has sufficient ETH (Hardhat accounts have 10,000 ETH)
- Verify contract address in logs matches deployment
- Check Hardhat node console for error details

#### **No Test Passports Available**
- Verify mock-passport-data.json exists in WebApp directory
- Check browser console for loading errors
- Ensure HTTP server can serve JSON files

### **Debug Information**

Check browser console (F12) for:
- Service import errors
- Network request failures  
- JavaScript execution errors
- Detailed operation logs

## 🎯 Success Criteria

The test is successful when:

1. ✅ **Wallet connects** without errors
2. ✅ **Passport selection** works smoothly
3. ✅ **NFC simulation** completes all stages
4. ✅ **TEE verification** passes all checks
5. ✅ **Identity hash** is generated correctly
6. ✅ **Blockchain transaction** executes successfully
7. ✅ **Off-chain storage** encrypts data properly
8. ✅ **Test summary** displays complete results

## 📁 Files Involved

### **Test Data**
- `mock-passport-data.json` - Realistic dummy passport database
- `contract-info.json` - Smart contract deployment information

### **Test Interface**  
- `comprehensive-test.html` - Main test interface
- `services/MockNFCService.ts` - Enhanced mock NFC service
- `services/WalletService.ts` - Real MetaMask integration
- `services/TEEService.ts` - TEE verification simulation

### **Smart Contract**
- `../MobilePass/contracts/IdentityVerification.sol` - Main contract
- `../MobilePass/scripts/deploy.js` - Deployment script

## 🚀 Next Steps

After successful testing:

1. **Document Results**: Export test results for review
2. **Test Edge Cases**: Try different scenarios and error conditions
3. **Performance Testing**: Measure transaction times and gas usage
4. **Security Review**: Analyze cryptographic operations and data handling
5. **Integration Testing**: Test with mobile app interfaces
6. **Production Planning**: Plan real passport reading and production TEE integration

This comprehensive test validates the entire passport verification workflow and demonstrates the system's capabilities for hackathon judges! 🎉 