-- Migration: Add customer column to sales_data table
-- Created: 2024-12-19
-- Purpose: Add customer information to sales data for customer analytics

-- Add customer column to sales_data table
ALTER TABLE sales_data 
ADD COLUMN customer VARCHAR(255);

-- Create index for customer column for performance
CREATE INDEX IF NOT EXISTS idx_sales_data_customer ON sales_data(customer);

-- Add some sample customer data to existing records for testing
UPDATE sales_data 
SET customer = CASE 
    WHEN id % 10 = 0 THEN 'Customer Premium A'
    WHEN id % 10 = 1 THEN 'Customer Premium B'
    WHEN id % 10 = 2 THEN 'Customer Regular C'
    WHEN id % 10 = 3 THEN 'Customer VIP D'
    WHEN id % 10 = 4 THEN 'Customer Regular E'
    WHEN id % 10 = 5 THEN 'Customer Premium F'
    WHEN id % 10 = 6 THEN 'Customer Regular G'
    WHEN id % 10 = 7 THEN 'Customer VIP H'
    WHEN id % 10 = 8 THEN 'Customer Regular I'
    ELSE 'Customer Premium J'
END
WHERE customer IS NULL;

COMMENT ON COLUMN sales_data.customer IS 'Customer name or identifier for sales tracking and analytics';