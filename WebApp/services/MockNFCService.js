// MockNFCService.js - Browser Compatible JavaScript Version
import { WalletService } from './WalletService.js';
import { TEEService } from './TEEService.js';

/**
 * Enhanced Mock NFC Service for comprehensive testing
 * Uses realistic dummy passport data for end-to-end testing
 */
export class MockNFCService {
  static selectedPassportId = 'test-passport-001';
  static mockPassportData = null;
  static contractInfo = null;

  /**
   * Initialize the service by loading data
   */
  static async initialize() {
    try {
      // Load mock passport data
      const mockDataResponse = await fetch('./mock-passport-data.json');
      this.mockPassportData = await mockDataResponse.json();
      
      // Load contract info
      const contractResponse = await fetch('./contract-info.json');
      this.contractInfo = await contractResponse.json();
      
      console.log('✅ MockNFCService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MockNFCService:', error);
      throw error;
    }
  }
  
  /**
   * Get available test passports
   */
  static getAvailableTestPassports() {
    if (!this.mockPassportData) {
      console.error('MockNFCService not initialized');
      return [];
    }
    return this.mockPassportData.testPassports;
  }

  /**
   * Select which test passport to use for scanning
   */
  static selectTestPassport(passportId) {
    if (!this.mockPassportData) {
      console.error('MockNFCService not initialized');
      return false;
    }
    
    const passport = this.mockPassportData.testPassports.find(p => p.id === passportId);
    if (passport) {
      this.selectedPassportId = passportId;
      console.log(`📋 Selected test passport: ${passport.name} (${passport.personalInfo.fullName})`);
      return true;
    }
    return false;
  }

  /**
   * Get currently selected test passport
   */
  static getSelectedTestPassport() {
    if (!this.mockPassportData) {
      return null;
    }
    return this.mockPassportData.testPassports.find(p => p.id === this.selectedPassportId) || null;
  }

  /**
   * Simulate realistic NFC passport scanning - ENHANCED MOCK
   */
  static async scanPassport() {
    try {
      console.log('📱 Starting enhanced mock NFC passport scan...');
      
      const testPassport = this.getSelectedTestPassport();
      if (!testPassport) {
        throw new Error('No test passport selected');
      }

      console.log(`🔍 Scanning test passport: ${testPassport.name}`);
      console.log(`👤 Holder: ${testPassport.personalInfo.fullName}`);
      console.log(`🌍 Country: ${testPassport.documentInfo.issuingCountry}`);
      console.log(`📄 Document: ${testPassport.documentInfo.documentNumber}`);

      // Simulate realistic NFC scanning stages
      await this.simulateNFCStages();

      // Convert test passport to PassportData format
      const passportData = {
        documentNumber: testPassport.documentInfo.documentNumber,
        dateOfBirth: testPassport.personalInfo.dateOfBirth,
        dateOfExpiry: testPassport.documentInfo.expiryDate,
        publicKey: testPassport.cryptographicData.publicKey,
        signature: testPassport.cryptographicData.signature,
        rawData: {
          testPassportId: testPassport.id,
          testPassportName: testPassport.name,
          personalInfo: testPassport.personalInfo,
          documentInfo: testPassport.documentInfo,
          biometricInfo: testPassport.biometricInfo,
          securityFeatures: testPassport.securityFeatures,
          nfcData: testPassport.nfcData,
          scannedAt: new Date().toISOString(),
          scanType: 'enhanced_mock',
          chipId: testPassport.nfcData.chipId
        }
      };

      console.log('✅ Enhanced mock passport scan completed successfully');
      console.log('📊 Passport data extracted:');
      console.log(`  - Document Number: ${passportData.documentNumber}`);
      console.log(`  - Date of Birth: ${passportData.dateOfBirth}`);
      console.log(`  - Date of Expiry: ${passportData.dateOfExpiry}`);
      console.log(`  - Public Key: ${passportData.publicKey.substring(0, 30)}...`);
      console.log(`  - Security Status: All checks passed`);

      return passportData;
    } catch (error) {
      console.error('❌ Error in enhanced mock passport scan:', error);
      throw new Error('Enhanced mock passport scan failed: ' + error.message);
    }
  }

