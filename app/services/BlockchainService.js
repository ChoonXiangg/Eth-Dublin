import { ethers } from 'ethers';

/**
 * BlockchainService - Handles smart contract interactions with strict 1:1 binding
 */
export class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = null;
        this.contractABI = [
            "function registerPassport(bytes32 passportPublicKey, address deviceAddress, string memory ipfsHash, bytes32 privateKeyHash) external",
            "function accessPassportData(bytes32 passportPublicKey, address deviceAddress, bytes32 privateKeyHash) external view returns (string memory ipfsHash)",
            "function canDeviceScanPassport(address deviceAddress) external view returns (bool canScan, string memory reason)",
            "function isPassportRegistered(bytes32 passportPublicKey) external view returns (bool)",
            "function getPassportIdentity(bytes32 passportPublicKey) external view returns (address currentDevice, uint256 registrationTime, bool isActive)",
            "function getPassportForDevice(address deviceAddress) external view returns (bytes32)",
            "function hasDevicePassport(address deviceAddress) external view returns (bool hasPassport, bytes32 passportPublicKey)",
            "function getTotalRegisteredPassports() external view returns (uint256)",
            "function revokePassport(bytes32 passportPublicKey) external",
            "function resetPassport(bytes32 passportPublicKey) external",
            "function resetDevice(address deviceAddress) external",
            "event PassportRegistered(bytes32 indexed passportPublicKey, address deviceAddress, string ipfsHash, uint256 timestamp)",
            "event PassportDataAccessed(bytes32 indexed passportPublicKey, address deviceAddress, uint256 timestamp)",
            "event PassportRevoked(bytes32 indexed passportPublicKey, uint256 timestamp)"
        ];
    }

    /**
     * Initialize blockchain connection
     * @returns {Promise<boolean>} Connection success
     */
    async initialize() {
        try {
            console.log('🔗 Initializing blockchain connection...');

            // Specific MetaMask detection when multiple wallets are present
            let ethereum = window.ethereum;
            
            if (window.ethereum?.providers?.length) {
                // Multiple wallets detected
                console.log('🔍 Multiple wallets detected, searching for MetaMask...');
                ethereum = window.ethereum.providers.find(provider => provider.isMetaMask);
                
                if (!ethereum) {
                    // Try the legacy way
                    ethereum = window.ethereum.providers.find(provider => provider.constructor.name === 'MetaMaskInpageProvider');
                }
                
                if (!ethereum) {
                    throw new Error('MetaMask not found. Please make sure MetaMask is installed and enabled.');
                }
                
                console.log('✅ MetaMask found among multiple wallets');
            } else if (window.ethereum?.isMetaMask) {
                // Only MetaMask or MetaMask is primary
                console.log('✅ MetaMask detected as primary wallet');
                ethereum = window.ethereum;
            } else if (window.ethereum) {
                // Some other wallet is primary, check if MetaMask is available
                if (window.ethereum.isPhantom) {
                    console.log('⚠️ Phantom detected as primary. Looking for MetaMask...');
                    // Try to find MetaMask specifically
                    if (window.solana && window.solana.isPhantom) {
                        // Phantom is using window.ethereum, try to access MetaMask directly
                        throw new Error('Please disable Phantom or set MetaMask as default Ethereum wallet in your browser settings.');
                    }
                }
                
                // Fallback to whatever ethereum provider is available
                console.log('⚠️ Using available Ethereum provider (may not be MetaMask)');
                ethereum = window.ethereum;
            } else {
                throw new Error('No Ethereum wallet detected. Please install MetaMask extension.');
            }

            // Create provider and signer with the specific MetaMask instance
            this.provider = new ethers.providers.Web3Provider(ethereum);
            this.signer = this.provider.getSigner();

            // Request account access from MetaMask specifically
            await ethereum.request({ method: 'eth_requestAccounts' });

            // Get network info
            const network = await this.provider.getNetwork();
            console.log(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

            // Check if we're on the right network (localhost should be chain ID 31337)
            if (network.chainId !== 31337) {
                console.warn(`⚠️ Warning: Expected local network (31337), but connected to ${network.chainId}`);
                console.log('💡 Please switch MetaMask to localhost:8545 network');
                
                // Try to switch network
                try {
                    await ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7a69' }], // 31337 in hex
                    });
                } catch (switchError) {
                    // If the network doesn't exist, add it
                    if (switchError.code === 4902) {
                        try {
                            await ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x7a69',
                                    chainName: 'Hardhat Local',
                                    rpcUrls: ['http://127.0.0.1:8545'],
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    }
                                }]
                            });
                        } catch (addError) {
                            console.error('Failed to add network:', addError);
                        }
                    }
                }
            }

            // Load contract info
            await this.loadContractInfo();

            console.log('✅ Blockchain connection initialized with MetaMask');
            return true;

        } catch (error) {
            console.error('❌ Blockchain initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load contract information from deployment file
     */
    async loadContractInfo() {
        try {
            // Try to load from contract-info.json
            const response = await fetch('/contract-info.json');
            if (response.ok) {
                const contractInfo = await response.json();
                this.contractAddress = contractInfo.address;
                console.log(`📄 Contract loaded: ${this.contractAddress}`);
            } else {
                // Fallback for development
                console.warn('⚠️ Contract info not found, using development defaults');
                this.contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default hardhat deployment
            }

            // Create contract instance
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );

        } catch (error) {
            console.error('Contract loading error:', error);
            throw new Error('Failed to load contract information');
        }
    }

    /**
     * Check if device can scan a new passport (strict 1:1 binding validation)
     * @param {string} deviceAddress - Device address to check
     * @returns {Promise<Object>} { canScan: boolean, reason: string }
     */
    async canDeviceScanPassport(deviceAddress) {
        try {
            console.log('🔍 Checking if device can scan passport...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const [canScan, reason] = await this.contract.canDeviceScanPassport(deviceAddress);
            
            console.log(`📋 Device scan check: ${canScan ? 'ALLOWED' : 'BLOCKED'}`);
            console.log(`📝 Reason: ${reason}`);

            return { canScan, reason };

        } catch (error) {
            console.error('❌ Device scan check failed:', error);
            throw new Error(`Failed to check device scan permission: ${error.message}`);
        }
    }

    /**
     * Check if device already has a passport registered
     * @param {string} deviceAddress - Device address to check  
     * @returns {Promise<Object>} { hasPassport: boolean, passportPublicKey: string }
     */
    async hasDevicePassport(deviceAddress) {
        try {
            console.log('🔍 Checking if device has existing passport...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const [hasPassport, passportPublicKey] = await this.contract.hasDevicePassport(deviceAddress);
            
            console.log(`📋 Device passport status: ${hasPassport ? 'HAS PASSPORT' : 'NO PASSPORT'}`);
            if (hasPassport) {
                console.log(`🗝️ Existing passport key: ${passportPublicKey}`);
            }

            return { hasPassport, passportPublicKey };

        } catch (error) {
            console.error('❌ Device passport check failed:', error);
            throw new Error(`Failed to check device passport: ${error.message}`);
        }
    }

    /**
     * Register a new passport on the blockchain with strict 1:1 binding
     * @param {string} passportPublicKeyHash - Passport public key hash
     * @param {string} deviceAddress - TEE-attested device address
     * @param {string} ipfsHash - IPFS hash of encrypted data
     * @param {string} privateKeyHash - Hash of passport private key
     * @returns {Promise<Object>} Transaction result
     */
    async registerPassport(passportPublicKeyHash, deviceAddress, ipfsHash, privateKeyHash) {
        try {
            console.log('🔐 Registering passport with strict 1:1 binding...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // Check if device can scan (strict validation)
            const deviceCheck = await this.canDeviceScanPassport(deviceAddress);
            if (!deviceCheck.canScan) {
                throw new Error(`Device cannot scan: ${deviceCheck.reason}`);
            }

            // Check if passport is already registered
            const isRegistered = await this.contract.isPassportRegistered(passportPublicKeyHash);
            if (isRegistered) {
                throw new Error('Passport already registered by another device');
            }

            // Register passport with private key hash
            const tx = await this.contract.registerPassport(
                passportPublicKeyHash,
                deviceAddress,
                ipfsHash,
                privateKeyHash
            );

            console.log(`📝 Transaction sent: ${tx.hash}`);
            console.log('⏳ Waiting for confirmation...');

            const receipt = await tx.wait();
            
            console.log('✅ Passport registered with strict 1:1 binding');
            console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`🔗 Block: ${receipt.blockNumber}`);

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };

        } catch (error) {
            console.error('❌ Passport registration failed:', error);
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    /**
     * Access passport data with private key verification
     * @param {string} passportPublicKeyHash - Passport public key hash
     * @param {string} deviceAddress - Device address requesting access
     * @param {string} privateKeyHash - Hash of provided private key
     * @returns {Promise<string>} IPFS hash of encrypted data
     */
    async accessPassportData(passportPublicKeyHash, deviceAddress, privateKeyHash) {
        try {
            console.log('🔓 Accessing passport data with private key verification...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const ipfsHash = await this.contract.accessPassportData(
                passportPublicKeyHash,
                deviceAddress,
                privateKeyHash
            );

            console.log('✅ Passport data access granted');
            console.log(`📄 IPFS Hash: ${ipfsHash}`);

            return ipfsHash;

        } catch (error) {
            console.error('❌ Passport data access failed:', error);
            throw new Error(`Access denied: ${error.message}`);
        }
    }

    /**
     * Get passport identity details (without sensitive data)
     */
    async getPassportIdentity(passportPublicKeyHash) {
        try {
            console.log('📋 Getting passport identity details...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const [currentDevice, registrationTime, isActive] = await this.contract.getPassportIdentity(passportPublicKeyHash);

            const identity = {
                currentDevice,
                registrationTime: new Date(registrationTime.toNumber() * 1000),
                isActive
            };

            console.log('✅ Identity details retrieved');
            console.log(`📱 Device: ${identity.currentDevice}`);
            console.log(`📅 Registered: ${identity.registrationTime.toISOString()}`);
            console.log(`✨ Active: ${identity.isActive}`);

            return identity;

        } catch (error) {
            console.error('❌ Failed to get passport identity:', error);
            throw new Error(`Identity lookup failed: ${error.message}`);
        }
    }

    /**
     * Get passport for a device address
     * @param {string} deviceAddress - Device address
     * @returns {Promise<string>} Passport public key hash
     */
    async getPassportForDevice(deviceAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const passportHash = await this.contract.getPassportForDevice(deviceAddress);
            return passportHash;

        } catch (error) {
            console.error('❌ Device passport lookup failed:', error);
            throw error;
        }
    }

    /**
     * Get total number of registered passports
     * @returns {Promise<number>} Total count
     */
    async getTotalRegisteredPassports() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const total = await this.contract.getTotalRegisteredPassports();
            return total.toNumber();

        } catch (error) {
            console.error('❌ Total count retrieval failed:', error);
            throw error;
        }
    }

    /**
     * Listen for passport events
     * @param {Function} callback - Event callback function
     */
    listenForEvents(callback) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        // Listen for PassportRegistered events
        this.contract.on('PassportRegistered', (passportPublicKey, deviceAddress, ipfsHash, timestamp, event) => {
            callback({
                type: 'PassportRegistered',
                passportPublicKey,
                deviceAddress,
                ipfsHash,
                timestamp: timestamp.toNumber(),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber
            });
        });

        // Listen for PassportDataAccessed events
        this.contract.on('PassportDataAccessed', (passportPublicKey, deviceAddress, timestamp, event) => {
            callback({
                type: 'PassportDataAccessed',
                passportPublicKey,
                deviceAddress,
                timestamp: timestamp.toNumber(),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber
            });
        });

        // Listen for PassportRevoked events
        this.contract.on('PassportRevoked', (passportPublicKey, timestamp, event) => {
            callback({
                type: 'PassportRevoked',
                passportPublicKey,
                timestamp: timestamp.toNumber(),
                txHash: event.transactionHash,
                blockNumber: event.blockNumber
            });
        });

        console.log('👂 Event listeners activated');
    }

    /**
     * Stop listening for events
     */
    stopListening() {
        if (this.contract) {
            this.contract.removeAllListeners();
            console.log('🔇 Event listeners removed');
        }
    }

    /**
     * Get current wallet address
     * @returns {Promise<string>} Wallet address
     */
    async getWalletAddress() {
        try {
            if (!this.signer) {
                throw new Error('Signer not initialized');
            }

            return await this.signer.getAddress();
        } catch (error) {
            console.error('❌ Wallet address retrieval failed:', error);
            throw error;
        }
    }

    /**
     * Get network information
     * @returns {Promise<Object>} Network info
     */
    async getNetworkInfo() {
        try {
            if (!this.provider) {
                throw new Error('Provider not initialized');
            }

            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();

            return {
                name: network.name,
                chainId: network.chainId,
                blockNumber,
                ensAddress: network.ensAddress
            };
        } catch (error) {
            console.error('❌ Network info retrieval failed:', error);
            throw error;
        }
    }

    /**
     * Estimate gas for passport registration
     * @param {string} passportPublicKeyHash - Passport public key hash
     * @param {string} deviceAddress - Device address
     * @param {string} ipfsHash - IPFS hash
     * @returns {Promise<string>} Estimated gas
     */
    async estimateRegistrationGas(passportPublicKeyHash, deviceAddress, ipfsHash) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const gasEstimate = await this.contract.estimateGas.registerPassport(
                passportPublicKeyHash,
                deviceAddress,
                ipfsHash
            );

            return gasEstimate.toString();
        } catch (error) {
            console.error('❌ Gas estimation failed:', error);
            throw error;
        }
    }

    /**
     * Check if a passport is already registered
     * @param {string} passportPublicKeyHash - Passport public key hash to check
     * @returns {Promise<boolean>} Registration status
     */
    async isPassportRegistered(passportPublicKeyHash) {
        try {
            console.log('🔍 Checking passport registration for:', passportPublicKeyHash);

            if (!this.contract) {
                throw new Error('Contract not initialized. Call initialize() first.');
            }

            console.log('📋 Contract address:', this.contractAddress);
            console.log('🔗 Provider:', this.provider?.connection?.url || 'Unknown');

            // Test contract connection first
            try {
                const totalPassports = await this.contract.getTotalRegisteredPassports();
                console.log('📊 Total registered passports:', totalPassports.toString());
            } catch (testError) {
                console.error('❌ Contract connection test failed:', testError);
                throw new Error(`Contract connection failed: ${testError.message}`);
            }

            // Now check the specific passport
            const isRegistered = await this.contract.isPassportRegistered(passportPublicKeyHash);
            console.log('✅ Passport registration check completed:', isRegistered);
            
            return isRegistered;

        } catch (error) {
            console.error('❌ Passport registration check failed:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
            throw error;
        }
    }
} 