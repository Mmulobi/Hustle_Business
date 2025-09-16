import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Users, Plus, X, Phone, AlertCircle, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/services/supabase';

interface CustomerDebt {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone?: string;
  amount_owed: number;
  description: string;
  date_borrowed: string;
  is_paid: boolean;
  created_at?: string;
}

export default function CustomersScreen() {
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDebts(data || []);
    } catch (error) {
      console.error('Error loading debts:', error);
      Alert.alert('Error', 'Failed to load customer debts');
    }
  };

  const handleAddDebt = async () => {
    if (!customerName || !amount) {
      Alert.alert('Error', 'Please fill in customer name and amount');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to record customer debts');
        return;
      }
      
      const debtData = {
        user_id: user.id,
        customer_name: customerName.trim(),
        amount_owed: parseFloat(amount),
        description: description.trim() || 'Credit sale',
        is_paid: false,
      };

      const { error } = await supabase
        .from('customer_debts')
        .insert(debtData);

      if (error) throw error;

      await loadDebts();
      
      // Reset form
      setCustomerName('');
      setPhoneNumber('');
      setAmount('');
      setDescription('');
      setModalVisible(false);
      
      Alert.alert('Success', 'Customer debt recorded!');
    } catch (error: any) {
      console.error('Error saving debt:', error);
      Alert.alert('Error', error.message || 'Failed to record debt');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getTotalOutstanding = () => {
    return debts
      .filter(debt => !debt.is_paid)
      .reduce((sum, debt) => sum + debt.amount_owed, 0);
  };

  const getCustomerSummary = () => {
    const uniqueCustomers = new Set(debts.map(debt => debt.customer_name));
    const unpaidCustomers = new Set(
      debts.filter(debt => !debt.is_paid).map(debt => debt.customer_name)
    );
    
    return {
      total: uniqueCustomers.size,
      withDebts: unpaidCustomers.size,
    };
  };

  const totalOutstanding = getTotalOutstanding();
  const customerSummary = getCustomerSummary();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Management</Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Users size={20} color="#3b82f6" />
            <Text style={styles.summaryLabel}>Total Customers</Text>
            <Text style={styles.summaryValue}>{customerSummary.total}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.summaryLabel}>With Debts</Text>
            <Text style={styles.summaryValue}>{customerSummary.withDebts}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              {formatCurrency(totalOutstanding)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.debtsList}>
        {debts.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No customer records yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking customer debts and credit sales
            </Text>
          </View>
        ) : (
          debts.map((debt) => (
            <View key={debt.id} style={styles.debtCard}>
              <View style={styles.debtHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{debt.customer_name}</Text>
                  {debt.customer_phone && (
                    <View style={styles.phoneContainer}>
                      <Phone size={12} color="#6b7280" />
                      <Text style={styles.phoneNumber}>{debt.customer_phone}</Text>
                    </View>
                  )}
                  <Text style={styles.debtDescription}>{debt.description}</Text>
                  <Text style={styles.debtDate}>
                    {new Date(debt.date_borrowed).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.debtAmountContainer}>
                  <Text
                    style={[
                      styles.debtAmount,
                      { color: debt.is_paid ? '#10b981' : '#ef4444' }
                    ]}
                  >
                    {formatCurrency(debt.amount_owed)}
                  </Text>
                  
                  <View style={styles.statusContainer}>
                    {debt.is_paid ? (
                      <View style={styles.paidBadge}>
                        <CheckCircle size={12} color="#10b981" />
                        <Text style={styles.paidText}>Paid</Text>
                      </View>
                    ) : (
                      <View style={styles.unpaidBadge}>
                        <AlertCircle size={12} color="#ef4444" />
                        <Text style={styles.unpaidText}>Outstanding</Text>
                      </View>
                    )}
                    
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Debt Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Debt Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Customer Debt</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Amount Owed (KES) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What did they buy?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleAddDebt}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Recording...' : 'Record Debt'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  debtsList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  debtCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  debtDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  debtDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  debtAmountContainer: {
    alignItems: 'flex-end',
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    color: '#065f46',
    marginLeft: 4,
    fontWeight: '500',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unpaidText: {
    fontSize: 12,
    color: '#991b1b',
    marginLeft: 4,
    fontWeight: '500',
  },
  unsyncedIndicator: {
    marginTop: 4,
  },
  unsyncedText: {
    color: '#f59e0b',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#16a34a',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});