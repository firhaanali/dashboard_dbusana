-- ✅ Activity Logs Table Migration
-- Stores real-time activity logs for D'Busana Dashboard
-- Created: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'info',
    metadata JSONB,
    user_id VARCHAR(100),
    related_id VARCHAR(100),
    related_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_logs_updated_at();

-- Insert initial system activity
INSERT INTO activity_logs (type, title, description, status, metadata) 
VALUES (
    'system', 
    'Activity Logging System', 
    'Activity logging system berhasil diinisialisasi untuk D''Busana Dashboard', 
    'success',
    '{"feature": "activity_logging", "version": "1.0", "migration": "019"}'
) ON CONFLICT DO NOTHING;

-- Migration completed
DO $$
BEGIN
    RAISE NOTICE 'Migration 019 completed: Activity Logs table created successfully with indexes and triggers';
END $$;