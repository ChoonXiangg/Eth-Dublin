import { ethers } from 'ethers';

interface WalletConnection {
  address: string;
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class WalletService {
  private static connection: WalletConnection | null = null;

  /**
   * Connect to MetaMask wallet - REAL IMPLEMENTATION
   * @returns wallet address if connection successful
   */
  static async connectWallet(): Promise<string | null> {
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && window.ethereum) {
        console.log('🦊 MetaMask detected, connecting...');
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Check network
        const network = await provider.getNetwork();
        console.log('🌐 Connected to network:', network.name, 'Chain ID:', network.chainId);
        
        this.connection = {
          address,
          provider,
          signer,
        };
        
        console.log('✅ Wallet connected:', address);
        return address;
      } else if (typeof window !== 'undefined') {
        // MetaMask not installed
        throw new Error('MetaMask not detected. Please install MetaMask extension.');
      } else {
        // React Native environment - use WalletConnect
        throw new Error('WalletConnect not implemented yet. Please run in browser with MetaMask.');
      }
    } catch (error: any) {
      console.error('❌ Error connecting wallet:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check MetaMask.');
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
    }
  }

  /**
   * Check if MetaMask is installed
   */
  static isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Switch to the correct network
   */
  static async switchToCorrectNetwork(): Promise<void> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      // For local development, switch to localhost:8545
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex (Hardhat local)
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7A69',
                chainName: 'Hardhat Local',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add local network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch network');
      }
    }
  }

  /**
   * Get current wallet connection
   */
  static getConnection(): WalletConnection | null {
    return this.connection;
  }

  /**
   * Disconnect wallet
   */
  static disconnect(): void {
    this.connection = null;
    console.log('👋 Wallet disconnected');
  }

  /**
   * Get connected wallet address
   */
  static getAddress(): string | null {
    return this.connection?.address || null;
  }

  /**
   * Sign a message with the connected wallet - REAL IMPLEMENTATION
   */
  static async signMessage(message: string): Promise<string> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('✍️ Signing message with MetaMask...');
      const signature = await this.connection.signer.signMessage(message);
      console.log('✅ Message signed successfully');
      return signature;
    } catch (error: any) {
      console.error('❌ Error signing message:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the signing request');
      } else {
        throw new Error(error.message || 'Failed to sign message');
      }
    }
  }

  /**
   * Interact with the Identity Verification contract - REAL IMPLEMENTATION
   */
  static async verifyIdentityOnChain(
    contractAddress: string,
    identityHash: string,
    signature: string
  ): Promise<boolean> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('🔗 Interacting with smart contract...');
      console.log('📄 Contract address:', contractAddress);
      console.log('🆔 Identity hash:', identityHash);
      
      // Contract ABI for the verifyIdentity function
      const contractABI = [
        'function verifyIdentity(address user, bytes32 identityHash, bytes signature) external',
        'function isIdentityVerified(address user) external view returns (bool)',
        'function identities(address user) external view returns (bytes32, uint256, bool, address)'
      ];

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.connection.signer
      );

      // Check gas price and estimate gas
      const gasPrice = await this.connection.provider.getGasPrice();
      console.log('⛽ Gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');

      // Estimate gas for the transaction
      const gasEstimate = await contract.estimateGas.verifyIdentity(
        this.connection.address,
        identityHash,
        signature
      );
      console.log('⛽ Estimated gas:', gasEstimate.toString());

      // Call the verifyIdentity function
      console.log('📝 Submitting transaction...');
      const tx = await contract.verifyIdentity(
        this.connection.address,
        identityHash,
        signature,
        {
          gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        }
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      // Verify the identity was stored correctly
      const isVerified = await contract.isIdentityVerified(this.connection.address);
      console.log('✅ Identity verification status:', isVerified);

      // Get the stored identity details
      const identity = await contract.identities(this.connection.address);
      console.log('📄 Stored identity details:');
      console.log('  - Hash:', identity[0]);
      console.log('  - Timestamp:', new Date(identity[1].toNumber() * 1000).toISOString());
      console.log('  - Is Verified:', identity[2]);
      console.log('  - Verifier:', identity[3]);

      return true;
    } catch (error: any) {
      console.error('❌ Error verifying identity on chain:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the transaction');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds to pay for gas');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Transaction may fail. Check contract parameters.');
      } else {
        throw new Error(error.message || 'Failed to verify identity on blockchain');
      }
    }
  }

  /**
   * Get account balance
   */
  static async getBalance(): Promise<string> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.connection.provider.getBalance(this.connection.address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get account balance');
    }
  }

  /**
   * Listen for account changes
   */
  static onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  /**
   * Listen for network changes
   */
  static onChainChanged(callback: (chainId: string) => void): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  /**
   * Remove event listeners
   */
  static removeAllListeners(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
  }
} 