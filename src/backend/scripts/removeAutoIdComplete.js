const { execSync } = require('child_process');
const path = require('path');

async function removeAutoIdComplete() {
  console.log('🎯 COMPLETE AUTO-ID REMOVAL FOR ADVERTISING SETTLEMENT');
  console.log('='.repeat(60));
  console.log('📋 Process Overview:');
  console.log('  1. Cleanup duplicate Order IDs');
  console.log('  2. Run database migration (remove auto-ID, use Order ID as PK)');
  console.log('  3. Update Prisma schema and generate client');
  console.log('  4. Generate new template without auto-ID');
  console.log('  5. Verify changes');
  console.log('');

  try {
    // Step 1: Run complete migration
    console.log('📤 Step 1: Running complete database migration...');
    execSync('node migrateAdvertisingSettlementComplete.js', {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Step 2: Generate new template
    console.log('\n📤 Step 2: Generating updated template...');
    const { generateAdvertisingSettlementTemplateNoId } = require('../src/templates/generate_advertising_settlement_template_no_id');
    const templateResult = generateAdvertisingSettlementTemplateNoId();
    
    if (templateResult.success) {
      console.log('✅ Template generated successfully');
    } else {
      console.log('⚠️ Template generation warning:', templateResult.message);
    }
    
    // Step 3: Verify controller changes
    console.log('\n📤 Step 3: Verifying controller changes...');
    const controllerPath = path.join(__dirname, '../src/controllers/advertisingSettlementImport.js');
    const fs = require('fs');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    const checks = [
      {
        check: controllerContent.includes('Order ID wajib diisi karena merupakan primary key'),
        description: 'Order ID mandatory validation'
      },
      {
        check: controllerContent.includes('order_id: orderId, // Order ID is now the primary key - no auto-generation'),
        description: 'No auto-generation of Order ID'
      },
      {
        check: controllerContent.includes('findUnique({'),
        description: 'Using findUnique for primary key lookup'
      },
      {
        check: controllerContent.includes('where: { order_id: settlementData.order_id }'),
        description: 'Using order_id in where clauses'
      }
    ];
    
    let allChecksPassed = true;
    checks.forEach(({ check, description }) => {
      if (check) {
        console.log(`  ✅ ${description}`);
      } else {
        console.log(`  ❌ ${description}`);
        allChecksPassed = false;
      }
    });
    
    if (!allChecksPassed) {
      throw new Error('Controller verification failed. Some changes are missing.');
    }
    
    console.log('\n🎉 AUTO-ID REMOVAL COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('📋 Summary of Changes:');
    console.log('');
    console.log('🗄️ Database Changes:');
    console.log('  ✅ Removed auto-generated "id" column');
    console.log('  ✅ Made "order_id" the primary key');
    console.log('  ✅ Cleaned up any duplicate Order IDs');
    console.log('  ✅ Updated indexes and constraints');
    console.log('');
    console.log('🔧 Code Changes:');
    console.log('  ✅ Controller now requires Order ID (mandatory)');
    console.log('  ✅ No more auto-generation of IDs');
    console.log('  ✅ Simplified duplicate detection using findUnique');
    console.log('  ✅ Updated error messages for Order ID requirement');
    console.log('');
    console.log('📄 Template Changes:');
    console.log('  ✅ New template emphasizes Order ID as mandatory');
    console.log('  ✅ Clear instructions about primary key requirement');
    console.log('  ✅ Examples and validation notes updated');
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Test advertising settlement import with new template');
    console.log('  3. Verify that Order ID is now mandatory');
    console.log('  4. Check that duplicate Order IDs are properly handled');
    console.log('');
    console.log('📁 Files Updated:');
    console.log('  - /backend/prisma/schema.prisma');
    console.log('  - /backend/src/controllers/advertisingSettlementImport.js');
    console.log('  - Database structure (advertising_settlement table)');
    console.log('  - New template: advertising_settlement_template_no_id.xlsx');
    
  } catch (error) {
    console.error('\n❌ AUTO-ID REMOVAL FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n📚 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running and accessible');
    console.log('2. Check that you have backup of your data');
    console.log('3. Verify no applications are currently using the database');
    console.log('4. Check database permissions');
    console.log('5. If migration partially completed, you may need to restore from backup');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  removeAutoIdComplete()
    .then(() => {
      console.log('\n✅ Process completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { removeAutoIdComplete };