-- Migration: Update Advertising Table Columns to Match Excel Format
-- This migration updates the advertising_data table structure to match the new Excel import format

-- Step 1: Drop existing advertising_data table if exists (careful - this will lose data)
DROP TABLE IF EXISTS "advertising_data" CASCADE;

-- Step 2: Create new advertising_data table with updated column structure
CREATE TABLE "advertising_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_name" TEXT NOT NULL,
    "ad_creative_type" TEXT,
    "ad_creative" TEXT,
    "account_name" TEXT,
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cpa" DECIMAL(15,2),
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "roi" DECIMAL(10,4),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DECIMAL(10,4),
    "conversion_rate" DECIMAL(10,4),
    "date_start" DATE NOT NULL,
    "date_end" DATE NOT NULL,
    "marketplace" TEXT,
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create indexes for performance
CREATE INDEX "advertising_data_campaign_name_idx" ON "advertising_data"("campaign_name");
CREATE INDEX "advertising_data_account_name_idx" ON "advertising_data"("account_name");
CREATE INDEX "advertising_data_date_start_idx" ON "advertising_data"("date_start");
CREATE INDEX "advertising_data_date_end_idx" ON "advertising_data"("date_end");
CREATE INDEX "advertising_data_marketplace_idx" ON "advertising_data"("marketplace");
CREATE INDEX "advertising_data_cost_idx" ON "advertising_data"("cost");
CREATE INDEX "advertising_data_revenue_idx" ON "advertising_data"("revenue");
CREATE INDEX "advertising_data_roi_idx" ON "advertising_data"("roi");

-- Step 4: Add foreign key constraint for import batch relationship
ALTER TABLE "advertising_data" 
ADD CONSTRAINT "advertising_data_import_batch_id_fkey" 
FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_advertising_data_updated_at BEFORE UPDATE ON "advertising_data" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Optional: Add comment to table
COMMENT ON TABLE "advertising_data" IS 'Updated advertising data table to match Excel import format with campaign_name, ad_creative_type, etc.';

-- Log migration completion
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    'advertising_columns_update_' || extract(epoch from now())::text,
    'advertising_columns_update_checksum',
    now(),
    '013_update_advertising_columns',
    'Updated advertising table structure to match Excel format',
    NULL,
    now(),
    1
) ON CONFLICT DO NOTHING;