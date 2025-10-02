const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runAdvertisingSettlementEnumMigration() {
  console.log('🔄 RUNNING ADVERTISING SETTLEMENT ENUM MIGRATION...');
  
  try {
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/025_add_advertising_settlement_enum.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    console.log('SQL:', migrationSQL);
    
    // Execute the migration using raw SQL
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    
    // Test the new enum value
    console.log('🧪 Testing ADVERTISING_SETTLEMENT enum value...');
    
    // Check if the enum value exists by creating a test import batch
    const testBatch = await prisma.importBatch.create({
      data: {
        batch_name: 'Test ADVERTISING_SETTLEMENT Enum',
        import_type: 'ADVERTISING_SETTLEMENT',
        file_name: 'test.xlsx',
        file_type: 'excel',
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        imported_records: 0,
        status: 'completed'
      }
    });
    
    console.log('✅ Test batch created with ADVERTISING_SETTLEMENT:', testBatch.id);
    
    // Clean up test batch
    await prisma.importBatch.delete({
      where: { id: testBatch.id }
    });
    
    console.log('🗑️ Test batch cleaned up');
    
    console.log('\n🎉 ADVERTISING SETTLEMENT ENUM MIGRATION COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Added ADVERTISING_SETTLEMENT to ImportType enum');
    console.log('✅ Tested enum value creation');
    console.log('✅ Backend now supports import_type: "ADVERTISING_SETTLEMENT"');
    console.log('\n💡 The advertising settlement import should now work!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    
    if (error.message.includes('already exists')) {
      console.log('💡 Enum value already exists - this is expected if migration was run before');
      console.log('✅ Migration completed (enum value already present)');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runAdvertisingSettlementEnumMigration()
    .then(() => {
      console.log('🎯 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAdvertisingSettlementEnumMigration
};