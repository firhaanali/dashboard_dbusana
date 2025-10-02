-- Migration: Add Cash Flow Entry table for income and expense tracking
-- Created: 2024-12-19
-- Purpose: Enable persistent storage of manual cash flow entries (income/expenses)

-- Create enum for cash flow entry types
CREATE TYPE "CashFlowType" AS ENUM ('income', 'expense');

-- Create cash_flow_entries table
CREATE TABLE "cash_flow_entries" (
    "id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "entry_type" "CashFlowType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "marketplace" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_entries_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "cash_flow_entries_entry_date_idx" ON "cash_flow_entries"("entry_date");
CREATE INDEX "cash_flow_entries_entry_type_idx" ON "cash_flow_entries"("entry_type");
CREATE INDEX "cash_flow_entries_category_idx" ON "cash_flow_entries"("category");
CREATE INDEX "cash_flow_entries_source_idx" ON "cash_flow_entries"("source");

-- Table ready for user data input
-- No sample data inserted - ready for manual cash flow entry

COMMENT ON TABLE "cash_flow_entries" IS 'Table for storing manual cash flow entries (income and expenses)';
COMMENT ON COLUMN "cash_flow_entries"."entry_type" IS 'Type of cash flow entry: income or expense';
COMMENT ON COLUMN "cash_flow_entries"."amount" IS 'Amount in IDR (Indonesian Rupiah)';
COMMENT ON COLUMN "cash_flow_entries"."marketplace" IS 'Optional marketplace/platform for transaction';
COMMENT ON COLUMN "cash_flow_entries"."reference" IS 'Optional reference number (order ID, invoice, etc.)';