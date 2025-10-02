const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runProductHPPMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🏗️  Running Product HPP Migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/024_add_product_hpp_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Product HPP table created successfully');
    console.log('📋 Migration completed successfully');

    // Verify the table was created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'product_hpp'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table verification passed - product_hpp table exists');
    } else {
      console.log('❌ Table verification failed - product_hpp table not found');
    }

    // Check columns
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_hpp'
      ORDER BY ordinal_position
    `);

    console.log('📊 Table structure:');
    columnCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'product_hpp'
    `);

    console.log('🔍 Indexes created:');
    indexCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runProductHPPMigration()
  .then(() => {
    console.log('🎉 Product HPP migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });