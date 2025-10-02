const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runCampaignTypeMigration() {
  try {
    console.log('🔄 Running Campaign Type Migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/014_add_campaign_type_column.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL commands (handle multiple statements)
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Found ${sqlCommands.length} SQL commands to execute:`);
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`   ${i + 1}. ${command.substring(0, 50)}...`);
      
      try {
        await prisma.$executeRawUnsafe(command);
        console.log(`   ✅ Command ${i + 1} executed successfully`);
      } catch (error) {
        // Check if error is about column already existing
        if (error.message.includes('already exists') || error.message.includes('duplicate column name')) {
          console.log(`   ⚠️  Command ${i + 1} skipped (column already exists)`);
        } else {
          console.error(`   ❌ Error executing command ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if campaign_type column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'advertising_data' 
      AND column_name = 'campaign_type';
    `;
    
    if (tableInfo.length > 0) {
      console.log('✅ campaign_type column added successfully');
      console.log(`   Column details: ${JSON.stringify(tableInfo[0])}`);
    } else {
      console.error('❌ campaign_type column not found');
    }
    
    // Check existing data
    const existingDataCount = await prisma.advertisingData.count();
    console.log(`📊 Total advertising records: ${existingDataCount}`);
    
    if (existingDataCount > 0) {
      const withCampaignType = await prisma.advertisingData.count({
        where: { campaign_type: { not: null } }
      });
      console.log(`📊 Records with campaign_type: ${withCampaignType}`);
      console.log(`📊 Records without campaign_type: ${existingDataCount - withCampaignType}`);
    }
    
    console.log('\n✅ Campaign Type migration completed successfully!');
    
    return {
      success: true,
      totalRecords: existingDataCount,
      recordsWithCampaignType: existingDataCount > 0 ? await prisma.advertisingData.count({
        where: { campaign_type: { not: null } }
      }) : 0
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

// Run migration if called directly
if (require.main === module) {
  runCampaignTypeMigration()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Migration failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Migration script error:', error);
      process.exit(1);
    });
}

module.exports = { runCampaignTypeMigration };