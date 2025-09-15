-- HustleAI Database Schema for Supabase
-- This schema supports different types of small-scale hustlers with tailored features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business Profiles Table
CREATE TABLE business_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('mama_mboga', 'boda_boda', 'small_shop', 'fruit_vendor', 'other_hustle')),
    location VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    daily_goal DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales/Income Tracking Table
CREATE TABLE sales_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Tracking Table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Management (for Mama Mboga, Small Shops, Fruit Vendors)
CREATE TABLE inventory_items (
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

-- Customer Debts Tracking (for Mama Mboga and Small Shops)
CREATE TABLE customer_debts (
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

-- Trip Logs (for Boda Boda riders)
CREATE TABLE trip_logs (
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

-- AI Assistant Interactions
CREATE TABLE ai_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Goals and Targets
CREATE TABLE business_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'daily_sales', 'monthly_profit', 'customer_count', etc.
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Users can view own business profile" ON business_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business profile" ON business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business profile" ON business_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sales records" ON sales_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales records" ON sales_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales records" ON sales_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales records" ON sales_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own customer debts" ON customer_debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customer debts" ON customer_debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customer debts" ON customer_debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customer debts" ON customer_debts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trip logs" ON trip_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trip logs" ON trip_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trip logs" ON trip_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trip logs" ON trip_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own AI interactions" ON ai_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI interactions" ON ai_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own business goals" ON business_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business goals" ON business_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business goals" ON business_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own business goals" ON business_goals FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_business_type ON business_profiles(business_type);
CREATE INDEX idx_sales_records_user_id ON sales_records(user_id);
CREATE INDEX idx_sales_records_date ON sales_records(date);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_customer_debts_user_id ON customer_debts(user_id);
CREATE INDEX idx_customer_debts_is_paid ON customer_debts(is_paid);
CREATE INDEX idx_trip_logs_user_id ON trip_logs(user_id);
CREATE INDEX idx_trip_logs_date ON trip_logs(date);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_business_goals_user_id ON business_goals(user_id);

-- Create functions for common queries
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
