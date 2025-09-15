import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Transaction, InventoryItem, CustomerDebt, Trip } from '../types/business';

const KEYS = {
  TRANSACTIONS: 'offline_transactions',
  INVENTORY: 'offline_inventory',
  DEBTS: 'offline_debts',
  TRIPS: 'offline_trips',
  PROFILE: 'business_profile',
};

// Transaction Management
export const saveTransactionOffline = async (transaction: Omit<Transaction, 'id' | 'is_synced' | 'created_at'>) => {
  try {
    const transactions = await getOfflineTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: uuid.v4() as string,
      is_synced: false,
      created_at: new Date().toISOString(),
    };
    
    transactions.push(newTransaction);
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  } catch (error) {
    console.error('Error saving transaction offline:', error);
    throw error;
  }
};

export const getOfflineTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline transactions:', error);
    return [];
  }
};

// Inventory Management
export const saveInventoryItemOffline = async (item: Omit<InventoryItem, 'id' | 'is_synced' | 'created_at' | 'updated_at'>) => {
  try {
    const inventory = await getOfflineInventory();
    const newItem: InventoryItem = {
      ...item,
      id: uuid.v4() as string,
      is_synced: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    inventory.push(newItem);
    await AsyncStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    return newItem;
  } catch (error) {
    console.error('Error saving inventory item offline:', error);
    throw error;
  }
};

export const getOfflineInventory = async (): Promise<InventoryItem[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline inventory:', error);
    return [];
  }
};

// Debt Management
export const saveCustomerDebtOffline = async (debt: Omit<CustomerDebt, 'id' | 'is_synced' | 'created_at'>) => {
  try {
    const debts = await getOfflineDebts();
    const newDebt: CustomerDebt = {
      ...debt,
      id: uuid.v4() as string,
      is_synced: false,
      created_at: new Date().toISOString(),
    };
    
    debts.push(newDebt);
    await AsyncStorage.setItem(KEYS.DEBTS, JSON.stringify(debts));
    return newDebt;
  } catch (error) {
    console.error('Error saving debt offline:', error);
    throw error;
  }
};

export const getOfflineDebts = async (): Promise<CustomerDebt[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DEBTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline debts:', error);
    return [];
  }
};

// Trip Management (Boda Boda)
export const saveTripOffline = async (trip: Omit<Trip, 'id' | 'is_synced' | 'created_at'>) => {
  try {
    const trips = await getOfflineTrips();
    const newTrip: Trip = {
      ...trip,
      id: uuid.v4() as string,
      is_synced: false,
      created_at: new Date().toISOString(),
    };
    
    trips.push(newTrip);
    await AsyncStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
    return newTrip;
  } catch (error) {
    console.error('Error saving trip offline:', error);
    throw error;
  }
};

export const getOfflineTrips = async (): Promise<Trip[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRIPS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline trips:', error);
    return [];
  }
};

// Sync Functions
export const getUnsyncedData = async () => {
  const transactions = (await getOfflineTransactions()).filter(t => !t.is_synced);
  const inventory = (await getOfflineInventory()).filter(i => !i.is_synced);
  const debts = (await getOfflineDebts()).filter(d => !d.is_synced);
  const trips = (await getOfflineTrips()).filter(t => !t.is_synced);
  
  return { transactions, inventory, debts, trips };
};

export const markAsSynced = async (type: keyof typeof KEYS, ids: string[]) => {
  try {
    let data: any[] = [];
    const key = KEYS[type];
    
    switch (type) {
      case 'TRANSACTIONS':
        data = await getOfflineTransactions();
        break;
      case 'INVENTORY':
        data = await getOfflineInventory();
        break;
      case 'DEBTS':
        data = await getOfflineDebts();
        break;
      case 'TRIPS':
        data = await getOfflineTrips();
        break;
    }
    
    const updatedData = data.map(item => 
      ids.includes(item.id) ? { ...item, is_synced: true } : item
    );
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error marking as synced:', error);
  }
};