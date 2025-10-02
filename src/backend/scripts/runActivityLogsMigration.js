const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'dbusana_dashboard',
  password: process.env.DB_PASSWORD || 'admin123',
  port: process.env.DB_PORT || 5432,
});

async function runActivityLogsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Activity Logs Migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/019_add_activity_logs_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Activity Logs Migration completed successfully!');
    
    // Verify table was created
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ activity_logs table verified');
      
      // Check if indexes were created
      const indexCheck = await client.query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename = 'activity_logs';
      `);
      
      console.log('✅ Indexes created:', indexCheck.rows.map(r => r.indexname));
      
      // Check initial data
      const dataCheck = await client.query('SELECT COUNT(*) FROM activity_logs');
      console.log('📊 Initial activity logs count:', dataCheck.rows[0].count);
      
    } else {
      console.error('❌ activity_logs table was not created');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runActivityLogsMigration()
    .then(() => {
      console.log('🎉 Activity Logs Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runActivityLogsMigration };