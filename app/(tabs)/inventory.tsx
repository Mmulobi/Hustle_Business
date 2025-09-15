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
import { Package, Plus, X, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { saveInventoryItemOffline, getOfflineInventory } from '@/services/offlineStorage';
import { InventoryItem } from '@/types/business';
import { supabase } from '@/services/supabase';

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const offlineInventory = await getOfflineInventory();
      setInventory(offlineInventory.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const handleAddItem = async () => {
    if (!name || !quantity || !unitPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Try to get user from Supabase, but fallback to offline mode if not configured
      let userId = 'offline_user';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || 'offline_user';
      } catch (supabaseError) {
        console.log('Supabase not configured, using offline mode');
      }
      
      const newItem = {
        user_id: userId,
        name,
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        cost_price: parseFloat(costPrice) || 0,
        category: category || 'General',
        expiry_date: expiryDate || undefined,
      };

      await saveInventoryItemOffline(newItem);
      await loadInventory();
      
      // Reset form
      setName('');
      setQuantity('');
      setUnitPrice('');
      setCostPrice('');
      setCategory('');
      setExpiryDate('');
      setModalVisible(false);
      
      Alert.alert('Success', 'Item added to inventory!');
    } catch (error) {
      console.error('Error saving inventory item:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= 5);
  };

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
  };

  const getProfitMargin = (item: InventoryItem) => {
    if (item.cost_price === 0) return 0;
    return ((item.unit_price - item.cost_price) / item.cost_price * 100);
  };

  const lowStockItems = getLowStockItems();
  const totalValue = getTotalValue();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Management</Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Package size={20} color="#3b82f6" />
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{inventory.length}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <TrendingUp size={20} color="#10b981" />
            <Text style={styles.summaryLabel}>Stock Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <AlertTriangle size={20} color="#f59e0b" />
            <Text style={styles.summaryLabel}>Low Stock</Text>
            <Text style={styles.summaryValue}>{lowStockItems.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.inventoryList}>
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <View style={styles.alertContainer}>
            <AlertTriangle size={20} color="#f59e0b" />
            <Text style={styles.alertText}>
              {lowStockItems.length} item(s) running low on stock
            </Text>
          </View>
        )}

        {inventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No inventory items yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start adding your products to track stock
            </Text>
          </View>
        ) : (
          inventory.map((item) => (
            <View key={item.id} style={styles.inventoryCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                
                <View style={styles.itemStats}>
                  <Text style={[
                    styles.stockQuantity,
                    { color: item.quantity <= 5 ? '#ef4444' : '#10b981' }
                  ]}>
                    Stock: {item.quantity}
                  </Text>
                  {!item.is_synced && (
                    <View style={styles.unsyncedIndicator}>
                      <Text style={styles.unsyncedText}>●</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Unit Price:</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(item.unit_price)}
                  </Text>
                </View>
                
                {item.cost_price > 0 && (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Cost Price:</Text>
                      <Text style={styles.priceValue}>
                        {formatCurrency(item.cost_price)}
                      </Text>
                    </View>
                    
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Profit Margin:</Text>
                      <Text style={[
                        styles.priceValue,
                        { color: getProfitMargin(item) > 0 ? '#10b981' : '#ef4444' }
                      ]}>
                        {getProfitMargin(item).toFixed(1)}%
                      </Text>
                    </View>
                  </>
                )}
                
                {item.expiry_date && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Expires:</Text>
                    <Text style={styles.priceValue}>
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Tomatoes, Sukuma Wiki"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Selling Price (per unit) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Price you sell to customers"
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Cost Price (per unit)</Text>
            <TextInput
              style={styles.input}
              placeholder="How much you bought it for"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Vegetables, Fruits, Grains"
              value={category}
              onChangeText={setCategory}
            />

            <Text style={styles.inputLabel}>Expiry Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleAddItem}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Adding...' : 'Add to Inventory'}
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
  inventoryList: {
    flex: 1,
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertText: {
    marginLeft: 8,
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
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
  inventoryCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemStats: {
    alignItems: 'flex-end',
  },
  stockQuantity: {
    fontSize: 14,
    fontWeight: '500',
  },
  unsyncedIndicator: {
    marginTop: 4,
  },
  unsyncedText: {
    color: '#f59e0b',
    fontSize: 12,
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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