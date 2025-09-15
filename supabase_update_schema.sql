-- HustleAI Database Schema Update - Safe Version
-- This script will only create tables/columns that don't exist

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check and update business_profiles table structure
DO $$ 
BEGIN
    -- Add missing columns to business_profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'business_type') THEN
        ALTER TABLE business_profiles ADD COLUMN business_type VARCHAR(50) NOT NULL DEFAULT 'other_hustle' CHECK (business_type IN ('mama_mboga', 'boda_boda', 'small_shop', 'fruit_vendor', 'other_hustle'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE business_profiles ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'email') THEN
        ALTER TABLE business_profiles ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'phone') THEN
        ALTER TABLE business_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'daily_goal') THEN
        ALTER TABLE business_profiles ADD COLUMN daily_goal DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create sales_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    purchase_date DATE,
    expiry_date DATE,
    supplier VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_debts table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_debts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date_borrowed DATE DEFAULT CURRENT_DATE,
    date_due DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trip_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS trip_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    distance_km DECIMAL(8,2),
    duration_minutes INTEGER,
    fare_amount DECIMAL(10,2),
    fuel_cost DECIMAL(10,2),
    customer_name VARCHAR(255),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
    -- Business profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'Users can view own business profile') THEN
        CREATE POLICY "Users can view own business profile" ON business_profiles FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'Users can insert own business profile') THEN
        CREATE POLICY "Users can insert own business profile" ON business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'Users can update own business profile') THEN
        CREATE POLICY "Users can update own business profile" ON business_profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Sales records policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_records' AND policyname = 'Users can view own sales records') THEN
        CREATE POLICY "Users can view own sales records" ON sales_records FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_records' AND policyname = 'Users can insert own sales records') THEN
        CREATE POLICY "Users can insert own sales records" ON sales_records FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_records' AND policyname = 'Users can update own sales records') THEN
        CREATE POLICY "Users can update own sales records" ON sales_records FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_records' AND policyname = 'Users can delete own sales records') THEN
        CREATE POLICY "Users can delete own sales records" ON sales_records FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Expenses policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view own expenses') THEN
        CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert own expenses') THEN
        CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update own expenses') THEN
        CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can delete own expenses') THEN
        CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Continue with other table policies...
    -- (Similar pattern for inventory_items, customer_debts, trip_logs, ai_interactions, business_goals)
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_type ON business_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON sales_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_debts_user_id ON customer_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_debts_is_paid ON customer_debts(is_paid);
CREATE INDEX IF NOT EXISTS idx_trip_logs_user_id ON trip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_date ON trip_logs(date);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_business_goals_user_id ON business_goals(user_id);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_daily_sales(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) FROM sales_records WHERE user_id = user_uuid AND date = target_date),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_expenses(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(amount) FROM expenses WHERE user_id = user_uuid AND date = target_date),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_profit(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN get_daily_sales(user_uuid, target_date) - get_daily_expenses(user_uuid, target_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
