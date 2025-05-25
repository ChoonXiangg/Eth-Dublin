'use client';

/**
 * PassportService - Handles passport scanning, key generation, and cryptographic operations
 */
export class PassportService {
    /**
     * Generate passport key pair from scanned passport data
     * @param {Object} passportData - Scanned passport information
     * @returns {Promise<Object>} { publicKey, privateKey, publicKeyHash }
     */
    static async generatePassportKeys(passportData) {
        try {
            // Create deterministic seed from passport MRZ data
            const mrzData = `${passportData.documentNumber}${passportData.nationality}${passportData.dateOfBirth}${passportData.dateOfExpiry}`;
            
            // Use browser crypto API
            const encoder = new TextEncoder();
            const data = encoder.encode(mrzData);
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            
            // Generate mock key pair for browser environment
            const privateKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const publicKey = hashArray.reverse().map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Generate public key hash for on-chain storage (full 32 bytes)
            const publicKeyHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return {
                publicKey,
                privateKey,
                publicKeyHash
            };
        } catch (error) {
            console.error('Error generating passport keys:', error);
            throw new Error('Failed to generate passport keys');
        }
    }

    /**
     * Simulate passport scanning (accepts dummy input)
     * @param {string} passportType - Type of passport to simulate
     * @returns {Object} Scanned passport data
     */
    static simulatePassportScan(passportType = 'US_PASSPORT_001') {
        const dummyPassports = {
            'US_PASSPORT_001': {
                documentNumber: 'PA123456789',
                nationality: 'USA',
                firstName: 'JOHN',
                lastName: 'DOE',
                fullName: 'JOHN MICHAEL DOE',
                dateOfBirth: '1990-05-15',
                dateOfExpiry: '2032-03-10',
                sex: 'M',
                issuingCountry: 'USA',
                issuingAuthority: 'US Department of State',
                placeOfBirth: 'New York, NY',
                mrzLine1: 'P<USADOE<<JOHN<MICHAEL<<<<<<<<<<<<<<<<<<<<<<<',
                mrzLine2: 'PA1234567892USA9005155M3203106<<<<<<<<<<<<<<<8',
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...' // Base64 photo
            },
            'UK_PASSPORT_001': {
                documentNumber: 'PB987654321',
                nationality: 'GBR',
                firstName: 'EMMA',
                lastName: 'JOHNSON',
                fullName: 'EMMA ANNE JOHNSON',
                dateOfBirth: '1990-03-22',
                dateOfExpiry: '2029-03-22',
                sex: 'F',
                issuingCountry: 'GBR',
                issuingAuthority: 'HM Passport Office',
                placeOfBirth: 'London, UK',
                mrzLine1: 'P<GBRJOHNSON<<EMMA<ANNE<<<<<<<<<<<<<<<<<<<<<<',
                mrzLine2: 'PB9876543211GBR9003225F2903226<<<<<<<<<<<<<<<4',
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
            },
            'GERMAN_PASSPORT_001': {
                documentNumber: 'PC456789123',
                nationality: 'DEU',
                firstName: 'HANS',
                lastName: 'MUELLER',
                fullName: 'HANS FREDERICK MUELLER',
                dateOfBirth: '1982-11-08',
                dateOfExpiry: '2031-11-08',
                sex: 'M',
                issuingCountry: 'DEU',
                issuingAuthority: 'Bundesdruckerei GmbH',
                placeOfBirth: 'Berlin, Germany',
                mrzLine1: 'P<DEUMUELLER<<HANS<FREDERICK<<<<<<<<<<<<<<<<<<<',
                mrzLine2: 'PC4567891232DEU8211085M3111086<<<<<<<<<<<<<<<2',
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
            },
            'CANADIAN_PASSPORT_001': {
                documentNumber: 'PD555888777',
                nationality: 'CAN',
                firstName: 'SARAH',
                lastName: 'SMITH',
                fullName: 'SARAH ELIZABETH SMITH',
                dateOfBirth: '1988-12-03',
                dateOfExpiry: '2030-12-03',
                sex: 'F',
                issuingCountry: 'CAN',
                issuingAuthority: 'Passport Canada',
                placeOfBirth: 'Toronto, ON',
                mrzLine1: 'P<CANSMITH<<SARAH<ELIZABETH<<<<<<<<<<<<<<<<<<<',
                mrzLine2: 'PD5558887773CAN8812035F3012036<<<<<<<<<<<<<<<5',
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
            },
            'JAPANESE_PASSPORT_001': {
                documentNumber: 'PE999222111',
                nationality: 'JPN',
                firstName: 'YUKI',
                lastName: 'TANAKA',
                fullName: 'YUKI TANAKA',
                dateOfBirth: '1995-07-20',
                dateOfExpiry: '2033-07-20',
                sex: 'F',
                issuingCountry: 'JPN',
                issuingAuthority: 'Ministry of Foreign Affairs',
                placeOfBirth: 'Tokyo, Japan',
                mrzLine1: 'P<JPNTANAKA<<YUKI<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
                mrzLine2: 'PE9992221115JPN9507205F3307206<<<<<<<<<<<<<<<7',
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
            },
            'FRENCH_PASSPORT_001': {
                documentNumber: 'PF777444333',
                nationality: 'FRA',
                firstName: 'PIERRE',
                lastName: 'DUPONT',
                fullName: 'PIERRE ALEXANDRE DUPONT',
                dateOfBirth: '1987-01-15',
                dateOfExpiry: '2032-01-15',
                sex: 'M',
                issuingCountry: 'FRA',
                issuingAuthority: 'Prefecture de Police',
                placeOfBirth: 'Paris, France',
                mrzLine1: 'P<FRADUPONT<<PIERRE<ALEXANDRE<<<<<<<<<<<<<<<<<<<',
                mrzLine2: 'PF7774443332FRA8701155M3201156<<<<<<<<<<<<<<<9',
                photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
            }
        };

        const passport = dummyPassports[passportType];
        if (!passport) {
            throw new Error(`Unknown passport type: ${passportType}`);
        }

        // Simulate scanning delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ...passport,
                    scanTimestamp: new Date().toISOString(),
                    scanMethod: 'DUMMY_SIMULATION'
                });
            }, 2000); // 2 second scan simulation
        });
    }

    /**
     * Validate passport data structure
     * @param {Object} passportData - Passport data to validate
     * @returns {boolean} Valid or not
     */
    static validatePassportData(passportData) {
        const requiredFields = [
            'documentNumber', 'nationality', 'firstName', 'lastName',
            'dateOfBirth', 'dateOfExpiry', 'sex', 'issuingCountry'
        ];

        for (const field of requiredFields) {
            if (!passportData[field]) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }

        // Validate document number format
        if (!/^[A-Z]{1,2}[0-9]{6,9}$/.test(passportData.documentNumber)) {
            console.error('Invalid document number format');
            return false;
        }

        // Validate date formats
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(passportData.dateOfBirth) || !dateRegex.test(passportData.dateOfExpiry)) {
            console.error('Invalid date format');
            return false;
        }

        // Check if passport is not expired
        const expiryDate = new Date(passportData.dateOfExpiry);
        if (expiryDate < new Date()) {
            console.error('Passport has expired');
            return false;
        }

        return true;
    }

    /**
     * Extract passport data from MRZ lines
     * @param {string} mrzLine1 - First MRZ line
     * @param {string} mrzLine2 - Second MRZ line
     * @returns {Object} Extracted passport data
     */
    static extractFromMRZ(mrzLine1, mrzLine2) {
        try {
            // Parse MRZ Line 1: P<USADOE<<JOHN<MICHAEL<<<<<<<<<<<<<<<<<<<<<<<
            const documentType = mrzLine1.substring(0, 1);
            const issuingCountry = mrzLine1.substring(2, 5);
            const nameSection = mrzLine1.substring(5).replace(/</g, ' ').trim();
            const nameParts = nameSection.split('  '); // Double space separates last and first names
            const lastName = nameParts[0]?.trim();
            const firstName = nameParts[1]?.trim();

            // Parse MRZ Line 2: PA1234567892USA9005155M3203106<<<<<<<<<<<<<<<8
            const documentNumber = mrzLine2.substring(0, 9).replace(/</g, '');
            const nationality = mrzLine2.substring(10, 13);
            const dateOfBirth = `20${mrzLine2.substring(13, 15)}-${mrzLine2.substring(15, 17)}-${mrzLine2.substring(17, 19)}`;
            const sex = mrzLine2.substring(20, 21);
            const dateOfExpiry = `20${mrzLine2.substring(21, 23)}-${mrzLine2.substring(23, 25)}-${mrzLine2.substring(25, 27)}`;

            return {
                documentType,
                documentNumber,
                issuingCountry,
                nationality,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                dateOfBirth,
                dateOfExpiry,
                sex,
                mrzLine1,
                mrzLine2
            };
        } catch (error) {
            console.error('Error extracting MRZ data:', error);
            throw new Error('Failed to extract passport data from MRZ');
        }
    }

    /**
     * Get available dummy passports for testing
     * @returns {Array} List of available passport types
     */
    static getAvailablePassportTypes() {
        return [
            { id: 'US_PASSPORT_001', name: '🇺🇸 US Passport - John Doe', country: 'USA', displayName: 'John Michael Doe (USA)' },
            { id: 'UK_PASSPORT_001', name: '🇬🇧 UK Passport - Emma Johnson', country: 'GBR', displayName: 'Emma Anne Johnson (UK)' },
            { id: 'GERMAN_PASSPORT_001', name: '🇩🇪 German Passport - Hans Mueller', country: 'DEU', displayName: 'Hans Frederick Mueller (Germany)' },
            { id: 'CANADIAN_PASSPORT_001', name: '🇨🇦 Canadian Passport - Sarah Smith', country: 'CAN', displayName: 'Sarah Elizabeth Smith (Canada)' },
            { id: 'JAPANESE_PASSPORT_001', name: '🇯🇵 Japanese Passport - Yuki Tanaka', country: 'JPN', displayName: 'Yuki Tanaka (Japan)' },
            { id: 'FRENCH_PASSPORT_001', name: '🇫🇷 French Passport - Pierre Dupont', country: 'FRA', displayName: 'Pierre Alexandre Dupont (France)' }
        ];
    }
} 