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
  Dimensions,
} from 'react-native';
import {
  Plus,
  Package,
  AlertTriangle,
  Search,
  X,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { supabase } from '@/services/supabase';

const { width } = Dimensions.get('window');

interface InventoryItem {
  id: string;
  user_id: string;
  name: string; // Changed from item_name to name to match database
  category: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export default function StockScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery]);

  const loadInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'Failed to load inventory');
    }
  };

  const filterInventory = () => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInventory(filtered);
    }
  };

  const resetForm = () => {
    setItemName('');
    setCategory('');
    setQuantity('');
    setUnitPrice('');
    setReorderLevel('');
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnitPrice(item.unit_price.toString());
    setReorderLevel(item.reorder_level.toString());
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim() || !quantity || !unitPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const itemData = {
        user_id: user.id,
        name: itemName.trim(), // Changed from item_name to name to match database
        category: category.trim() || 'General',
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        reorder_level: parseInt(reorderLevel) || 5,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('inventory_items')
          .update({ ...itemData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
        Alert.alert('Success', 'Item updated successfully!');
      } else {
        // Add new item
        const { error } = await supabase
          .from('inventory_items')
          .insert(itemData);

        if (error) throw error;
        Alert.alert('Success', 'Item added successfully!');
      }

      await loadInventory();
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving item:', error);
      Alert.alert('Error', error.message || 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteItem(item.id)
        }
      ]
    );
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      await loadInventory();
      Alert.alert('Success', 'Item deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getInventoryStats = () => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level).length;
    
    return { totalItems, totalValue, lowStockItems };
  };

  const stats = getInventoryStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Package size={20} color="#3b82f6" />
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatCurrency(stats.totalValue)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          
          <View style={styles.statItem}>
            <AlertTriangle size={20} color="#f59e0b" />
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.lowStockItems}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Inventory List */}
      <ScrollView style={styles.inventoryList}>
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>
              {inventory.length === 0 ? 'No inventory items yet' : 'No items match your search'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {inventory.length === 0 ? 'Start adding items to track your stock' : 'Try a different search term'}
            </Text>
          </View>
        ) : (
          filteredInventory.map((item) => (
            <View key={item.id} style={styles.inventoryCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Edit3 size={16} color="#6b7280" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteItem(item)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.itemStat}>
                  <Text style={styles.itemStatLabel}>Quantity</Text>
                  <Text style={[
                    styles.itemStatValue,
                    item.quantity <= item.reorder_level && { color: '#f59e0b' }
                  ]}>
                    {item.quantity}
                    {item.quantity <= item.reorder_level && ' ⚠️'}
                  </Text>
                </View>
                
                <View style={styles.itemStat}>
                  <Text style={styles.itemStatLabel}>Unit Price</Text>
                  <Text style={styles.itemStatValue}>{formatCurrency(item.unit_price)}</Text>
                </View>
                
                <View style={styles.itemStat}>
                  <Text style={styles.itemStatLabel}>Total Value</Text>
                  <Text style={styles.itemStatValue}>
                    {formatCurrency(item.quantity * item.unit_price)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Item Name */}
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter item name"
              value={itemName}
              onChangeText={setItemName}
            />

            {/* Category */}
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Vegetables, Fruits, Supplies"
              value={category}
              onChangeText={setCategory}
            />

            {/* Quantity */}
            <Text style={styles.inputLabel}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            {/* Unit Price */}
            <Text style={styles.inputLabel}>Unit Price (KES) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price per unit"
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="numeric"
            />

            {/* Reorder Level */}
            <Text style={styles.inputLabel}>Reorder Level</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum quantity before reorder (default: 5)"
              value={reorderLevel}
              onChangeText={setReorderLevel}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveItem}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  inventoryList: {
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
    textAlign: 'center',
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
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemStat: {
    alignItems: 'center',
    flex: 1,
  },
  itemStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemStatValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
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
