-- 027_add_comprehensive_transaction_tracking.sql
-- Add comprehensive transaction tracking for returns, reimbursements, commission adjustments, and affiliate samples

-- 🔄 Returns and Cancellations Table
CREATE TABLE IF NOT EXISTS "returns_and_cancellations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "original_order_id" TEXT,
    "original_sales_id" TEXT,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "return_date" TIMESTAMP(3) NOT NULL,
    "returned_amount" REAL NOT NULL DEFAULT 0,
    "refund_amount" REAL NOT NULL DEFAULT 0,
    "restocking_fee" REAL NOT NULL DEFAULT 0,
    "shipping_cost_loss" REAL NOT NULL DEFAULT 0,
    "product_name" TEXT NOT NULL,
    "quantity_returned" INTEGER NOT NULL DEFAULT 1,
    "original_price" REAL NOT NULL DEFAULT 0,
    "marketplace" TEXT,
    "product_condition" TEXT,
    "resellable" BOOLEAN NOT NULL DEFAULT false,
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "returns_and_cancellations_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 💰 Marketplace Reimbursements Table
CREATE TABLE IF NOT EXISTS "marketplace_reimbursements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claim_id" TEXT,
    "reimbursement_type" TEXT NOT NULL,
    "claim_amount" REAL NOT NULL DEFAULT 0,
    "approved_amount" REAL NOT NULL DEFAULT 0,
    "received_amount" REAL NOT NULL DEFAULT 0,
    "processing_fee" REAL NOT NULL DEFAULT 0,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "claim_date" TIMESTAMP(3) NOT NULL,
    "approval_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "affected_order_id" TEXT,
    "product_name" TEXT,
    "marketplace" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "evidence_provided" TEXT,
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_reimbursements_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 📉 Commission Adjustments Table
CREATE TABLE IF NOT EXISTS "commission_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "original_order_id" TEXT,
    "original_sales_id" TEXT,
    "adjustment_type" TEXT NOT NULL,
    "reason" TEXT,
    "original_commission" REAL NOT NULL DEFAULT 0,
    "adjustment_amount" REAL NOT NULL DEFAULT 0,
    "final_commission" REAL NOT NULL DEFAULT 0,
    "marketplace" TEXT NOT NULL,
    "commission_rate" REAL,
    "dynamic_rate_applied" BOOLEAN NOT NULL DEFAULT false,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "adjustment_date" TIMESTAMP(3) NOT NULL,
    "product_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "product_price" REAL NOT NULL DEFAULT 0,
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_adjustments_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 🎁 Affiliate Samples Table
CREATE TABLE IF NOT EXISTS "affiliate_samples" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliate_name" TEXT NOT NULL,
    "affiliate_platform" TEXT,
    "affiliate_contact" TEXT,
    "product_name" TEXT NOT NULL,
    "product_sku" TEXT,
    "quantity_given" INTEGER NOT NULL DEFAULT 1,
    "product_cost" REAL NOT NULL DEFAULT 0,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "shipping_cost" REAL NOT NULL DEFAULT 0,
    "packaging_cost" REAL NOT NULL DEFAULT 0,
    "campaign_name" TEXT,
    "expected_reach" INTEGER,
    "content_type" TEXT,
    "given_date" TIMESTAMP(3) NOT NULL,
    "expected_content_date" TIMESTAMP(3),
    "actual_content_date" TIMESTAMP(3),
    "content_delivered" BOOLEAN NOT NULL DEFAULT false,
    "performance_notes" TEXT,
    "roi_estimate" REAL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "import_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_samples_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Update ImportType enum to include new types
-- Note: PostgreSQL enum updates need to be done carefully
DO $$ 
BEGIN
    -- Check if enum values don't exist and add them
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'returns_and_cancellations' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ImportType')) THEN
        ALTER TYPE "ImportType" ADD VALUE 'returns_and_cancellations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'marketplace_reimbursements' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ImportType')) THEN
        ALTER TYPE "ImportType" ADD VALUE 'marketplace_reimbursements';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'commission_adjustments' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ImportType')) THEN
        ALTER TYPE "ImportType" ADD VALUE 'commission_adjustments';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'affiliate_samples' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ImportType')) THEN
        ALTER TYPE "ImportType" ADD VALUE 'affiliate_samples';
    END IF;
END $$;

-- Create indexes for performance optimization

-- Returns and Cancellations Indexes
CREATE INDEX IF NOT EXISTS "returns_and_cancellations_type_idx" ON "returns_and_cancellations"("type");
CREATE INDEX IF NOT EXISTS "returns_and_cancellations_return_date_idx" ON "returns_and_cancellations"("return_date");
CREATE INDEX IF NOT EXISTS "returns_and_cancellations_marketplace_idx" ON "returns_and_cancellations"("marketplace");
CREATE INDEX IF NOT EXISTS "returns_and_cancellations_product_name_idx" ON "returns_and_cancellations"("product_name");
CREATE INDEX IF NOT EXISTS "returns_and_cancellations_resellable_idx" ON "returns_and_cancellations"("resellable");

