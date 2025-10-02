#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseData() {
  console.log('🔍 AUDIT DATABASE D\'BUSANA - CHECKING DATA AVAILABILITY');
  console.log('=' * 70);
  
  try {
    // Test database connection
    console.log('\n1. 🔌 TESTING DATABASE CONNECTION...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check SalesData table
    console.log('\n2. 📊 CHECKING SALES DATA TABLE...');
    const salesCount = await prisma.salesData.count();
    console.log(`   Total sales records: ${salesCount}`);
    
    if (salesCount > 0) {
      const sampleSales = await prisma.salesData.findMany({
        take: 3,
        orderBy: { created_at: 'desc' }
      });
      
      console.log('\n   📋 Sample sales records:');
      sampleSales.forEach((sale, index) => {
        console.log(`   ${index + 1}. Order: ${sale.order_id}`);
        console.log(`      Product: ${sale.product_name}`);
        console.log(`      Quantity: ${sale.quantity}`);
        console.log(`      Order Amount: ${sale.order_amount}`);
        console.log(`      Settlement Amount: ${sale.settlement_amount}`);
        console.log(`      Created: ${sale.created_time}`);
        console.log(`      Marketplace: ${sale.marketplace}`);
        console.log('      ---');
      });

      // Check date ranges
      const dateRange = await prisma.salesData.aggregate({
        _min: {
          created_time: true
        },
        _max: {
          created_time: true
        }
      });
      
      console.log(`\n   📅 Date range: ${dateRange._min.created_time} to ${dateRange._max.created_time}`);
      
      // Check marketplace distribution
      const marketplaceStats = await prisma.salesData.groupBy({
        by: ['marketplace'],
        _count: {
          _all: true
        }
      });
      
      console.log('\n   🏪 Marketplace distribution:');
      marketplaceStats.forEach(stat => {
        console.log(`      ${stat.marketplace}: ${stat._count._all} records`);
      });
      
    } else {
      console.log('❌ NO SALES DATA FOUND IN DATABASE');
    }

    // Check ProductData table
    console.log('\n3. 📦 CHECKING PRODUCT DATA TABLE...');
    const productCount = await prisma.productData.count();
    console.log(`   Total product records: ${productCount}`);

    // Check StockData table
    console.log('\n4. 📋 CHECKING STOCK DATA TABLE...');
    const stockCount = await prisma.stockData.count();
    console.log(`   Total stock records: ${stockCount}`);

    // Check ImportBatch table
    console.log('\n5. 📥 CHECKING IMPORT HISTORY...');
    const importCount = await prisma.importBatch.count();
    console.log(`   Total import batches: ${importCount}`);
    
    if (importCount > 0) {
      const recentImports = await prisma.importBatch.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
      });
      
      console.log('\n   📋 Recent imports:');
      recentImports.forEach((batch, index) => {
        console.log(`   ${index + 1}. ${batch.batch_name} (${batch.import_type})`);
        console.log(`      File: ${batch.file_name}`);
        console.log(`      Status: ${batch.status}`);
        console.log(`      Records: ${batch.imported_records}/${batch.total_records}`);
        console.log(`      Date: ${batch.created_at}`);
        console.log('      ---');
      });
    }

    // Check database tables existence
    console.log('\n6. 🏗️ CHECKING DATABASE SCHEMA...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('   Available tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n7. 🧪 TESTING API ENDPOINT SIMULATION...');
    
    // Simulate the API call that RevenueComparison makes
    const salesData = await prisma.salesData.findMany({
      orderBy: {
        created_time: 'desc'
      }
    });
    
    console.log(`   API simulation result: ${salesData.length} records found`);
    
    if (salesData.length > 0) {
      console.log('   ✅ API endpoint should return data');
      
      // Check for required fields that RevenueComparison uses
      const sampleRecord = salesData[0];
      console.log('\n   🔍 Checking required fields for RevenueComparison:');
      console.log(`   - order_amount: ${sampleRecord.order_amount !== null ? '✅' : '❌'} (${sampleRecord.order_amount})`);
      console.log(`   - total_revenue: ${sampleRecord.total_revenue !== null ? '✅' : '❌'} (${sampleRecord.total_revenue})`);
      console.log(`   - settlement_amount: ${sampleRecord.settlement_amount !== null ? '✅' : '❌'} (${sampleRecord.settlement_amount})`);
      console.log(`   - created_time: ${sampleRecord.created_time !== null ? '✅' : '❌'} (${sampleRecord.created_time})`);
      console.log(`   - quantity: ${sampleRecord.quantity !== null ? '✅' : '❌'} (${sampleRecord.quantity})`);
      console.log(`   - marketplace: ${sampleRecord.marketplace !== null ? '✅' : '❌'} (${sampleRecord.marketplace})`);
      
    } else {
      console.log('   ❌ API endpoint will return empty data');
    }

  } catch (error) {
    console.error('\n❌ DATABASE ERROR:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '=' * 70);
  console.log('🏁 DATABASE DATA AUDIT COMPLETED');
}

// Run the check
checkDatabaseData().catch(console.error);