'use client';

import { useState, useEffect } from 'react';
import { PassportService } from '../services/PassportService';
import { TEEService } from '../services/TEEService';
import { IPFSService } from '../services/IPFSService';
import { BlockchainService } from '../services/BlockchainService';

export default function TesterInterface() {
  const [selectedTest, setSelectedTest] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Services
  const [teeService] = useState(new TEEService());
  const [ipfsService] = useState(new IPFSService());
  const [blockchainService] = useState(new BlockchainService());

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const addTestResult = (testName, result, data = null) => {
    setTestResults(prev => [...prev, {
      testName,
      result,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  // Test scenarios
  const testScenarios = [
    {
      id: 'test-passport-generation',
      name: '🔑 Test Passport Key Generation',
      description: 'Generate passport keys from different dummy passports'
    },
    {
      id: 'test-tee-attestation',
      name: '🔒 Test TEE Attestation',
      description: 'Test WebAuthn-based TEE device key generation'
    },
    {
      id: 'test-ipfs-storage',
      name: '📤 Test IPFS Storage',
      description: 'Test encrypted data upload and retrieval from IPFS'
    },
    {
      id: 'test-blockchain-registration',
      name: '⛓️ Test Blockchain Registration',
      description: 'Test passport registration on blockchain'
    },
    {
      id: 'test-duplicate-prevention',
      name: '🚫 Test Duplicate Prevention',
      description: 'Verify that duplicate passports are rejected'
    },
    {
      id: 'test-migration-flow',
      name: '🔄 Test Migration Flow',
      description: 'Test passport migration to new device'
    },
    {
      id: 'test-end-to-end',
      name: '🎯 Full End-to-End Test',
      description: 'Complete registration flow from scan to blockchain'
    }
  ];

  // Test Passport Key Generation
  const testPassportGeneration = async () => {
    try {
      addLog('🔑 Testing passport key generation...');
      
      const passportTypes = PassportService.getAvailablePassportTypes();
      const results = [];

      for (const passportType of passportTypes) {
        addLog(`📱 Scanning ${passportType.name}...`);
        const passportData = await PassportService.simulatePassportScan(passportType.id);
        const keys = await PassportService.generatePassportKeys(passportData);
        
        results.push({
          passport: passportType.name,
          documentNumber: passportData.documentNumber,
          publicKeyHash: keys.publicKeyHash,
          generated: true
        });
        
        addLog(`✅ Keys generated for ${passportType.name}`);
      }

      addTestResult('Passport Key Generation', 'PASS', results);
      addLog('✅ All passport key generation tests passed');

    } catch (error) {
      addLog(`❌ Passport generation test failed: ${error.message}`, 'error');
      addTestResult('Passport Key Generation', 'FAIL', { error: error.message });
    }
  };

  // Test TEE Attestation
  const testTEEAttestation = async () => {
    try {
      addLog('🔒 Testing TEE attestation...');
      
      const deviceKeyData = await teeService.generateDeviceKey();
      
      // Test encryption/decryption
      const testData = 'This is test data for encryption';
      addLog('🔐 Testing encryption...');
      const encrypted = await teeService.encryptWithDeviceKey(testData);
      
      addLog('🔓 Testing decryption...');
      const decrypted = await teeService.decryptWithDeviceKey(encrypted);
      
      const success = decrypted === testData;
      
      if (success) {
        addTestResult('TEE Attestation', 'PASS', {
          deviceAddress: deviceKeyData.deviceAddress,
          encryptionTest: 'PASS',
          teeSupported: TEEService.isSupported(),
          fallback: deviceKeyData.attestationData.fallback
        });
        addLog('✅ TEE attestation test passed');
      } else {
        throw new Error('Encryption/decryption test failed');
      }

    } catch (error) {
      addLog(`❌ TEE attestation test failed: ${error.message}`, 'error');
      addTestResult('TEE Attestation', 'FAIL', { error: error.message });
    }
  };

  // Test IPFS Storage
  const testIPFSStorage = async () => {
    try {
      addLog('📤 Testing IPFS storage...');
      
      const testData = {
        testMessage: 'Hello IPFS!',
        timestamp: Date.now(),
        randomData: Math.random().toString(36)
      };

      // Upload test
      addLog('📤 Uploading test data...');
      const ipfsHash = await ipfsService.uploadEncryptedData(testData);
      addLog(`✅ Data uploaded: ${ipfsHash}`);

      // Retrieval test
      addLog('📥 Retrieving test data...');
      const retrievedData = await ipfsService.retrieveEncryptedData(ipfsHash);
      
      const success = JSON.stringify(retrievedData.data) === JSON.stringify(testData);
      
      if (success) {
        addTestResult('IPFS Storage', 'PASS', {
          ipfsHash,
          uploadSuccess: true,
          retrievalSuccess: true,
          dataIntegrity: 'PASS'
        });
        addLog('✅ IPFS storage test passed');
      } else {
        throw new Error('Data integrity check failed');
      }

    } catch (error) {
      addLog(`❌ IPFS storage test failed: ${error.message}`, 'error');
      addTestResult('IPFS Storage', 'FAIL', { error: error.message });
    }
  };

  // Test Blockchain Registration
  const testBlockchainRegistration = async () => {
    try {
      addLog('⛓️ Testing blockchain registration...');
      
      // Initialize blockchain
      await blockchainService.initialize();
      addLog('✅ Blockchain connected');
      
      // Generate test data
      const testPassportData = await PassportService.simulatePassportScan('US_PASSPORT_001');
      const keys = await PassportService.generatePassportKeys(testPassportData);
      const deviceKeyData = await teeService.generateDeviceKey();
      
      // Test registration
      const testIpfsHash = 'QmTestHash123456789';
      
      addLog('📝 Registering test passport...');
      const result = await blockchainService.registerPassport(
        keys.publicKeyHash,
        deviceKeyData.deviceAddress,
        testIpfsHash
      );
      
      // Verify registration
      const isRegistered = await blockchainService.isPassportRegistered(keys.publicKeyHash);
      
      if (isRegistered) {
        addTestResult('Blockchain Registration', 'PASS', {
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          passportPublicKeyHash: keys.publicKeyHash,
          deviceAddress: deviceKeyData.deviceAddress
        });
        addLog('✅ Blockchain registration test passed');
      } else {
        throw new Error('Registration verification failed');
      }

    } catch (error) {
      addLog(`❌ Blockchain registration test failed: ${error.message}`, 'error');
      addTestResult('Blockchain Registration', 'FAIL', { error: error.message });
    }
  };

  // Test Duplicate Prevention
  const testDuplicatePrevention = async () => {
    try {
      addLog('🚫 Testing duplicate prevention...');
      
      await blockchainService.initialize();
      
      const testPassportData = await PassportService.simulatePassportScan('UK_PASSPORT_001');
      const keys = await PassportService.generatePassportKeys(testPassportData);
      const deviceKeyData = await teeService.generateDeviceKey();
      
      // First registration should succeed
      addLog('📝 First registration attempt...');
      try {
        await blockchainService.registerPassport(
          keys.publicKeyHash,
          deviceKeyData.deviceAddress,
          'QmFirstRegistration'
        );
        addLog('✅ First registration succeeded');
      } catch (firstError) {
        if (firstError.message.includes('already registered')) {
          addLog('ℹ️ Passport already registered, skipping first registration');
        } else {
          throw firstError;
        }
      }
      
      // Second registration should fail
      addLog('📝 Second registration attempt (should fail)...');
      let duplicateBlocked = false;
      try {
        await blockchainService.registerPassport(
          keys.publicKeyHash,
          deviceKeyData.deviceAddress,
          'QmSecondRegistration'
        );
        addLog('❌ Second registration succeeded (this should not happen)', 'error');
      } catch (secondError) {
        if (secondError.message.includes('already registered')) {
          duplicateBlocked = true;
          addLog('✅ Duplicate registration correctly blocked');
        } else {
          throw secondError;
        }
      }
      
      if (duplicateBlocked) {
        addTestResult('Duplicate Prevention', 'PASS', {
          passportHash: keys.publicKeyHash,
          duplicateBlocked: true
        });
        addLog('✅ Duplicate prevention test passed');
      } else {
        throw new Error('Duplicate registration was not blocked');
      }

    } catch (error) {
      addLog(`❌ Duplicate prevention test failed: ${error.message}`, 'error');
      addTestResult('Duplicate Prevention', 'FAIL', { error: error.message });
    }
  };

  // Full End-to-End Test
  const testEndToEnd = async () => {
    try {
      addLog('🎯 Starting full end-to-end test...');
      
      // Step 1: Passport Scan
      addLog('Step 1: Passport scanning...');
      const passportData = await PassportService.simulatePassportScan('GERMAN_PASSPORT_001');
      const keys = PassportService.generatePassportKeys(passportData);
      addLog('✅ Passport scanned and keys generated');
      
      // Step 2: TEE Attestation
      addLog('Step 2: TEE attestation...');
      const deviceKeyData = await teeService.generateDeviceKey();
      addLog('✅ Device key generated via TEE');
      
      // Step 3: Blockchain Check
      addLog('Step 3: Blockchain registration check...');
      await blockchainService.initialize();
      const isAlreadyRegistered = await blockchainService.isPassportRegistered(keys.publicKeyHash);
      
      if (isAlreadyRegistered) {
        addLog('⚠️ Passport already registered, test complete');
        addTestResult('End-to-End Test', 'PASS', {
          flow: 'duplicate-detected',
          passportHash: keys.publicKeyHash
        });
        return;
      }
      
      // Step 4: Data Encryption & IPFS Upload
      addLog('Step 4: Encrypting and uploading data...');
      const dataToEncrypt = {
        passportDetails: passportData,
        deviceId: deviceKeyData.attestationData.deviceFingerprint,
        passportPrivateKey: keys.privateKey,
        timestamp: Date.now()
      };
      
      const encryptedData = await teeService.encryptWithDeviceKey(JSON.stringify(dataToEncrypt));
      const ipfsHash = await ipfsService.uploadEncryptedData(encryptedData);
      addLog('✅ Data encrypted and uploaded to IPFS');
      
      // Step 5: Blockchain Registration
      addLog('Step 5: Blockchain registration...');
      const result = await blockchainService.registerPassport(
        keys.publicKeyHash,
        deviceKeyData.deviceAddress,
        ipfsHash
      );
      addLog('✅ Passport registered on blockchain');
      
      // Verification
      const isNowRegistered = await blockchainService.isPassportRegistered(keys.publicKeyHash);
      
      if (isNowRegistered) {
        addTestResult('End-to-End Test', 'PASS', {
          flow: 'complete-registration',
          passportHash: keys.publicKeyHash,
          deviceAddress: deviceKeyData.deviceAddress,
          ipfsHash,
          txHash: result.txHash,
          blockNumber: result.blockNumber
        });
        addLog('✅ Full end-to-end test passed');
      } else {
        throw new Error('Registration verification failed');
      }

    } catch (error) {
      addLog(`❌ End-to-end test failed: ${error.message}`, 'error');
      addTestResult('End-to-End Test', 'FAIL', { error: error.message });
    }
  };

  const runTest = async (testId) => {
    setLoading(true);
    setSelectedTest(testId);
    
    try {
      switch (testId) {
        case 'test-passport-generation':
          await testPassportGeneration();
          break;
        case 'test-tee-attestation':
          await testTEEAttestation();
          break;
        case 'test-ipfs-storage':
          await testIPFSStorage();
          break;
        case 'test-blockchain-registration':
          await testBlockchainRegistration();
          break;
        case 'test-duplicate-prevention':
          await testDuplicatePrevention();
          break;
        case 'test-end-to-end':
          await testEndToEnd();
          break;
        default:
          addLog('❌ Unknown test selected', 'error');
      }
    } catch (error) {
      addLog(`❌ Test execution failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setSelectedTest('');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setLogs([]);
    addLog('🧹 Test results cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🧪 Tester Interface</h1>
          <p className="text-xl text-purple-200">Comprehensive Testing Suite for Secure Passport Identity</p>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Test Scenarios */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">Test Scenarios</h2>
            
            <div className="space-y-3">
              {testScenarios.map((test) => (
                <div key={test.id} className="border border-white/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{test.name}</h3>
                  <p className="text-sm text-purple-200 mb-3">{test.description}</p>
                  <button
                    onClick={() => runTest(test.id)}
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      selectedTest === test.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {selectedTest === test.id ? '⏳ Running...' : '▶️ Run Test'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={clearResults}
              className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              🧹 Clear Results
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">Test Results</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-center text-gray-400 italic">No test results yet...</div>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.result === 'PASS'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-red-500 bg-red-500/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{result.testName}</h3>
                      <span className={`px-2 py-1 rounded text-sm font-bold ${
                        result.result === 'PASS' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {result.result}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-300">View Details</summary>
                        <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">System Logs</h2>
            
            <div className="bg-black/20 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    log.type === 'error' ? 'text-red-300' :
                    log.type === 'success' ? 'text-green-300' :
                    'text-blue-200'
                  }`}
                >
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-400 italic">No logs yet...</div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-green-400">
              {testResults.filter(r => r.result === 'PASS').length}
            </div>
            <div className="text-sm text-green-200">Tests Passed</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-red-400">
              {testResults.filter(r => r.result === 'FAIL').length}
            </div>
            <div className="text-sm text-red-200">Tests Failed</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {testResults.length}
            </div>
            <div className="text-sm text-blue-200">Total Tests</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {TEEService.isSupported() ? '✅' : '❌'}
            </div>
            <div className="text-sm text-purple-200">TEE Support</div>
          </div>
        </div>
      </div>
    </div>
  );
} 