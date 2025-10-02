-- Migration: Remove campaign_type column and ensure advertising_settlement table exists
-- Description: Remove duplicate campaign_type column since ad_creative_type already exists, and create advertising_settlement table

-- Step 1: Drop campaign_type column from advertising_data table (redundant with ad_creative_type)
ALTER TABLE "advertising_data" DROP COLUMN IF EXISTS "campaign_type";

-- Step 2: Drop index for campaign_type if exists
DROP INDEX IF EXISTS "idx_advertising_data_campaign_type";

-- Step 3: Ensure ImportType enum includes advertising_settlement (if not already added)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportType') THEN
        CREATE TYPE "ImportType" AS ENUM ('sales', 'products', 'stock', 'advertising', 'advertising_settlement');
    ELSE
        -- Add advertising_settlement to enum if not exists
        BEGIN
            ALTER TYPE "ImportType" ADD VALUE IF NOT EXISTS 'advertising_settlement';
        EXCEPTION WHEN duplicate_object THEN
            -- Value already exists, continue
            NULL;
        END;
    END IF;
END $$;

-- Step 4: Create advertising_settlement table (if not exists)
CREATE TABLE IF NOT EXISTS "advertising_settlement" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" TEXT,
    "order_created_time" TIMESTAMP(3) NOT NULL,
    "order_settled_time" TIMESTAMP(3) NOT NULL,
    "settlement_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "account_name" TEXT,
    "marketplace" TEXT,
    "currency" TEXT DEFAULT 'IDR',
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertising_settlement_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create unique constraint for order_id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertising_settlement_order_id_key') THEN
        ALTER TABLE "advertising_settlement" ADD CONSTRAINT "advertising_settlement_order_id_key" UNIQUE ("order_id");
    END IF;
END $$;

-- Step 6: Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS "advertising_settlement_order_id_idx" ON "advertising_settlement"("order_id");
CREATE INDEX IF NOT EXISTS "advertising_settlement_type_idx" ON "advertising_settlement"("type");
CREATE INDEX IF NOT EXISTS "advertising_settlement_account_name_idx" ON "advertising_settlement"("account_name");
CREATE INDEX IF NOT EXISTS "advertising_settlement_order_created_time_idx" ON "advertising_settlement"("order_created_time");
CREATE INDEX IF NOT EXISTS "advertising_settlement_order_settled_time_idx" ON "advertising_settlement"("order_settled_time");
CREATE INDEX IF NOT EXISTS "advertising_settlement_marketplace_idx" ON "advertising_settlement"("marketplace");
CREATE INDEX IF NOT EXISTS "advertising_settlement_settlement_amount_idx" ON "advertising_settlement"("settlement_amount");

-- Step 7: Add foreign key constraint to import_batches (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertising_settlement_import_batch_id_fkey') THEN
        ALTER TABLE "advertising_settlement" ADD CONSTRAINT "advertising_settlement_import_batch_id_fkey" 
        FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 8: Create trigger for updated_at timestamp on advertising_settlement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_advertising_settlement_updated_at 
BEFORE UPDATE ON "advertising_settlement" 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Step 9: Add comments to tables
COMMENT ON TABLE "advertising_settlement" IS 'Advertising settlement data table for tracking billing and settlement information';
COMMENT ON COLUMN "advertising_settlement"."order_id" IS 'Unique order identifier from advertising platforms';
COMMENT ON COLUMN "advertising_settlement"."settlement_amount" IS 'Total settlement amount in specified currency';
COMMENT ON COLUMN "advertising_settlement"."account_name" IS 'Account name (auto-filled to D''Busana if empty)';

-- Migration completed successfully
SELECT 'Migration 016 completed: Removed campaign_type column and ensured advertising_settlement table exists' as status;