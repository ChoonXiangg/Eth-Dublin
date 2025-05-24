// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecurePassportIdentity is Ownable, ReentrancyGuard {
    struct PassportIdentity {
        bytes32 passportPublicKey;    // Unique passport public key (identity anchor)
        string ipfsHash;              // Current IPFS hash of encrypted data
        address currentDevice;        // Current device address (from TEE)
        uint256 registrationTime;
        uint256 lastMigrationTime;
        bool isActive;
    }

    // Mapping from passport public key to identity
    mapping(bytes32 => PassportIdentity) public passportIdentities;
    
    // Mapping from device address to passport public key
    mapping(address => bytes32) public deviceToPassport;
    
    // Track all registered passport public keys
    bytes32[] public registeredPassports;

    // Events
    event PassportRegistered(bytes32 indexed passportPublicKey, address deviceAddress, string ipfsHash, uint256 timestamp);
    event PassportMigrated(bytes32 indexed passportPublicKey, address oldDevice, address newDevice, string newIpfsHash, uint256 timestamp);
    event PassportRevoked(bytes32 indexed passportPublicKey, uint256 timestamp);

    /**
     * Register a new passport identity
     * @param passportPublicKey Unique public key derived from passport
     * @param deviceAddress TEE-attested device address
     * @param ipfsHash IPFS hash of encrypted passport data
     */
    function registerPassport(
        bytes32 passportPublicKey,
        address deviceAddress,
        string memory ipfsHash
    ) external nonReentrant {
        require(passportPublicKey != bytes32(0), "Invalid passport public key");
        require(deviceAddress != address(0), "Invalid device address");
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(!passportIdentities[passportPublicKey].isActive, "Passport already registered");
        require(deviceToPassport[deviceAddress] == bytes32(0), "Device already linked to passport");

        passportIdentities[passportPublicKey] = PassportIdentity({
            passportPublicKey: passportPublicKey,
            ipfsHash: ipfsHash,
            currentDevice: deviceAddress,
            registrationTime: block.timestamp,
            lastMigrationTime: block.timestamp,
            isActive: true
        });

        deviceToPassport[deviceAddress] = passportPublicKey;
        registeredPassports.push(passportPublicKey);

        emit PassportRegistered(passportPublicKey, deviceAddress, ipfsHash, block.timestamp);
    }

    /**
     * Migrate passport to new device
     * @param passportPublicKey The passport to migrate
     * @param newDeviceAddress New TEE-attested device address
     * @param newIpfsHash New IPFS hash with re-encrypted data
     * @param migrationSignature Signature proving ownership of passport private key
     */
    function migratePassport(
        bytes32 passportPublicKey,
        address newDeviceAddress,
        string memory newIpfsHash,
        bytes memory migrationSignature
    ) external nonReentrant {
        require(passportIdentities[passportPublicKey].isActive, "Passport not registered");
        require(newDeviceAddress != address(0), "Invalid new device address");
        require(bytes(newIpfsHash).length > 0, "Invalid IPFS hash");
        require(deviceToPassport[newDeviceAddress] == bytes32(0), "New device already linked");
        
        // Verify migration signature (proves ownership of passport private key)
        require(verifyMigrationSignature(passportPublicKey, newDeviceAddress, migrationSignature), "Invalid migration signature");

        PassportIdentity storage identity = passportIdentities[passportPublicKey];
        address oldDevice = identity.currentDevice;

        // Clear old device mapping
        delete deviceToPassport[oldDevice];

        // Update to new device and IPFS hash
        identity.currentDevice = newDeviceAddress;
        identity.ipfsHash = newIpfsHash;
        identity.lastMigrationTime = block.timestamp;
        
        // Set new device mapping
        deviceToPassport[newDeviceAddress] = passportPublicKey;

        emit PassportMigrated(passportPublicKey, oldDevice, newDeviceAddress, newIpfsHash, block.timestamp);
    }

    /**
     * Check if a passport public key is already registered
     */
    function isPassportRegistered(bytes32 passportPublicKey) external view returns (bool) {
        return passportIdentities[passportPublicKey].isActive;
    }

    /**
     * Get passport identity details
     */
    function getPassportIdentity(bytes32 passportPublicKey) external view returns (
        string memory ipfsHash,
        address currentDevice,
        uint256 registrationTime,
        uint256 lastMigrationTime,
        bool isActive
    ) {
        PassportIdentity memory identity = passportIdentities[passportPublicKey];
        return (
            identity.ipfsHash,
            identity.currentDevice,
            identity.registrationTime,
            identity.lastMigrationTime,
            identity.isActive
        );
    }

    /**
     * Get passport public key for a device
     */
    function getPassportForDevice(address deviceAddress) external view returns (bytes32) {
        return deviceToPassport[deviceAddress];
    }

    /**
     * Get total number of registered passports
     */
    function getTotalRegisteredPassports() external view returns (uint256) {
        return registeredPassports.length;
    }

    /**
     * Revoke a passport (admin only)
     */
    function revokePassport(bytes32 passportPublicKey) external onlyOwner {
        require(passportIdentities[passportPublicKey].isActive, "Passport not active");
        
        PassportIdentity storage identity = passportIdentities[passportPublicKey];
        address deviceAddress = identity.currentDevice;
        
        // Clear mappings
        delete deviceToPassport[deviceAddress];
        identity.isActive = false;

        emit PassportRevoked(passportPublicKey, block.timestamp);
    }

    /**
     * Verify migration signature (placeholder - implement actual signature verification)
     */
    function verifyMigrationSignature(
        bytes32 passportPublicKey,
        address newDeviceAddress,
        bytes memory signature
    ) internal pure returns (bool) {
        // TODO: Implement actual signature verification using passport private key
        // For now, return true for development
        return signature.length > 0;
    }

    /**
     * Emergency reset for testing (admin only)
     */
    function resetPassport(bytes32 passportPublicKey) external onlyOwner {
        PassportIdentity storage identity = passportIdentities[passportPublicKey];
        if (identity.currentDevice != address(0)) {
            delete deviceToPassport[identity.currentDevice];
        }
        delete passportIdentities[passportPublicKey];
    }
} 