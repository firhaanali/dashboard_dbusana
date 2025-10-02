-- Migration: Add Province, Regency, City columns to sales_data table
-- Created: 2024-12-19
-- Purpose: Add location information to sales data for regional analytics

-- Add location columns to sales_data table
ALTER TABLE sales_data 
ADD COLUMN province VARCHAR(100),
ADD COLUMN regency VARCHAR(100),  
ADD COLUMN city VARCHAR(100);

-- Create indexes for location columns for performance
CREATE INDEX IF NOT EXISTS idx_sales_data_province ON sales_data(province);
CREATE INDEX IF NOT EXISTS idx_sales_data_regency ON sales_data(regency);
CREATE INDEX IF NOT EXISTS idx_sales_data_city ON sales_data(city);

-- Add some sample location data to existing records for testing
UPDATE sales_data 
SET 
    province = CASE 
        WHEN id % 15 = 0 THEN 'DKI Jakarta'
        WHEN id % 15 = 1 THEN 'Jawa Barat'
        WHEN id % 15 = 2 THEN 'Jawa Tengah'
        WHEN id % 15 = 3 THEN 'Jawa Timur'
        WHEN id % 15 = 4 THEN 'Banten'
        WHEN id % 15 = 5 THEN 'Yogyakarta'
        WHEN id % 15 = 6 THEN 'Bali'
        WHEN id % 15 = 7 THEN 'Sumatera Utara'
        WHEN id % 15 = 8 THEN 'Sumatera Barat'
        WHEN id % 15 = 9 THEN 'Sumatera Selatan'
        WHEN id % 15 = 10 THEN 'Kalimantan Timur'
        WHEN id % 15 = 11 THEN 'Sulawesi Selatan'
        WHEN id % 15 = 12 THEN 'Papua'
        WHEN id % 15 = 13 THEN 'Maluku'
        ELSE 'Nusa Tenggara Barat'
    END,
    regency = CASE 
        WHEN id % 10 = 0 THEN 'Jakarta Pusat'
        WHEN id % 10 = 1 THEN 'Bandung'
        WHEN id % 10 = 2 THEN 'Semarang'
        WHEN id % 10 = 3 THEN 'Surabaya'
        WHEN id % 10 = 4 THEN 'Tangerang'
        WHEN id % 10 = 5 THEN 'Yogyakarta'
        WHEN id % 10 = 6 THEN 'Denpasar'
        WHEN id % 10 = 7 THEN 'Medan'
        WHEN id % 10 = 8 THEN 'Padang'
        ELSE 'Palembang'
    END,
    city = CASE 
        WHEN id % 8 = 0 THEN 'Jakarta Pusat'
        WHEN id % 8 = 1 THEN 'Bandung'
        WHEN id % 8 = 2 THEN 'Semarang'
        WHEN id % 8 = 3 THEN 'Surabaya'
        WHEN id % 8 = 4 THEN 'Tangerang Selatan'
        WHEN id % 8 = 5 THEN 'Yogyakarta'
        WHEN id % 8 = 6 THEN 'Denpasar'
        ELSE 'Medan'
    END
WHERE province IS NULL OR regency IS NULL OR city IS NULL;

COMMENT ON COLUMN sales_data.province IS 'Province/provinsi location for customer delivery address';
COMMENT ON COLUMN sales_data.regency IS 'Regency/kabupaten location for customer delivery address';
COMMENT ON COLUMN sales_data.city IS 'City/kota location for customer delivery address';