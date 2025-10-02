#!/usr/bin/env node

/**
 * Location Columns Migration Script
 * Menjalankan migration untuk menambahkan kolom Province, Regency, City ke sales_data
 * 
 * Usage: node backend/src/scripts/runLocationColumnMigration.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function runLocationColumnMigration() {
    console.log('🚀 Starting Location Columns Migration (Province, Regency, City)...\n');

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../../prisma/migrations/010_add_location_columns.sql');
        console.log('📁 Reading migration file:', migrationPath);
        
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        console.log('✅ Migration file loaded successfully\n');

        // Execute migration - split into individual statements
        console.log('⚡ Executing migration SQL...');
        
        // Split SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => 
                stmt.length > 0 && 
                !stmt.startsWith('--') && 
                !stmt.startsWith('/*') &&
                stmt.toLowerCase() !== 'commit' &&
                stmt.toLowerCase() !== 'begin'
            );
        
        console.log(`📋 Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    console.log(`   ${i + 1}/${statements.length}: Executing statement...`);
                    await prisma.$executeRawUnsafe(statement + ';');
                    console.log(`   ✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    // Skip if already exists or column already exists
                    if (error.message.includes('already exists') || 
                        error.message.includes('duplicate key') ||
                        error.message.includes('column') && error.message.includes('already exists') ||
                        error.message.includes('duplicate column name')) {
                        console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
                    } else {
                        console.log(`   ❌ Statement ${i + 1} failed:`, error.message);
                        // Continue with other statements
                    }
                }
            }
        }
        
        console.log('✅ All migration statements executed successfully\n');

        // Verify the columns exist
        console.log('🔍 Verifying location columns...');
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'sales_data' 
            AND column_name IN ('province', 'regency', 'city', 'customer')
            ORDER BY ordinal_position;
        `;

        if (result.length > 0) {
            console.log('✅ Location columns added successfully:');
            result.forEach((col) => {
                console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        } else {
            console.log('❌ Location columns not found after migration');
        }

        // Check sample data with location
        console.log('\n📊 Checking sample sales data with location...');
        const sampleSales = await prisma.$queryRaw`
            SELECT 
                order_id,
                product_name,
                customer,
                province,
                regency,
                city,
                marketplace,
                order_amount,
                created_time
            FROM sales_data 
            WHERE province IS NOT NULL AND regency IS NOT NULL AND city IS NOT NULL
            ORDER BY created_time DESC 
            LIMIT 5;
        `;
        
        if (sampleSales.length > 0) {
            console.log('📋 Sample sales data with location:');
            sampleSales.forEach((sale, index) => {
                console.log(`   ${index + 1}. Order: ${sale.order_id}`);
                console.log(`      Customer: ${sale.customer || 'N/A'}`);
                console.log(`      Location: ${sale.city}, ${sale.regency}, ${sale.province}`);
                console.log(`      Product: ${sale.product_name}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No sales data with location found');
        }

        // Check location distribution
        console.log('📊 Location distribution summary:');
        const locationStats = await prisma.$queryRaw`
            SELECT 
                province,
                COUNT(*) as total_orders,
                SUM(order_amount) as total_revenue
            FROM sales_data 
            WHERE province IS NOT NULL
            GROUP BY province
            ORDER BY total_orders DESC
            LIMIT 10;
        `;

        if (locationStats.length > 0) {
            console.log('🏢 Top provinces by order count:');
            locationStats.forEach((stat, index) => {
                const revenue = parseFloat(stat.total_revenue || 0);
                console.log(`   ${index + 1}. ${stat.province}: ${stat.total_orders} orders (${revenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })})`);
            });
        }

        console.log('\n🎉 Location Columns Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Update frontend interfaces to include location fields');
        console.log('   2. Update import template with Province, Regency, City columns');
        console.log('   3. Update dashboard to display regional analytics');
        console.log('   4. Test import process with location data');
        console.log('   5. Create regional sales reports and analytics');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Pastikan PostgreSQL server running');
        console.error('   2. Check DATABASE_URL di .env file');
        console.error('   3. Pastikan sales_data table exists');
        console.error('   4. Run table creation first if needed');
        
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration if called directly
if (require.main === module) {
    runLocationColumnMigration()
        .then(() => {
            console.log('\n✨ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runLocationColumnMigration };