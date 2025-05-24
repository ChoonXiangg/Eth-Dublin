/**
 * IPFSService - Handles encrypted off-chain data storage using IPFS
 */
export class IPFSService {
    constructor() {
        this.ipfsGateway = 'https://ipfs.io/ipfs/';
        this.pinataApiUrl = 'https://api.pinata.cloud';
        this.pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
        this.pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
    }

    /**
     * Upload encrypted passport data to IPFS
     * @param {Object} encryptedData - Encrypted passport data package
     * @returns {Promise<string>} IPFS hash
     */
    async uploadEncryptedData(encryptedData) {
        try {
            console.log('📤 Uploading encrypted data to IPFS...');

            // Prepare data package
            const dataPackage = {
                version: '1.0',
                timestamp: Date.now(),
                data: encryptedData,
                metadata: {
                    encryption: 'AES-GCM',
                    keyType: 'device-key'
                }
            };

            // If Pinata credentials are available, use Pinata
            if (this.pinataApiKey && this.pinataSecretKey) {
                return await this.uploadToPinata(dataPackage);
            } else {
                // Fallback to local/mock IPFS for development
                return await this.uploadToMockIPFS(dataPackage);
            }

        } catch (error) {
            console.error('❌ IPFS upload failed:', error);
            throw new Error(`IPFS upload failed: ${error.message}`);
        }
    }

