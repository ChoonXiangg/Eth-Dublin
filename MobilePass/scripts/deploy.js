const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying IdentityVerification contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // For now, we'll use the deployer as the TEE verifier
  // In production, this would be the actual TEE's public key/address
  const teeVerifierAddress = deployer.address;
  console.log("TEE Verifier address:", teeVerifierAddress);

  // Deploy the contract
  const IdentityVerification = await ethers.getContractFactory("IdentityVerification");
  const identityVerification = await IdentityVerification.deploy(teeVerifierAddress);

  await identityVerification.deployed();

  console.log("✅ IdentityVerification deployed to:", identityVerification.address);
  console.log("🔑 TEE Verifier set to:", teeVerifierAddress);

  // Save the contract address and ABI for the mobile app
  const fs = require('fs');
  const contractInfo = {
    address: identityVerification.address,
    deployer: deployer.address,
    teeVerifier: teeVerifierAddress,
    network: "localhost", // Change this when deploying to testnets
    deployedAt: new Date().toISOString(),
    abi: [
      "function verifyIdentity(address user, bytes32 identityHash, bytes signature) external",
      "function revokeIdentity(address user) external",
      "function isIdentityVerified(address user) external view returns (bool)",
      "function identities(address user) external view returns (bytes32, uint256, bool, address)"
    ]
  };

  // Save to WebApp directory  fs.writeFileSync(    '../WebApp/contract-info.json',     JSON.stringify(contractInfo, null, 2)  );  console.log("📱 Contract info saved to ../WebApp/contract-info.json");
  
  // Test the contract
  console.log("\n🧪 Testing contract functions...");
  
  // Test identity verification
  const testIdentityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-identity"));
  const testSignature = await deployer.signMessage(ethers.utils.arrayify(testIdentityHash));
  
  console.log("Testing verifyIdentity function...");
  const tx = await identityVerification.verifyIdentity(
    deployer.address,
    testIdentityHash,
    testSignature
  );
  await tx.wait();
  
  // Check if identity is verified
  const isVerified = await identityVerification.isIdentityVerified(deployer.address);
  console.log("✅ Test identity verified:", isVerified);
  
  // Get identity details
  const identity = await identityVerification.identities(deployer.address);
  console.log("Identity details:");
  console.log("  - Hash:", identity[0]);
  console.log("  - Timestamp:", new Date(identity[1].toNumber() * 1000).toISOString());
  console.log("  - Is Verified:", identity[2]);
  console.log("  - Verifier:", identity[3]);

  console.log("\n🎉 Deployment and testing completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. The contract is deployed and ready");
  console.log("2. Contract info saved to ../WebApp/contract-info.json");
  console.log("3. You can now test with real blockchain interactions");
  console.log("4. For testnet deployment, update hardhat.config.js with network settings");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 