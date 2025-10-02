#!/usr/bin/env node

/**
 * Test Sales API Script
 * Direct test of the sales API endpoint to diagnose issues
 * 
 * Usage: node backend/src/scripts/testSalesApi.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSalesApi() {
    console.log('🧪 Testing Sales API Logic...\n');

    try {
        // Test the exact logic from the sales controller
        console.log('1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected\n');

        console.log('2️⃣ Testing sales data query...');
        
        // Execute the exact same query as in the controller
        let salesQuery = {
            orderBy: {
                created_time: 'desc'
            }
        };

        const [salesData, totalCount] = await Promise.all([
            prisma.salesData.findMany(salesQuery),
            prisma.salesData.count()
        ]);

        console.log(`✅ Query successful: ${salesData.length} records returned, ${totalCount} total\n`);

        // Test response structure (same as controller)
        const responseData = {
            success: true,
            data: salesData,
            count: totalCount,
            pagination: {
                page: 1,
                limit: totalCount,
                total: totalCount,
                totalPages: 1
            }
        };

        console.log('3️⃣ Testing response structure...');
        console.log('✅ Response structure:', {
            success: responseData.success,
            dataLength: responseData.data.length,
            count: responseData.count,
            pagination: responseData.pagination
        });

        // Show sample data
        if (salesData.length > 0) {
            console.log('\n4️⃣ Sample sales data:');
            const sample = salesData[0];
            console.log('   Order ID:', sample.order_id);
            console.log('   Product:', sample.product_name);
            console.log('   Quantity:', sample.quantity);
            console.log('   Amount:', sample.order_amount);
            console.log('   Created:', sample.created_time);
            console.log('   Marketplace:', sample.marketplace || 'Not set');
            console.log('   Customer:', sample.customer || 'Not set');
        } else {
            console.log('\n4️⃣ No sales data found in database');
            console.log('💡 Import some sales data to see results');
        }

        console.log('\n🎯 API Test Result: SUCCESS');
        console.log('The sales API logic should work correctly.');
        console.log('If you\'re still getting 500 errors, check:');
        console.log('1. Backend server is running');
        console.log('2. Database connection is working');
        console.log('3. Prisma schema matches database structure');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if sales_data table exists');
        console.log('2. Verify Prisma schema matches database');
        console.log('3. Run migrations if needed');
        console.log('4. Check database connection string');
    } finally {
        await prisma.$disconnect();
    }
}

// Run test if called directly
if (require.main === module) {
    testSalesApi()
        .then(() => {
            console.log('\n✨ Sales API test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test script failed:', error);
            process.exit(1);
        });
}

module.exports = { testSalesApi };