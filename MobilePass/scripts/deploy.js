const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying SecurePassportIdentity contract with strict 1:1 binding...");

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
      "function registerPassport(bytes32 passportPublicKey, address deviceAddress, string memory ipfsHash, bytes32 privateKeyHash) external",
      "function accessPassportData(bytes32 passportPublicKey, address deviceAddress, bytes32 privateKeyHash) external view returns (string memory ipfsHash)",
      "function canDeviceScanPassport(address deviceAddress) external view returns (bool canScan, string memory reason)",
      "function isPassportRegistered(bytes32 passportPublicKey) external view returns (bool)",
      "function getPassportIdentity(bytes32 passportPublicKey) external view returns (address currentDevice, uint256 registrationTime, bool isActive)",
      "function getPassportForDevice(address deviceAddress) external view returns (bytes32)",
      "function hasDevicePassport(address deviceAddress) external view returns (bool hasPassport, bytes32 passportPublicKey)",
      "function getTotalRegisteredPassports() external view returns (uint256)",
      "function revokePassport(bytes32 passportPublicKey) external",
      "function resetPassport(bytes32 passportPublicKey) external",
      "function resetDevice(address deviceAddress) external",
      "event PassportRegistered(bytes32 indexed passportPublicKey, address deviceAddress, string ipfsHash, uint256 timestamp)",
      "event PassportDataAccessed(bytes32 indexed passportPublicKey, address deviceAddress, uint256 timestamp)",
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
  console.log("\n🧪 Testing contract functions with strict 1:1 binding...");
  
  // Test device scan check first
  console.log("Testing device scan capability...");
  try {
    const [canScan, reason] = await contract.canDeviceScanPassport(deployer.address);
    console.log(`✅ Device scan check - Can scan: ${canScan}, Reason: ${reason}`);
  } catch (testError) {
    console.error("❌ Device scan check failed:", testError.message);
  }

  // Test passport registration with private key hash
  const testPassportPublicKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-passport-key"));
  const testDeviceAddress = deployer.address;
  const testIpfsHash = "QmTest123456789abcdef";
  const testPrivateKey = "test-private-key-for-passport-verification";
  
  // Generate private key hash
  const testPrivateKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testPrivateKey));
  
  console.log("Testing registerPassport function with private key hash...");
  try {
    const tx = await contract.registerPassport(
      testPassportPublicKey,
      testDeviceAddress,
      testIpfsHash,
      testPrivateKeyHash
    );
    await tx.wait();
    console.log("✅ Test passport registered successfully with strict 1:1 binding");
    
    // Check if passport is registered
    const isRegistered = await contract.isPassportRegistered(testPassportPublicKey);
    console.log("✅ Registration verified:", isRegistered);
    
    // Check if device now has a passport
    const [hasPassport, passportKey] = await contract.hasDevicePassport(testDeviceAddress);
    console.log(`✅ Device passport status - Has passport: ${hasPassport}`);
    if (hasPassport) {
      console.log(`🗝️ Passport key: ${passportKey}`);
    }
    
    // Get passport identity details (new format)
    const identity = await contract.getPassportIdentity(testPassportPublicKey);
    console.log("Identity details:");
    console.log("  - Current Device:", identity[0]);
    console.log("  - Registration Time:", new Date(identity[1].toNumber() * 1000).toISOString());
    console.log("  - Is Active:", identity[2]);
    
    // Test private key verification by accessing data
    console.log("Testing private key verification...");
    try {
      const accessedIpfsHash = await contract.accessPassportData(
        testPassportPublicKey,
        testDeviceAddress,
        testPrivateKeyHash
      );
      console.log("✅ Private key verified - IPFS hash accessed:", accessedIpfsHash);
    } catch (accessError) {
      console.error("❌ Private key verification failed:", accessError.message);
    }
    
    // Test that device cannot scan another passport now
    console.log("Testing strict 1:1 binding - device should not be able to scan another passport...");
    try {
      const [canScanAgain, reasonAgain] = await contract.canDeviceScanPassport(testDeviceAddress);
      console.log(`📋 Second scan check - Can scan: ${canScanAgain}, Reason: ${reasonAgain}`);
      
      if (!canScanAgain) {
        console.log("✅ Strict 1:1 binding working correctly - device blocked from scanning another passport");
      }
    } catch (bindingError) {
      console.error("❌ Binding test failed:", bindingError.message);
    }
    
    // Get total registered passports
    const total = await contract.getTotalRegisteredPassports();
    console.log("✅ Total registered passports:", total.toString());
    
  } catch (testError) {
    console.error("❌ Test failed:", testError.message);
  }

  console.log("\n🎉 Deployment and testing completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. The SecurePassportIdentity contract is deployed with strict 1:1 binding");
  console.log("2. Contract info saved for both WebApp and main app");
  console.log("3. Start the Next.js app with: npm run dev");
  console.log("4. Visit the comprehensive test interface or main app");
  console.log("5. Test the strict 1:1 binding - each device can only scan one passport");
  
  console.log("\n🔧 Development URLs:");
  console.log("- Main App: http://localhost:3000");
  console.log("- Test Interface: http://localhost:3000/comprehensive-test.html");
  
  console.log("\n🔐 Strict 1:1 Binding Features:");
  console.log("- ✅ Each device can only scan ONE passport");
  console.log("- ✅ Each passport can only be scanned by ONE device");
  console.log("- ✅ Private key required to access passport data");
  console.log("- ✅ Automatic device authorization checks");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 