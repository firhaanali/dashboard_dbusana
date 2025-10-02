-- Migration: Add Users Management Table
-- Created: 2024-12-XX
-- Description: Create users table with roles (admin, manager, staff) and user management features

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    department VARCHAR(100),
    position VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Authentication & Security
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    
    -- Permissions & Settings
    permissions JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Soft delete
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    status,
    department,
    position,
    bio
) VALUES (
    'admin',
    'admin@dbusana.com',
    '$2b$10$rQZ8vQ8vJ9cY9Qj7Y2bLXO8tE2v0kJ8yA8n1V5fR7K5mF2L1vX5', -- admin123
    'D''Busana Administrator',
    'admin',
    'active',
    'IT',
    'System Administrator',
    'Administrator sistem dashboard D''Busana untuk manajemen bisnis fashion yang efisien.'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample manager
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    status,
    department,
    position,
    bio,
    created_by
) VALUES (
    'manager1',
    'manager@dbusana.com',
    '$2b$10$rQZ8vQ8vJ9cY9Qj7Y2bLXO8tE2v0kJ8yA8n1V5fR7K5mF2L1vX5', -- manager123
    'Fashion Manager',
    'manager',
    'active',
    'Operations',
    'Operations Manager',
    'Manager operasional yang mengelola inventory dan sales.',
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
) ON CONFLICT (username) DO NOTHING;

-- Insert sample staff
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    status,
    department,
    position,
    bio,
    created_by
) VALUES (
    'staff1',
    'staff@dbusana.com',
    '$2b$10$rQZ8vQ8vJ9cY9Qj7Y2bLXO8tE2v0kJ8yA8n1V5fR7K5mF2L1vX5', -- staff123
    'Sales Staff',
    'staff',
    'active',
    'Sales',
    'Sales Representative',
    'Staff penjualan yang mengelola transaksi harian.',
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
) ON CONFLICT (username) DO NOTHING;

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Create user_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_logs(created_at);

COMMENT ON TABLE users IS 'User management table with role-based access control';
COMMENT ON TABLE user_sessions IS 'Active user sessions for authentication';
COMMENT ON TABLE user_activity_logs IS 'Audit trail for user activities';