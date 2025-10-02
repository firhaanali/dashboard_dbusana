const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedStockData() {
  try {
    console.log('🌱 Starting stock data seed...');

    // Check if products exist first
    const products = await prisma.productData.findMany({
      take: 10,
      select: {
        product_code: true,
        product_name: true,
        stock_quantity: true
      }
    });

    if (products.length === 0) {
      console.log('📦 No products found. Creating sample products first...');
      
      // Create sample products
      const sampleProducts = [
        {
          product_code: 'DBT-001',
          product_name: 'Dress Batik Traditional Blue',
          category: 'Dress',
          brand: 'D\'Busana',
          size: 'M',
          color: 'Blue',
          price: 350000,
          cost: 200000,
          stock_quantity: 15,
          min_stock: 5
        },
        {
          product_code: 'DBT-002',
          product_name: 'Blouse Batik Modern Red',
          category: 'Blouse',
          brand: 'D\'Busana',
          size: 'L',
          color: 'Red',
          price: 175000,
          cost: 100000,
          stock_quantity: 25,
          min_stock: 8
        },
        {
          product_code: 'DBT-003',
          product_name: 'Kebaya Traditional Yellow',
          category: 'Kebaya',
          brand: 'D\'Busana',
          size: 'S',
          color: 'Yellow',
          price: 450000,
          cost: 300000,
          stock_quantity: 10,
          min_stock: 3
        }
      ];

      for (const productData of sampleProducts) {
        await prisma.productData.upsert({
          where: { product_code: productData.product_code },
          update: productData,
          create: productData
        });
      }

      console.log('✅ Created sample products');
      
      // Refresh products list
      const newProducts = await prisma.productData.findMany({
        take: 10,
        select: {
          product_code: true,
          product_name: true,
          stock_quantity: true
        }
      });
      products.push(...newProducts);
    }

    console.log(`📦 Found ${products.length} products for stock movements`);

    // Create sample stock movements
    const stockMovements = [];
    const now = new Date();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Create some historical movements
      for (let j = 0; j < 3; j++) {
        const daysBack = Math.floor(Math.random() * 30);
        const movementDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        
        const movementTypes = ['in', 'out', 'adjustment'];
        const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        
        let quantity;
        switch (movementType) {
          case 'in':
            quantity = Math.floor(Math.random() * 20) + 5; // 5-25 items in
            break;
          case 'out':
            quantity = Math.floor(Math.random() * 10) + 1; // 1-10 items out
            break;
          case 'adjustment':
            quantity = product.stock_quantity + Math.floor(Math.random() * 10) - 5; // Adjust around current stock
            break;
        }

        stockMovements.push({
          product_code: product.product_code,
          movement_type: movementType,
          quantity: quantity,
          reference_number: `REF-${Date.now()}-${i}-${j}`,
          notes: `Sample ${movementType} movement for ${product.product_name}`,
          movement_date: movementDate
        });
      }
    }

    // Insert stock movements
    for (const movement of stockMovements) {
      try {
        await prisma.stockData.create({
          data: movement
        });
      } catch (error) {
        console.log(`⚠️ Skipped movement for ${movement.product_code}: ${error.message}`);
      }
    }

    const totalCreated = await prisma.stockData.count();
    console.log(`✅ Stock seed completed! Created ${totalCreated} total stock movements`);

    // Show some statistics
    const stats = await prisma.stockData.groupBy({
      by: ['movement_type'],
      _count: {
        movement_type: true
      }
    });

    console.log('📊 Stock movement statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat.movement_type}: ${stat._count.movement_type} movements`);
    });

  } catch (error) {
    console.error('❌ Error seeding stock data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedStockData()
    .then(() => {
      console.log('🎉 Stock seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Stock seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedStockData;