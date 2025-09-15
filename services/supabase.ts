import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for offline mode when Supabase is not configured
const createMockSupabaseClient = () => {
  const mockAuth = {
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    signInWithOAuth: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
  };

  const mockFrom = () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
  });

  return {
    auth: mockAuth,
    from: mockFrom,
  };
};

// Export either real Supabase client or mock client
export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? createMockSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);