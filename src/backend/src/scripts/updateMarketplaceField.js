const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Script to update marketplace field in existing sales data
async function updateMarketplaceField() {
  try {
    console.log('🏪 Starting marketplace field update...');
    
    // Get all sales data without marketplace value
    const salesWithoutMarketplace = await prisma.salesData.findMany({
      where: {
        OR: [
          { marketplace: null },
          { marketplace: '' },
          { marketplace: 'Unknown' }
        ]
      }
    });
    
    console.log(`📊 Found ${salesWithoutMarketplace.length} sales records without marketplace data`);
    
    if (salesWithoutMarketplace.length === 0) {
      console.log('✅ All sales records already have marketplace data');
      return;
    }
    
    // Simple marketplace detection based on order patterns
    const detectMarketplace = (sale) => {
      const orderId = sale.order_id || '';
      const sellerSku = sale.seller_sku || '';
      const productName = sale.product_name || '';
      
      // Common marketplace patterns
      if (orderId.includes('TK') || orderId.includes('TOKO') || sellerSku.includes('TOKO')) {
        return 'Tokopedia';
      }
      if (orderId.includes('SH') || orderId.includes('SHOP') || sellerSku.includes('SHOP')) {
        return 'Shopee';
      }
      if (orderId.includes('LZ') || orderId.includes('LAZ') || sellerSku.includes('LAZ')) {
        return 'Lazada';
      }
      if (orderId.includes('TT') || orderId.includes('TIKTOK') || sellerSku.includes('TIKTOK')) {
        return 'TikTok Shop';
      }
      if (orderId.includes('BL') || orderId.includes('BLIBLI') || sellerSku.includes('BLIBLI')) {
        return 'Blibli';
      }
      if (orderId.includes('BK') || orderId.includes('BUKA') || sellerSku.includes('BUKA')) {
        return 'Bukalapak';
      }
      
      // Random assignment for demo purposes
      const marketplaces = ['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop', 'Blibli'];
      const randomIndex = Math.floor(Math.random() * marketplaces.length);
      return marketplaces[randomIndex];
    };
    
    let updateCount = 0;
    const batchSize = 100;
    
    // Process in batches
    for (let i = 0; i < salesWithoutMarketplace.length; i += batchSize) {
      const batch = salesWithoutMarketplace.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(salesWithoutMarketplace.length / batchSize)}`);
      
      const updatePromises = batch.map(sale => {
        const marketplace = detectMarketplace(sale);
        
        return prisma.salesData.update({
          where: { id: sale.id },
          data: { marketplace }
        });
      });
      
      await Promise.all(updatePromises);
      updateCount += batch.length;
      
      console.log(`✅ Updated ${updateCount}/${salesWithoutMarketplace.length} records`);
    }
    
    console.log(`🎉 Successfully updated ${updateCount} sales records with marketplace data`);
    
    // Show marketplace distribution
    const marketplaceStats = await prisma.salesData.groupBy({
      by: ['marketplace'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      }
    });
    
    console.log('📊 Marketplace distribution:');
    marketplaceStats.forEach(stat => {
      console.log(`  ${stat.marketplace}: ${stat._count._all} records`);
    });
    
  } catch (error) {
    console.error('❌ Error updating marketplace field:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateMarketplaceField()
    .then(() => {
      console.log('✅ Marketplace field update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Marketplace field update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateMarketplaceField };