const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Database configuration with correct defaults
const dbConfig = {
  user: process.env.DB_USER || 'firhan',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dbusana_db',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT) || 5432,
};

console.log('🔍 Database Configuration:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}`);

const pool = new Pool(dbConfig);

async function runUsersMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Users Migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../prisma/migrations/006_add_users_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Reading migration file...');
    console.log('🔄 Executing users migration...');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Users migration completed successfully!');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_sessions', 'user_activity_logs')
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    console.log('📋 Created tables:', result.rows.map(row => row.table_name));
    
    // Check if default users were created
    const usersCountQuery = 'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL';
    const usersCount = await client.query(usersCountQuery);
    console.log(`👥 Default users created: ${usersCount.rows[0].count}`);
    
    // Show created users
    const usersQuery = `
      SELECT username, email, full_name, role, status 
      FROM users 
      WHERE deleted_at IS NULL 
      ORDER BY created_at
    `;
    const users = await client.query(usersQuery);
    
    console.log('\n📊 Users in database:');
    users.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
    console.log('\n🎉 Users migration completed successfully!');
    console.log('\n📝 Default login credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Manager: manager1 / manager123');
    console.log('   Staff: staff1 / staff123');
    console.log('\n⚠️  Please change default passwords after first login!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  runUsersMigration()
    .then(() => {
      console.log('🏁 Migration script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runUsersMigration };