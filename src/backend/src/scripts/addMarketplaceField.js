const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function addMarketplaceField() {
  console.log('🚀 Starting marketplace field migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../prisma/migrations/002_add_marketplace_field.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Migration SQL loaded successfully');
    
    // Check if marketplace field already exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sales_data' 
      AND column_name = 'marketplace';
    `;
    
    if (tableInfo.length > 0) {
      console.log('✅ Marketplace field already exists!');
      
      // Check current data
      const marketplaceStats = await prisma.$queryRaw`
        SELECT 
          marketplace,
          COUNT(*) as count
        FROM sales_data 
        GROUP BY marketplace 
        ORDER BY count DESC;
      `;
      
      console.log('📊 Current marketplace distribution:');
      marketplaceStats.forEach(stat => {
        console.log(`   ${stat.marketplace || 'NULL'}: ${stat.count} records`);
      });
      
      return;
    }
    
    console.log('🔧 Adding marketplace field to database...');
    
    // Execute the migration
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    const verification = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN marketplace IS NOT NULL THEN 1 END) as records_with_marketplace,
        marketplace
      FROM sales_data 
      GROUP BY marketplace;
    `;
    
    console.log('🔍 Migration verification:');
    verification.forEach(stat => {
      console.log(`   ${stat.marketplace || 'NULL'}: ${stat.total_records} records`);
    });
    
    // Update Prisma schema
    console.log('🔄 Regenerating Prisma client...');
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('npx prisma generate', { cwd: path.join(__dirname, '../..') }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error regenerating Prisma client:', error);
          reject(error);
          return;
        }
        
        console.log('✅ Prisma client regenerated successfully!');
        console.log('🎉 Marketplace field migration completed!');
        
        console.log('\n📈 Next steps:');
        console.log('1. Restart your backend server');
        console.log('2. Update frontend components to use marketplace field');
        console.log('3. Update import functionality to include marketplace selection');
        
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  addMarketplaceField()
    .then(() => {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addMarketplaceField };