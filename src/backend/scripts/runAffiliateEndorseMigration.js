const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'dbusana_dashboard',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

async function runAffiliateEndorseMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Affiliate Endorse Tables Migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/018_add_affiliate_endorse_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    
    console.log('📝 Executing affiliate endorse tables migration...');
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    
    console.log('✅ Affiliate Endorse Tables Migration completed successfully!');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('affiliate_endorsements', 'affiliate_product_sales')
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check indexes
    const indexesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes 
      WHERE tablename IN ('affiliate_endorsements', 'affiliate_product_sales')
      ORDER BY tablename, indexname;
    `);
    
    console.log('🔍 Created indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.tablename}.${row.indexname}`);
    });
    
    // Test data insertion
    console.log('🧪 Testing data insertion...');
    
    const testEndorsement = await client.query(`
      INSERT INTO affiliate_endorsements (
        id, campaign_name, affiliate_name, affiliate_type, 
        start_date, end_date, endorse_fee, status, platform
      ) VALUES (
        'test_endorse_1', 
        'Test Campaign', 
        'Test Affiliate', 
        'Micro Influencer (1K-100K)',
        '2024-12-01', 
        '2024-12-15', 
        500000, 
        'active',
        ARRAY['TikTok Shop', 'Shopee']
      ) RETURNING id;
    `);
    
    const endorsementId = testEndorsement.rows[0].id;
    
    await client.query(`
      INSERT INTO affiliate_product_sales (
        id, endorsement_id, product_name, quantity, unit_price, total_sales, commission
      ) VALUES (
        'test_product_sale_1',
        $1,
        'Test Product',
        10,
        50000,
        500000,
        50000
      );
    `, [endorsementId]);
    
    console.log('✅ Test data inserted successfully!');
    
    // Clean up test data
    await client.query('DELETE FROM affiliate_endorsements WHERE id = $1', [endorsementId]);
    console.log('🧹 Test data cleaned up!');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✓ affiliate_endorsements table created');
    console.log('   ✓ affiliate_product_sales table created');
    console.log('   ✓ Foreign key relationships established');
    console.log('   ✓ Performance indexes created');
    console.log('   ✓ Data insertion tested');
    console.log('\n🚀 You can now use the Affiliate Endorse Manager with proper database tables!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runAffiliateEndorseMigration().catch(console.error);