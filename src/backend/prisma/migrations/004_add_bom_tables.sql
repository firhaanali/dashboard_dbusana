-- Migration: Add BOM (Bill of Materials) Tables
-- Date: 2024-01-16
-- Description: Create tables for BOM management including materials, BOMs, and BOM items

-- Create Materials table
CREATE TABLE IF NOT EXISTS "materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "cost_per_unit" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- Create BOM Status enum type
CREATE TYPE "BOMStatus" AS ENUM ('Draft', 'Active', 'Archived');

-- Create BOMs table
CREATE TABLE IF NOT EXISTS "boms" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "description" TEXT,
    "category" TEXT,
    "target_quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "BOMStatus" NOT NULL DEFAULT 'Draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- Create BOM Items table (junction table)
CREATE TABLE IF NOT EXISTS "bom_items" (
    "id" TEXT NOT NULL,
    "bom_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost_per_unit" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "materials_code_key" ON "materials"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "boms_product_code_key" ON "boms"("product_code");
CREATE UNIQUE INDEX IF NOT EXISTS "bom_items_bom_id_material_id_key" ON "bom_items"("bom_id", "material_id");

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "materials_category_idx" ON "materials"("category");
CREATE INDEX IF NOT EXISTS "materials_name_idx" ON "materials"("name");
CREATE INDEX IF NOT EXISTS "boms_status_idx" ON "boms"("status");
CREATE INDEX IF NOT EXISTS "boms_category_idx" ON "boms"("category");
CREATE INDEX IF NOT EXISTS "boms_product_name_idx" ON "boms"("product_name");
CREATE INDEX IF NOT EXISTS "bom_items_bom_id_idx" ON "bom_items"("bom_id");
CREATE INDEX IF NOT EXISTS "bom_items_material_id_idx" ON "bom_items"("material_id");

-- Add foreign key constraints
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert sample materials data
INSERT INTO "materials" ("id", "code", "name", "description", "category", "unit", "cost_per_unit", "supplier", "min_stock", "current_stock") VALUES
    ('MAT001', 'KTN-001', 'Kain Katun Premium', 'Kain katun berkualitas tinggi untuk dress premium', 'Fabric', 'meter', 45000.0, 'PT Tekstil Nusantara', 50, 150),
    ('MAT002', 'PLS-001', 'Kain Polyester', 'Kain polyester standar untuk produk kasual', 'Fabric', 'meter', 35000.0, 'CV Bahan Tekstil', 30, 80),
    ('MAT003', 'KNC-001', 'Kancing Plastik', 'Kancing plastik diameter 12mm', 'Accessories', 'pcs', 500.0, 'Toko Aksesoris', 200, 500),
    ('MAT004', 'KNC-002', 'Kancing Logam', 'Kancing logam premium finish emas', 'Accessories', 'pcs', 1200.0, 'Toko Aksesoris', 100, 250),
    ('MAT005', 'BNG-001', 'Benang Polyester', 'Benang polyester berbagai warna', 'Thread', 'cone', 15000.0, 'PT Benang Jaya', 20, 45),
    ('MAT006', 'RSL-001', 'Resleting', 'Resleting YKK ukuran standar', 'Accessories', 'pcs', 3500.0, 'Distributor Resleting', 50, 120),
    ('MAT007', 'LBL-001', 'Label Brand', 'Label brand D\''Busana printed', 'Label', 'pcs', 800.0, 'Percetakan Digital', 500, 1000),
    ('MAT008', 'FUR-001', 'Furing', 'Furing halus untuk lapisan dalam', 'Fabric', 'meter', 25000.0, 'PT Tekstil Nusantara', 25, 60);

-- Insert sample BOM data
INSERT INTO "boms" ("id", "product_name", "product_code", "version", "description", "category", "target_quantity", "status", "created_by") VALUES
    ('BOM001', 'Dress Batik Premium', 'DBP-001', 'v1.2', 'Dress batik premium dengan detail aksesoris', 'dress', 1, 'Active', 'Admin'),
    ('BOM002', 'Kemeja Kasual Pria', 'KKP-001', 'v1.0', 'Kemeja kasual untuk pria dengan bahan nyaman', 'shirt', 1, 'Active', 'Production Manager'),
    ('BOM003', 'Celana Formal Wanita', 'CFW-001', 'v2.1', 'Celana formal wanita dengan cutting modern', 'pants', 1, 'Draft', 'Designer');

-- Insert sample BOM items
INSERT INTO "bom_items" ("id", "bom_id", "material_id", "quantity", "cost_per_unit", "notes") VALUES
    -- Dress Batik Premium items
    ('BOMI001', 'BOM001', 'MAT001', 2.5, 45000.0, 'Kain utama untuk body dress'),
    ('BOMI002', 'BOM001', 'MAT008', 1.0, 25000.0, 'Furing untuk lapisan dalam'),
    ('BOMI003', 'BOM001', 'MAT006', 1.0, 3500.0, 'Resleting belakang'),
    ('BOMI004', 'BOM001', 'MAT004', 3.0, 1200.0, 'Kancing hiasan depan'),
    ('BOMI005', 'BOM001', 'MAT005', 1.0, 15000.0, 'Benang untuk jahitan'),
    ('BOMI006', 'BOM001', 'MAT007', 1.0, 800.0, 'Label brand'),
    
    -- Kemeja Kasual Pria items  
    ('BOMI007', 'BOM002', 'MAT002', 1.8, 35000.0, 'Kain utama kemeja'),
    ('BOMI008', 'BOM002', 'MAT003', 8.0, 500.0, 'Kancing depan dan manset'),
    ('BOMI009', 'BOM002', 'MAT005', 1.0, 15000.0, 'Benang untuk jahitan'),
    ('BOMI010', 'BOM002', 'MAT007', 1.0, 800.0, 'Label brand'),
    
    -- Celana Formal Wanita items
    ('BOMI011', 'BOM003', 'MAT001', 1.5, 45000.0, 'Kain utama celana'),
    ('BOMI012', 'BOM003', 'MAT008', 0.5, 25000.0, 'Furing pinggang'),
    ('BOMI013', 'BOM003', 'MAT006', 1.0, 3500.0, 'Resleting samping'),
    ('BOMI014', 'BOM003', 'MAT004', 1.0, 1200.0, 'Kancing pinggang'),
    ('BOMI015', 'BOM003', 'MAT005', 1.0, 15000.0, 'Benang untuk jahitan'),
    ('BOMI016', 'BOM003', 'MAT007', 1.0, 800.0, 'Label brand');

-- Create view for BOM cost calculation
CREATE OR REPLACE VIEW "bom_cost_summary" AS
SELECT 
    b."id" as bom_id,
    b."product_name",
    b."product_code", 
    b."status",
    COUNT(bi."id") as material_count,
    SUM(bi."quantity" * bi."cost_per_unit") as total_material_cost,
    b."created_at",
    b."updated_at"
FROM "boms" b
LEFT JOIN "bom_items" bi ON b."id" = bi."bom_id"
GROUP BY b."id", b."product_name", b."product_code", b."status", b."created_at", b."updated_at";

-- Migration completed successfully
SELECT 'BOM tables migration completed successfully' as status;