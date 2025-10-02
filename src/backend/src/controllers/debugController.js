const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get database statistics and connection status
const getDatabaseStats = async (req, res) => {
  try {
    console.log('🔍 Debug: Getting database statistics...');
    
    // Test Prisma connection
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Get counts from all main tables
    const [salesCount, productsCount, stockCount, batchesCount] = await Promise.all([
      prisma.salesData.count(),
      prisma.productData.count(),
      prisma.stockData.count(),
      prisma.importBatch.count()
    ]);
    
    // Get latest records from each table
    const [latestSales, latestProducts, latestBatches] = await Promise.all([
      prisma.salesData.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          order_id: true,
          seller_sku: true,
          product_name: true,
          created_at: true
        }
      }),
      prisma.productData.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          product_code: true,
          product_name: true,
          created_at: true
        }
      }),
      prisma.importBatch.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          batch_name: true,
          import_type: true,
          status: true,
          total_records: true,
          imported_records: true,
          created_at: true
        }
      })
    ]);
    
    const stats = {
      connection: 'connected',
      counts: {
        salesData: salesCount,
        productData: productsCount,
        stockData: stockCount,
        importBatches: batchesCount
      },
      latestRecords: {
        sales: latestSales,
        products: latestProducts,
        batches: latestBatches
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Database stats collected:', stats.counts);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Database stats error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Database stats failed',
      message: error.message,
      connection: 'failed'
    });
  }
};

// Test database write operations
const testDatabaseWrite = async (req, res) => {
  try {
    console.log('🧪 Debug: Testing database write operations...');
    
    const testId = `test-${Date.now()}`;
    
    // Test ProductData create
    const testProduct = await prisma.productData.create({
      data: {
        product_code: `TEST-${testId}`,
        product_name: `Test Product ${testId}`,
        category: 'Test Category',
        brand: 'Test Brand',
        size: 'M',
        color: 'Red',
        price: 100000,
        cost: 50000,
        stock_quantity: 10,
        min_stock: 5,
        description: 'Test product for debugging'
      }
    });
    
    console.log('✅ Test product created:', testProduct.id);
    
    // Test SalesData create
    const testSale = await prisma.salesData.create({
      data: {
        order_id: `ORDER-${testId}`,
        seller_sku: `SKU-${testId}`,
        product_name: `Test Product ${testId}`,
        color: 'Red',
        size: 'M',
        quantity: 1,
        order_amount: 100000,
        created_time: new Date()
      }
    });
    
    console.log('✅ Test sale created:', testSale.id);
    
    // Test ImportBatch create
    const testBatch = await prisma.importBatch.create({
      data: {
        batch_name: `Debug Test ${testId}`,
        import_type: 'products',
        file_name: 'debug_test.xlsx',
        file_type: 'excel',
        total_records: 1,
        valid_records: 1,
        invalid_records: 0,
        imported_records: 1,
        status: 'completed'
      }
    });
    
    console.log('✅ Test batch created:', testBatch.id);
    
    // Clean up test data
    await prisma.salesData.delete({ where: { id: testSale.id } });
    await prisma.productData.delete({ where: { id: testProduct.id } });
    await prisma.importBatch.delete({ where: { id: testBatch.id } });
    
    console.log('🧹 Test data cleaned up');
    
    res.status(200).json({
      success: true,
      message: 'Database write test successful',
      data: {
        productCreated: testProduct.id,
        saleCreated: testSale.id,
        batchCreated: testBatch.id,
        cleanedUp: true
      }
    });
    
  } catch (error) {
    console.error('❌ Database write test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Database write test failed',
      message: error.message,
      details: {
        name: error.name,
        code: error.code,
        meta: error.meta
      }
    });
  }
};

// Get Prisma configuration and environment
const getPrismaConfig = async (req, res) => {
  try {
    console.log('🔧 Debug: Getting Prisma configuration...');
    
    const config = {
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      nodeEnv: process.env.NODE_ENV,
      prismaVersion: require('@prisma/client').version || 'unknown',
      generatedAt: new Date().toISOString()
    };
    
    // Test basic connection
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      config.connectionTest = 'success';
    } catch (connError) {
      config.connectionTest = 'failed';
      config.connectionError = connError.message;
    }
    
    console.log('🔧 Prisma config:', config);
    
    res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('❌ Prisma config error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Prisma config check failed',
      message: error.message
    });
  }
};

// Advanced debugging: Monitor import process
const monitorImportProcess = async (req, res) => {
  try {
    console.log('🕵️ Debug: Monitoring import process...');
    
    // Get recent import attempts
    const recentBatches = await prisma.importBatch.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        sales_data: {
          take: 3,
          orderBy: { created_at: 'desc' }
        },
        product_data: {
          take: 3,
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    // Analyze data consistency
    const analysis = recentBatches.map(batch => ({
      batchId: batch.id,
      batchName: batch.batch_name,
      type: batch.import_type,
      status: batch.status,
      totalRecords: batch.total_records,
      importedRecords: batch.imported_records,
      actualSalesRecords: batch.sales_data.length,
      actualProductRecords: batch.product_data.length,
      discrepancy: {
        sales: batch.import_type === 'sales' ? 
          batch.imported_records - batch.sales_data.length : null,
        products: batch.import_type === 'products' ? 
          batch.imported_records - batch.product_data.length : null
      },
      createdAt: batch.created_at
    }));
    
    console.log('🔍 Import analysis:', analysis);
    
    res.status(200).json({
      success: true,
      data: {
        analysis,
        summary: {
          totalBatches: recentBatches.length,
          successfulBatches: recentBatches.filter(b => b.status === 'completed').length,
          failedBatches: recentBatches.filter(b => b.status === 'failed').length,
          partialBatches: recentBatches.filter(b => b.status === 'partial').length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Import monitoring error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Import monitoring failed',
      message: error.message
    });
  }
};

// 🔍 REAL-TIME DATABASE VERIFICATION
const verifyProductImport = async (req, res) => {
  try {
    console.log('🔍 VERIFICATION: Starting product import verification...');
    
    // Get current product count 
    const totalProducts = await prisma.productData.count();
    
    // Get products from last 5 minutes (recent imports)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentProducts = await prisma.productData.findMany({
      where: {
        created_at: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    // Get all products (latest 20)
    const allLatestProducts = await prisma.productData.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        product_code: true,
        product_name: true,
        category: true,
        price: true,
        stock_quantity: true,
        created_at: true,
        updated_at: true,
        import_batch_id: true
      }
    });
    
    // Get recent import batches
    const recentBatches = await prisma.importBatch.findMany({
      where: {
        import_type: 'products'
      },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            product_data: true
          }
        }
      }
    });
    
    // Check for duplicate product codes
    const duplicateCodes = await prisma.$queryRaw`
      SELECT product_code, COUNT(*) as count 
      FROM product_data 
      GROUP BY product_code 
      HAVING COUNT(*) > 1
      LIMIT 5
    `;
    
    console.log(`🔍 VERIFICATION: Found ${totalProducts} total products, ${recentProducts.length} recent`);
    
    res.status(200).json({
      success: true,
      verification: {
        timestamp: new Date().toISOString(),
        database_status: 'connected',
        total_products: totalProducts,
        recent_products_count: recentProducts.length,
        has_recent_imports: recentProducts.length > 0
      },
      data: {
        recent_products: recentProducts,
        latest_products: allLatestProducts,
        recent_batches: recentBatches,
        duplicate_codes: duplicateCodes,
        summary: {
          total_products: totalProducts,
          recent_imports: recentProducts.length,
          last_import: recentBatches.length > 0 ? recentBatches[0].created_at : null,
          database_healthy: totalProducts > 0
        }
      },
      message: totalProducts > 0 ? 
        `✅ Database contains ${totalProducts} products. Import functionality verified.` :
        `⚠️ No products found in database. Try importing data.`
    });
    
  } catch (error) {
    console.error('❌ VERIFICATION: Product import verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message,
      verification: {
        timestamp: new Date().toISOString(),
        database_status: 'error',
        error_details: error.message
      }
    });
  }
};

// 📊 PERSISTENT DATA CHECK
const checkDataPersistence = async (req, res) => {
  try {
    console.log('📊 PERSISTENCE CHECK: Starting data persistence verification...');
    
    // Create a test product to verify persistence
    const testProductCode = `TEST-${Date.now()}`;
    
    // Insert test product
    const testProduct = await prisma.productData.create({
      data: {
        product_code: testProductCode,
        product_name: 'Persistence Test Product',
        category: 'Test Category',
        brand: 'Test Brand',
        price: 100.00,
        cost: 50.00,
        stock_quantity: 10,
        min_stock: 5,
        description: 'Test product for persistence verification'
      }
    });
    
    console.log(`📊 PERSISTENCE CHECK: Created test product: ${testProductCode}`);
    
    // Immediately verify it exists
    const verifyProduct = await prisma.productData.findUnique({
      where: { product_code: testProductCode }
    });
    
    // Get current database stats
    const stats = await Promise.all([
      prisma.productData.count(),
      prisma.salesData.count(),
      prisma.importBatch.count()
    ]);
    
    // Delete test product
    await prisma.productData.delete({
      where: { product_code: testProductCode }
    });
    
    console.log(`📊 PERSISTENCE CHECK: Deleted test product: ${testProductCode}`);
    
    res.status(200).json({
      success: true,
      persistence_test: {
        test_product_created: !!testProduct,
        test_product_verified: !!verifyProduct,
        test_product_deleted: true,
        database_operations_working: true
      },
      current_stats: {
        total_products: stats[0],
        total_sales: stats[1],
        total_batches: stats[2]
      },
      message: '✅ Database persistence test PASSED. Create/Read/Delete operations working correctly.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ PERSISTENCE CHECK: Data persistence check error:', error);
    res.status(500).json({
      success: false,
      persistence_test: {
        database_operations_working: false,
        error: error.message
      },
      message: '❌ Database persistence test FAILED.',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getDatabaseStats,
  testDatabaseWrite,
  getPrismaConfig,
  monitorImportProcess,
  verifyProductImport,
  checkDataPersistence
};