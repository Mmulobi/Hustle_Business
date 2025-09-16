-- Query to check the actual structure of business_profiles table
-- Run this in your Supabase SQL Editor to see what columns exist

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'business_profiles'
ORDER BY ordinal_position;
