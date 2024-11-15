// MyTransactions.tsx
import axiosInstance from '@/src/api/axiosInstance';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';

interface Transaction {
  id: string;
  requestId: string;
  itemName: string | null;
  quantity: number;
  senderId: string;
  senderName: string;
  senderProfileUrl: string;
  recipientId: string;
  recipientName: string;
  recipientProfileUrl: string;
  createdAt: string;
  appointmentDate: string;
  status: string;
  senderProduct: {
    name: string;
    images: string[];
  };
  recipientProduct: {
    name: string;
    images: string[];
  };
}

const MyTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showId, setShowId] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axiosInstance.get('transaction/get-transactions');
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleIdentityPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
    setShowId(false);
    setVerificationInput('');
  };

  const handleVerification = () => {
    if (selectedTransaction && verificationInput === selectedTransaction.id) {
      Alert.alert('Success', 'Mã định danh trùng khớp');
    } else {
      Alert.alert('Error', 'Mã định danh không trùng khớp');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Transaction with {transaction.recipientName}</Text>
              <Text style={styles.status}>Status: {transaction.status}</Text>
            </View>

            <View style={styles.productsContainer}>
              {/* Sender's Product */}
              <View style={styles.productCard}>
                <Image 
                  source={{ uri: 'https://res.cloudinary.com/djh9baokn/image/upload/v1731336465/png-clipart-man-wearing-blue-shirt-illustration-computer-icons-avatar-user-login-avatar-blue-child_ijzlxf.png' }} 
                  style={styles.productImage} 
                />
                <Text style={styles.productName}>
                    {/* {transaction.senderProduct.name} */}
                    gà rán
                </Text>
                <Text style={styles.ownerName}>
                    {/* From: {transaction.senderName} */}
                    To: Nhân
                </Text>
              </View>

              <Text style={styles.exchangeIcon}>↔️</Text>

              {/* Recipient's Product */}
              <View style={styles.productCard}>
                <Image 
                  source={{ uri: 'https://res.cloudinary.com/djh9baokn/image/upload/v1731336465/png-clipart-man-wearing-blue-shirt-illustration-computer-icons-avatar-user-login-avatar-blue-child_ijzlxf.png' }} 
                  style={styles.productImage} 
                />
                <Text style={styles.productName}>
                    {/* {transaction.recipientProduct.name} */}
                    chân gà
                    </Text>
                <Text style={styles.ownerName}>
                    {/* To: {transaction.recipientName} */}
                    To: Phúc
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text>Created: {formatDate(transaction.createdAt)}</Text>
              <Text>Appointment: {formatDate(transaction.appointmentDate)}</Text>
              <TouchableOpacity
                style={styles.identityButton}
                onPress={() => handleIdentityPress(transaction)}
              >
                <Text style={styles.buttonText}>Lấy mã định danh</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác thực mã định danh</Text>
            
            {!showId ? (
              <TouchableOpacity
                style={styles.identityButton}
                onPress={() => setShowId(true)}
              >
                <Text style={styles.buttonText}>Xem mã</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.idText}>{selectedTransaction?.id}</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Nhập mã định danh"
              value={verificationInput}
              onChangeText={setVerificationInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.identityButton, styles.verifyButton]}
                onPress={handleVerification}
              >
                <Text style={styles.buttonText}>Xác thực</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.identityButton, styles.closeButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 8,
  },
  identityButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  idText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  productsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 10,
  },
  productCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ownerName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  exchangeIcon: {
    fontSize: 24,
    marginHorizontal: 10,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
});

export default MyTransactions;