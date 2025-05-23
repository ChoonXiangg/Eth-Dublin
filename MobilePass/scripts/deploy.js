const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const IdentityVerification = await hre.ethers.getContractFactory("IdentityVerification");

    // Get the TEE verifier address from environment or use a placeholder
    // In production, this should be the actual TEE verifier address
    const teeVerifierAddress = process.env.TEE_VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000000";

    // Deploy the contract
    const identityVerification = await IdentityVerification.deploy(teeVerifierAddress);

    // Wait for deployment to finish
    await identityVerification.deployed();

    console.log("IdentityVerification deployed to:", identityVerification.address);
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 