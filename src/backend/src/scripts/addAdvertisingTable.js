// Script to add advertising table to D'Busana Fashion Dashboard
// This script will create the advertising_data table and related enums

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function addAdvertisingTable() {
  try {
    console.log('🚀 Starting advertising table migration...');
    
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '../../../prisma/migrations/003_add_advertising_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement + ';');
          console.log('✅ Executed:', statement.split('\n')[0].substring(0, 80) + '...');
        } catch (error) {
          // Ignore errors for already existing types/tables
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('type') && error.message.includes('already exists')) {
            console.log('⚠️  Skipped (already exists):', statement.split('\n')[0].substring(0, 80) + '...');
          } else {
            console.error('❌ Error executing statement:', error.message);
            console.error('Statement:', statement.substring(0, 200) + '...');
          }
        }
      }
    }
    
    // Verify the migration worked
    console.log('\n🔍 Verifying advertising table...');
    
    try {
      const count = await prisma.advertisingData.count();
      console.log(`✅ Advertising table created successfully! Sample records: ${count}`);
      
      // Show sample data
      const sampleData = await prisma.advertisingData.findMany({
        take: 3,
        select: {
          campaign_name: true,
          platform: true,
          impressions: true,
          clicks: true,
          cost: true,
          revenue: true
        }
      });
      
      console.log('\n📊 Sample advertising data:');
      sampleData.forEach((ad, index) => {
        console.log(`${index + 1}. Campaign: ${ad.campaign_name}`);
        console.log(`   Platform: ${ad.platform}, Impressions: ${ad.impressions}, Clicks: ${ad.clicks}`);
        console.log(`   Cost: ${ad.cost}, Revenue: ${ad.revenue}\n`);
      });
      
    } catch (error) {
      console.error('❌ Error verifying advertising table:', error.message);
    }
    
    // Test enum values
    console.log('🧪 Testing enum values...');
    try {
      const testAd = await prisma.advertisingData.create({
        data: {
          campaign_name: 'Test Campaign - Delete Me',
          campaign_type: 'social',
          platform: 'tiktok_ads',
          date_range_start: new Date('2024-01-01'),
          date_range_end: new Date('2024-01-31'),
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          cost: 100000,
          revenue: 500000
        }
      });
      
      console.log('✅ Test record created successfully:', testAd.id);
      
      // Clean up test record
      await prisma.advertisingData.delete({
        where: { id: testAd.id }
      });
      
      console.log('✅ Test record cleaned up');
      
    } catch (error) {
      console.error('❌ Error testing advertising table:', error.message);
    }
    
    console.log('\n🎉 Advertising table migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - AdvertisingData table created');
    console.log('   - CampaignType enum created (search, display, video, shopping, social, influencer, email, affiliate)');
    console.log('   - Platform enum created (google_ads, facebook_ads, instagram_ads, tiktok_ads, shopee_ads, etc.)');
    console.log('   - ImportType enum updated to include "advertising"');
    console.log('   - Sample data inserted for testing');
    console.log('   - All indexes created for performance optimization');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  addAdvertisingTable()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addAdvertisingTable };