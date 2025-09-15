import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllOfflineData = async () => {
  try {
    // Clear all offline storage keys related to business data
    const keysToRemove = [
      'transactions',
      'customer_debts', 
      'inventory_items',
      'business_profile',
      'sales_records',
      'expenses',
      'offline_transactions',
      'offline_debts',
      'offline_inventory'
    ];

    await AsyncStorage.multiRemove(keysToRemove);
    console.log('All offline data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing offline data:', error);
    return false;
  }
};

export const clearSpecificData = async (dataType: 'transactions' | 'customers' | 'inventory' | 'all') => {
  try {
    let keysToRemove: string[] = [];
    
    switch (dataType) {
      case 'transactions':
        keysToRemove = ['transactions', 'sales_records', 'expenses', 'offline_transactions'];
        break;
      case 'customers':
        keysToRemove = ['customer_debts', 'offline_debts'];
        break;
      case 'inventory':
        keysToRemove = ['inventory_items', 'offline_inventory'];
        break;
      case 'all':
        return await clearAllOfflineData();
    }

    await AsyncStorage.multiRemove(keysToRemove);
    console.log(`Cleared ${dataType} data successfully`);
    return true;
  } catch (error) {
    console.error(`Error clearing ${dataType} data:`, error);
    return false;
  }
};
