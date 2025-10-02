-- Migration: Add Categories and Brands tables
-- This migration adds new tables without affecting existing ProductData, SalesData, and StockData tables

-- Create Categories table
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Create unique index on category name
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

-- Create Brands table
CREATE TABLE IF NOT EXISTS "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logo_color" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- Create unique index on brand name
CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_key" ON "brands"("name");

-- Insert some default categories if they don't exist
INSERT INTO "categories" ("id", "name", "description", "color") 
SELECT 'cat_default_1', 'Dress', 'Koleksi dress dan gaun', '#FF6B9D'
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Dress');

INSERT INTO "categories" ("id", "name", "description", "color") 
SELECT 'cat_default_2', 'Blouse', 'Koleksi blouse dan atasan', '#4ECDC4'
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Blouse');

INSERT INTO "categories" ("id", "name", "description", "color") 
SELECT 'cat_default_3', 'Pants', 'Koleksi celana panjang dan pendek', '#45B7D1'
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Pants');

INSERT INTO "categories" ("id", "name", "description", "color") 
SELECT 'cat_default_4', 'Skirt', 'Koleksi rok dan midi skirt', '#96CEB4'
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Skirt');

INSERT INTO "categories" ("id", "name", "description", "color") 
SELECT 'cat_default_5', 'Outer', 'Koleksi jaket dan cardigan', '#FFEAA7'
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Outer');

-- Insert some default brands if they don't exist
INSERT INTO "brands" ("id", "name", "description", "logo_color", "is_premium") 
SELECT 'brand_default_1', 'D''Busana Premium', 'Koleksi premium D''Busana dengan kualitas terbaik', '#6C5CE7', true
WHERE NOT EXISTS (SELECT 1 FROM "brands" WHERE "name" = 'D''Busana Premium');

INSERT INTO "brands" ("id", "name", "description", "logo_color", "is_premium") 
SELECT 'brand_default_2', 'D''Busana Classic', 'Koleksi classic everyday D''Busana', '#74B9FF', false
WHERE NOT EXISTS (SELECT 1 FROM "brands" WHERE "name" = 'D''Busana Classic');

INSERT INTO "brands" ("id", "name", "description", "logo_color", "is_premium") 
SELECT 'brand_default_3', 'D''Busana Casual', 'Koleksi casual wear yang nyaman', '#00B894', false
WHERE NOT EXISTS (SELECT 1 FROM "brands" WHERE "name" = 'D''Busana Casual');

INSERT INTO "brands" ("id", "name", "description", "logo_color", "is_premium") 
SELECT 'brand_default_4', 'D''Busana Sport', 'Koleksi sportswear dan activewear', '#E17055', false
WHERE NOT EXISTS (SELECT 1 FROM "brands" WHERE "name" = 'D''Busana Sport');