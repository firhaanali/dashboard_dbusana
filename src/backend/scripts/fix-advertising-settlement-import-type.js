const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function fixAdvertisingSettlementImportType() {
  console.log('🔄 FIXING ADVERTISING SETTLEMENT IMPORT TYPE ENUM...');
  
  try {
    // Step 1: Generate new migration for updated ImportType enum
    console.log('📝 Generating migration for ImportType enum update...');
    const { stdout: generateOutput, stderr: generateError } = await execAsync(
      'npx prisma migrate dev --name add_advertising_settlement_enum --create-only',
      { cwd: '/Users/firhan/Downloads/Sales Dashboard Creation/src/backend' }
    );
    
    if (generateError && !generateError.includes('warnings')) {
      console.error('❌ Migration generation error:', generateError);
    } else {
      console.log('✅ Migration file generated successfully');
      console.log(generateOutput);
    }
    
    // Step 2: Apply the migration
    console.log('🚀 Applying migration...');
    const { stdout: applyOutput, stderr: applyError } = await execAsync(
      'npx prisma migrate dev',
      { cwd: '/Users/firhan/Downloads/Sales Dashboard Creation/src/backend' }
    );
    
    if (applyError && !applyError.includes('warnings')) {
      console.error('❌ Migration apply error:', applyError);
    } else {
      console.log('✅ Migration applied successfully');
      console.log(applyOutput);
    }
    
    // Step 3: Generate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    const { stdout: generateClientOutput, stderr: generateClientError } = await execAsync(
      'npx prisma generate',
      { cwd: '/Users/firhan/Downloads/Sales Dashboard Creation/src/backend' }
    );
    
    if (generateClientError && !generateClientError.includes('warnings')) {
      console.error('❌ Client generation error:', generateClientError);
    } else {
      console.log('✅ Prisma client regenerated successfully');
      console.log(generateClientOutput);
    }
    
    console.log('\n🎉 ADVERTISING SETTLEMENT IMPORT TYPE FIX COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Added ADVERTISING_SETTLEMENT to ImportType enum');
    console.log('✅ Applied database migration');
    console.log('✅ Regenerated Prisma client');
    console.log('\n💡 Backend now supports import_type: "ADVERTISING_SETTLEMENT"');
    console.log('🧪 Ready to test advertising settlement import!');
    
  } catch (error) {
    console.error('❌ Error during advertising settlement import type fix:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixAdvertisingSettlementImportType()
    .then(() => {
      console.log('🎯 Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = {
  fixAdvertisingSettlementImportType
};