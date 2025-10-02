#!/usr/bin/env node

// Script to run migration 016: Remove campaign_type and fix advertising_settlement table
// This script removes the redundant campaign_type column and ensures advertising_settlement table exists

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'dbusana_db',
  password: process.env.PGPASSWORD || 'your_password',
  port: process.env.PGPORT || 5432,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔧 Starting migration 016: Remove campaign_type and fix advertising_settlement...');
    console.log('📊 Database:', dbConfig.database);
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '016_remove_campaign_type_and_fix_settlement.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    console.log('📝 Executing migration SQL...');
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration 016 executed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying migration results...');
    
    // Check if campaign_type column was removed
    const campaignTypeCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'advertising_data' AND column_name = 'campaign_type'
    `);
    
    if (campaignTypeCheck.rows.length === 0) {
      console.log('✅ campaign_type column successfully removed from advertising_data table');
    } else {
      console.log('⚠️  campaign_type column still exists');
    }
    
    // Check if ad_creative_type column exists (should remain)
    const creativeTypeCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'advertising_data' AND column_name = 'ad_creative_type'
    `);
    
    if (creativeTypeCheck.rows.length > 0) {
      console.log('✅ ad_creative_type column exists (correct)');
    } else {
      console.log('⚠️  ad_creative_type column missing');
    }
    
    // Check if advertising_settlement table exists
    const settlementTableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'advertising_settlement'
    `);
    
    if (settlementTableCheck.rows.length > 0) {
      console.log('✅ advertising_settlement table exists');
      
      // Check settlement table structure
      const settlementColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'advertising_settlement' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 advertising_settlement table columns:');
      settlementColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
      });
    } else {
      console.log('❌ advertising_settlement table does not exist');
    }
    
    // Check ImportType enum
    const importTypeCheck = await pool.query(`
      SELECT unnest(enum_range(NULL::\"ImportType\")) as enum_value
    `);
    
    console.log('📋 ImportType enum values:');
    importTypeCheck.rows.forEach(row => {
      console.log(`   - ${row.enum_value}`);
    });
    
    console.log('\n🎉 Migration 016 completed successfully!');
    console.log('📝 Summary:');
    console.log('   - Removed redundant campaign_type column');
    console.log('   - Kept ad_creative_type column (correct one to use)');
    console.log('   - Ensured advertising_settlement table exists');
    console.log('   - Added advertising_settlement to ImportType enum');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Full error:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line execution
if (require.main === module) {
  console.log('🚀 D\'Busana Database Migration Tool');
  console.log('📋 Migration: Remove campaign_type and fix advertising_settlement\n');
  
  runMigration()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };