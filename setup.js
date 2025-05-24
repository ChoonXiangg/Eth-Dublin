#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n🚀 Step ${step}: ${message}`, 'cyan');
    log('─'.repeat(60), 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function checkDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        logError(`Directory not found: ${dirPath}`);
        return false;
    }
    return true;
}

function runCommand(command, directory = '.', description = '') {
    try {
        log(`📦 ${description || `Running: ${command}`}`, 'blue');
        
        const options = {
            stdio: 'inherit',
            cwd: path.resolve(directory)
        };
        
        execSync(command, options);
        logSuccess(`Completed: ${description || command}`);
        return true;
    } catch (error) {
        logError(`Failed: ${description || command}`);
        logError(`Error: ${error.message}`);
        return false;
    }
}

function checkNodeVersion() {
    try {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 16) {
            logError(`Node.js version ${nodeVersion} is not supported. Please install Node.js 16 or higher.`);
            process.exit(1);
        }
        
        logSuccess(`Node.js version: ${nodeVersion} ✓`);
        return true;
    } catch (error) {
        logError('Failed to check Node.js version');
        return false;
    }
}

function main() {
    log('🛂 Zero-Knowledge Passport Verification Setup', 'bright');
    log('═'.repeat(60), 'cyan');
    log('Setting up Eth Dublin Hackathon project...', 'blue');
    
    // Step 1: Check prerequisites
    logStep(1, 'Checking Prerequisites');
    checkNodeVersion();
    
    // Check if npm is available
    try {
        execSync('npm --version', { stdio: 'pipe' });
        logSuccess('npm is available ✓');
    } catch (error) {
        logError('npm is not available. Please install Node.js and npm.');
        process.exit(1);
    }
    
    // Step 2: Install root dependencies
    logStep(2, 'Installing Root Dependencies (Next.js Web App)');
    if (!runCommand('npm install', '.', 'Installing root project dependencies')) {
        logError('Failed to install root dependencies');
        process.exit(1);
    }
    
    // Step 3: Install Blockchain dependencies  
    logStep(3, 'Installing Blockchain Dependencies (Hardhat)');
    if (checkDirectory('MobilePass')) {
        if (!runCommand('npm install', 'MobilePass', 'Installing Hardhat blockchain dependencies')) {
            logWarning('Blockchain dependency installation failed - you may need to install manually');
        }
    } else {
        logWarning('MobilePass directory not found - skipping blockchain dependencies');
    }
    
    // Step 4: Compile smart contracts
    logStep(4, 'Compiling Smart Contracts');
    if (checkDirectory('MobilePass')) {
        if (!runCommand('npm run compile', 'MobilePass', 'Compiling Solidity smart contracts')) {
            logWarning('Smart contract compilation failed - you may need to compile manually');
        }
    }
    
    // Step 5: Verify installation
    logStep(5, 'Verifying Installation');
    
    const checks = [
        { path: 'package.json', description: 'Root package.json' },
        { path: 'MobilePass/package.json', description: 'Blockchain package.json' },
        { path: 'WebApp/comprehensive-test.html', description: 'Test interface' }
    ];
    
    let allChecksPass = true;
    checks.forEach(check => {
        if (fs.existsSync(check.path)) {
            logSuccess(`${check.description} ✓`);
        } else {
            logWarning(`${check.description} not found`);
            allChecksPass = false;
        }
    });
    
    // Final summary
    log('\n🎉 Setup Complete!', 'green');
    log('═'.repeat(60), 'green');
    
    if (allChecksPass) {
        logSuccess('All components installed successfully!');
    } else {
        logWarning('Some components may need manual setup');
    }
    
    log('\n📋 Next Steps:', 'bright');
    log('1. Start development: npm run dev:all', 'blue');
    log('2. Or start individual components:', 'blue');
    log('   • Web app: npm run dev', 'cyan');
    log('   • Blockchain: npm run dev:blockchain', 'cyan');
    log('3. Open demo: WebApp/comprehensive-test.html', 'blue');
    
    log('\n🏆 Ready for Eth Dublin Hackathon demo!', 'green');
    log('Demo file: WebApp/comprehensive-test.html', 'cyan');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logError(`Uncaught exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled rejection: ${reason}`);
    process.exit(1);
});

// Run the setup
if (require.main === module) {
    main();
}

module.exports = { main, runCommand, log, logSuccess, logWarning, logError }; 