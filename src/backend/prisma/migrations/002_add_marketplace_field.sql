-- Migration to add marketplace field to sales_data table
-- This migration adds the marketplace field to track source of sales (TikTok Shop, Shopee, etc.)

BEGIN;

-- Add marketplace column to sales_data table
ALTER TABLE sales_data 
ADD COLUMN marketplace VARCHAR(255);

-- Create index on marketplace for better query performance
CREATE INDEX idx_sales_data_marketplace ON sales_data(marketplace);

-- Update existing records to set TikTok Shop as default marketplace
-- Since user mentioned they have 2000 records from TikTok Shop
UPDATE sales_data 
SET marketplace = 'TikTok Shop' 
WHERE marketplace IS NULL;

-- Add comment to explain the field
COMMENT ON COLUMN sales_data.marketplace IS 'Source marketplace for the sale (TikTok Shop, Shopee, Tokopedia, etc.)';

COMMIT;