-- Migration: Add size column to product_hpp table
-- Date: Current

-- Add size column to product_hpp table
ALTER TABLE product_hpp ADD COLUMN size VARCHAR(50);

-- Update the unique constraint to include size
-- Drop the old unique constraint
ALTER TABLE product_hpp DROP CONSTRAINT IF EXISTS product_hpp_nama_produk_key;

-- Add new composite unique constraint
ALTER TABLE product_hpp ADD CONSTRAINT product_hpp_nama_produk_size_key UNIQUE (nama_produk, size);

-- Create index for size column for better performance
CREATE INDEX idx_product_hpp_size ON product_hpp(size);

-- Create index for combined nama_produk and size for lookups
CREATE INDEX idx_product_hpp_nama_produk_size ON product_hpp(nama_produk, size);