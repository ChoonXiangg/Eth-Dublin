// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IdentityVerification is Ownable, ReentrancyGuard {
    struct Identity {
        bytes32 identityHash;
        uint256 verificationTimestamp;
        bool isVerified;
        address verifier;
    }

    // Mapping from user address to their identity information
    mapping(address => Identity) public identities;
    
    // Mapping to track used passport hashes to prevent reuse
    mapping(bytes32 => bool) public usedPassportHashes;

    // Events
    event IdentityVerified(address indexed user, bytes32 identityHash, uint256 timestamp);
    event IdentityRevoked(address indexed user, uint256 timestamp);

    // TEE public key for verification
    address public teeVerifier;

    constructor(address _teeVerifier) {
        teeVerifier = _teeVerifier;
    }

    function verifyIdentity(
        address user,
        bytes32 identityHash,
        bytes memory signature
    ) external nonReentrant {
        require(!usedPassportHashes[identityHash], "Passport already used");
        require(verifySignature(identityHash, signature), "Invalid signature");

        identities[user] = Identity({
            identityHash: identityHash,
            verificationTimestamp: block.timestamp,
            isVerified: true,
            verifier: msg.sender
        });

        usedPassportHashes[identityHash] = true;
        emit IdentityVerified(user, identityHash, block.timestamp);
    }

    function revokeIdentity(address user) external onlyOwner {
        require(identities[user].isVerified, "Identity not verified");
        
        identities[user].isVerified = false;
        emit IdentityRevoked(user, block.timestamp);
    }

    function verifySignature(bytes32 hash, bytes memory signature) internal view returns (bool) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        return signer == teeVerifier;
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function isIdentityVerified(address user) external view returns (bool) {
        return identities[user].isVerified;
    }
} 