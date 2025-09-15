export type HustleType = 
  | 'mama_mboga' 
  | 'boda_boda' 
  | 'small_shop' 
  | 'fruit_vendor' 
  | 'other_hustle';

export interface BusinessProfile {
  id: string;
  user_id: string;
  full_name: string;
  business_type: HustleType;
  location: string;
  email: string;
  phone?: string;
  daily_goal: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  is_synced: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  category: string;
  expiry_date?: string;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerDebt {
  id: string;
  user_id: string;
  customer_name: string;
  phone_number?: string;
  amount_owed: number;
  description: string;
  date_borrowed: string;
  is_paid: boolean;
  is_synced: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  start_location: string;
  end_location: string;
  distance?: number;
  duration_minutes: number;
  fare_amount: number;
  fuel_cost?: number;
  customer_name?: string;
  date: string;
  is_synced: boolean;
  created_at: string;
}