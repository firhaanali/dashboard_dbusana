-- Migration: Add import_history table
-- Created: 2024-12-19
-- Purpose: Store detailed history of all data imports

CREATE TABLE IF NOT EXISTS import_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(100),
    import_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    total_records INTEGER NOT NULL,
    imported_records INTEGER NOT NULL,
    failed_records INTEGER DEFAULT 0,
    duplicate_records INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_records > 0 THEN (imported_records::DECIMAL / total_records::DECIMAL) * 100
            ELSE 0
        END
    ) STORED,
    processing_time_ms INTEGER,
    import_status VARCHAR(20) DEFAULT 'completed',
    error_details TEXT,
    import_summary JSONB,
    source_ip VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_import_history_timestamp ON import_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_type ON import_history(import_type);
CREATE INDEX IF NOT EXISTS idx_import_history_user ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(import_status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_import_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_import_history_updated_at
    BEFORE UPDATE ON import_history
    FOR EACH ROW
    EXECUTE FUNCTION update_import_history_updated_at();

-- Add some sample data for testing
INSERT INTO import_history (
    import_type, 
    file_name, 
    file_size, 
    total_records, 
    imported_records, 
    failed_records, 
    duplicate_records,
    processing_time_ms,
    import_summary,
    user_id
) VALUES 
(
    'sales', 
    'sales_data_2024.xlsx', 
    153600, 
    150, 
    148, 
    1, 
    1,
    2340,
    '{"marketplace_breakdown": {"tokopedia": 45, "shopee": 52, "tiktok": 51}, "date_range": "2024-01-01 to 2024-12-19"}',
    'admin'
),
(
    'products', 
    'product_master.xlsx', 
    89200, 
    75, 
    75, 
    0, 
    0,
    1890,
    '{"categories_added": 12, "brands_added": 8, "variants_created": 45}',
    'admin'
),
(
    'stock', 
    'stock_update_dec.xlsx', 
    45800, 
    120, 
    118, 
    2, 
    0,
    1567,
    '{"total_stock_value": 25000000, "products_updated": 118, "warnings": 2}',
    'admin'
);

COMMENT ON TABLE import_history IS 'Comprehensive history tracking for all data imports';
COMMENT ON COLUMN import_history.success_rate IS 'Automatically calculated success percentage';
COMMENT ON COLUMN import_history.import_summary IS 'JSON field for flexible import metadata and statistics';