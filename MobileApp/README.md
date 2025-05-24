# Passport Verification Mobile App

A React Native iOS app for NFC passport scanning with blockchain-based identity verification using Zero-Knowledge Proofs and Trusted Execution Environment (TEE).

## Features

- **NFC Passport Scanning**: Scan passport data using NFC technology
- **MetaMask Integration**: Connect to MetaMask wallet for blockchain interactions
- **TEE Verification**: Passport data verified through Trusted Execution Environment
- **Zero-Knowledge Proofs**: Privacy-preserving identity verification
- **Blockchain Storage**: Public keys stored on Ethereum blockchain
- **Off-chain Privacy**: Sensitive data encrypted and stored off-chain

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │       TEE       │    │   Blockchain    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ NFC Scanner │ │    │ │ Passport    │ │    │ │ Identity    │ │
│ │             │ │───▶│ │ Verification│ │───▶│ │ Contract    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Wallet      │ │    │ │ Signature   │ │    │ │ Public Keys │ │
│ │ Integration │ │    │ │ Generation  │ │    │ │ Storage     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

- Node.js 16 or higher
- React Native development environment
- iOS development setup (Xcode, iOS Simulator)
- MetaMask mobile app installed
- An iPhone with NFC capability for real passport scanning

## Installation

1. **Navigate to the mobile app directory:**
   ```bash
   cd MobilePass/mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install iOS dependencies:**
   ```bash
   cd ios && pod install && cd ..
   ```

## Development Setup

### For iOS Development

1. **Open the iOS project in Xcode:**
   ```bash
   open ios/PassportVerificationMobile.xcworkspace
   ```

2. **Configure signing and capabilities:**
   - Select your development team
   - Enable NFC capability
   - Add Near Field Communication Tag Reading entitlement

3. **Add NFC usage description to Info.plist:**
   ```xml
   <key>NFCReaderUsageDescription</key>
   <string>This app uses NFC to read passport information for identity verification</string>
   ```

### Environment Configuration

1. **Set up your blockchain network:**
   - Update the contract address in `services/NFCService.ts`
   - Configure the correct network in your wallet

2. **TEE Configuration:**
   - In production, replace mock TEE implementation with actual TEE service
   - Update TEE endpoints and certificates

## Usage

### Running the App

1. **Start Metro bundler:**
   ```bash
   npm start
   ```

2. **Run on iOS simulator:**
   ```bash
   npm run ios
   ```

3. **Run on physical iOS device:**
   - Connect your iPhone
   - Run from Xcode or use `react-native run-ios --device`

### App Flow

1. **Connect Wallet:**
   - Tap "Connect Wallet" button
   - Approve the connection in MetaMask
   - Wallet address will be displayed

2. **Scan Passport:**
   - Ensure wallet is connected
   - Place passport on NFC reader
   - Wait for TEE verification
   - Confirm blockchain transaction

3. **Verification Complete:**
   - Public key stored on blockchain
   - Private data encrypted off-chain
   - Identity card generated for future use

## Smart Contract Integration

The app integrates with the `IdentityVerification.sol` smart contract deployed in the parent directory:

- **Contract Location:** `../contracts/IdentityVerification.sol`
- **Main Functions:**
  - `verifyIdentity()`: Store verified identity on blockchain
  - `isIdentityVerified()`: Check verification status

## Security Features

### TEE (Trusted Execution Environment)
- Passport verification in secure environment
- Hardware-backed key generation
- Attestation of execution integrity

### Zero-Knowledge Proofs
- Identity verification without revealing personal data
- Public key storage without exposing private information
- Cryptographic proof of passport authenticity

### Data Protection
- **On-chain:** Only public keys and verification hashes
- **Off-chain:** Encrypted personal data with user-controlled keys
- **TEE:** Secure processing of sensitive passport data

## File Structure

```
mobile-app/
├── App.tsx                 # Main app component
├── services/
│   ├── WalletService.ts    # MetaMask wallet integration
│   ├── NFCService.ts       # NFC passport scanning
│   └── TEEService.ts       # TEE verification logic
├── components/             # Reusable UI components
├── screens/               # App screens
├── utils/                 # Utility functions
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── metro.config.js        # Metro bundler configuration
└── babel.config.js        # Babel transpilation config
```

## API Reference

### WalletService
- `connectWallet()`: Connect to MetaMask
- `signMessage()`: Sign data with wallet
- `verifyIdentityOnChain()`: Interact with smart contract

### NFCService
- `scanPassport()`: Read passport NFC data
- `verifyPassportWithTEE()`: Verify through TEE
- `generateIdentityHash()`: Create identity hash

### TEEService
- `verifyPassport()`: Validate passport authenticity
- `signIdentityHash()`: Generate TEE signature
- `getTEEAttestation()`: Provide execution proof

## Development Notes

### Current Implementation Status

- ✅ Basic UI layout with wallet connection
- ✅ NFC scanning interface
- ✅ TEE verification simulation
- ✅ Smart contract integration
- ⚠️ Mock implementations for development
- ❌ Real passport parsing (requires ICAO 9303 implementation)
- ❌ Production TEE integration
- ❌ Real NFC passport communication

### Next Steps for Production

1. **Implement real passport parsing:**
   - ICAO 9303 standard compliance
   - BAC (Basic Access Control) implementation
   - Digital signature verification

2. **Integrate production TEE:**
   - Intel SGX or ARM TrustZone
   - Secure key storage
   - Remote attestation

3. **Enhanced security:**
   - Certificate pinning
   - Anti-tampering measures
   - Secure communication protocols

## Troubleshooting

### Common Issues

1. **NFC not working:**
   - Ensure NFC is enabled in device settings
   - Check NFC capability entitlements
   - Verify Info.plist permissions

2. **Wallet connection fails:**
   - Ensure MetaMask is installed
   - Check network configuration
   - Verify wallet is unlocked

3. **Build errors:**
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Clean build: `cd ios && xcodebuild clean`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Update tests for new features
4. Document API changes

## License

This project is part of the Eth Dublin hackathon submission. 