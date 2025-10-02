-- Migration: Remove auto-generated ID from advertising_settlement table
-- Use order_id as primary key instead

-- Step 1: Drop the existing primary key constraint and id column
ALTER TABLE advertising_settlement DROP CONSTRAINT advertising_settlement_pkey;
ALTER TABLE advertising_settlement DROP COLUMN id;

-- Step 2: Make order_id the primary key
ALTER TABLE advertising_settlement ADD PRIMARY KEY (order_id);

-- Step 3: Remove the unique constraint on order_id since it's now the primary key
ALTER TABLE advertising_settlement DROP CONSTRAINT IF EXISTS advertising_settlement_order_id_key;

-- Step 4: Add comment to document the change
COMMENT ON TABLE advertising_settlement IS 'Advertising settlement data - now uses order_id as primary key (no auto-generated ID)';
COMMENT ON COLUMN advertising_settlement.order_id IS 'Order ID from advertising platform - serves as primary key';