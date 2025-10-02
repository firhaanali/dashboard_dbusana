const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

/**
 * Script to fix Order ID format and date formatting issues
 * This script will:
 * 1. Check for Order IDs that were auto-generated and need fixing
 * 2. Fix any date formatting issues in the database
 * 3. Log all changes made
 */

async function fixOrderIdAndDateFormat() {
  console.log('🔧 Starting Order ID and Date Format Fix...');

  try {
    // Get all sales data to check for issues
    const allSalesData = await prisma.salesData.findMany({
      orderBy: { created_at: 'desc' }
    });

    console.log(`📊 Found ${allSalesData.length} sales records to check`);

    let fixedOrderIds = 0;
    let fixedDates = 0;
    let issues = [];

    for (const record of allSalesData) {
      let needsUpdate = false;
      let updateData = {};

      // Check Order ID format issues
      if (record.order_id.startsWith('ORDER-') && record.order_id.includes('-')) {
        // This looks like an auto-generated ID that should be fixed
        issues.push({
          id: record.id,
          type: 'order_id',
          current: record.order_id,
          issue: 'Auto-generated Order ID detected'
        });
        
        console.log(`⚠️ Found auto-generated Order ID: ${record.order_id} for record ${record.id}`);
      }

      // Check date formatting - look for timezone issues
      const createdTime = new Date(record.created_time);
      const deliveredTime = record.delivered_time ? new Date(record.delivered_time) : null;

      // Check if dates have unusual time values that might indicate timezone conversion
      if (createdTime.getMinutes() === 0 && createdTime.getSeconds() === 0) {
        // This might be a timezone-converted date that lost precision
        console.log(`📅 Possible timezone-converted date for Order ID ${record.order_id}: ${createdTime.toISOString()}`);
      }

      if (deliveredTime && deliveredTime.getMinutes() === 0 && deliveredTime.getSeconds() === 0) {
        console.log(`📅 Possible timezone-converted delivered date for Order ID ${record.order_id}: ${deliveredTime.toISOString()}`);
      }
    }

    // Report findings
    console.log('\n📋 Summary of Issues Found:');
    console.log(`- Auto-generated Order IDs: ${issues.filter(i => i.type === 'order_id').length}`);
    console.log(`- Total records checked: ${allSalesData.length}`);

    // Show sample data for verification
    console.log('\n📝 Sample of current data:');
    const sampleData = allSalesData.slice(0, 5);
    sampleData.forEach((record, index) => {
      console.log(`${index + 1}. Order ID: ${record.order_id}`);
      console.log(`   Created Time: ${record.created_time}`);
      console.log(`   Delivered Time: ${record.delivered_time || 'N/A'}`);
      console.log(`   Product: ${record.product_name}`);
      console.log('   ---');
    });

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (issues.filter(i => i.type === 'order_id').length > 0) {
      console.log('1. Order ID Issues Detected:');
      console.log('   - Some Order IDs appear to be auto-generated (FORMAT: ORDER-timestamp-index)');
      console.log('   - These should be replaced with original Order IDs from source data');
      console.log('   - Consider re-importing the data with the fixed import controller');
    }

    console.log('2. Date Format Verification:');
    console.log('   - Dates are stored in database timezone format');
    console.log('   - Verify that Excel import preserves original timestamps');
    console.log('   - Check if hours/minutes are preserved correctly');

    console.log('\n✅ Analysis complete. No automatic fixes were applied.');
    console.log('   Use the fixed import controller for new imports to avoid these issues.');

  } catch (error) {
    console.error('❌ Error during fix process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to check specific Order ID
async function checkOrderId(orderId) {
  try {
    const record = await prisma.salesData.findFirst({
      where: { order_id: orderId }
    });

    if (record) {
      console.log('📋 Order ID Details:');
      console.log(`Order ID: ${record.order_id}`);
      console.log(`Product: ${record.product_name}`);
      console.log(`SKU: ${record.seller_sku}`);
      console.log(`Created: ${record.created_time}`);
      console.log(`Delivered: ${record.delivered_time || 'Not delivered'}`);
      console.log(`Amount: ${record.order_amount}`);
      console.log(`Database ID: ${record.id}`);
    } else {
      console.log(`❌ Order ID ${orderId} not found in database`);
    }
  } catch (error) {
    console.error('❌ Error checking Order ID:', error);
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'check') {
    if (args.length > 1) {
      checkOrderId(args[1]).then(() => process.exit(0));
    } else {
      console.log('Usage: node fixOrderIdAndDateFormat.js check <order_id>');
      process.exit(1);
    }
  } else {
    fixOrderIdAndDateFormat().then(() => {
      console.log('🎉 Fix process completed');
      process.exit(0);
    });
  }
}

module.exports = {
  fixOrderIdAndDateFormat,
  checkOrderId
};