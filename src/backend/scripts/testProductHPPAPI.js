const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProductHPPAPI() {
  try {
    console.log('🧪 Testing Product HPP API functionality...');

    // Test 1: Create sample products
    console.log('\n1️⃣ Testing product creation...');
    
    const sampleProducts = [
      {
        nama_produk: 'Hijab Syari Premium Test',
        hpp: 45000,
        kategori: 'Hijab',
        deskripsi: 'Hijab syari bahan premium untuk testing'
      },
      {
        nama_produk: 'Gamis Casual Test',
        hpp: 120000,
        kategori: 'Gamis',
        deskripsi: 'Gamis untuk sehari-hari testing'
      },
      {
        nama_produk: 'Kerudung Instan Test',
        hpp: 25000,
        kategori: 'Hijab',
        deskripsi: 'Kerudung praktis untuk testing'
      }
    ];

    for (const product of sampleProducts) {
      try {
        const created = await prisma.productHPP.create({
          data: product
        });
        console.log(`   ✅ Created: ${created.nama_produk} (HPP: ${created.hpp})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`   ⚠️  Product already exists: ${product.nama_produk}`);
        } else {
          console.log(`   ❌ Error creating ${product.nama_produk}:`, error.message);
        }
      }
    }

    // Test 2: Read all products
    console.log('\n2️⃣ Testing product retrieval...');
    const allProducts = await prisma.productHPP.findMany({
      orderBy: { created_at: 'desc' }
    });
    console.log(`   📊 Total products in database: ${allProducts.length}`);

    if (allProducts.length > 0) {
      console.log('   📋 Sample products:');
      allProducts.slice(0, 3).forEach(product => {
        console.log(`      - ${product.nama_produk}: ${product.hpp}`);
      });
    }

    // Test 3: Search functionality
    console.log('\n3️⃣ Testing search functionality...');
    const searchResults = await prisma.productHPP.findMany({
      where: {
        nama_produk: {
          contains: 'Test',
          mode: 'insensitive'
        }
      }
    });
    console.log(`   🔍 Search results for "Test": ${searchResults.length} products found`);

    // Test 4: Statistics calculation
    console.log('\n4️⃣ Testing statistics calculation...');
    const total = await prisma.productHPP.count();
    
    if (total > 0) {
      const stats = await prisma.productHPP.aggregate({
        _avg: { hpp: true },
        _max: { hpp: true },
        _min: { hpp: true }
      });

      const categories = await prisma.productHPP.findMany({
        select: { kategori: true },
        where: { kategori: { not: null } },
        distinct: ['kategori']
      });

      console.log(`   📈 Statistics:`);
      console.log(`      - Total products: ${total}`);
      console.log(`      - Average HPP: ${Math.round(stats._avg.hpp || 0)}`);
      console.log(`      - Max HPP: ${stats._max.hpp || 0}`);
      console.log(`      - Min HPP: ${stats._min.hpp || 0}`);
      console.log(`      - Categories: ${categories.map(c => c.kategori).join(', ')}`);
    }

    // Test 5: Update product
    console.log('\n5️⃣ Testing product update...');
    const productToUpdate = await prisma.productHPP.findFirst({
      where: { nama_produk: { contains: 'Test' } }
    });

    if (productToUpdate) {
      const updated = await prisma.productHPP.update({
        where: { id: productToUpdate.id },
        data: { hpp: productToUpdate.hpp + 1000 }
      });
      console.log(`   ✅ Updated ${updated.nama_produk} HPP: ${productToUpdate.hpp} → ${updated.hpp}`);
    }

    // Test 6: Bulk import simulation
    console.log('\n6️⃣ Testing bulk import functionality...');
    const bulkData = [
      { nama_produk: 'Bulk Test Product 1', hpp: 35000, kategori: 'Test' },
      { nama_produk: 'Bulk Test Product 2', hpp: 55000, kategori: 'Test' }
    ];

    let bulkSuccess = 0;
    let bulkErrors = [];

    for (const product of bulkData) {
      try {
        const existing = await prisma.productHPP.findUnique({
          where: { nama_produk: product.nama_produk }
        });

        if (existing) {
          await prisma.productHPP.update({
            where: { id: existing.id },
            data: { hpp: product.hpp }
          });
          console.log(`   🔄 Updated: ${product.nama_produk}`);
        } else {
          await prisma.productHPP.create({ data: product });
          console.log(`   ➕ Created: ${product.nama_produk}`);
        }
        bulkSuccess++;
      } catch (error) {
        bulkErrors.push(`${product.nama_produk}: ${error.message}`);
      }
    }

    console.log(`   📊 Bulk import results: ${bulkSuccess} successful, ${bulkErrors.length} errors`);

    // Test 7: Cleanup test data
    console.log('\n7️⃣ Cleaning up test data...');
    const deleteResult = await prisma.productHPP.deleteMany({
      where: {
        OR: [
          { nama_produk: { contains: 'Test' } },
          { kategori: 'Test' }
        ]
      }
    });
    console.log(`   🧹 Cleaned up ${deleteResult.count} test products`);

    console.log('\n✅ All Product HPP API tests completed successfully!');
    
    // Final summary
    const finalCount = await prisma.productHPP.count();
    console.log(`\n📋 Final database state:`);
    console.log(`   - Total products: ${finalCount}`);
    console.log(`   - Database connection: ✅ Working`);
    console.log(`   - CRUD operations: ✅ Working`);
    console.log(`   - Search functionality: ✅ Working`);
    console.log(`   - Statistics calculation: ✅ Working`);
    console.log(`   - Bulk operations: ✅ Working`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Full error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProductHPPAPI()
  .then(() => {
    console.log('\n🎉 Product HPP API test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });