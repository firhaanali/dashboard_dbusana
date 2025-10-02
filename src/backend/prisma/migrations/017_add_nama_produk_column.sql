-- Migration: Add nama_produk column to advertising_data table for True Profit ROI calculation
-- This enables campaign-to-product attribution for accurate ROI calculation

ALTER TABLE advertising_data 
ADD COLUMN nama_produk VARCHAR(255);

-- Add index for product name lookups and optimization
CREATE INDEX idx_advertising_nama_produk ON advertising_data(nama_produk);

-- Add comment for documentation
COMMENT ON COLUMN advertising_data.nama_produk IS 'Product name being advertised in this campaign for True Profit ROI calculation';

-- Optional: Add constraint to ensure product name follows naming convention
-- ALTER TABLE advertising_data 
-- ADD CONSTRAINT chk_nama_produk_format CHECK (nama_produk ~ '^[A-Za-z0-9\s\-\_\.]+$');

-- Update any existing records with default value if needed
-- UPDATE advertising_data SET nama_produk = 'Unknown Product' WHERE nama_produk IS NULL;