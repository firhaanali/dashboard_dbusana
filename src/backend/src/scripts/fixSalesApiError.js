#!/usr/bin/env node

/**
 * Fix Sales API Error Script
 * Comprehensive fix for the 500 error in sales API
 * 
 * Usage: node backend/src/scripts/fixSalesApiError.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSalesApiError() {
    console.log('🔧 Fixing Sales API Error...\n');

    try {
        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // 2. Check if sales_data table exists
        console.log('2️⃣ Checking if sales_data table exists...');
        try {
            const tableExists = await prisma.$queryRaw`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'sales_data'
                );
            `;
            
            if (!tableExists[0].exists) {
                console.log('❌ sales_data table does not exist');
                console.log('🔧 Creating sales_data table...');
                
                // Create the table
                await prisma.$executeRaw`
                    CREATE TABLE IF NOT EXISTS sales_data (
                        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                        order_id TEXT NOT NULL,
                        seller_sku TEXT NOT NULL,
                        product_name TEXT NOT NULL,
                        color TEXT,
                        size TEXT,
                        quantity INTEGER NOT NULL DEFAULT 1,
                        order_amount FLOAT NOT NULL DEFAULT 0,
                        created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                        delivered_time TIMESTAMP,
                        settlement_amount FLOAT,
                        total_revenue FLOAT,
                        hpp FLOAT,
                        total FLOAT,
                        marketplace TEXT DEFAULT 'TikTok Shop',
                        customer TEXT,
                        province TEXT,
                        regency TEXT,
                        city TEXT,
                        import_batch_id TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    );
                `;
                
                // Create indexes
                await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sales_data_order_id ON sales_data(order_id);`;
                await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sales_data_created_time ON sales_data(created_time);`;
                await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sales_data_marketplace ON sales_data(marketplace);`;
                
                console.log('✅ sales_data table created successfully');
            } else {
                console.log('✅ sales_data table exists');
            }
        } catch (error) {
            console.log('❌ Error with table:', error.message);
            throw error;
        }

        // 3. Add some sample data if table is empty
        console.log('\n3️⃣ Checking for sample data...');
        const count = await prisma.salesData.count();
        
        if (count === 0) {
            console.log('📝 Adding sample sales data for testing...');
            
            const sampleData = [
                {
                    order_id: 'DBU-TEST-001',
                    seller_sku: 'DBS-001-RED-M',
                    product_name: 'Kemeja Batik Modern',
                    color: 'Red',
                    size: 'M',
                    quantity: 2,
                    order_amount: 350000,
                    created_time: new Date(Date.now() - 86400000), // 1 day ago
                    delivered_time: new Date(),
                    settlement_amount: 332500,
                    total_revenue: 350000,
                    hpp: 200000,
                    total: 350000,
                    marketplace: 'TikTok Shop',
                    customer: 'Ibu Sari Dewi',
                    province: 'DKI Jakarta',
                    regency: 'Jakarta Pusat',
                    city: 'Jakarta Pusat'
                },
                {
                    order_id: 'DBU-TEST-002',
                    seller_sku: 'DBS-002-BLUE-L',
                    product_name: 'Blouse Wanita Elegant',
                    color: 'Blue',
                    size: 'L',
                    quantity: 1,
                    order_amount: 200000,
                    created_time: new Date(Date.now() - 172800000), // 2 days ago
                    delivered_time: new Date(Date.now() - 86400000), // 1 day ago
                    settlement_amount: 190000,
                    total_revenue: 200000,
                    hpp: 130000,
                    total: 200000,
                    marketplace: 'Shopee',
                    customer: 'Bpk. Ahmad Pratama',
                    province: 'Jawa Barat',
                    regency: 'Bandung',
                    city: 'Bandung'
                },
                {
                    order_id: 'DBU-TEST-003',
                    seller_sku: 'DBS-003-GREEN-S',
                    product_name: 'Celana Panjang Formal',
                    color: 'Green',
                    size: 'S',
                    quantity: 3,
                    order_amount: 540000,
                    created_time: new Date(Date.now() - 259200000), // 3 days ago
                    settlement_amount: 513000,
                    total_revenue: 540000,
                    hpp: 360000,
                    total: 540000,
                    marketplace: 'Tokopedia',
                    customer: 'Ibu Maya Indira',
                    province: 'Jawa Tengah',
                    regency: 'Semarang',
                    city: 'Semarang'
                }
            ];

            for (const data of sampleData) {
                await prisma.salesData.create({ data });
            }
            
            console.log(`✅ Added ${sampleData.length} sample sales records`);
        } else {
            console.log(`✅ Found ${count} existing sales records`);
        }

        // 4. Test the actual API query
        console.log('\n4️⃣ Testing API query...');
        
        const salesQuery = {
            orderBy: {
                created_time: 'desc'
            }
        };

        const [salesData, totalCount] = await Promise.all([
            prisma.salesData.findMany(salesQuery),
            prisma.salesData.count()
        ]);

        console.log(`✅ API query successful: ${salesData.length} records, ${totalCount} total`);

        // 5. Show final status
        console.log('\n🎉 Sales API Fix Complete!');
        console.log('================================');
        console.log(`✅ Database: Connected`);
        console.log(`✅ Table: sales_data exists`);
        console.log(`✅ Data: ${totalCount} records available`);
        console.log(`✅ Query: Working correctly`);
        
        console.log('\n📋 Sample data preview:');
        if (salesData.length > 0) {
            const sample = salesData[0];
            console.log(`   Latest order: ${sample.order_id}`);
            console.log(`   Product: ${sample.product_name}`);
            console.log(`   Customer: ${sample.customer || 'Not set'}`);
            console.log(`   Marketplace: ${sample.marketplace || 'Not set'}`);
        }

        console.log('\n🚀 The Sales API should now work correctly!');
        console.log('Try refreshing your frontend to see the data.');

    } catch (error) {
        console.error('❌ Fix failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 Manual troubleshooting needed:');
        console.log('1. Check PostgreSQL is running');
        console.log('2. Verify DATABASE_URL in .env');
        console.log('3. Check Prisma schema matches database');
        console.log('4. Restart backend server');
        
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run fix if called directly
if (require.main === module) {
    fixSalesApiError()
        .then(() => {
            console.log('\n✨ Sales API fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fix script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixSalesApiError };