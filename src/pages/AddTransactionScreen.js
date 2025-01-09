import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, Alert, Modal, KeyboardAvoidingView, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddTransactionScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    account: '',
    date: new Date(),
    type: 'expense',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const walletsData = await AsyncStorage.getItem('wallets');
      if (walletsData) {
        const parsedWallets = JSON.parse(walletsData);
        setWallets(parsedWallets);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
    }
  };

  const handleAmountChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, amount: '' });
      return;
    }

    const numberValue = parseInt(numericValue, 10);
    const formattedValue = numberValue.toLocaleString('id-ID').replace(/,/g, '.');

    setFormData({ ...formData, amount: formattedValue });
  };

  const parseFormattedAmount = (formattedAmount) => {
    return parseFloat(formattedAmount.replace(/\./g, ''));
  };

  const updateWalletBalance = async (walletId, amount, type) => {
    try {
      const walletsData = await AsyncStorage.getItem('wallets');
      if (walletsData) {
        const parsedWallets = JSON.parse(walletsData);
        const updatedWallets = parsedWallets.map(wallet => {
          if (wallet.id === walletId) {
            const currentBalance = parseFloat(wallet.balance);
            const transactionAmount = parseFloat(amount);
            
            const newBalance = type === 'income' 
              ? currentBalance + transactionAmount
              : currentBalance - transactionAmount;

            return {
              ...wallet,
              balance: newBalance
            };
          }
          return wallet;
        });

        await AsyncStorage.setItem('wallets', JSON.stringify(updatedWallets));
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw new Error('Failed to update wallet balance');
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      const numericAmount = parseFormattedAmount(formData.amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      if (!selectedWallet) {
        Alert.alert('Error', 'Please select a wallet');
        return;
      }

      if (formData.type === 'expense') {
        const wallet = wallets.find(w => w.id === selectedWallet.id);
        if (numericAmount > parseFloat(wallet.balance)) {
          Alert.alert('Error', 'Insufficient balance in selected wallet');
          return;
        }
      }

      const newTransaction = {
        id: Date.now().toString(),
        name: formData.title.trim(),
        amount: numericAmount,
        category: formData.category,
        account: selectedWallet.name,
        accountId: selectedWallet.id,
        date: formData.date.toISOString().split('T')[0],
        type: formData.type,
        createdAt: new Date().toISOString(),
      };

      await updateWalletBalance(selectedWallet.id, numericAmount, formData.type);

      const existingTransactionsJson = await AsyncStorage.getItem('transactions');
      const existingTransactions = existingTransactionsJson 
        ? JSON.parse(existingTransactionsJson) 
        : [];

      const updatedTransactions = [newTransaction, ...existingTransactions];
      await AsyncStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      navigation.goBack();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const selectWallet = (wallet) => {
    setSelectedWallet(wallet);
    setShowWalletPicker(false);
    setFormData({ ...formData, account: wallet.name });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter transaction title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              maxLength={50}
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              returnKeyType="done"
              maxLength={15}
            />
          </View>

          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.categoryContainer}>
              <TouchableOpacity 
                style={[
                  styles.categoryTag,
                  formData.type === 'expense' && styles.categoryTagActive
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <Text style={[
                  styles.categoryTagText,
                  formData.type === 'expense' && styles.categoryTagTextActive
                ]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.categoryTag,
                  formData.type === 'income' && styles.categoryTagActive
                ]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <Text style={[
                  styles.categoryTagText,
                  formData.type === 'income' && styles.categoryTagTextActive
                ]}>Income</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account</Text>
            <TouchableOpacity 
              style={styles.walletSelector}
              onPress={() => setShowWalletPicker(true)}
            >
              <Text style={[
                styles.walletSelectorText,
                !selectedWallet && styles.placeholderText
              ]}>
                {selectedWallet ? selectedWallet.name : 'Select Wallet'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{formData.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</Text>
              <Calendar size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Wallet Picker Modal */}
        <Modal
          visible={showWalletPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWalletPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Wallet</Text>
              <ScrollView>
                {wallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    style={styles.walletOption}
                    onPress={() => selectWallet(wallet)}
                  >
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletBalance}>
                      Balance: Rp{parseFloat(wallet.balance).toLocaleString('id-ID', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).replace(/,/g, '.')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowWalletPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
    color: '#000000',
  },
  placeholderText: {
    color: '#666666',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryTagActive: {
    backgroundColor: '#000000',
  },
  categoryTagText: {
    color: '#666666',
  },
  categoryTagTextActive: {
    color: '#C8FB00',
  },
  walletSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
  },
  walletSelectorText: {
    fontSize: 16,
    color: '#000000',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: '#C8FB00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  walletName: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 14,
    color: '#666666',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#EF4444',
  },
});

export default AddTransactionScreen;