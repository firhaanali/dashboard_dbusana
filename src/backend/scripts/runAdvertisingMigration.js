const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runAdvertisingMigration() {
  console.log('🚀 Starting Advertising Table Migration...');
  
  try {
    // Step 1: Run the SQL migration
    const migrationPath = path.join(__dirname, '../prisma/migrations/013_update_advertising_columns.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .filter(stmt => stmt.trim().length > 0)
        .filter(stmt => !stmt.trim().startsWith('--'))
        .filter(stmt => !stmt.trim().startsWith('/*'));

      console.log(`📊 Executing ${statements.length} migration statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          try {
            console.log(`   ${i + 1}. Executing statement...`);
            await prisma.$executeRawUnsafe(statement);
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          } catch (error) {
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('relation') && error.message.includes('already exists')) {
              console.log(`   ⚠️ Statement ${i + 1} skipped (already exists)`);
            } else {
              console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
            }
          }
        }
      }
    } else {
      console.log('📄 Migration file not found, creating table manually...');
      
      // Create table manually if migration file doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "advertising_data" (
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
      
      // Create indexes
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "advertising_data_campaign_name_idx" ON "advertising_data"("campaign_name");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "advertising_data_account_name_idx" ON "advertising_data"("account_name");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "advertising_data_date_start_idx" ON "advertising_data"("date_start");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "advertising_data_date_end_idx" ON "advertising_data"("date_end");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "advertising_data_marketplace_idx" ON "advertising_data"("marketplace");`);
      
      console.log('✅ Advertising table created manually');
    }

    // Step 2: Verify table structure
    console.log('\n🔍 Verifying table structure...');
    
    const tableInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'advertising_data' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Step 3: Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    try {
      // Count existing records
      const count = await prisma.advertisingData.count();
      console.log(`✅ Current advertising records: ${count}`);
      
      // Try to create a test record
      const testRecord = await prisma.advertisingData.create({
        data: {
          campaign_name: 'Test Campaign Migration',
          ad_creative_type: 'Video',
          ad_creative: 'Test Creative',
          account_name: 'Test Account',
          cost: 100.00,
          conversions: 5,
          cpa: 20.00,
          revenue: 500.00,
          roi: 400.00,
          impressions: 10000,
          clicks: 100,
          ctr: 1.0,
          conversion_rate: 5.0,
          date_start: new Date('2025-01-01'),
          date_end: new Date('2025-01-07'),
          marketplace: 'TikTok Shop'
        }
      });
      
      console.log(`✅ Test record created with ID: ${testRecord.id}`);
      
      // Clean up test record
      await prisma.advertisingData.delete({
        where: { id: testRecord.id }
      });
      
      console.log('✅ Test record cleaned up');
      
    } catch (error) {
      console.error('❌ Error during basic operations test:', error.message);
    }

    console.log('\n🎉 Advertising Migration Completed Successfully!');
    console.log('\n📊 Next Steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test advertising data import with new Excel format');
    console.log('3. Check advertising dashboard for proper data display');
    
    return {
      success: true,
      message: 'Advertising migration completed successfully',
      tableColumns: tableInfo.length
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runAdvertisingMigration()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migration script completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Migration script failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Migration script error:', error);
      process.exit(1);
    });
}

module.exports = { runAdvertisingMigration };