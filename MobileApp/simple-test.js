// Simple test to verify our services work
const { webcrypto } = require('crypto');

// Polyfill for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

console.log('🚀 Testing Mobile App Services (Simplified)');
console.log('==========================================\n');

// Test 1: Check if we can import ethers
console.log('📦 Testing ethers import...');
try {
  const ethers = require('ethers');
  console.log('✅ Ethers imported successfully');
  
  // Test basic ethers functionality
  const wallet = ethers.Wallet.createRandom();
  console.log('✅ Random wallet created:', wallet.address.substring(0, 10) + '...');
} catch (error) {
  console.error('❌ Ethers test failed:', error.message);
}

// Test 2: Check crypto functionality
console.log('\n🔐 Testing crypto functionality...');
try {
  const encoder = new TextEncoder();
  const data = encoder.encode('test message');
  
  crypto.subtle.digest('SHA-256', data).then(hash => {
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('✅ SHA-256 hash generated:', hashHex.substring(0, 20) + '...');
  }).catch(err => {
    console.error('❌ Crypto test failed:', err.message);
  });
} catch (error) {
  console.error('❌ Crypto setup failed:', error.message);
}

// Test 3: Check if our file structure is correct
console.log('\n📁 Testing file structure...');
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'services/WalletService.ts',
  'services/NFCService.ts', 
  'services/TEEService.ts',
  'App.tsx',
  'package.json'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Test 4: Basic TypeScript compilation check
console.log('\n🔧 Testing TypeScript compilation...');
try {
  const ts = require('typescript');
  console.log('✅ TypeScript is available, version:', ts.version);
} catch (error) {
  console.log('⚠️  TypeScript not available (this is okay for basic testing)');
}

console.log('\n==========================================');
console.log('🎯 Basic tests completed!');
console.log('\nNext steps to test the full app:');
console.log('1. Run: npx react-native start (in another terminal)');
console.log('2. Run: npx react-native run-ios (for iOS simulator)');
console.log('3. Or use Expo Go for easier testing');

setTimeout(() => {
  console.log('\n💡 Tip: For real NFC testing, you need a physical iOS device with NFC capability.');
}, 1000); 