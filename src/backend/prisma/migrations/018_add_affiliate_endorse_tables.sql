-- ================================================
-- Migration: Add Affiliate Endorse Tables
-- Date: 2024-12-14
-- Description: Create proper tables for affiliate endorse management
-- ================================================

-- 1. Create affiliate_endorsements table for main campaign data
CREATE TABLE "affiliate_endorsements" (
    "id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "affiliate_name" TEXT NOT NULL,
    "affiliate_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "endorse_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_sales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_sales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "platform" TEXT[], -- Array of platforms
    "content_type" TEXT,
    "followers" INTEGER DEFAULT 0,
    "engagement" DOUBLE PRECISION DEFAULT 0,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "roi" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "affiliate_endorsements_pkey" PRIMARY KEY ("id")
);

-- 2. Create affiliate_product_sales table for detailed product tracking
CREATE TABLE "affiliate_product_sales" (
    "id" TEXT NOT NULL,
    "endorsement_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_sales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_product_sales_pkey" PRIMARY KEY ("id")
);

-- 3. Create foreign key relationship
ALTER TABLE "affiliate_product_sales" ADD CONSTRAINT "affiliate_product_sales_endorsement_id_fkey" 
    FOREIGN KEY ("endorsement_id") REFERENCES "affiliate_endorsements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Create indexes for performance
CREATE INDEX "affiliate_endorsements_affiliate_name_idx" ON "affiliate_endorsements"("affiliate_name");
CREATE INDEX "affiliate_endorsements_campaign_name_idx" ON "affiliate_endorsements"("campaign_name");
CREATE INDEX "affiliate_endorsements_start_date_idx" ON "affiliate_endorsements"("start_date");
CREATE INDEX "affiliate_endorsements_end_date_idx" ON "affiliate_endorsements"("end_date");
CREATE INDEX "affiliate_endorsements_status_idx" ON "affiliate_endorsements"("status");
CREATE INDEX "affiliate_endorsements_affiliate_type_idx" ON "affiliate_endorsements"("affiliate_type");
CREATE INDEX "affiliate_endorsements_endorse_fee_idx" ON "affiliate_endorsements"("endorse_fee");
CREATE INDEX "affiliate_endorsements_actual_sales_idx" ON "affiliate_endorsements"("actual_sales");
CREATE INDEX "affiliate_endorsements_roi_idx" ON "affiliate_endorsements"("roi");
CREATE INDEX "affiliate_endorsements_created_at_idx" ON "affiliate_endorsements"("created_at");

CREATE INDEX "affiliate_product_sales_endorsement_id_idx" ON "affiliate_product_sales"("endorsement_id");
CREATE INDEX "affiliate_product_sales_product_name_idx" ON "affiliate_product_sales"("product_name");
CREATE INDEX "affiliate_product_sales_total_sales_idx" ON "affiliate_product_sales"("total_sales");
CREATE INDEX "affiliate_product_sales_commission_idx" ON "affiliate_product_sales"("commission");

-- 5. Add unique constraint to prevent duplicate product entries per endorsement
CREATE UNIQUE INDEX "affiliate_product_sales_endorsement_product_unique" 
    ON "affiliate_product_sales"("endorsement_id", "product_name");

-- 6. Add comments for documentation
COMMENT ON TABLE "affiliate_endorsements" IS 'Main table for affiliate endorsement campaigns';
COMMENT ON TABLE "affiliate_product_sales" IS 'Detailed product sales tracking for each endorsement campaign';

COMMENT ON COLUMN "affiliate_endorsements"."platform" IS 'Array of marketplace platforms (TikTok Shop, Shopee, Lazada, Tokopedia)';
COMMENT ON COLUMN "affiliate_endorsements"."roi" IS 'Return on Investment percentage calculated as ((actual_sales - endorse_fee) / endorse_fee) * 100';
COMMENT ON COLUMN "affiliate_endorsements"."status" IS 'Campaign status: active, completed, cancelled, pending';
COMMENT ON COLUMN "affiliate_product_sales"."total_sales" IS 'Calculated as quantity * unit_price';