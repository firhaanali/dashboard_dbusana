-- Migration: Add Duplicate Check Tables
-- Description: Create tables for import duplicate checking and logging

-- Create duplicate_check_logs table
CREATE TABLE IF NOT EXISTS duplicate_check_logs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(64),
    import_type VARCHAR(50) NOT NULL,
    check_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_duplicate_check_logs_file_hash ON duplicate_check_logs(file_hash);
CREATE INDEX IF NOT EXISTS idx_duplicate_check_logs_import_type ON duplicate_check_logs(import_type);
CREATE INDEX IF NOT EXISTS idx_duplicate_check_logs_created_at ON duplicate_check_logs(created_at);

-- Add file_hash column to import_history table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'import_history' 
        AND column_name = 'file_hash'
    ) THEN
        ALTER TABLE import_history ADD COLUMN file_hash VARCHAR(64);
        CREATE INDEX IF NOT EXISTS idx_import_history_file_hash ON import_history(file_hash);
    END IF;
END $$;

-- Add metadata column to import_history table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'import_history' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE import_history ADD COLUMN metadata JSONB;
        CREATE INDEX IF NOT EXISTS idx_import_history_metadata ON import_history USING GIN(metadata);
    END IF;
END $$;

-- Create import_metadata table for detailed import analysis
CREATE TABLE IF NOT EXISTS import_metadata (
    id SERIAL PRIMARY KEY,
    import_history_id INTEGER REFERENCES import_history(id) ON DELETE CASCADE,
    metadata_type VARCHAR(50) NOT NULL, -- 'date_range', 'file_info', 'processing_info'
    metadata JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for import_metadata
CREATE INDEX IF NOT EXISTS idx_import_metadata_import_history_id ON import_metadata(import_history_id);
CREATE INDEX IF NOT EXISTS idx_import_metadata_type ON import_metadata(metadata_type);
CREATE INDEX IF NOT EXISTS idx_import_metadata_content ON import_metadata USING GIN(metadata);

-- Insert some sample duplicate check logs for testing
INSERT INTO duplicate_check_logs (file_name, file_size, import_type, check_result) VALUES
('sales_march_2024.xlsx', 25600, 'sales', '{"is_duplicate": false, "risk_level": "low", "similar_imports_count": 0}'),
('products_update.xlsx', 15360, 'products', '{"is_duplicate": false, "risk_level": "low", "similar_imports_count": 0}'),
('stock_movement.csv', 8192, 'stock', '{"is_duplicate": false, "risk_level": "low", "similar_imports_count": 0}')
ON CONFLICT DO NOTHING;

-- Update import_history with sample metadata
UPDATE import_history 
SET metadata = JSONB_BUILD_OBJECT(
    'file_type', CASE 
        WHEN file_name LIKE '%.xlsx' THEN 'excel'
        WHEN file_name LIKE '%.csv' THEN 'csv'
        ELSE 'unknown'
    END,
    'has_duplicate_check', false,
    'processing_version', '1.0'
)
WHERE metadata IS NULL;

COMMENT ON TABLE duplicate_check_logs IS 'Logs for import duplicate checking operations';
COMMENT ON TABLE import_metadata IS 'Extended metadata for import operations including date ranges and file analysis';
COMMENT ON COLUMN duplicate_check_logs.file_hash IS 'SHA-256 hash of file content for exact duplicate detection';
COMMENT ON COLUMN duplicate_check_logs.check_result IS 'JSON result of duplicate analysis including risk level and recommendations';
COMMENT ON COLUMN import_history.file_hash IS 'SHA-256 hash of imported file for duplicate detection';
COMMENT ON COLUMN import_history.metadata IS 'Extended metadata including date ranges, file info, and processing details';