-- Migration 022: Remove BOM (Bill of Materials) tables
-- Date: 2024-12-20
-- Description: Removes BOM-related tables and updates purchase_order_items

-- First, drop foreign key constraints that reference materials table
ALTER TABLE "purchase_order_items" DROP CONSTRAINT IF EXISTS "purchase_order_items_material_id_fkey";

-- Add new columns to purchase_order_items before dropping materials table
ALTER TABLE "purchase_order_items" 
ADD COLUMN IF NOT EXISTS "material_name" TEXT,
ADD COLUMN IF NOT EXISTS "material_description" TEXT;

-- Update existing purchase_order_items with material data (if any exists)
UPDATE "purchase_order_items" 
SET 
  "material_name" = COALESCE(m.name, 'Unknown Material'),
  "material_description" = m.description
FROM "materials" m 
WHERE "purchase_order_items"."material_id" = m.id;

-- Drop BOM cost summary view first
DROP VIEW IF EXISTS "bom_cost_summary";

-- Drop BOM-related tables in correct order (dependent tables first)
DROP TABLE IF EXISTS "bom_items";
DROP TABLE IF EXISTS "boms";
DROP TABLE IF EXISTS "materials";

-- Drop BOM-related enums
DROP TYPE IF EXISTS "BOMStatus";

-- Create index on new material_name column
CREATE INDEX IF NOT EXISTS "purchase_order_items_material_name_idx" ON "purchase_order_items"("material_name");

-- Note: material_id column is kept as a reference ID but no longer has FK constraint
-- This maintains backward compatibility while removing BOM functionality

COMMIT;