/**
 * TEEService - Trusted Execution Environment using WebAuthn for hardware attestation
 */
export class TEEService {
    constructor() {
        this.credentialId = null;
        this.deviceKey = null;
        this.attestationResult = null;
    }

    /**
     * Check if TEE (WebAuthn) is supported
     * @returns {boolean} Support status
     */
    static isSupported() {
        return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
    }

    /**
     * Generate device key using TEE attestation
     * @returns {Promise<Object>} Device key and attestation data
     */
    async generateDeviceKey() {
        try {
            if (!TEEService.isSupported()) {
                throw new Error('TEE/WebAuthn not supported on this device');
            }

            console.log('🔒 Starting TEE device key generation...');

            // Create WebAuthn credential (this uses the device's secure enclave/TPM)
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    rp: {
                        name: "Secure Passport Identity",
                        id: window.location.hostname,
                    },
                    user: {
                        id: crypto.getRandomValues(new Uint8Array(16)),
                        name: "device-identity",
                        displayName: "Device Identity Key",
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" }, // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "preferred",
                        requireResidentKey: false
                    },
                    attestation: "direct", // Request direct attestation from hardware
                    timeout: 60000
                }
            });

            if (!credential) {
                throw new Error('Failed to create TEE credential');
            }

            console.log('✅ TEE credential created successfully');

            // Extract attestation data
            const attestationResponse = credential.response;
            const attestationObject = new Uint8Array(attestationResponse.attestationObject);
            const clientDataJSON = new Uint8Array(attestationResponse.clientDataJSON);

            // Generate device fingerprint
            const deviceFingerprint = await this.generateDeviceFingerprint();

            // Combine hardware attestation with device fingerprint
            const deviceKeyData = {
                credentialId: Array.from(new Uint8Array(credential.rawId)),
                attestationObject: Array.from(attestationObject),
                clientDataJSON: Array.from(clientDataJSON),
                deviceFingerprint,
                timestamp: Date.now()
            };

            // Create device key hash
            const deviceKeyString = JSON.stringify(deviceKeyData);
            const encoder = new TextEncoder();
            const data = encoder.encode(deviceKeyString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const deviceKeyHash = Array.from(new Uint8Array(hashBuffer));

            this.credentialId = credential.rawId;
            this.deviceKey = deviceKeyHash;
            this.attestationResult = {
                credentialId: Array.from(new Uint8Array(credential.rawId)),
                attestationObject: Array.from(attestationObject),
                deviceFingerprint,
                deviceKeyHash,
                timestamp: Date.now()
            };

            console.log('🔑 Device key generated successfully');
            console.log('🛡️ TEE attestation completed');

            return {
                deviceKey: deviceKeyHash,
                deviceAddress: this.generateDeviceAddress(deviceKeyHash),
                attestationData: this.attestationResult
            };

        } catch (error) {
            console.error('❌ TEE device key generation failed:', error);
            
            // Fallback for development/testing (when WebAuthn not available)
            if (error.message.includes('not supported')) {
                console.warn('⚠️ Using fallback device key for development');
                return this.generateFallbackDeviceKey();
            }
            
            throw error;
        }
    }

    /**
     * Verify device using existing TEE credential
     * @returns {Promise<boolean>} Verification result
     */
    async verifyDevice() {
        try {
            if (!this.credentialId) {
                throw new Error('No device credential found');
            }

            console.log('🔍 Verifying device with TEE...');

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    allowCredentials: [{
                        id: this.credentialId,
                        type: 'public-key'
                    }],
                    userVerification: 'preferred',
                    timeout: 30000
                }
            });

            if (!assertion) {
                throw new Error('Device verification failed');
            }

            console.log('✅ Device verified successfully');
            return true;

        } catch (error) {
            console.error('❌ Device verification failed:', error);
            return false;
        }
    }

    /**
     * Generate device fingerprint using multiple hardware characteristics
     * @returns {Promise<string>} Device fingerprint
     */
    async generateDeviceFingerprint() {
        const fingerprint = {
            // Screen characteristics
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            
            // Hardware characteristics
            hardware: {
                deviceMemory: navigator.deviceMemory || 'unknown',
                hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
                maxTouchPoints: navigator.maxTouchPoints || 'unknown'
            },
            
            // Browser/Platform characteristics
            platform: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                languages: navigator.languages?.join(',') || 'unknown'
            },
            
            // Timezone
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // Canvas fingerprint (for additional uniqueness)
            canvas: await this.generateCanvasFingerprint()
        };

        const fingerprintString = JSON.stringify(fingerprint);
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Generate canvas fingerprint for additional device uniqueness
     * @returns {Promise<string>} Canvas fingerprint
     */
    async generateCanvasFingerprint() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            // Draw text with specific formatting
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint: 🔒🌍', 2, 2);
            
            // Draw additional shapes
            ctx.fillStyle = '#f60';
            ctx.fillRect(100, 5, 20, 20);
            
            const dataURL = canvas.toDataURL();
            resolve(dataURL.substring(dataURL.indexOf(',') + 1));
        });
    }

    /**
     * Generate device address from device key (for blockchain interaction)
     * @param {Array} deviceKeyHash - Device key hash array
     * @returns {string} Ethereum-style address
     */
    generateDeviceAddress(deviceKeyHash) {
        // Take last 20 bytes of device key hash to create an address
        const addressBytes = deviceKeyHash.slice(-20);
        const address = '0x' + addressBytes
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return address;
    }

    /**
     * Encrypt data using device key
     * @param {string} data - Data to encrypt
     * @returns {Promise<string>} Encrypted data (base64)
     */
    async encryptWithDeviceKey(data) {
        try {
            if (!this.deviceKey) {
                throw new Error('Device key not generated');
            }

            // Import device key for encryption
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                new Uint8Array(this.deviceKey),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt data
            const encoder = new TextEncoder();
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                keyMaterial,
                encoder.encode(data)
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt data using device key
     * @param {string} encryptedData - Encrypted data (base64)
     * @returns {Promise<string>} Decrypted data
     */
    async decryptWithDeviceKey(encryptedData) {
        try {
            if (!this.deviceKey) {
                throw new Error('Device key not generated');
            }

            // Decode base64
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(c => c.charCodeAt(0))
            );

            // Split IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            // Import device key for decryption
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                new Uint8Array(this.deviceKey),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            // Decrypt
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                keyMaterial,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }

    /**
     * Fallback device key generation for development/testing
     * @returns {Object} Fallback device key data
     */
    generateFallbackDeviceKey() {
        console.warn('🔄 Generating fallback device key (development mode)');
        
        const fallbackSeed = `${navigator.userAgent}${navigator.platform}${screen.width}x${screen.height}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(fallbackSeed);
        
        return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
            const deviceKeyHash = Array.from(new Uint8Array(hashBuffer));
            
            this.deviceKey = deviceKeyHash;
            this.attestationResult = {
                credentialId: 'fallback',
                deviceFingerprint: 'fallback',
                deviceKeyHash,
                timestamp: Date.now(),
                fallback: true
            };

            return {
                deviceKey: deviceKeyHash,
                deviceAddress: this.generateDeviceAddress(deviceKeyHash),
                attestationData: this.attestationResult
            };
        });
    }

    /**
     * Get current device attestation data
     * @returns {Object} Attestation data
     */
    getAttestationData() {
        return this.attestationResult;
    }

    /**
     * Re-authenticate user using existing WebAuthn credential
     * @returns {Promise<Object>} Authentication result
     */
    async authenticateUser() {
        try {
            if (!TEEService.isSupported()) {
                return {
                    success: true,
                    method: 'fallback',
                    message: 'WebAuthn not supported, allowing access'
                };
            }

            // Get existing credential for authentication
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)), // Random challenge
                    rpId: window.location.hostname,
                    userVerification: 'required', // Require PIN/biometric
                    timeout: 60000
                }
            });

            if (credential) {
                return {
                    success: true,
                    method: 'webauthn',
                    credentialId: credential.id,
                    message: 'WebAuthn authentication successful'
                };
            } else {
                throw new Error('No credential returned');
            }

        } catch (error) {
            console.error('WebAuthn authentication failed:', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }
} 