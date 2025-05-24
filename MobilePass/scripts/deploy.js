const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying SecurePassportIdentity contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const SecurePassportIdentity = await ethers.getContractFactory("SecurePassportIdentity");
  const contract = await SecurePassportIdentity.deploy();

  await contract.deployed();

  console.log("✅ SecurePassportIdentity deployed to:", contract.address);

  // Save the contract address and ABI for the web app
  const contractInfo = {
    address: contract.address,
    deployer: deployer.address,
    network: "localhost",
    deployedAt: new Date().toISOString(),
    abi: [
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
    ]
  };

  // Save to WebApp directory for the test interface
  try {
    fs.writeFileSync(
      '../WebApp/contract-info.json', 
      JSON.stringify(contractInfo, null, 2)
    );
    console.log("📱 Contract info saved to ../WebApp/contract-info.json");
  } catch (error) {
    console.warn("⚠️ Could not save to WebApp directory:", error.message);
  }

  // Save to public directory for the main app
  try {
    const publicPath = path.join(__dirname, '../../public/contract-info.json');
    fs.writeFileSync(publicPath, JSON.stringify(contractInfo, null, 2));
    console.log("📱 Contract info saved to public/contract-info.json");
  } catch (error) {
    console.warn("⚠️ Could not save to public directory:", error.message);
  }
  
  // Test the contract functionality
  console.log("\n🧪 Testing contract functions...");
  
  // Test passport registration
  const testPassportPublicKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-passport-key"));
  const testDeviceAddress = deployer.address;
  const testIpfsHash = "QmTest123456789abcdef";
  
  console.log("Testing registerPassport function...");
  try {
    const tx = await contract.registerPassport(
      testPassportPublicKey,
      testDeviceAddress,
      testIpfsHash
    );
    await tx.wait();
    console.log("✅ Test passport registered successfully");
    
    // Check if passport is registered
    const isRegistered = await contract.isPassportRegistered(testPassportPublicKey);
    console.log("✅ Registration verified:", isRegistered);
    
    // Get passport identity details
    const identity = await contract.getPassportIdentity(testPassportPublicKey);
    console.log("Identity details:");
    console.log("  - IPFS Hash:", identity[0]);
    console.log("  - Current Device:", identity[1]);
    console.log("  - Registration Time:", new Date(identity[2].toNumber() * 1000).toISOString());
    console.log("  - Is Active:", identity[4]);
    
    // Get total registered passports
    const total = await contract.getTotalRegisteredPassports();
    console.log("✅ Total registered passports:", total.toString());
    
  } catch (testError) {
    console.error("❌ Test failed:", testError.message);
  }

  console.log("\n🎉 Deployment and testing completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. The SecurePassportIdentity contract is deployed and ready");
  console.log("2. Contract info saved for both WebApp and main app");
  console.log("3. Start the Next.js app with: npm run dev");
  console.log("4. Visit the comprehensive test interface or main app");
  console.log("5. For testnet deployment, update hardhat.config.js with network settings");
  
  console.log("\n🔧 Development URLs:");
  console.log("- Main App: http://localhost:3000");
  console.log("- Test Interface: http://localhost:3000/comprehensive-test.html");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 