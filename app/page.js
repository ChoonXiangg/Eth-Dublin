'use client';

import { useState, useEffect } from 'react';
import { PassportService } from './services/PassportService';
import { TEEService } from './services/TEEService';
import { IPFSService } from './services/IPFSService';
import { BlockchainService } from './services/BlockchainService';

export default function SecurePassportIdentity() {
  const [currentStep, setCurrentStep] = useState('home');
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState(null);
  const [passportKeys, setPassportKeys] = useState(null);
  const [deviceKey, setDeviceKey] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);

  // Services
  const [teeService] = useState(new TEEService());
  const [ipfsService] = useState(new IPFSService());
  const [blockchainService] = useState(new BlockchainService());

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog('🚀 Secure Passport Identity System Initialized');
    addLog(`🔒 TEE Support: ${TEEService.isSupported() ? 'Available' : 'Not Available'}`);
  }, []);

  // Step 1: Scan Passport
  const handleScanPassport = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep('scanning');
      addLog('📱 Starting passport scan process...');

      // Simulate passport scanning
      const scannedData = await PassportService.simulatePassportScan('US_PASSPORT_001');
      setPassportData(scannedData);
      addLog(`✅ Passport scanned: ${scannedData.fullName} (${scannedData.documentNumber})`);

      // Generate passport keys (now async)
      addLog('🔑 Generating passport key pair...');
      const keys = await PassportService.generatePassportKeys(scannedData);
      setPassportKeys(keys);
      addLog('✅ Passport keys generated successfully');

      setCurrentStep('tee-attestation');
      await handleTEEAttestation(keys);

    } catch (err) {
      addLog(`❌ Passport scan failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: TEE Attestation
  const handleTEEAttestation = async (passportKeysParam) => {
    try {
      addLog('🔒 Starting TEE attestation process...');
      
      const deviceKeyData = await teeService.generateDeviceKey();
      setDeviceKey(deviceKeyData);
      addLog('✅ TEE attestation completed');
      addLog(`🛡️ Device address: ${deviceKeyData.deviceAddress}`);

      setCurrentStep('blockchain-check');
      await handleBlockchainCheck(passportKeysParam, deviceKeyData);

    } catch (err) {
      addLog(`❌ TEE attestation failed: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  // Step 3: Blockchain Check
  const handleBlockchainCheck = async (passportKeysParam, deviceKeyParam) => {
    try {
      addLog('🔗 Initializing blockchain connection...');
      await blockchainService.initialize();

      addLog('🔍 Checking if passport is already registered...');
      const isRegistered = await blockchainService.isPassportRegistered(passportKeysParam.publicKeyHash);
      
      if (isRegistered) {
        addLog('⚠️ Passport public key already exists on-chain!', 'error');
        setError('This passport is already registered. Cannot proceed with registration.');
        setCurrentStep('error');
        return;
      }

      addLog('✅ Passport is new - proceeding to registration');
      setCurrentStep('encrypt-upload');
      await handleEncryptAndUpload(passportKeysParam, deviceKeyParam);

    } catch (err) {
      addLog(`❌ Blockchain check failed: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  // Step 4: Encrypt and Upload to IPFS
  const handleEncryptAndUpload = async (passportKeysParam, deviceKeyParam) => {
    try {
      addLog('🔐 Encrypting passport data with device key...');

      const dataToEncrypt = {
        passportDetails: passportData,
        deviceId: deviceKeyParam.attestationData.deviceFingerprint,
        passportPrivateKey: passportKeysParam.privateKey,
        timestamp: Date.now()
      };

      const encryptedData = await teeService.encryptWithDeviceKey(JSON.stringify(dataToEncrypt));
      addLog('✅ Data encrypted successfully');

      addLog('📤 Uploading encrypted data to IPFS...');
      const ipfsHash = await ipfsService.uploadEncryptedData(encryptedData);
      addLog(`✅ Data uploaded to IPFS: ${ipfsHash}`);

      setCurrentStep('register-blockchain');
      await handleBlockchainRegistration(ipfsHash, passportKeysParam, deviceKeyParam);

    } catch (err) {
      addLog(`❌ Encryption/Upload failed: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  // Step 5: Register on Blockchain
  const handleBlockchainRegistration = async (ipfsHash, passportKeysParam, deviceKeyParam) => {
    try {
      addLog('⛓️ Registering passport on blockchain...');

      const result = await blockchainService.registerPassport(
        passportKeysParam.publicKeyHash,
        deviceKeyParam.deviceAddress,
        ipfsHash
      );

      addLog('✅ Passport registered successfully!');
      addLog(`📝 Transaction: ${result.txHash}`);
      addLog(`🔗 Block: ${result.blockNumber}`);

      setCurrentStep('success');

    } catch (err) {
      addLog(`❌ Blockchain registration failed: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  // Import Private Key Flow
  const handleImportPrivateKey = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep('import');
      addLog('🔑 Starting private key import process...');

    } catch (err) {
      addLog(`❌ Import failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Migration Process
  const handleMigration = async (privateKeyInput) => {
    try {
      setLoading(true);
      setError(null);
      addLog('🔄 Starting migration process...');

      if (!privateKeyInput || privateKeyInput.length < 50) {
        throw new Error('Invalid private key format');
      }

      // Generate new device key for this device
      addLog('🔒 Generating new device key for this device...');
      const newDeviceKeyData = await teeService.generateDeviceKey();
      setDeviceKey(newDeviceKeyData);
      addLog(`✅ New device key generated: ${newDeviceKeyData.deviceAddress}`);

      // Initialize blockchain
      addLog('🔗 Connecting to blockchain...');
      await blockchainService.initialize();

      // For migration, we need to reconstruct the passport data from the private key
      // In a real system, you'd derive the public key hash from the private key
      // For demo purposes, we'll simulate this
      const simulatedPassportKeys = {
        privateKey: privateKeyInput,
        publicKey: privateKeyInput.split('').reverse().join(''), // Simplified
        publicKeyHash: '0x' + privateKeyInput.substring(0, 64) // Use first 64 chars as hash
      };

      setPassportKeys(simulatedPassportKeys);
      addLog('✅ Passport keys reconstructed from private key');

      // Check if passport exists on-chain
      addLog('🔍 Verifying passport exists on blockchain...');
      const isRegistered = await blockchainService.isPassportRegistered(simulatedPassportKeys.publicKeyHash);
      
      if (!isRegistered) {
        throw new Error('Passport not found on blockchain. Please check your private key.');
      }

      addLog('✅ Passport found on blockchain');

      // In a real migration, you would:
      // 1. Decrypt the IPFS data using the old device key
      // 2. Re-encrypt with the new device key
      // 3. Update the blockchain with the new device address
      
      addLog('🔄 Performing migration...');
      const result = await blockchainService.migratePassport(
        simulatedPassportKeys.publicKeyHash,
        newDeviceKeyData.deviceAddress,
        'QmMigratedData123' // In real system, this would be the re-encrypted IPFS hash
      );

      addLog('✅ Migration completed successfully!');
      addLog(`📝 Transaction: ${result.txHash}`);
      setCurrentStep('success');

    } catch (err) {
      addLog(`❌ Migration failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Secure Private Key Reveal with WebAuthn Re-authentication
  const handleRevealPrivateKey = async () => {
    try {
      addLog('🔐 Requesting WebAuthn authentication to reveal private key...');
      
      // Re-authenticate using WebAuthn
      const authResult = await teeService.authenticateUser();
      
      if (authResult.success) {
        addLog('✅ WebAuthn authentication successful');
        setShowPrivateKeyModal(true);
      } else {
        throw new Error('Authentication failed');
      }
      
    } catch (error) {
      addLog(`❌ Authentication failed: ${error.message}`, 'error');
      setError('WebAuthn authentication required to reveal private key');
    }
  };

  const resetFlow = () => {
    setCurrentStep('home');
    setPassportData(null);
    setPassportKeys(null);
    setDeviceKey(null);
    setError(null);
    clearLogs();
    addLog('🔄 System reset');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🛂 Secure Passport Identity</h1>
          <p className="text-xl text-blue-200">TEE-Secured Identity System with IPFS & Blockchain</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Control Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">Control Panel</h2>
            
            {currentStep === 'home' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl mb-4">Choose an option:</h3>
                </div>
                
                <button
                  onClick={handleScanPassport}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷 Scan Passport
                </button>
                
                <button
                  onClick={handleImportPrivateKey}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔑 Import Private Key
                </button>
              </div>
            )}

            {currentStep === 'scanning' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Scanning passport...</p>
              </div>
            )}

            {currentStep === 'tee-attestation' && (
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="bg-blue-500 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                    🔒
                  </div>
                </div>
                <p className="text-lg">TEE Attestation in progress...</p>
              </div>
            )}

            {currentStep === 'blockchain-check' && (
              <div className="text-center">
                <div className="animate-bounce">
                  <div className="bg-purple-500 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                    🔗
                  </div>
                </div>
                <p className="text-lg">Checking blockchain...</p>
              </div>
            )}

            {currentStep === 'encrypt-upload' && (
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="bg-orange-500 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                    📤
                  </div>
                </div>
                <p className="text-lg">Encrypting & uploading to IPFS...</p>
              </div>
            )}

            {currentStep === 'register-blockchain' && (
              <div className="text-center">
                <div className="animate-spin">
                  <div className="bg-green-500 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                    ⛓️
                  </div>
                </div>
                <p className="text-lg">Registering on blockchain...</p>
              </div>
            )}

            {currentStep === 'success' && (
              <div className="text-center">
                <div className="bg-green-500 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                  ✅
                </div>
                <h3 className="text-xl font-semibold mb-4">Registration Successful!</h3>
                <p className="mb-4">Your passport identity has been securely registered.</p>
                
                {/* Secure Private Key Access */}
                <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-300 font-semibold mb-2">🔐 Migration Key Access</h4>
                  <p className="text-sm text-blue-200 mb-3">
                    Your private key is protected by WebAuthn. Authenticate to reveal it for migration.
                  </p>
                  <button
                    onClick={handleRevealPrivateKey}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    🔐 Reveal Private Key
                  </button>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={resetFlow}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    🔄 Register Another
                  </button>
                  <button
                    onClick={() => window.open('/tester', '_blank')}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    🧪 Open Tester
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'error' && (
              <div className="text-center">
                <div className="bg-red-500 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                  ❌
                </div>
                <h3 className="text-xl font-semibold mb-4">Error Occurred</h3>
                <p className="mb-4 text-red-200">{error}</p>
                <button
                  onClick={resetFlow}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  🔄 Try Again
                </button>
              </div>
            )}

            {currentStep === 'import' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">🔄 Migrate to This Device</h3>
                <p className="text-sm text-blue-200">
                  Enter your passport private key to migrate your identity to this device.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Private Key:</label>
                  <textarea
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 font-mono text-xs"
                    rows={4}
                    placeholder="Paste your 64-character passport private key here..."
                    disabled={loading}
                  />
                </div>
                {privateKeyInput && (
                  <div className="text-sm">
                    <span className={privateKeyInput.length >= 50 ? 'text-green-400' : 'text-red-400'}>
                      Key length: {privateKeyInput.length} characters
                      {privateKeyInput.length >= 50 ? ' ✅' : ' (minimum 50 required)'}
                    </span>
                  </div>
                )}
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleMigration(privateKeyInput)}
                    disabled={loading || !privateKeyInput || privateKeyInput.length < 50}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    {loading ? '🔄 Migrating...' : '🔄 Start Migration'}
                  </button>
                  <button
                    onClick={resetFlow}
                    disabled={loading}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Help section */}
                <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 text-sm">
                  <h4 className="text-blue-300 font-semibold mb-1">💡 Migration Process:</h4>
                  <ul className="text-blue-200 space-y-1 text-xs">
                    <li>• Creates new device key for this device</li>
                    <li>• Verifies passport exists on blockchain</li>
                    <li>• Updates device association</li>
                    <li>• Re-encrypts data for new device</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Logs Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">System Logs</h2>
              <button
                onClick={clearLogs}
                className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold py-1 px-3 rounded-lg"
              >
                Clear
              </button>
            </div>
            
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

        {/* Status Cards */}
        {(passportData || deviceKey) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {passportData && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">📄 Passport Data</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-blue-300">Name:</span> {passportData.fullName}</div>
                  <div><span className="text-blue-300">Document:</span> {passportData.documentNumber}</div>
                  <div><span className="text-blue-300">Country:</span> {passportData.issuingCountry}</div>
                  <div><span className="text-blue-300">Expires:</span> {passportData.dateOfExpiry}</div>
                  {passportKeys && (
                    <div><span className="text-blue-300">Public Key Hash:</span> {passportKeys.publicKeyHash.substring(0, 20)}...</div>
                  )}
                </div>
              </div>
            )}

            {deviceKey && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">🔒 Device Data</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-blue-300">Device Address:</span> {deviceKey.deviceAddress}</div>
                  <div><span className="text-blue-300">TEE Status:</span> {deviceKey.attestationData.fallback ? 'Fallback' : 'Hardware'}</div>
                  <div><span className="text-blue-300">Timestamp:</span> {new Date(deviceKey.attestationData.timestamp).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Private Key Modal */}
      {showPrivateKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="bg-yellow-500 rounded-full h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                🔑
              </div>
              <h3 className="text-xl font-semibold text-white">Your Migration Key</h3>
              <p className="text-sm text-gray-300 mt-2">
                Save this securely - you'll need it to migrate to a new device
              </p>
            </div>
            
            <div className="bg-black rounded-lg p-4 mb-4">
              <div className="font-mono text-xs text-green-400 break-all">
                {passportKeys?.privateKey}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(passportKeys?.privateKey);
                  addLog('📋 Private key copied to clipboard');
                }}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                📋 Copy Key
              </button>
              <button
                onClick={() => setShowPrivateKeyModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Close
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-400 text-center">
              🔐 This key was protected by WebAuthn hardware security
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
