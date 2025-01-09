import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Edit2, Trash2, ChevronLeft } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';

const WalletScreen = ({ navigation, route }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  
  const isSelectionMode = route.params?.onSelect;
  const onSelect = route.params?.onSelect;

  useEffect(() => {
    if (isFocused) {
      loadWallets();
    }
  }, [isFocused]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const walletsData = await AsyncStorage.getItem('wallets');
      if (walletsData) {
        const parsedWallets = JSON.parse(walletsData);
        setWallets(parsedWallets);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      Alert.alert('Error', 'Error loading wallets');
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalance = () => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  };

  const formatCurrency = (amount) => {
    return `Rp${amount.toLocaleString('id-ID')}`;
  };

  const handleWalletPress = (wallet) => {
    if (isSelectionMode && onSelect) {
      onSelect(wallet);
      navigation.goBack();
    } else {
      handleEditWallet(wallet);
    }
  };

  const handleAddWallet = () => {
    navigation.navigate('AddWallet', {
      onWalletAdded: async (newWallet) => {
        try {
          const updatedWallets = [...wallets, newWallet];
          await AsyncStorage.setItem('wallets', JSON.stringify(updatedWallets));
          setWallets(updatedWallets);
        } catch (error) {
          console.error('Error saving wallet:', error);
          Alert.alert('Error', 'Error saving wallet');
        }
      }
    });
  };

  const handleEditWallet = (wallet) => {
    navigation.navigate('EditWallet', {
      wallet,
      onWalletUpdated: async (updatedWallet) => {
        try {
          const updatedWallets = wallets.map(w =>
            w.id === updatedWallet.id ? updatedWallet : w
          );
          await AsyncStorage.setItem('wallets', JSON.stringify(updatedWallets));
          setWallets(updatedWallets);
        } catch (error) {
          console.error('Error updating wallet:', error);
          Alert.alert('Error', 'Error updating wallet');
        }
      }
    });
  };

  const handleDeleteWallet = async (walletId) => {
    Alert.alert(
      'Confirmation',
      'Are you sure yo want to delete this account?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Destructive',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedWallets = wallets.filter(w => w.id !== walletId);
              await AsyncStorage.setItem('wallets', JSON.stringify(updatedWallets));
              setWallets(updatedWallets);
            } catch (error) {
              console.error('Error deleting wallet:', error);
              Alert.alert('Error', 'Error deleting wallet');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8FB00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {isSelectionMode && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isSelectionMode ? 'Select Wallet' : 'Wallet'}
          </Text>
        </View>
        {isSelectionMode && <View style={styles.placeholderButton} />}
      </View>
      
      <View style={styles.totalBalanceContainer}>
        <Text style={styles.totalBalanceLabel}>Total Balance</Text>
        <Text style={styles.totalBalanceAmount}>
          {formatCurrency(getTotalBalance())}
        </Text>
      </View>

      <ScrollView style={styles.walletsContainer}>
        {wallets.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No accounts have been added yet</Text>
            <Text style={styles.emptyStateSubText}>Tap the + button to add an account</Text>
          </View>
        ) : (
          wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletItem}>
              <TouchableWithoutFeedback onPress={() => handleWalletPress(wallet)}>
                <View style={styles.walletContent}>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletDate}>
                      {new Date(wallet.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <Text style={styles.walletBalance}>
                    {formatCurrency(wallet.balance)}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
              {!isSelectionMode && (
                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditWallet(wallet)}
                  >
                    <Edit2 size={16} color="#000000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteWallet(wallet.id)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {!isSelectionMode && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddWallet}
        >
          <Plus size={24} color="#000000" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 1,
    position: 'relative',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
    padding: 4,
  },
  placeholderButton: {
    width: 32,
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    marginTop: 23,
    marginBottom: 20,
    color: '#000000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  totalBalanceContainer: {
    backgroundColor: '#000000',
    margin: 20,
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
  },
  totalBalanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 5,
  },
  totalBalanceAmount: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  walletsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyStateText: {
    color: '#888888',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    color: '#888888',
    fontSize: 14,
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  walletContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 4,
  },
  walletDate: {
    fontSize: 12,
    color: '#666666',
  },
  walletBalance: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginRight: 10,
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#C8FB00',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C8FB00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default WalletScreen;