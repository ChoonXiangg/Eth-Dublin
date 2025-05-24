#!/usr/bin/env node

/**
 * Comprehensive Test Setup Verification Script
 * Checks if all components are ready for the mock passport test
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive Test Setup Verification');
console.log('=' .repeat(50));

let allChecksPass = true;

// Check 1: Mock passport data file
console.log('\n📄 Checking mock passport data...');
try {
    const mockDataPath = path.join(__dirname, 'mock-passport-data.json');
    if (fs.existsSync(mockDataPath)) {
        const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
        const passportCount = mockData.testPassports ? mockData.testPassports.length : 0;
        console.log(`✅ Mock passport data found: ${passportCount} test passports available`);
        
        // Validate passport structure
        if (passportCount > 0) {
            const firstPassport = mockData.testPassports[0];
            const requiredFields = ['id', 'name', 'personalInfo', 'documentInfo', 'cryptographicData'];
            const hasAllFields = requiredFields.every(field => firstPassport.hasOwnProperty(field));
            
            if (hasAllFields) {
                console.log(`✅ Passport data structure is valid`);
            } else {
                console.log(`❌ Passport data structure is missing required fields`);
                allChecksPass = false;
            }
        }
    } else {
        console.log('❌ Mock passport data file not found');
        allChecksPass = false;
    }
} catch (error) {
    console.log(`❌ Error reading mock passport data: ${error.message}`);
    allChecksPass = false;
}

// Check 2: Contract info file
console.log('\n📄 Checking contract deployment info...');
try {
    const contractInfoPath = path.join(__dirname, 'contract-info.json');
    if (fs.existsSync(contractInfoPath)) {
        const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
        console.log(`✅ Contract info found`);
        console.log(`   - Address: ${contractInfo.address}`);
        console.log(`   - Network: ${contractInfo.network}`);
        console.log(`   - Deployed: ${contractInfo.deployedAt}`);
        
        if (contractInfo.address && contractInfo.abi && contractInfo.network) {
            console.log(`✅ Contract info is complete`);
        } else {
            console.log(`❌ Contract info is missing required fields`);
            allChecksPass = false;
        }
    } else {
        console.log('❌ Contract info file not found - please deploy the contract first');
        allChecksPass = false;
    }
} catch (error) {
    console.log(`❌ Error reading contract info: ${error.message}`);
    allChecksPass = false;
}

// Check 3: Service files
console.log('\n🔧 Checking service files...');
const serviceFiles = [
    'services/WalletService.ts',
    'services/NFCService.ts', 
    'services/TEEService.ts',
    'services/MockNFCService.ts'
];

serviceFiles.forEach(serviceFile => {
    const servicePath = path.join(__dirname, serviceFile);
    if (fs.existsSync(servicePath)) {
        console.log(`✅ ${serviceFile} found`);
    } else {
        console.log(`❌ ${serviceFile} not found`);
        allChecksPass = false;
    }
});

// Check 4: Test interface file
console.log('\n🌐 Checking test interface...');
const testInterfacePath = path.join(__dirname, 'comprehensive-test.html');
if (fs.existsSync(testInterfacePath)) {
    console.log(`✅ Comprehensive test interface found`);
} else {
    console.log(`❌ Comprehensive test interface not found`);
    allChecksPass = false;
}

// Check 5: Documentation
console.log('\n📚 Checking documentation...');
const docsToCheck = [
    'COMPREHENSIVE_TEST_GUIDE.md',
    'README.md'
];

docsToCheck.forEach(docFile => {
    const docPath = path.join(__dirname, docFile);
    if (fs.existsSync(docPath)) {
        console.log(`✅ ${docFile} found`);
    } else {
        console.log(`❌ ${docFile} not found`);
        allChecksPass = false;
    }
});

// Final status
console.log('\n' + '=' .repeat(50));
if (allChecksPass) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('\n🚀 Ready to run comprehensive test:');
    console.log('1. Ensure Hardhat blockchain is running (npx hardhat node)');
    console.log('2. Start HTTP server (npx http-server . -p 8080 --cors)');
    console.log('3. Open http://localhost:8080/comprehensive-test.html');
    console.log('4. Connect MetaMask and run the full test');
} else {
    console.log('❌ SOME CHECKS FAILED!');
    console.log('\n🔧 Please address the issues above before running the test.');
}

console.log('\n📋 Quick Setup Commands:');
console.log('# Terminal 1 - Start blockchain');
console.log('cd ../MobilePass && npx hardhat node');
console.log('\n# Terminal 2 - Deploy contract');
console.log('cd ../MobilePass && npx hardhat run scripts/deploy.js --network localhost');
console.log('\n# Terminal 3 - Start web server');
console.log('cd WebApp && npx http-server . -p 8080 --cors');

// Generate test report
const reportData = {
    timestamp: new Date().toISOString(),
    checksPerformed: [
        'Mock passport data validation',
        'Contract deployment verification',
        'Service files presence',
        'Test interface availability',
        'Documentation completeness'
    ],
    allChecksPassed: allChecksPass,
    readyForTesting: allChecksPass
};

try {
    fs.writeFileSync(
        path.join(__dirname, 'test-setup-report.json'),
        JSON.stringify(reportData, null, 2)
    );
    console.log('\n📄 Test setup report saved to test-setup-report.json');
} catch (error) {
    console.log(`\n⚠️ Could not save test report: ${error.message}`);
}

process.exit(allChecksPass ? 0 : 1); 