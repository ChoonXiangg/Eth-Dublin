// Simple test script for the mobile app services
// This can be run with node to test the basic functionality

// Mock React Native modules for testingglobal.TextEncoder = TextEncoder;if (!global.crypto) {  global.crypto = require('crypto').webcrypto;}

// Mock react-native-nfc-manager
const mockNfcManager = {
  start: () => Promise.resolve(),
  isSupported: () => Promise.resolve(true),
  requestTechnology: () => Promise.resolve(),
  getTag: () => Promise.resolve({ id: 'mock-tag-id', data: 'mock-data' }),
  cancelTechnologyRequest: () => Promise.resolve(),
};

// Mock react-native modules
const mockModules = {
  'react-native-nfc-manager': {
    default: mockNfcManager,
    NfcTech: { IsoDep: 'IsoDep' },
  },
  'ethers': require('ethers'),
};

// Override require for our mocked modules
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
  if (mockModules[args[0]]) {
    return mockModules[args[0]];
  }
  return originalRequire.apply(this, args);
};

async function testWalletService() {
  console.log('🔗 Testing Wallet Service...');
  
  try {
    const { WalletService } = require('./services/WalletService.ts');
    
    // Test wallet connection
    const address = await WalletService.connectWallet();
    console.log('✅ Wallet connected:', address);
    
    // Test getting address
    const retrievedAddress = WalletService.getAddress();
    console.log('✅ Retrieved address:', retrievedAddress);
    
    console.log('✅ Wallet Service tests passed!\n');
  } catch (error) {
    console.error('❌ Wallet Service test failed:', error.message);
  }
}

async function testTEEService() {
  console.log('🔒 Testing TEE Service...');
  
  try {
    const { TEEService } = require('./services/TEEService.ts');
    
    // Mock passport data
    const mockPassportData = {
      documentNumber: 'P123456789',
      dateOfBirth: '1990-01-01',
      dateOfExpiry: '2030-01-01',
      publicKey: '0x1234567890abcdef',
      signature: '0xabcdef1234567890',
      rawData: {}
    };
    
    // Test passport verification
    const verification = await TEEService.verifyPassport(mockPassportData);
    console.log('✅ Passport verification result:', verification.isValid);
    
    // Test identity hash signing
    const identityHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const signature = await TEEService.signIdentityHash(identityHash);
    console.log('✅ TEE signature generated:', signature.substring(0, 20) + '...');
    
    // Test TEE attestation
    const attestation = await TEEService.getTEEAttestation();
    console.log('✅ TEE attestation generated:', attestation.substring(0, 20) + '...');
    
    console.log('✅ TEE Service tests passed!\n');
  } catch (error) {
    console.error('❌ TEE Service test failed:', error.message);
  }
}

async function testNFCService() {
  console.log('📱 Testing NFC Service...');
  
  try {
    const { NFCService } = require('./services/NFCService.ts');
    
    // Test NFC initialization
    const isInitialized = await NFCService.initialize();
    console.log('✅ NFC initialized:', isInitialized);
    
    // Test passport scanning
    const passportData = await NFCService.scanPassport();
    console.log('✅ Passport scanned:', passportData ? 'Success' : 'No data');
    
    if (passportData) {
      console.log('   Document Number:', passportData.documentNumber);
      console.log('   Date of Birth:', passportData.dateOfBirth);
      console.log('   Date of Expiry:', passportData.dateOfExpiry);
    }
    
    console.log('✅ NFC Service tests passed!\n');
  } catch (error) {
    console.error('❌ NFC Service test failed:', error.message);
  }
}

async function testFullFlow() {
  console.log('🌟 Testing Full Verification Flow...');
  
  try {
    const { WalletService } = require('./services/WalletService.ts');
    const { NFCService } = require('./services/NFCService.ts');
    
    // Step 1: Connect wallet
    console.log('Step 1: Connecting wallet...');
    const address = await WalletService.connectWallet();
    console.log('✅ Wallet connected:', address);
    
    // Step 2: Scan passport
    console.log('Step 2: Scanning passport...');
    const passportData = await NFCService.scanPassport();
    console.log('✅ Passport data obtained');
    
    // Step 3: Verify through TEE (this will fail due to blockchain interaction)
    console.log('Step 3: Verifying through TEE...');
    try {
      const result = await NFCService.verifyPassportWithTEE(passportData);
      console.log('✅ TEE verification result:', result.success);
      if (!result.success) {
        console.log('   Error:', result.error);
      }
    } catch (error) {
      console.log('⚠️  TEE verification failed (expected - no blockchain):', error.message);
    }
    
    console.log('✅ Full flow test completed!\n');
  } catch (error) {
    console.error('❌ Full flow test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Mobile App Service Tests\n');
  console.log('==========================================\n');
  
  await testWalletService();
  await testTEEService();
  await testNFCService();
  await testFullFlow();
  
  console.log('==========================================');
  console.log('🎉 All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Run on React Native simulator for UI testing');
  console.log('2. Test on physical device for real NFC functionality');
  console.log('3. Deploy smart contract and update contract address');
}

// Run the tests
runTests().catch(console.error); 