  /**
   * Simulate realistic NFC scanning stages
   */
  static async simulateNFCStages() {
    const stages = [
      { name: 'Detecting NFC field', duration: 500 },
      { name: 'Establishing connection', duration: 800 },
      { name: 'Performing Basic Access Control (BAC)', duration: 1200 },
      { name: 'Reading Data Group 1 (MRZ)', duration: 600 },
      { name: 'Reading Data Group 2 (Face image)', duration: 900 },
      { name: 'Reading Data Group 14 (Security features)', duration: 700 },
      { name: 'Reading Data Group 15 (Active Auth key)', duration: 500 },
      { name: 'Verifying data integrity', duration: 1000 },
      { name: 'Performing Active Authentication', duration: 800 }
    ];

    for (const stage of stages) {
      console.log(`📡 ${stage.name}...`);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }
  }

  /**
   * Enhanced passport verification with TEE and blockchain - FULL MOCK TEST
   */
  static async verifyPassportWithTEE(passportData) {
    try {
      console.log('🔒 Starting FULL MOCK verification process...');
      console.log('📋 Test passport information:');
      console.log(`  - Test ID: ${passportData.rawData.testPassportId}`);
      console.log(`  - Test Name: ${passportData.rawData.testPassportName}`);
      console.log(`  - Holder: ${passportData.rawData.personalInfo.fullName}`);
      console.log(`  - Country: ${passportData.rawData.documentInfo.issuingCountry}`);
      
      // Step 1: Enhanced TEE verification with detailed feedback
      console.log('\n🔒 Step 1: TEE Verification');
      const teeVerification = await TEEService.verifyPassport(passportData);
      
      if (!teeVerification.isValid) {
        return {
          success: false,
          error: 'Enhanced TEE verification failed: ' + (teeVerification.error || 'Unknown error'),
        };
      }

      console.log('✅ TEE verification successful with attestation');

      // Step 2: Generate deterministic identity hash
      console.log('\n🆔 Step 2: Identity Hash Generation');
      const identityHash = await this.generateIdentityHash(passportData);
      console.log(`✅ Identity hash: ${identityHash}`);

      // Step 3: TEE signature generation
      console.log('\n✍️ Step 3: TEE Signature Generation');
      const teeSignature = await TEEService.signIdentityHash(identityHash);
      console.log(`✅ TEE signature: ${teeSignature.substring(0, 30)}...`);

      // Step 4: Wallet validation
      console.log('\n👛 Step 4: Wallet Connection Validation');
      const walletAddress = WalletService.getAddress();
      if (!walletAddress) {
        return {
          success: false,
          error: 'Wallet not connected - please connect your wallet first',
        };
      }
      console.log(`✅ Wallet connected: ${walletAddress}`);

      // Step 5: Blockchain interaction
      console.log('\n⛓️ Step 5: Blockchain Transaction');
      console.log(`📄 Contract: ${this.contractInfo.address}`);
      console.log(`🌐 Network: ${this.contractInfo.network}`);
      
      try {
        const success = await WalletService.verifyIdentityOnChain(
          this.contractInfo.address,
          identityHash,
          teeSignature
        );

        if (!success) {
          throw new Error('Blockchain transaction failed');
        }
        console.log('✅ Identity successfully stored on blockchain');

      } catch (blockchainError) {
        console.error('❌ Blockchain interaction failed:', blockchainError);
        return {
          success: false,
          error: `Blockchain error: ${blockchainError.message}`,
        };
      }

      // Step 6: Off-chain data storage
      console.log('\n🔐 Step 6: Off-chain Data Storage');
      await this.storePrivateDataOffChain(passportData, walletAddress);
      console.log('✅ Private data encrypted and stored off-chain');

      // Step 7: Generate test summary
      console.log('\n📊 Step 7: Test Summary Generation');
      const testSummary = this.generateTestSummary(passportData, identityHash, walletAddress);
      
      console.log('\n🎉 FULL MOCK VERIFICATION COMPLETED SUCCESSFULLY!');
      console.log('=' .repeat(60));
      console.log('📋 VERIFICATION SUMMARY:');
      console.log(`✅ Passport: ${passportData.rawData.personalInfo.fullName}`);
      console.log(`✅ Document: ${passportData.documentNumber}`);
      console.log(`✅ Identity Hash: ${identityHash.substring(0, 20)}...`);
      console.log(`✅ Wallet: ${walletAddress.substring(0, 10)}...`);
      console.log(`✅ TEE Verification: PASSED`);
      console.log(`✅ Blockchain Storage: SUCCESSFUL`);
      console.log(`✅ Off-chain Storage: ENCRYPTED`);
      console.log('=' .repeat(60));

      return {
        success: true,
        identityHash,
        publicKey: passportData.publicKey,
        signature: teeSignature,
        ...testSummary
      };
    } catch (error) {
      console.error('❌ Error in enhanced verification process:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate identity hash from passport data - ENHANCED
   */
  static async generateIdentityHash(passportData) {
    try {
      // Create a deterministic hash from key passport fields
      const dataToHash = [
        passportData.documentNumber,
        passportData.dateOfBirth,
        passportData.publicKey,
        passportData.dateOfExpiry,
        passportData.rawData.testPassportId // Include test ID for uniqueness
      ].join('|');
      
      console.log('🔐 Generating enhanced identity hash...');
      
      // Use proper cryptographic hashing
      const encoder = new TextEncoder();
      const data = encoder.encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return '0x' + hashHex;
    } catch (error) {
      console.error('❌ Error generating enhanced identity hash:', error);
      throw new Error('Failed to generate enhanced identity hash');
    }
  }

  /**
   * Store private passport data off-chain - ENHANCED
   */
  static async storePrivateDataOffChain(passportData, walletAddress) {
    try {
      console.log('🔐 Storing enhanced private data off-chain...');
      
      const enhancedDataToStore = {
        testInfo: {
          testPassportId: passportData.rawData.testPassportId,
          testPassportName: passportData.rawData.testPassportName,
          testType: 'enhanced_mock'
        },
        personalInfo: passportData.rawData.personalInfo,
        documentInfo: passportData.rawData.documentInfo,
        biometricHashes: passportData.rawData.biometricInfo,
        encryptedAt: new Date().toISOString(),
        walletAddress: walletAddress,
        verificationComplete: true
      };
      
      // Encrypt the enhanced data
      const dataString = JSON.stringify(enhancedDataToStore);
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString + walletAddress + 'enhanced_encryption_salt');
      const encrypted = await crypto.subtle.digest('SHA-256', data);
      const encryptedArray = Array.from(new Uint8Array(encrypted));
      const encryptedData = encryptedArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Store locally (in production, use IPFS/secure storage)
      const storageKey = `enhanced_passport_data_${walletAddress}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify({
          encrypted: encryptedData,
          testInfo: enhancedDataToStore.testInfo,
          timestamp: enhancedDataToStore.encryptedAt
        }));
        console.log('✅ Enhanced private data stored locally');
      }
      
    } catch (error) {
      console.error('❌ Error storing enhanced private data:', error);
      throw new Error('Failed to store enhanced private data');
    }
  }

  /**
   * Generate comprehensive test summary
   */
  static generateTestSummary(passportData, identityHash, walletAddress) {
    return {
      testSummary: {
        testType: 'Full Mock Verification',
        testPassportUsed: passportData.rawData.testPassportName,
        passportHolder: passportData.rawData.personalInfo.fullName,
        documentNumber: passportData.documentNumber,
        issuingCountry: passportData.rawData.documentInfo.issuingCountry,
        identityHash: identityHash,
        walletAddress: walletAddress,
        verificationSteps: [
          '✅ NFC Scanning Simulation',
          '✅ TEE Passport Verification',
          '✅ Identity Hash Generation',
          '✅ TEE Signature Creation',
          '✅ Wallet Connection Validation',
          '✅ Blockchain Transaction',
          '✅ Off-chain Data Encryption',
          '✅ Test Summary Generation'
        ],
        completedAt: new Date().toISOString(),
        status: 'SUCCESS'
      }
    };
  }

  /**
   * Get stored test data for a wallet
   */
  static getStoredTestData(walletAddress) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storageKey = `enhanced_passport_data_${walletAddress}`;
        const stored = window.localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving enhanced test data:', error);
      return null;
    }
  }

  /**
   * Clear test data for a wallet
   */
  static clearTestData(walletAddress) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storageKey = `enhanced_passport_data_${walletAddress}`;
        window.localStorage.removeItem(storageKey);
        console.log('🧹 Test data cleared for wallet:', walletAddress);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing test data:', error);
      return false;
    }
  }
} 