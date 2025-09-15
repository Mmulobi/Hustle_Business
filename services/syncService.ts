import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { getUnsyncedData, markAsSynced } from './offlineStorage';

export class SyncService {
  private static instance: SyncService;
  private isOnline = false;
  private syncInProgress = false;

  private constructor() {
    this.initNetworkListener();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.syncData();
      }
    });
  }

  async syncData() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      const { transactions, inventory, debts, trips } = await getUnsyncedData();
      
      // Sync transactions
      if (transactions.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .insert(transactions.map(t => ({
            user_id: t.user_id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            category: t.category,
            date: t.date,
          })));
          
        if (!error) {
          await markAsSynced('TRANSACTIONS', transactions.map(t => t.id));
        }
      }
      
      // Sync inventory
      if (inventory.length > 0) {
        const { error } = await supabase
          .from('inventory_items')
          .insert(inventory.map(i => ({
            user_id: i.user_id,
            name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            cost_price: i.cost_price,
            category: i.category,
            expiry_date: i.expiry_date,
          })));
          
        if (!error) {
          await markAsSynced('INVENTORY', inventory.map(i => i.id));
        }
      }
      
      // Sync debts
      if (debts.length > 0) {
        const { error } = await supabase
          .from('customer_debts')
          .insert(debts.map(d => ({
            user_id: d.user_id,
            customer_name: d.customer_name,
            phone_number: d.phone_number,
            amount_owed: d.amount_owed,
            description: d.description,
            date_borrowed: d.date_borrowed,
            is_paid: d.is_paid,
          })));
          
        if (!error) {
          await markAsSynced('DEBTS', debts.map(d => d.id));
        }
      }
      
      // Sync trips
      if (trips.length > 0) {
        const { error } = await supabase
          .from('trips')
          .insert(trips.map(t => ({
            user_id: t.user_id,
            start_location: t.start_location,
            end_location: t.end_location,
            distance: t.distance,
            duration_minutes: t.duration_minutes,
            fare_amount: t.fare_amount,
            fuel_cost: t.fuel_cost,
            customer_name: t.customer_name,
            date: t.date,
          })));
          
        if (!error) {
          await markAsSynced('TRIPS', trips.map(t => t.id));
        }
      }
      
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  isConnected(): boolean {
    return this.isOnline;
  }
}

export const syncService = SyncService.getInstance();