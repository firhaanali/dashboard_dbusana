-- Migration: Add Advertising Settlement Table
-- Description: Adds AdvertisingSettlement table for tracking advertising billing/settlement data

-- Update ImportType enum to include advertising_settlement
ALTER TYPE "ImportType" ADD VALUE 'advertising_settlement';

-- Create the advertising_settlement table
CREATE TABLE "advertising_settlement" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertising_settlement_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for order_id
ALTER TABLE "advertising_settlement" ADD CONSTRAINT "advertising_settlement_order_id_key" UNIQUE ("order_id");

-- Create indexes for performance
CREATE INDEX "advertising_settlement_order_id_idx" ON "advertising_settlement"("order_id");
CREATE INDEX "advertising_settlement_type_idx" ON "advertising_settlement"("type");
CREATE INDEX "advertising_settlement_account_name_idx" ON "advertising_settlement"("account_name");
CREATE INDEX "advertising_settlement_order_created_time_idx" ON "advertising_settlement"("order_created_time");
CREATE INDEX "advertising_settlement_order_settled_time_idx" ON "advertising_settlement"("order_settled_time");
CREATE INDEX "advertising_settlement_marketplace_idx" ON "advertising_settlement"("marketplace");
CREATE INDEX "advertising_settlement_settlement_amount_idx" ON "advertising_settlement"("settlement_amount");

-- Add foreign key constraint to import_batches
ALTER TABLE "advertising_settlement" ADD CONSTRAINT "advertising_settlement_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;