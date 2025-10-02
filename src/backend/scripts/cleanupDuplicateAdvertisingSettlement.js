const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateAdvertisingSettlement() {
  console.log('🧹 Starting cleanup of duplicate advertising settlement data...');
  
  try {
    // First, check if there are any duplicates
    const duplicates = await prisma.$queryRaw`
      SELECT order_id, COUNT(*) as count 
      FROM advertising_settlement 
      GROUP BY order_id 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate order_ids found. Safe to proceed with migration.');
      return true;
    }
    
    console.log(`⚠️ Found ${duplicates.length} order_ids with duplicates:`);
    duplicates.forEach(dup => {
      console.log(`  - Order ID: ${dup.order_id} (${dup.count} duplicates)`);
    });
    
    console.log('\n🔄 Starting cleanup process...');
    
    for (const duplicate of duplicates) {
      const orderId = duplicate.order_id;
      
      // Get all records for this order_id, ordered by updated_at (keep the most recent)
      const records = await prisma.advertisingSettlement.findMany({
        where: { order_id: orderId },
        orderBy: { updated_at: 'desc' }
      });
      
      // Keep the first one (most recent), delete the rest
      const toKeep = records[0];
      const toDelete = records.slice(1);
      
      console.log(`📝 Order ID: ${orderId}`);
      console.log(`  Keeping: ID ${toKeep.id} (${toKeep.updated_at})`);
      console.log(`  Deleting: ${toDelete.length} older records`);
      
      // Delete the older duplicates
      for (const record of toDelete) {
        await prisma.advertisingSettlement.delete({
          where: { id: record.id }
        });
        console.log(`    ❌ Deleted ID: ${record.id} (${record.updated_at})`);
      }
    }
    
    // Verify cleanup
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT order_id, COUNT(*) as count 
      FROM advertising_settlement 
      GROUP BY order_id 
      HAVING COUNT(*) > 1
    `;
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Cleanup completed successfully. All order_ids are now unique.');
      return true;
    } else {
      console.log(`❌ Cleanup failed. Still ${remainingDuplicates.length} duplicates remaining.`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupDuplicateAdvertisingSettlement()
    .then(success => {
      if (success) {
        console.log('\n🎉 Cleanup completed. Ready for primary key migration.');
        process.exit(0);
      } else {
        console.log('\n❌ Cleanup failed. Please check the errors above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateAdvertisingSettlement };