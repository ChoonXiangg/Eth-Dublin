// WalletService.js - Browser Compatible JavaScript Version
// Uses ethers.js loaded from CDN in the HTML

export class WalletService {
  static connection = null;

  /**
   * Connect to MetaMask wallet - REAL IMPLEMENTATION
   * @returns wallet address if connection successful
   */
  static async connectWallet() {
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
    } catch (error) {
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
  static isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Switch to the correct network
   */
  static async switchToCorrectNetwork() {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      // For local development, switch to localhost:8545
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex (Hardhat local)
      });
    } catch (switchError) {
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
  static getConnection() {
    return this.connection;
  }

  /**
   * Disconnect wallet
   */
  static disconnect() {
    this.connection = null;
    console.log('👋 Wallet disconnected');
  }

  /**
   * Get connected wallet address
   */
  static getAddress() {
    return this.connection?.address || null;
  }

  /**
   * Sign a message with the connected wallet - REAL IMPLEMENTATION
   */
  static async signMessage(message) {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('✍️ Signing message with MetaMask...');
      const signature = await this.connection.signer.signMessage(message);
      console.log('✅ Message signed successfully');
      return signature;
    } catch (error) {
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
  static async verifyIdentityOnChain(contractAddress, identityHash, signature) {
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

      // Send the transaction
      console.log('📤 Sending transaction to blockchain...');
      const tx = await contract.verifyIdentity(
        this.connection.address,
        identityHash,
        signature,
        {
          gasLimit: gasEstimate.mul(110).div(100), // Add 10% buffer
        }
      );

      console.log('⏳ Transaction sent, hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      // Verify the identity was stored correctly
      const isVerified = await contract.isIdentityVerified(this.connection.address);
      console.log('🔍 Identity verification status:', isVerified);

      return true;
    } catch (error) {
      console.error('❌ Error interacting with contract:', error);
      
      if (error.code === 4001) {
        throw new Error('User rejected the transaction');
      } else if (error.code === -32603) {
        throw new Error('Transaction failed - check contract and network');
      } else {
        throw new Error(error.message || 'Blockchain transaction failed');
      }
    }
  }

  /**
   * Get ETH balance of connected wallet
   */
  static async getBalance() {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.connection.provider.getBalance(this.connection.address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Listen for account changes
   */
  static onAccountsChanged(callback) {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  /**
   * Listen for network changes
   */
  static onChainChanged(callback) {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  /**
   * Remove all event listeners
   */
  static removeAllListeners() {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.removeAllListeners();
    }
  }
} 