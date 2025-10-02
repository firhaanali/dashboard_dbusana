-- Migration: Merge regency and city columns into regency_city
-- This migration combines the separate regency and city fields into a single field

-- Add new regency_city column
ALTER TABLE sales_data ADD COLUMN regency_city TEXT;

-- Migrate existing data by combining regency and city
UPDATE sales_data 
SET regency_city = 
  CASE 
    WHEN regency IS NOT NULL AND city IS NOT NULL THEN 
      CASE 
        WHEN regency = city THEN regency
        ELSE regency || ' & ' || city
      END
    WHEN regency IS NOT NULL THEN regency
    WHEN city IS NOT NULL THEN city
    ELSE NULL
  END;

-- Add index for the new column
CREATE INDEX idx_sales_data_regency_city ON sales_data(regency_city);

-- Drop old columns (uncomment after verifying data migration)
-- ALTER TABLE sales_data DROP COLUMN regency;
-- ALTER TABLE sales_data DROP COLUMN city;

-- Drop old indexes (uncomment after dropping columns)
-- DROP INDEX IF EXISTS idx_sales_data_regency;  
-- DROP INDEX IF EXISTS idx_sales_data_city;