    /**
     * Retrieve encrypted data from IPFS
     * @param {string} ipfsHash - IPFS hash of the data
     * @returns {Promise<Object>} Encrypted data package
     */
    async retrieveEncryptedData(ipfsHash) {
        try {
            console.log(`📥 Retrieving data from IPFS: ${ipfsHash}`);

            // Try different IPFS gateways
            const gateways = [
                'https://ipfs.io/ipfs/',
                'https://gateway.pinata.cloud/ipfs/',
                'https://cloudflare-ipfs.com/ipfs/',
                'https://dweb.link/ipfs/'
            ];

            for (const gateway of gateways) {
                try {
                    const response = await fetch(`${gateway}${ipfsHash}`, {
                        headers: {
                            'Accept': 'application/json'
                        },
                        timeout: 10000
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Data retrieved successfully from IPFS');
                        return data;
                    }
                } catch (gatewayError) {
                    console.warn(`⚠️ Gateway ${gateway} failed:`, gatewayError.message);
                    continue;
                }
            }

            // If all gateways fail, try mock storage
            return await this.retrieveFromMockIPFS(ipfsHash);

        } catch (error) {
            console.error('❌ IPFS retrieval failed:', error);
            throw new Error(`IPFS retrieval failed: ${error.message}`);
        }
    }

    /**
     * Upload to Pinata IPFS service
     * @param {Object} dataPackage - Data to upload
     * @returns {Promise<string>} IPFS hash
     */
    async uploadToPinata(dataPackage) {
        try {
            const response = await fetch(`${this.pinataApiUrl}/pinning/pinJSONToIPFS`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                },
                body: JSON.stringify({
                    pinataContent: dataPackage,
                    pinataMetadata: {
                        name: `passport-data-${Date.now()}`,
                        description: 'Encrypted passport identity data'
                    },
                    pinataOptions: {
                        cidVersion: 1
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Pinata upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Data uploaded to Pinata IPFS');
            return result.IpfsHash;

        } catch (error) {
            console.error('Pinata upload error:', error);
            throw error;
        }
    }

    /**
     * Mock IPFS storage for development
     * @param {Object} dataPackage - Data to store
     * @returns {Promise<string>} Mock IPFS hash
     */
    async uploadToMockIPFS(dataPackage) {
        try {
            // Generate mock IPFS hash
            const dataString = JSON.stringify(dataPackage);
            const encoder = new TextEncoder();
            const data = encoder.encode(dataString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const mockHash = 'Qm' + hashArray.slice(0, 23)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // Store in localStorage for development
            const mockStorage = JSON.parse(localStorage.getItem('mockIPFS') || '{}');
            mockStorage[mockHash] = dataPackage;
            localStorage.setItem('mockIPFS', JSON.stringify(mockStorage));

            console.log('✅ Data stored in mock IPFS (localStorage)');
            return mockHash;

        } catch (error) {
            console.error('Mock IPFS storage error:', error);
            throw error;
        }
    }

    /**
     * Retrieve from mock IPFS storage
     * @param {string} hash - Mock IPFS hash
     * @returns {Promise<Object>} Stored data
     */
    async retrieveFromMockIPFS(hash) {
        try {
            const mockStorage = JSON.parse(localStorage.getItem('mockIPFS') || '{}');
            const data = mockStorage[hash];

            if (!data) {
                throw new Error('Data not found in mock IPFS storage');
            }

            console.log('✅ Data retrieved from mock IPFS (localStorage)');
            return data;

        } catch (error) {
            console.error('Mock IPFS retrieval error:', error);
            throw error;
        }
    }

    /**
     * Pin data to IPFS (prevent garbage collection)
     * @param {string} ipfsHash - Hash to pin
     * @returns {Promise<boolean>} Success status
     */
    async pinData(ipfsHash) {
        try {
            if (!this.pinataApiKey || !this.pinataSecretKey) {
                console.log('📌 Pinning skipped (no Pinata credentials)');
                return true;
            }

            const response = await fetch(`${this.pinataApiUrl}/pinning/pinByHash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                },
                body: JSON.stringify({
                    hashToPin: ipfsHash,
                    pinataMetadata: {
                        name: `pinned-passport-data-${Date.now()}`
                    }
                })
            });

            if (response.ok) {
                console.log('📌 Data pinned successfully');
                return true;
            } else {
                console.warn('⚠️ Pinning failed:', response.statusText);
                return false;
            }

        } catch (error) {
            console.error('Pinning error:', error);
            return false;
        }
    }

    /**
     * Unpin data from IPFS
     * @param {string} ipfsHash - Hash to unpin
     * @returns {Promise<boolean>} Success status
     */
    async unpinData(ipfsHash) {
        try {
            if (!this.pinataApiKey || !this.pinataSecretKey) {
                console.log('📌 Unpinning skipped (no Pinata credentials)');
                return true;
            }

            const response = await fetch(`${this.pinataApiUrl}/pinning/unpin/${ipfsHash}`, {
                method: 'DELETE',
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });

            if (response.ok) {
                console.log('📌 Data unpinned successfully');
                return true;
            } else {
                console.warn('⚠️ Unpinning failed:', response.statusText);
                return false;
            }

        } catch (error) {
            console.error('Unpinning error:', error);
            return false;
        }
    }

    /**
     * Get IPFS data statistics
     * @param {string} ipfsHash - IPFS hash
     * @returns {Promise<Object>} Data statistics
     */
    async getDataStats(ipfsHash) {
        try {
            // For mock IPFS, return basic stats
            if (ipfsHash.startsWith('Qm') && ipfsHash.length < 50) {
                const mockStorage = JSON.parse(localStorage.getItem('mockIPFS') || '{}');
                const data = mockStorage[ipfsHash];
                
                if (data) {
                    return {
                        hash: ipfsHash,
                        size: JSON.stringify(data).length,
                        timestamp: data.timestamp,
                        pinned: true,
                        gateways: ['mock-storage']
                    };
                }
            }

            // For real IPFS, we'd query the network
            return {
                hash: ipfsHash,
                size: 'unknown',
                pinned: 'unknown',
                gateways: ['ipfs.io', 'gateway.pinata.cloud']
            };

        } catch (error) {
            console.error('Stats retrieval error:', error);
            return null;
        }
    }

    /**
     * Validate IPFS hash format
     * @param {string} hash - Hash to validate
     * @returns {boolean} Valid or not
     */
    static isValidIPFSHash(hash) {
        if (!hash || typeof hash !== 'string') {
            return false;
        }

        // Basic IPFS hash validation (CIDv0 and CIDv1)
        const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
        const cidv1Regex = /^[a-z2-7]{59}$/;
        
        return cidv0Regex.test(hash) || cidv1Regex.test(hash);
    }

    /**
     * Clear mock IPFS storage (for testing)
     */
    clearMockStorage() {
        localStorage.removeItem('mockIPFS');
        console.log('🧹 Mock IPFS storage cleared');
    }
} 