-- Marketplace Reimbursements Indexes
CREATE INDEX IF NOT EXISTS "marketplace_reimbursements_reimbursement_type_idx" ON "marketplace_reimbursements"("reimbursement_type");
CREATE INDEX IF NOT EXISTS "marketplace_reimbursements_status_idx" ON "marketplace_reimbursements"("status");
CREATE INDEX IF NOT EXISTS "marketplace_reimbursements_marketplace_idx" ON "marketplace_reimbursements"("marketplace");
CREATE INDEX IF NOT EXISTS "marketplace_reimbursements_incident_date_idx" ON "marketplace_reimbursements"("incident_date");
CREATE INDEX IF NOT EXISTS "marketplace_reimbursements_claim_date_idx" ON "marketplace_reimbursements"("claim_date");

-- Commission Adjustments Indexes
CREATE INDEX IF NOT EXISTS "commission_adjustments_adjustment_type_idx" ON "commission_adjustments"("adjustment_type");
CREATE INDEX IF NOT EXISTS "commission_adjustments_marketplace_idx" ON "commission_adjustments"("marketplace");
CREATE INDEX IF NOT EXISTS "commission_adjustments_transaction_date_idx" ON "commission_adjustments"("transaction_date");
CREATE INDEX IF NOT EXISTS "commission_adjustments_adjustment_date_idx" ON "commission_adjustments"("adjustment_date");
CREATE INDEX IF NOT EXISTS "commission_adjustments_dynamic_rate_applied_idx" ON "commission_adjustments"("dynamic_rate_applied");

-- Affiliate Samples Indexes
CREATE INDEX IF NOT EXISTS "affiliate_samples_affiliate_name_idx" ON "affiliate_samples"("affiliate_name");
CREATE INDEX IF NOT EXISTS "affiliate_samples_affiliate_platform_idx" ON "affiliate_samples"("affiliate_platform");
CREATE INDEX IF NOT EXISTS "affiliate_samples_product_name_idx" ON "affiliate_samples"("product_name");
CREATE INDEX IF NOT EXISTS "affiliate_samples_given_date_idx" ON "affiliate_samples"("given_date");
CREATE INDEX IF NOT EXISTS "affiliate_samples_status_idx" ON "affiliate_samples"("status");
CREATE INDEX IF NOT EXISTS "affiliate_samples_content_delivered_idx" ON "affiliate_samples"("content_delivered");
CREATE INDEX IF NOT EXISTS "affiliate_samples_campaign_name_idx" ON "affiliate_samples"("campaign_name");

-- Insert some sample data for testing (optional)
-- You can uncomment these if you want sample data for development

/*
-- Sample Returns Data
INSERT INTO "returns_and_cancellations" (
    "id", "type", "return_date", "returned_amount", "product_name", "marketplace", "reason"
) VALUES 
('ret_001', 'return', '2024-01-15', 150000, 'Dress Batik Premium', 'TikTok Shop', 'Size tidak sesuai'),
('ret_002', 'cancel', '2024-01-20', 200000, 'Blouse Modern', 'Shopee', 'Customer berubah pikiran');

-- Sample Reimbursement Data
INSERT INTO "marketplace_reimbursements" (
    "id", "reimbursement_type", "claim_amount", "incident_date", "claim_date", "marketplace", "status"
) VALUES 
('reimb_001', 'lost_package', 175000, '2024-01-10', '2024-01-12', 'TikTok Shop', 'approved'),
('reimb_002', 'fake_checkout', 250000, '2024-01-18', '2024-01-19', 'Shopee', 'pending');

-- Sample Commission Adjustment Data
INSERT INTO "commission_adjustments" (
    "id", "adjustment_type", "original_commission", "adjustment_amount", "marketplace", "transaction_date", "adjustment_date"
) VALUES 
('comm_001', 'return_commission_loss', 15000, -15000, 'TikTok Shop', '2024-01-15', '2024-01-16'),
('comm_002', 'dynamic_commission', 20000, -5000, 'TikTok Shop', '2024-01-20', '2024-01-21');

-- Sample Affiliate Sample Data
INSERT INTO "affiliate_samples" (
    "id", "affiliate_name", "product_name", "total_cost", "given_date", "status"
) VALUES 
('aff_001', 'Influencer_A', 'Dress Batik Limited Edition', 125000, '2024-01-05', 'content_created'),
('aff_002', 'Influencer_B', 'Koleksi Lebaran 2024', 200000, '2024-01-10', 'sent');
*/

-- Create triggers to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all new tables
DROP TRIGGER IF EXISTS update_returns_and_cancellations_updated_at ON "returns_and_cancellations";
CREATE TRIGGER update_returns_and_cancellations_updated_at
    BEFORE UPDATE ON "returns_and_cancellations"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_reimbursements_updated_at ON "marketplace_reimbursements";
CREATE TRIGGER update_marketplace_reimbursements_updated_at
    BEFORE UPDATE ON "marketplace_reimbursements"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commission_adjustments_updated_at ON "commission_adjustments";
CREATE TRIGGER update_commission_adjustments_updated_at
    BEFORE UPDATE ON "commission_adjustments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_samples_updated_at ON "affiliate_samples";
CREATE TRIGGER update_affiliate_samples_updated_at
    BEFORE UPDATE ON "affiliate_samples"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();