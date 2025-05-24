import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { WalletService } from './services/WalletService';
import { NFCService } from './services/NFCService';

const { width, height } = Dimensions.get('window');

const App: React.FC = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Initialize NFC Manager
    NfcManager.start();
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);

  const handleConnectWallet = async () => {
    try {
      const address = await WalletService.connectWallet();
      if (address) {
        setWalletAddress(address);
        setIsWalletConnected(true);
        setShowSuccessModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet. Please make sure MetaMask is installed and try again.');
    }
  };

  const handleNFCScan = async () => {
    if (!isWalletConnected) {
      Alert.alert('Wallet Required', 'Wallet needs to be connected before scanning your passport.');
      return;
    }

    try {
      setIsScanning(true);
      const passportData = await NFCService.scanPassport();
      
      if (passportData) {
        // Process passport data through TEE verification
        const verificationResult = await NFCService.verifyPassportWithTEE(passportData);
        
        if (verificationResult.success) {
          Alert.alert(
            'Success',
            'Passport verified successfully! Your identity has been securely stored.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Verification Failed', 'Passport verification failed. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to scan passport. Please ensure your passport is properly placed on the NFC reader.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Connect Wallet Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.connectButton, isWalletConnected && styles.connectedButton]}
          onPress={handleConnectWallet}
          disabled={isWalletConnected}
        >
          <Text style={styles.connectButtonText}>
            {isWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <TouchableOpacity
          style={[styles.scanBubble, isScanning && styles.scanningBubble]}
          onPress={handleNFCScan}
          disabled={isScanning}
        >
          <Text style={styles.scanText}>
            {isScanning ? 'Scanning...' : 'Place your passport on the NFC reader'}
          </Text>
          {isScanning && (
            <View style={styles.loadingIndicator}>
              <Text style={styles.loadingText}>📱</Text>
            </View>
          )}
        </TouchableOpacity>

        {isWalletConnected && (
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Connected Wallet:</Text>
            <Text style={styles.walletAddress}>
              {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </Text>
          </View>
        )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✅ Wallet Connected Successfully!</Text>
            <Text style={styles.modalMessage}>
              You can now scan your passport for identity verification.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  connectedButton: {
    backgroundColor: '#28a745',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanBubble: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    minWidth: width * 0.8,
  },
  scanningBubble: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  scanText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  loadingText: {
    fontSize: 24,
    textAlign: 'center',
  },
  walletInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App; 