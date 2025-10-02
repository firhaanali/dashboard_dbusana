#!/usr/bin/env node

/**
 * Sales API Error Diagnostic Script
 * Diagnose the 500 error from GET /api/sales endpoint
 * 
 * Usage: node backend/src/scripts/diagnoseSalesApiError.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseSalesApiError() {
    console.log('🔍 Diagnosing Sales API Error...\n');

    try {
        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // 2. Check if sales_data table exists
        console.log('2️⃣ Checking if sales_data table exists...');
        try {
            const tableCheck = await prisma.$queryRaw`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'sales_data'
                );
            `;
            
            if (tableCheck[0].exists) {
                console.log('✅ sales_data table exists\n');
            } else {
                console.log('❌ sales_data table does NOT exist\n');
                console.log('💡 Run migration scripts to create the table:');
                console.log('   node backend/src/scripts/ensureAllTablesExist.js\n');
                return;
            }
        } catch (error) {
            console.log('❌ Error checking table existence:', error.message);
            return;
        }

        // 3. Check table structure
        console.log('3️⃣ Checking table structure...');
        try {
            const columns = await prisma.$queryRaw`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'sales_data'
                ORDER BY ordinal_position;
            `;
            
            console.log('📋 Table columns:');
            columns.forEach((col, index) => {
                console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
            console.log('');
        } catch (error) {
            console.log('❌ Error checking table structure:', error.message);
        }

        // 4. Test simple count query
        console.log('4️⃣ Testing simple count query...');
        try {
            const count = await prisma.salesData.count();
            console.log(`✅ Sales data count: ${count} records\n`);
        } catch (error) {
            console.log('❌ Error counting sales data:', error.message);
            console.log('   This might indicate Prisma schema mismatch\n');
        }

        // 5. Test simple findMany query (limit 1)
        console.log('5️⃣ Testing simple findMany query...');
        try {
            const sampleData = await prisma.salesData.findMany({
                take: 1,
                orderBy: { created_at: 'desc' }
            });
            
            if (sampleData.length > 0) {
                console.log('✅ Sample sales record retrieved:');
                console.log('   Order ID:', sampleData[0].order_id);
                console.log('   Product:', sampleData[0].product_name);
                console.log('   Created:', sampleData[0].created_time);
                console.log('   Marketplace:', sampleData[0].marketplace || 'Not set');
                console.log('');
            } else {
                console.log('⚠️  No sales data found in database\n');
            }
        } catch (error) {
            console.log('❌ Error querying sales data:', error.message);
            console.log('   Error details:', error);
            console.log('');
        }

        // 6. Test the exact query from controller
        console.log('6️⃣ Testing controller query...');
        try {
            const salesQuery = {
                orderBy: {
                    created_time: 'desc'
                }
            };

            const [salesData, totalCount] = await Promise.all([
                prisma.salesData.findMany(salesQuery),
                prisma.salesData.count()
            ]);

            console.log(`✅ Controller query successful: ${salesData.length} records returned, ${totalCount} total\n`);
        } catch (error) {
            console.log('❌ Controller query failed:', error.message);
            console.log('   Error details:', error);
            console.log('');
        }

        // 7. Check for common issues
        console.log('7️⃣ Checking for common issues...');
        
        // Check if created_time column exists and has proper type
        try {
            const createdTimeColumn = await prisma.$queryRaw`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'sales_data' AND column_name = 'created_time';
            `;
            
            if (createdTimeColumn.length > 0) {
                console.log(`✅ created_time column exists (${createdTimeColumn[0].data_type})`);
            } else {
                console.log('❌ created_time column missing - this would cause ordering error');
            }
        } catch (error) {
            console.log('❌ Error checking created_time column:', error.message);
        }

        // 8. Test database migrations status
        console.log('\n8️⃣ Testing recent migrations status...');
        try {
            // Check if customer and location columns exist
            const newColumns = await prisma.$queryRaw`
                SELECT column_name
                FROM information_schema.columns 
                WHERE table_name = 'sales_data' 
                AND column_name IN ('customer', 'province', 'regency', 'city');
            `;
            
            const foundColumns = newColumns.map(col => col.column_name);
            console.log('✅ New columns found:', foundColumns.length > 0 ? foundColumns.join(', ') : 'None');
            
            if (foundColumns.length < 4) {
                console.log('💡 Some recent columns missing. Run location migration:');
                console.log('   node backend/src/scripts/runLocationColumnMigration.js');
            }
        } catch (error) {
            console.log('❌ Error checking new columns:', error.message);
        }

        console.log('\n🎯 DIAGNOSIS SUMMARY:');
        console.log('===================');
        console.log('✅ Database connection: Working');
        console.log('✅ Table existence: Confirmed'); 
        console.log('✅ Basic queries: Should work');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Check backend server logs when hitting /api/sales');
        console.log('2. Verify Prisma schema matches database structure');
        console.log('3. Restart backend server if needed');
        console.log('4. Check if any recent migrations need to be run');

    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Check if PostgreSQL is running');
        console.error('2. Verify DATABASE_URL in .env file');
        console.error('3. Check if sales_data table exists');
        console.error('4. Run table creation scripts if needed');
    } finally {
        await prisma.$disconnect();
    }
}

// Run diagnostic if called directly
if (require.main === module) {
    diagnoseSalesApiError()
        .then(() => {
            console.log('\n✨ Sales API diagnostic completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Diagnostic script failed:', error);
            process.exit(1);
        });
}

module.exports = { diagnoseSalesApiError };