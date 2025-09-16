-- Quick fix for customer_debts and inventory_items schema issues
-- Run this in your Supabase SQL Editor

-- First, let's check what columns exist in customer_debts
-- You can run this query first to see current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customer_debts';

-- Fix customer_debts table structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_debts' AND column_name = 'amount') THEN
        ALTER TABLE customer_debts ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_debts' AND column_name = 'phone_number') THEN
        ALTER TABLE customer_debts ADD COLUMN phone_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_debts' AND column_name = 'date') THEN
        ALTER TABLE customer_debts ADD COLUMN date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    -- Copy amount_owed to amount if amount_owed exists but amount doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_debts' AND column_name = 'amount_owed') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_debts' AND column_name = 'amount') THEN
        ALTER TABLE customer_debts ADD COLUMN amount DECIMAL(10,2);
        UPDATE customer_debts SET amount = amount_owed WHERE amount IS NULL;
        ALTER TABLE customer_debts ALTER COLUMN amount SET NOT NULL;
    END IF;
END $$;

-- Fix inventory_items table structure
DO $$ 
BEGIN
    -- Add reorder_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'reorder_level') THEN
        ALTER TABLE inventory_items ADD COLUMN reorder_level INTEGER DEFAULT 5;
    END IF;
END $$;

-- Fix Row Level Security policies for customer_debts
DO $$ 
BEGIN
    -- Drop existing policies if they exist to recreate them properly
    DROP POLICY IF EXISTS "Users can insert own customer debts" ON customer_debts;
    DROP POLICY IF EXISTS "Users can view own customer debts" ON customer_debts;
    DROP POLICY IF EXISTS "Users can update own customer debts" ON customer_debts;
    DROP POLICY IF EXISTS "Users can delete own customer debts" ON customer_debts;
    
    -- Create proper RLS policies
    CREATE POLICY "Users can view own customer debts" ON customer_debts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own customer debts" ON customer_debts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own customer debts" ON customer_debts FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own customer debts" ON customer_debts FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Fix Row Level Security policies for inventory_items
DO $$ 
BEGIN
    -- Drop existing policies if they exist to recreate them properly
    DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
    DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
    DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
    DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;
    
    -- Create proper RLS policies
    CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Fix business_profiles table column name mismatch
-- Handle case where both hustle_type and business_type columns exist
DO $$
BEGIN
    -- If both columns exist, copy data from hustle_type to business_type and drop hustle_type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'business_profiles' AND column_name = 'hustle_type') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_profiles' AND column_name = 'business_type') THEN
        -- Copy data from hustle_type to business_type where business_type is null
        UPDATE business_profiles SET business_type = hustle_type WHERE business_type IS NULL;
        
        -- Drop the old hustle_type column
        ALTER TABLE business_profiles DROP COLUMN hustle_type;
        
    -- If only hustle_type exists, rename it to business_type
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'business_profiles' AND column_name = 'hustle_type') 
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'business_profiles' AND column_name = 'business_type') THEN
        ALTER TABLE business_profiles RENAME COLUMN hustle_type TO business_type;
        
    -- If neither column exists, add business_type
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'business_profiles' AND column_name = 'business_type') 
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'business_profiles' AND column_name = 'hustle_type') THEN
        ALTER TABLE business_profiles ADD COLUMN business_type VARCHAR(50) NOT NULL DEFAULT 'other_hustle' 
        CHECK (business_type IN ('mama_mboga', 'boda_boda', 'small_shop', 'fruit_vendor', 'other_hustle'));
    END IF;
    
    -- Ensure business_type has proper constraints if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'business_profiles' AND column_name = 'business_type') THEN
        -- Add constraint if it doesn't exist
        BEGIN
            ALTER TABLE business_profiles ADD CONSTRAINT business_profiles_business_type_check 
            CHECK (business_type IN ('mama_mboga', 'boda_boda', 'small_shop', 'fruit_vendor', 'other_hustle'));
        EXCEPTION
            WHEN duplicate_object THEN
                -- Constraint already exists, ignore
                NULL;
        END;
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
