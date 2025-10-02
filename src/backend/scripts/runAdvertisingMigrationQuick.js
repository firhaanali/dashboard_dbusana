const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runQuickAdvertisingMigration() {
  console.log('🚀 Quick Advertising Migration...');
  
  try {
    // Step 1: Check if advertising_data table exists
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'advertising_data'
      );
    `);
    
    console.log('📊 Table exists check:', tableExists[0].exists);
    
    if (!tableExists[0].exists) {
      console.log('🔧 Creating advertising_data table...');
      
      // Create table with new structure
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "advertising_data" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "campaign_name" TEXT NOT NULL,
          "ad_creative_type" TEXT,
          "ad_creative" TEXT,
          "account_name" TEXT,
          "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "conversions" INTEGER NOT NULL DEFAULT 0,
          "cpa" DECIMAL(15,2),
          "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "roi" DECIMAL(10,4),
          "impressions" INTEGER NOT NULL DEFAULT 0,
          "clicks" INTEGER NOT NULL DEFAULT 0,
          "ctr" DECIMAL(10,4),
          "conversion_rate" DECIMAL(10,4),
          "date_start" DATE NOT NULL,
          "date_end" DATE NOT NULL,
          "marketplace" TEXT,
          "import_batch_id" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ advertising_data table created');
    } else {
      console.log('✅ advertising_data table already exists');
    }

    // Step 2: Verify table structure
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'advertising_data' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // Step 3: Test basic operations
    const count = await prisma.advertisingData.count();
    console.log(`📊 Current records: ${count}`);
    
    console.log('🎉 Quick Migration Completed!');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runQuickAdvertisingMigration()
    .then(result => {
      if (result.success) {
        console.log('✅ Quick migration completed successfully');
        process.exit(0);
      } else {
        console.log('❌ Quick migration failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Script error:', error);
      process.exit(1);
    });
}

module.exports = { runQuickAdvertisingMigration };