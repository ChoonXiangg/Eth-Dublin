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
        bool isActive;
        bytes32 privateKeyHash;       // Hash of passport private key for verification
    }

    // Mapping from passport public key to identity
    mapping(bytes32 => PassportIdentity) public passportIdentities;
    
    // Mapping from device address to passport public key (1:1 binding)
    mapping(address => bytes32) public deviceToPassport;
    
    // Track all registered passport public keys
    bytes32[] public registeredPassports;

    // Events
    event PassportRegistered(bytes32 indexed passportPublicKey, address deviceAddress, string ipfsHash, uint256 timestamp);
    event PassportDataAccessed(bytes32 indexed passportPublicKey, address deviceAddress, uint256 timestamp);
    event PassportRevoked(bytes32 indexed passportPublicKey, uint256 timestamp);

    /**
     * Register a new passport identity with strict 1:1 binding
     * @param passportPublicKey Unique public key derived from passport
     * @param deviceAddress TEE-attested device address
     * @param ipfsHash IPFS hash of encrypted passport data
     * @param privateKeyHash Hash of the passport private key for later verification
     */
    function registerPassport(
        bytes32 passportPublicKey,
        address deviceAddress,
        string memory ipfsHash,
        bytes32 privateKeyHash
    ) external nonReentrant {
        require(passportPublicKey != bytes32(0), "Invalid passport public key");
        require(deviceAddress != address(0), "Invalid device address");
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(privateKeyHash != bytes32(0), "Invalid private key hash");
        
        // STRICT 1:1 BINDING CHECKS
        require(!passportIdentities[passportPublicKey].isActive, "Passport already registered by another device");
        require(deviceToPassport[deviceAddress] == bytes32(0), "Device already linked to another passport");

        passportIdentities[passportPublicKey] = PassportIdentity({
            passportPublicKey: passportPublicKey,
            ipfsHash: ipfsHash,
            currentDevice: deviceAddress,
            registrationTime: block.timestamp,
            isActive: true,
            privateKeyHash: privateKeyHash
        });

        deviceToPassport[deviceAddress] = passportPublicKey;
        registeredPassports.push(passportPublicKey);

        emit PassportRegistered(passportPublicKey, deviceAddress, ipfsHash, block.timestamp);
    }

    /**
     * Access passport data - requires private key verification
     * @param passportPublicKey The passport to access
     * @param deviceAddress The device requesting access
     * @param privateKeyHash Hash of the provided private key
     * @return ipfsHash The IPFS hash containing encrypted passport data
     */
    function accessPassportData(
        bytes32 passportPublicKey,
        address deviceAddress,
        bytes32 privateKeyHash
    ) external view returns (string memory ipfsHash) {
        require(passportIdentities[passportPublicKey].isActive, "Passport not registered");
        require(passportIdentities[passportPublicKey].currentDevice == deviceAddress, "Device not authorized for this passport");
        require(passportIdentities[passportPublicKey].privateKeyHash == privateKeyHash, "Invalid private key - access denied");

        return passportIdentities[passportPublicKey].ipfsHash;
    }

    /**
     * Verify if device can scan a new passport (for UI validation)
     */
    function canDeviceScanPassport(address deviceAddress) external view returns (bool canScan, string memory reason) {
        if (deviceToPassport[deviceAddress] != bytes32(0)) {
            return (false, "Device already linked to another passport");
        }
        return (true, "Device can scan a new passport");
    }

    /**
     * Check if a passport public key is already registered
     */
    function isPassportRegistered(bytes32 passportPublicKey) external view returns (bool) {
        return passportIdentities[passportPublicKey].isActive;
    }

    /**
     * Get basic passport identity details (without private data)
     */
    function getPassportIdentity(bytes32 passportPublicKey) external view returns (
        address currentDevice,
        uint256 registrationTime,
        bool isActive
    ) {
        PassportIdentity memory identity = passportIdentities[passportPublicKey];
        return (
            identity.currentDevice,
            identity.registrationTime,
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
     * Check if a device has an existing passport registration
     */
    function hasDevicePassport(address deviceAddress) external view returns (bool hasPassport, bytes32 passportPublicKey) {
        bytes32 passport = deviceToPassport[deviceAddress];
        return (passport != bytes32(0), passport);
    }

    /**
     * Revoke a passport (admin only) - breaks the 1:1 binding
     */
    function revokePassport(bytes32 passportPublicKey) external onlyOwner {
        require(passportIdentities[passportPublicKey].isActive, "Passport not active");
        
        PassportIdentity storage identity = passportIdentities[passportPublicKey];
        address deviceAddress = identity.currentDevice;
        
        // Clear mappings to allow device to scan new passport
        delete deviceToPassport[deviceAddress];
        identity.isActive = false;

        emit PassportRevoked(passportPublicKey, block.timestamp);
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

    /**
     * Reset device binding (admin only) - allows device to scan new passport
     */
    function resetDevice(address deviceAddress) external onlyOwner {
        bytes32 passportKey = deviceToPassport[deviceAddress];
        if (passportKey != bytes32(0)) {
            passportIdentities[passportKey].isActive = false;
            delete deviceToPassport[deviceAddress];
        }
    }
} 