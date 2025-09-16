-- Fix inventory_items table schema
-- This script ensures the inventory_items table has all required columns

DO $$
BEGIN
    -- Check if inventory_items table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
        CREATE TABLE inventory_items (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            item_name VARCHAR(255) NOT NULL,
            quantity INTEGER DEFAULT 0,
            unit_price DECIMAL(10,2),
            reorder_level INTEGER DEFAULT 5,
            purchase_date DATE,
            expiry_date DATE,
            supplier VARCHAR(255),
            category VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);
        
        -- Create index
        CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
        
        RAISE NOTICE 'Created inventory_items table with all required columns';
    ELSE
        -- Table exists, check and add missing columns
        
        -- Handle name/item_name column mismatch
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'inventory_items' AND column_name = 'name') THEN
            -- If 'name' column exists but 'item_name' doesn't, rename it
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'inventory_items' AND column_name = 'item_name') THEN
                ALTER TABLE inventory_items RENAME COLUMN name TO item_name;
                RAISE NOTICE 'Renamed name column to item_name in inventory_items table';
            END IF;
        ELSE
            -- Add item_name column if neither exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'inventory_items' AND column_name = 'item_name') THEN
                ALTER TABLE inventory_items ADD COLUMN item_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Item';
                RAISE NOTICE 'Added item_name column to inventory_items table';
            END IF;
        END IF;
        
        -- Add quantity column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'quantity') THEN
            ALTER TABLE inventory_items ADD COLUMN quantity INTEGER DEFAULT 0;
            RAISE NOTICE 'Added quantity column to inventory_items table';
        END IF;
        
        -- Add unit_price column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'unit_price') THEN
            ALTER TABLE inventory_items ADD COLUMN unit_price DECIMAL(10,2);
            RAISE NOTICE 'Added unit_price column to inventory_items table';
        END IF;
        
        -- Add reorder_level column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'reorder_level') THEN
            ALTER TABLE inventory_items ADD COLUMN reorder_level INTEGER DEFAULT 5;
            RAISE NOTICE 'Added reorder_level column to inventory_items table';
        END IF;
        
        -- Add category column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'category') THEN
            ALTER TABLE inventory_items ADD COLUMN category VARCHAR(100);
            RAISE NOTICE 'Added category column to inventory_items table';
        END IF;
        
        -- Add purchase_date column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'purchase_date') THEN
            ALTER TABLE inventory_items ADD COLUMN purchase_date DATE;
            RAISE NOTICE 'Added purchase_date column to inventory_items table';
        END IF;
        
        -- Add expiry_date column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'expiry_date') THEN
            ALTER TABLE inventory_items ADD COLUMN expiry_date DATE;
            RAISE NOTICE 'Added expiry_date column to inventory_items table';
        END IF;
        
        -- Add supplier column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'supplier') THEN
            ALTER TABLE inventory_items ADD COLUMN supplier VARCHAR(255);
            RAISE NOTICE 'Added supplier column to inventory_items table';
        END IF;
        
        -- Add created_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'created_at') THEN
            ALTER TABLE inventory_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to inventory_items table';
        END IF;
        
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'updated_at') THEN
            ALTER TABLE inventory_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to inventory_items table';
        END IF;
        
        -- Ensure user_id column exists and has proper reference
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'user_id') THEN
            ALTER TABLE inventory_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id column to inventory_items table';
        END IF;
        
        RAISE NOTICE 'Verified all required columns exist in inventory_items table';
    END IF;
    
    -- Ensure RLS is enabled
    BEGIN
        ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN duplicate_object THEN
            -- RLS already enabled, ignore
            NULL;
    END;
    
    -- Ensure policies exist
    BEGIN
        CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy already exists, ignore
            NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy already exists, ignore
            NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy already exists, ignore
            NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy already exists, ignore
            NULL;
    END;
    
    -- Ensure index exists
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_items_user_id') THEN
        CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
        RAISE NOTICE 'Created index idx_inventory_items_user_id';
    ELSE
        RAISE NOTICE 'Index idx_inventory_items_user_id already exists';
    END IF;
    
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
