-- Quick fix for inventory_items column name mismatch
-- This script specifically handles the name -> item_name column issue

DO $$
BEGIN
    -- Check if the table has 'name' column but not 'item_name'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'inventory_items' AND column_name = 'name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inventory_items' AND column_name = 'item_name') THEN
        
        -- Rename the column
        ALTER TABLE inventory_items RENAME COLUMN name TO item_name;
        RAISE NOTICE 'Successfully renamed name column to item_name';
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'inventory_items' AND column_name = 'item_name') THEN
        
        RAISE NOTICE 'Column item_name already exists - no action needed';
        
    ELSE
        -- Neither column exists, add item_name
        ALTER TABLE inventory_items ADD COLUMN item_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Item';
        RAISE NOTICE 'Added item_name column to inventory_items table';
    END IF;
    
END $$;
