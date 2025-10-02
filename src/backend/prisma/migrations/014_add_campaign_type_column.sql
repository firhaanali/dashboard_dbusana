-- Migration: Add campaign_type column to advertising_data table
-- Date: 2025-01-07

-- Add campaign_type column to advertising_data table
ALTER TABLE advertising_data 
ADD COLUMN campaign_type TEXT;

-- Add index for performance on campaign_type
CREATE INDEX IF NOT EXISTS idx_advertising_data_campaign_type 
ON advertising_data(campaign_type);

-- Update existing records with default campaign_type based on cost/revenue ratio
UPDATE advertising_data 
SET campaign_type = CASE 
  WHEN revenue > cost * 1.5 THEN 'Sales Conversion'
  WHEN revenue > 0 THEN 'Brand Awareness'
  ELSE 'Experimental'
END 
WHERE campaign_type IS NULL;