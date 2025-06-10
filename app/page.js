'use client';

import { useState, useEffect } from 'react';
import { PassportService } from './services/PassportService';
import { TEEService } from './services/TEEService';
import { IPFSService } from './services/IPFSService';
import { BlockchainService } from './services/BlockchainService';
import { ethers } from 'ethers';

export default function SecurePassportIdentity() {
  const [currentStep, setCurrentStep] = useState('home');
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState(null);
  const [passportKeys, setPassportKeys] = useState(null);
  const [deviceKey, setDeviceKey] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [selectedPassportType, setSelectedPassportType] = useState('US_PASSPORT_001');
  const [deviceHasPassport, setDeviceHasPassport] = useState(false);
  const [existingPassportKey, setExistingPassportKey] = useState(null);

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
    addLog('🛂 Secure Passport Identity System Initialized (Strict 1:1 Binding)');
    addLog(`TEE Support: ${TEEService.isSupported() ? 'Available' : 'Not Available'}`);
    checkDevicePassportStatus();
  }, []);

  // Check if device already has a passport registered
  const checkDevicePassportStatus = async () => {
    try {
      addLog('🔍 Checking device passport status...');
      
      // Generate device key to get device address
      const deviceKeyData = await teeService.generateDeviceKey();
      setDeviceKey(deviceKeyData);
      
      // Initialize blockchain
      await blockchainService.initialize();
      
      // Check if device has existing passport
      const deviceStatus = await blockchainService.hasDevicePassport(deviceKeyData.deviceAddress);
      
      if (deviceStatus.hasPassport) {
        setDeviceHasPassport(true);
        setExistingPassportKey(deviceStatus.passportPublicKey);
        addLog('📱 Device already has a passport registered', 'warning');
        addLog(`🗝️ Passport Key: ${deviceStatus.passportPublicKey.substring(0, 20)}...`);
        addLog('💡 You can load your passport data using your private key', 'info');
        setCurrentStep('home'); // Still show buttons
      } else {
        addLog('✅ Device can scan a new passport');
        setCurrentStep('home');
      }
      
    } catch (err) {
      addLog(`Device check failed: ${err.message}`, 'error');
      addLog('Continuing in offline mode...');
      setCurrentStep('home'); // Still show buttons even if check fails
    }
  };

  // Step 1: Scan Passport (with strict validation)
  const handleScanPassport = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep('scanning');
      addLog('🔍 Starting strict passport scan process...');

      // First check if device can scan
      let currentDeviceKey = deviceKey;
      if (!currentDeviceKey) {
        const deviceKeyData = await teeService.generateDeviceKey();
        setDeviceKey(deviceKeyData);
        currentDeviceKey = deviceKeyData; // Use the fresh data directly
      }

      await blockchainService.initialize();
      
      // STRICT 1:1 BINDING CHECK
      if (deviceHasPassport) {
        throw new Error(`❌ SCAN BLOCKED: Device already linked to another passport (${existingPassportKey.substring(0, 20)}...)`);
      }

      const canScan = await blockchainService.canDeviceScanPassport(currentDeviceKey.deviceAddress);
      if (!canScan.canScan) {
        throw new Error(`❌ SCAN BLOCKED: ${canScan.reason}`);
      }

      addLog('✅ Device authorized to scan passport');

      // Simulate passport scan
      const scannedData = await PassportService.simulatePassportScan(selectedPassportType);
      setPassportData(scannedData);
      addLog(`📄 Passport scanned: ${scannedData.fullName} (${scannedData.documentNumber})`);

      // Add debug logging to confirm passport data is set
      addLog('🔍 Debug: Scanned passport data keys: ' + Object.keys(scannedData).join(', '));
      addLog('🔍 Debug: Scanned fullName: ' + scannedData.fullName);

      // Generate passport keys
      addLog('🔐 Generating passport key pair...');
      const keys = await PassportService.generatePassportKeys(scannedData);
      setPassportKeys(keys);
      addLog('✅ Passport keys generated successfully');

      // Check if passport is already registered
      addLog('🔍 Checking if passport already exists on blockchain...');
      const isRegistered = await blockchainService.isPassportRegistered(keys.publicKeyHash);
      
      if (isRegistered) {
        throw new Error('❌ PASSPORT ALREADY REGISTERED: This passport has been scanned by another device');
      }

      addLog('✅ Passport is new - proceeding to registration');
      setCurrentStep('scanned');
      await handleEncryptAndUpload(keys, scannedData, currentDeviceKey);

    } catch (err) {
      addLog(`❌ Passport scan failed: ${err.message}`, 'error');
      setError(err.message);
      setCurrentStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Encrypt and Upload to IPFS
  const handleEncryptAndUpload = async (passportKeysParam, passportDataParam = null, deviceKeyParam = null) => {
    try {
      addLog('🔒 Encrypting passport data with device key...');

      // Use passed parameter or state variable
      const dataToUse = passportDataParam || passportData;
      const deviceKeyToUse = deviceKeyParam || deviceKey;

      // Add debug logging to check what we have before encryption
      addLog('🔍 Debug: passportData before encryption: ' + (dataToUse ? 'exists' : 'null'));
      if (dataToUse) {
        addLog('🔍 Debug: passportData keys: ' + Object.keys(dataToUse).join(', '));
        addLog('🔍 Debug: fullName: ' + dataToUse.fullName);
      }

      const dataToEncrypt = {
        passportDetails: dataToUse,
        deviceId: deviceKeyToUse?.attestationData?.deviceFingerprint || 'unknown',
        passportPrivateKey: passportKeysParam.privateKey,
        timestamp: Date.now()
      };

      // Add debug logging for the data we're about to encrypt
      addLog('🔍 Debug: dataToEncrypt structure ready');
      addLog('🔍 Debug: dataToEncrypt.passportDetails: ' + (dataToEncrypt.passportDetails ? 'exists' : 'null'));

      const encryptedData = await teeService.encryptWithDeviceKey(JSON.stringify(dataToEncrypt));
      addLog('✅ Data encrypted successfully');

      addLog('🌐 Uploading encrypted data to IPFS...');
      const ipfsHash = await ipfsService.uploadEncryptedData(encryptedData);
      addLog(`✅ Data uploaded to IPFS: ${ipfsHash}`);

      setCurrentStep('register-blockchain');
      await handleBlockchainRegistration(ipfsHash, passportKeysParam, deviceKeyToUse);

    } catch (err) {
      addLog(`❌ Encryption/Upload failed: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  // Step 3: Register on Blockchain with Private Key
  const handleBlockchainRegistration = async (ipfsHash, passportKeysParam, deviceKeyParam = null) => {
    try {
      addLog('⛓️ Registering passport with strict 1:1 binding...');

      // Use passed parameter or state variable
      const deviceKeyToUse = deviceKeyParam || deviceKey;

      if (!deviceKeyToUse || !deviceKeyToUse.deviceAddress) {
        throw new Error('Device key not available for blockchain registration');
      }

      // Generate private key hash for verification
      const encoder = new TextEncoder();
      const data = encoder.encode(passportKeysParam.privateKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const privateKeyHash = '0x' + Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const result = await blockchainService.registerPassport(
        passportKeysParam.publicKeyHash,
        deviceKeyToUse.deviceAddress,
        ipfsHash,
        privateKeyHash
      );

      addLog('✅ Passport registered with strict 1:1 binding!');
      addLog(`📝 Transaction: ${result.txHash}`);
      addLog(`🔗 Block: ${result.blockNumber}`);
      addLog('⚠️ IMPORTANT: Save your private key to access data later!');
      addLog(`🔑 Private Key: ${passportKeysParam.privateKey}`);

      setCurrentStep('success');

    } catch (err) {
      addLog(`❌ Blockchain registration failed: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  // Load Passport Data with Private Key
  const handleLoadPassportData = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStep('private-key-input');
      addLog('🔓 Ready to load passport data with private key verification...');

    } catch (err) {
      addLog(`❌ Load preparation failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify Private Key and Load Data
  const handleVerifyAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      addLog('🔓 Loading passport data with private key verification...');

      if (!privateKeyInput || privateKeyInput.length < 50) {
        throw new Error('Please enter a valid private key');
      }

      let currentDeviceKey = deviceKey;
      if (!currentDeviceKey) {
        const deviceKeyData = await teeService.generateDeviceKey();
        setDeviceKey(deviceKeyData);
        currentDeviceKey = deviceKeyData; // Use the fresh data directly
      }

      await blockchainService.initialize();

      // Reconstruct passport keys from private key
      const privateKeyHex = privateKeyInput;
      const hashArray = [];
      for (let i = 0; i < privateKeyHex.length; i += 2) {
        hashArray.push(parseInt(privateKeyHex.substr(i, 2), 16));
      }
      
      const reversedHashArray = hashArray.slice().reverse();
      const publicKeyHash = '0x' + reversedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // If device has existing passport, verify it matches
      if (deviceHasPassport && existingPassportKey !== publicKeyHash) {
        throw new Error('❌ Private key does not match the passport registered on this device');
      }

      // Generate private key hash for verification
      const encoder = new TextEncoder();
      const data = encoder.encode(privateKeyInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const privateKeyHashForVerification = '0x' + Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      addLog('🔍 Verifying private key and accessing data...');

      // Access passport data with private key verification
      const ipfsHash = await blockchainService.accessPassportData(
        publicKeyHash,
        currentDeviceKey.deviceAddress,
        privateKeyHashForVerification
      );

      addLog('✅ Private key verified - access granted!');
      addLog(`📄 IPFS Hash: ${ipfsHash}`);

      // Decrypt and display data
      addLog('🔒 Decrypting passport data...');
      const encryptedDataPackage = await ipfsService.retrieveEncryptedData(ipfsHash);
      
      // Extract the actual encrypted data from the IPFS data package
      const actualEncryptedData = encryptedDataPackage.data;
      addLog('📦 Extracted encrypted data from IPFS package');
      
      const decryptedData = await teeService.decryptWithDeviceKey(actualEncryptedData);
      
      // Add debug logging to see what we actually got
      addLog('🔍 Debug: Decrypted data type: ' + typeof decryptedData);
      addLog('🔍 Debug: Decrypted data preview: ' + decryptedData.substring(0, 100) + '...');
      
      const passportInfo = JSON.parse(decryptedData);
      
      // Add debug logging for the parsed object
      addLog('🔍 Debug: Parsed object keys: ' + Object.keys(passportInfo).join(', '));
      if (passportInfo.passportDetails) {
        addLog('🔍 Debug: PassportDetails keys: ' + Object.keys(passportInfo.passportDetails).join(', '));
      } else {
        addLog('🔍 Debug: passportDetails is: ' + passportInfo.passportDetails);
      }

      // Handle case where passportDetails is null (corrupted/old data)
      if (!passportInfo.passportDetails) {
        addLog('⚠️ Stored passport data is corrupted or incomplete', 'warning');
        addLog('💡 This may happen with old test data. Try scanning a new passport.', 'info');
        throw new Error('Stored passport data is corrupted. Please scan a new passport.');
      }

      setPassportData(passportInfo.passportDetails);
      setPassportKeys({ 
        publicKeyHash,
        privateKey: privateKeyInput // Store the private key for display
      });
      addLog('✅ Passport data loaded successfully!');
      
      // Only log welcome message if passportDetails exists and has fullName
      if (passportInfo.passportDetails && passportInfo.passportDetails.fullName) {
        addLog(`👤 Welcome back, ${passportInfo.passportDetails.fullName}!`);
      } else {
        addLog('⚠️ Passport data structure issue - fullName not found');
      }

      setCurrentStep('data-loaded');

    } catch (err) {
      addLog(`❌ Data access failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('home');
    setPassportData(null);
    setPassportKeys(null);
    setDeviceKey(null);
    setError(null);
    clearLogs();
    addLog('System reset');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Scan D. Passport</h1>
          <p className="text-xl text-gray-600">TEE Attested Virtual Passport</p>
        </div>

        {/* Main Layout: iPhone Left, Controls Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)]">
          
          {/* Left Side: iPhone Mockup */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* iPhone Frame */}
              <div className="w-80 h-[650px] bg-black rounded-[3rem] p-2 shadow-2xl">
                {/* iPhone Screen */}
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] relative overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                  
                  {/* iPhone Status Bar */}
                  <div className="bg-gray-900 px-6 py-2 flex justify-between items-center text-white text-sm">
                    <span></span>
                    <div className="flex items-center space-x-1">
                    </div>
                  </div>

                  {/* iPhone Content */}
                  <div className="flex-1 bg-gray-900 text-white flex flex-col relative h-full">
                    
                    {/* App Header */}
                    <div className="text-center pt-6 pb-4">
                      <h2 className="text-2xl font-bold text-white">Scan D. Passport</h2>
                      <p className="text-gray-400 text-sm mt-2">TEE Attested Virtual Passport</p>
                    </div>

                    {/* Main Interface - Vertically Centered */}
                    <div className="flex-1 flex items-center justify-center px-6 pb-8">
                      <div className="w-full max-w-xs">
                        {currentStep === 'home' && (
                          <div className="space-y-4">
                            {deviceHasPassport && (
                              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 mb-4">
                                <div className="flex items-center text-yellow-400 text-sm">
                                  <span className="mr-2">⚠️</span>
                                  <span>Device has existing passport</span>
                                </div>
                                <div className="text-yellow-300/70 text-xs mt-1 font-mono">
                                  {existingPassportKey?.substring(0, 20)}...
                                </div>
                              </div>
                            )}
                            
                            <button
                              onClick={handleScanPassport}
                              disabled={loading || deviceHasPassport}
                              className={`w-full font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg ${
                                deviceHasPassport 
                                  ? 'bg-gray-500 cursor-not-allowed text-gray-300' 
                                  : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white'
                              }`}
                            >
                              {deviceHasPassport ? 'Scan Blocked (Device Used)' : 'Scan Passport'}
                            </button>
                            
                            <button
                              onClick={handleLoadPassportData}
                              disabled={loading}
                              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg"
                            >
                              Load Passport Data
                            </button>
                          </div>
                        )}

                        {currentStep === 'scanning' && (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-white mb-2">Scanning Passport</h3>
                            <p className="text-gray-400">Please wait...</p>
                          </div>
                        )}

                        {currentStep === 'tee-attestation' && (
                          <div className="text-center">
                            <div className="animate-pulse">
                              <div className="bg-blue-600 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center text-2xl">
                                TEE
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">TEE Attestation</h3>
                            <p className="text-gray-400">Securing device...</p>
                          </div>
                        )}

                        {currentStep === 'blockchain-check' && (
                          <div className="text-center">
                            <div className="animate-pulse">
                              <div className="bg-purple-600 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center text-2xl">
                                BC
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Blockchain Check</h3>
                            <p className="text-gray-400">Verifying on-chain...</p>
                          </div>
                        )}

                        {currentStep === 'encrypt-upload' && (
                          <div className="text-center">
                            <div className="animate-pulse">
                              <div className="bg-green-600 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center text-2xl">
                                ENC
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Encrypting</h3>
                            <p className="text-gray-400">Uploading to IPFS...</p>
                          </div>
                        )}

                        {currentStep === 'register-blockchain' && (
                          <div className="text-center">
                            <div className="animate-pulse">
                              <div className="bg-orange-600 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center text-2xl">
                                REG
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Registering</h3>
                            <p className="text-gray-400">On blockchain...</p>
                          </div>
                        )}

                        {currentStep === 'scanned' && passportData && (
                          <div className="space-y-4">
                            <div className="text-center mb-4">
                              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">✓</span>
                              </div>
                              <h3 className="text-white text-lg">Passport Scanned</h3>
                              <p className="text-gray-400 text-sm">{passportData.fullName}</p>
                            </div>
                            
                            <button
                              onClick={() => handleEncryptAndUpload(passportKeys, passportData, deviceKey)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg"
                            >
                              Continue
                            </button>
                          </div>
                        )}

                        {currentStep === 'success' && (
                          <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                              <span className="text-white text-lg font-bold">✓</span>
                            </div>
                            <h3 className="text-white text-lg font-semibold">Success</h3>
                            <p className="text-gray-400 text-sm mb-4">Identity verified</p>
                            
                            <button
                              onClick={() => setCurrentStep('passport-data')}
                              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg"
                            >
                              Passport Data
                            </button>
                            
                            <button
                              onClick={() => setCurrentStep('private-key')}
                              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg"
                            >
                              Private Key
                            </button>
                          </div>
                        )}

                        {currentStep === 'passport-data' && passportData && (
                          <div className="text-white">
                            <div className="text-center mb-4">
                              <h3 className="text-lg font-semibold text-white mb-2">Passport Data</h3>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              <div><span className="text-blue-300 font-medium">Name:</span> <span className="text-white">{passportData.fullName}</span></div>
                              <div><span className="text-blue-300 font-medium">Document:</span> <span className="text-white">{passportData.documentNumber}</span></div>
                              <div><span className="text-blue-300 font-medium">Country:</span> <span className="text-white">{passportData.issuingCountry}</span></div>
                              <div><span className="text-blue-300 font-medium">DOB:</span> <span className="text-white">{passportData.dateOfBirth}</span></div>
                              <div><span className="text-blue-300 font-medium">Expires:</span> <span className="text-white">{passportData.dateOfExpiry}</span></div>
                              <div><span className="text-blue-300 font-medium">Sex:</span> <span className="text-white">{passportData.sex}</span></div>
                              {passportKeys && (
                                <div><span className="text-blue-300 font-medium">Key Hash:</span> <span className="text-white font-mono text-xs">{passportKeys.publicKeyHash.substring(0, 20)}...</span></div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => setCurrentStep('success')}
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg mt-4"
                            >
                              Back
                            </button>
                          </div>
                        )}

                        {currentStep === 'private-key' && (
                          <div className="text-white">
                            <div className="text-center mb-4">
                              <div className="bg-yellow-500 rounded-full h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                                <span className="text-white font-bold">KEY</span>
                              </div>
                              <h3 className="text-lg font-semibold text-white">Your Migration Key</h3>
                              <p className="text-sm text-gray-300 mt-2">
                                Save this securely - you'll need it to migrate to a new device
                              </p>
                            </div>
                            
                            <div className="bg-black/30 rounded-lg p-3 mb-4">
                              <div className="font-mono text-xs text-green-400 break-all">
                                {passportKeys?.privateKey}
                              </div>
                            </div>
                            
                            <div className="flex space-x-3 mb-4">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(passportKeys?.privateKey);
                                  addLog('Private key copied to clipboard');
                                }}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg"
                              >
                                Copy Key
                              </button>
                              <button
                                onClick={() => setCurrentStep('success')}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg"
                              >
                                Back
                              </button>
                            </div>
                            
                            <div className="text-xs text-gray-400 text-center">
                              This key was protected by WebAuthn hardware security
                            </div>
                          </div>
                        )}

                        {currentStep === 'error' && (
                          <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                              <span className="text-white text-lg font-bold">!</span>
                            </div>
                            <h3 className="text-white text-lg font-semibold">Error</h3>
                            <p className="text-red-300 text-sm mb-4">{error}</p>
                            <button
                              onClick={resetFlow}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg"
                            >
                              Try Again
                            </button>
                          </div>
                        )}

                        {currentStep === 'data-loaded' && passportData && (
                          <div className="text-white">
                            <div className="text-center mb-4">
                              <h3 className="text-lg font-semibold text-white mb-2">Passport Data</h3>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              <div><span className="text-blue-300 font-medium">Name:</span> <span className="text-white">{passportData.fullName}</span></div>
                              <div><span className="text-blue-300 font-medium">Document:</span> <span className="text-white">{passportData.documentNumber}</span></div>
                              <div><span className="text-blue-300 font-medium">Country:</span> <span className="text-white">{passportData.issuingCountry}</span></div>
                              <div><span className="text-blue-300 font-medium">DOB:</span> <span className="text-white">{passportData.dateOfBirth}</span></div>
                              <div><span className="text-blue-300 font-medium">Expires:</span> <span className="text-white">{passportData.dateOfExpiry}</span></div>
                              <div><span className="text-blue-300 font-medium">Sex:</span> <span className="text-white">{passportData.sex}</span></div>
                              {passportKeys && (
                                <div><span className="text-blue-300 font-medium">Key Hash:</span> <span className="text-white font-mono text-xs">{passportKeys.publicKeyHash.substring(0, 20)}...</span></div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => setCurrentStep('success')}
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg mt-4"
                            >
                              Back
                            </button>
                          </div>
                        )}

                        {currentStep === 'private-key-input' && (
                          <div className="space-y-4">
                            <div className="text-center mb-4">
                              <div className="bg-blue-500 rounded-full h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                                <span className="text-white font-bold">🔑</span>
                              </div>
                              <h3 className="text-lg font-semibold text-white">Enter Private Key</h3>
                              <p className="text-sm text-gray-300 mt-2">
                                Enter your passport private key to access your data
                              </p>
                            </div>
                            
                            <div>
                              <textarea
                                value={privateKeyInput}
                                onChange={(e) => setPrivateKeyInput(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-white placeholder-gray-400 text-sm font-mono"
                                rows={3}
                                placeholder="Paste your private key here..."
                                disabled={loading}
                              />
                            </div>
                            
                            <div className="flex space-x-3">
                              <button 
                                onClick={handleVerifyAndLoadData}
                                disabled={loading || !privateKeyInput || privateKeyInput.length < 50}
                                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform active:scale-95"
                              >
                                {loading ? 'Verifying...' : 'Load Data'}
                              </button>
                              <button
                                onClick={() => {setCurrentStep('home'); setPrivateKeyInput(''); setError(null);}}
                                disabled={loading}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform active:scale-95"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Home Indicator - Fixed at bottom */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-32 h-1 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Controls & Logs */}
          <div className="flex flex-col gap-6 h-full max-h-full overflow-hidden">
            
            {/* Top Right: Passport Selector - Reduced size */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Select Mock Passport</h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Choose a test passport to simulate scanning:
                </label>
                <select
                  value={selectedPassportType}
                  onChange={(e) => setSelectedPassportType(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || currentStep !== 'home'}
                >
                  {PassportService.getAvailablePassportTypes().map((passport) => (
                    <option key={passport.id} value={passport.id}>
                      {passport.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Selected passport will be used when you click "Scan Passport"
                </p>
              </div>
            </div>

            {/* Bottom Right: System Logs - Expanded */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-800">System Logs</h3>
                <button
                  onClick={clearLogs}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1 overflow-y-auto font-mono text-sm max-h-96">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${
                      log.type === 'error' ? 'text-red-600' :
                      log.type === 'warning' ? 'text-yellow-600' :
                      log.type === 'success' ? 'text-green-600' :
                      'text-gray-700'
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-400 italic">No logs yet...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
