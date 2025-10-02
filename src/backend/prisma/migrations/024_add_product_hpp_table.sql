-- Migration: Add Product HPP table for TikTok Commission Calculator
-- Date: 2024-01-20

-- Create product_hpp table
CREATE TABLE IF NOT EXISTS "product_hpp" (
    "id" TEXT NOT NULL,
    "nama_produk" TEXT NOT NULL,
    "hpp" REAL NOT NULL,
    "kategori" TEXT,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_hpp_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "product_hpp_nama_produk_idx" ON "product_hpp"("nama_produk");
CREATE INDEX IF NOT EXISTS "product_hpp_kategori_idx" ON "product_hpp"("kategori");
CREATE INDEX IF NOT EXISTS "product_hpp_hpp_idx" ON "product_hpp"("hpp");
CREATE INDEX IF NOT EXISTS "product_hpp_created_at_idx" ON "product_hpp"("created_at");

-- Create unique index for nama_produk to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "product_hpp_nama_produk_unique" ON "product_hpp"("nama_produk");

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_product_hpp_updated_at ON "product_hpp";
CREATE TRIGGER update_product_hpp_updated_at
    BEFORE UPDATE ON "product_hpp"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();