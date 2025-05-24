import { ethers } from 'ethers';

/**
 * BlockchainService - Handles smart contract interactions
 */
export class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = null;
        this.contractABI = [
            "function registerPassport(bytes32 passportPublicKey, address deviceAddress, string memory ipfsHash) external",
            "function migratePassport(bytes32 passportPublicKey, address newDeviceAddress, string memory newIpfsHash, bytes memory migrationSignature) external",
            "function isPassportRegistered(bytes32 passportPublicKey) external view returns (bool)",
            "function getPassportIdentity(bytes32 passportPublicKey) external view returns (string memory ipfsHash, address currentDevice, uint256 registrationTime, uint256 lastMigrationTime, bool isActive)",
            "function getPassportForDevice(address deviceAddress) external view returns (bytes32)",
            "function getTotalRegisteredPassports() external view returns (uint256)",
            "function revokePassport(bytes32 passportPublicKey) external",
            "function resetPassport(bytes32 passportPublicKey) external",
            "event PassportRegistered(bytes32 indexed passportPublicKey, address deviceAddress, string ipfsHash, uint256 timestamp)",
            "event PassportMigrated(bytes32 indexed passportPublicKey, address oldDevice, address newDevice, string newIpfsHash, uint256 timestamp)",
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
     * Register a new passport on the blockchain
     * @param {string} passportPublicKeyHash - Passport public key hash
     * @param {string} deviceAddress - TEE-attested device address
     * @param {string} ipfsHash - IPFS hash of encrypted data
     * @returns {Promise<Object>} Transaction result
     */
    async registerPassport(passportPublicKeyHash, deviceAddress, ipfsHash) {
        try {
            console.log('🔐 Registering passport on blockchain...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // Check if passport is already registered
            const isRegistered = await this.contract.isPassportRegistered(passportPublicKeyHash);
            if (isRegistered) {
                throw new Error('Passport public key already registered on-chain');
            }

            // Register passport
            const tx = await this.contract.registerPassport(
                passportPublicKeyHash,
                deviceAddress,
                ipfsHash
            );

            console.log(`📝 Transaction sent: ${tx.hash}`);
            console.log('⏳ Waiting for confirmation...');

            const receipt = await tx.wait();
            
            console.log('✅ Passport registered successfully');
            console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`🔗 Block: ${receipt.blockNumber}`);

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                passportPublicKeyHash,
                deviceAddress,
                ipfsHash
            };

        } catch (error) {
            console.error('❌ Passport registration failed:', error);
            throw error;
        }
    }

    /**
     * Migrate passport to a new device
     * @param {string} passportPublicKeyHash - Passport public key hash
     * @param {string} newDeviceAddress - New TEE-attested device address
     * @param {string} newIpfsHash - New IPFS hash with re-encrypted data
     * @param {string} migrationSignature - Signature proving ownership
     * @returns {Promise<Object>} Transaction result
     */
    async migratePassport(passportPublicKeyHash, newDeviceAddress, newIpfsHash, migrationSignature) {
        try {
            console.log('🔄 Migrating passport to new device...');

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // Verify passport is registered
            const isRegistered = await this.contract.isPassportRegistered(passportPublicKeyHash);
            if (!isRegistered) {
                throw new Error('Passport not registered on-chain');
            }

            // Migrate passport
            const tx = await this.contract.migratePassport(
                passportPublicKeyHash,
                newDeviceAddress,
                newIpfsHash,
                migrationSignature
            );

            console.log(`📝 Migration transaction sent: ${tx.hash}`);
            console.log('⏳ Waiting for confirmation...');

            const receipt = await tx.wait();
            
            console.log('✅ Passport migrated successfully');
            console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                passportPublicKeyHash,
                newDeviceAddress,
                newIpfsHash
            };

        } catch (error) {
            console.error('❌ Passport migration failed:', error);
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

    /**
     * Get passport identity details
     * @param {string} passportPublicKeyHash - Passport public key hash
     * @returns {Promise<Object>} Passport identity data
     */
    async getPassportIdentity(passportPublicKeyHash) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const identity = await this.contract.getPassportIdentity(passportPublicKeyHash);
            
            return {
                ipfsHash: identity[0],
                currentDevice: identity[1],
                registrationTime: identity[2].toNumber(),
                lastMigrationTime: identity[3].toNumber(),
                isActive: identity[4]
            };

        } catch (error) {
            console.error('❌ Identity retrieval failed:', error);
            throw error;
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

        // Listen for PassportMigrated events
        this.contract.on('PassportMigrated', (passportPublicKey, oldDevice, newDevice, newIpfsHash, timestamp, event) => {
            callback({
                type: 'PassportMigrated',
                passportPublicKey,
                oldDevice,
                newDevice,
                newIpfsHash,
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
} 