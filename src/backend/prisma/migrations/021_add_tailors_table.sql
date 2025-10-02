-- 021_add_tailors_table.sql
-- Add Tailors table for managing tailors/sewers in the fashion business

-- Create Tailors table
CREATE TABLE IF NOT EXISTS "tailors" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "specialization" TEXT NOT NULL, -- e.g., "Blouses, Dress, Set"
    "rating" REAL NOT NULL DEFAULT 0, -- Rating out of 5
    "status" TEXT NOT NULL DEFAULT 'active', -- active, inactive, pending
    "payment_terms" TEXT NOT NULL DEFAULT 'COD', -- Payment terms
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Tailor Productions table for tracking tailor production records
CREATE TABLE IF NOT EXISTS "tailor_productions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "tailor_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "finished_stock" INTEGER NOT NULL DEFAULT 0,
    "meters_needed" REAL NOT NULL DEFAULT 0,
    "cost_per_piece" REAL NOT NULL DEFAULT 0,
    "defective_stock" INTEGER DEFAULT 0,
    "additional_costs" REAL DEFAULT 0,
    "additional_cost_description" TEXT,
    "delivery_date" DATE,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed', -- completed, in_progress, pending
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT "tailor_productions_tailor_id_fkey" FOREIGN KEY ("tailor_id") REFERENCES "tailors"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_tailors_code" ON "tailors"("code");
CREATE INDEX IF NOT EXISTS "idx_tailors_name" ON "tailors"("name");
CREATE INDEX IF NOT EXISTS "idx_tailors_status" ON "tailors"("status");
CREATE INDEX IF NOT EXISTS "idx_tailors_specialization" ON "tailors"("specialization");
CREATE INDEX IF NOT EXISTS "idx_tailors_rating" ON "tailors"("rating");

CREATE INDEX IF NOT EXISTS "idx_tailor_productions_tailor_id" ON "tailor_productions"("tailor_id");
CREATE INDEX IF NOT EXISTS "idx_tailor_productions_product_name" ON "tailor_productions"("product_name");
CREATE INDEX IF NOT EXISTS "idx_tailor_productions_status" ON "tailor_productions"("status");
CREATE INDEX IF NOT EXISTS "idx_tailor_productions_delivery_date" ON "tailor_productions"("delivery_date");
CREATE INDEX IF NOT EXISTS "idx_tailor_productions_created_at" ON "tailor_productions"("created_at");

-- Update updated_at timestamp function for tailors
CREATE OR REPLACE FUNCTION update_tailors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_tailor_productions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER "update_tailors_updated_at_trigger"
BEFORE UPDATE ON "tailors"
FOR EACH ROW EXECUTE FUNCTION update_tailors_updated_at();

CREATE TRIGGER "update_tailor_productions_updated_at_trigger"  
BEFORE UPDATE ON "tailor_productions"
FOR EACH ROW EXECUTE FUNCTION update_tailor_productions_updated_at();

-- Tables are ready for data input
-- No sample data inserted - ready for user input

COMMIT;