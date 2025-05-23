const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityVerification", function () {
    let IdentityVerification;
    let identityVerification;
    let owner;
    let teeVerifier;
    let user;
    let identityHash;
    let signature;

    beforeEach(async function () {
        // Get signers
        [owner, teeVerifier, user] = await ethers.getSigners();

        // Deploy contract
        IdentityVerification = await ethers.getContractFactory("IdentityVerification");
        identityVerification = await IdentityVerification.deploy(teeVerifier.address);
        await identityVerification.deployed();

        // Create a mock identity hash
        identityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-identity"));
        
        // Create a signature that matches the contract's verification logic
        signature = await teeVerifier.signMessage(ethers.utils.arrayify(identityHash));
    });

    describe("Deployment", function () {
        it("Should set the correct teeVerifier address", async function () {
            expect(await identityVerification.teeVerifier()).to.equal(teeVerifier.address);
        });
    });

    describe("Identity Verification", function () {
        it("Should verify identity with valid signature", async function () {
            await identityVerification.connect(teeVerifier).verifyIdentity(
                user.address,
                identityHash,
                signature
            );

            const identity = await identityVerification.identities(user.address);
            expect(identity.isVerified).to.be.true;
            expect(identity.identityHash).to.equal(identityHash);
        });

        it("Should prevent reuse of passport hash", async function () {
            await identityVerification.connect(teeVerifier).verifyIdentity(
                user.address,
                identityHash,
                signature
            );

            await expect(
                identityVerification.connect(teeVerifier).verifyIdentity(
                    user.address,
                    identityHash,
                    signature
                )
            ).to.be.revertedWith("Passport already used");
        });

        it("Should allow identity revocation by owner", async function () {
            await identityVerification.connect(teeVerifier).verifyIdentity(
                user.address,
                identityHash,
                signature
            );

            await identityVerification.connect(owner).revokeIdentity(user.address);
            const identity = await identityVerification.identities(user.address);
            expect(identity.isVerified).to.be.false;
        });

        it("Should prevent non-owner from revoking identity", async function () {
            await identityVerification.connect(teeVerifier).verifyIdentity(
                user.address,
                identityHash,
                signature
            );

            await expect(
                identityVerification.connect(user).revokeIdentity(user.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
}); 