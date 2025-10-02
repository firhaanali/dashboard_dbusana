#!/usr/bin/env node

/**
 * Comprehensive Database Setup Script
 * Memastikan semua tabel yang diperlukan ada di database
 * 
 * Usage: node backend/src/scripts/ensureAllTablesExist.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureAllTablesExist() {
    console.log('🔍 D\'BUSANA DATABASE SETUP & VERIFICATION');
    console.log('=' .repeat(60));
    
    try {
        // Test database connection
        console.log('\n1. 🔌 Testing database connection...');
        await prisma.$connect();
        console.log('   ✅ Database connection successful');

        // Get all existing tables
        console.log('\n2. 📋 Checking existing tables...');
        const existingTables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;
        
        console.log(`   📊 Found ${existingTables.length} existing tables:`);
        const tableNames = existingTables.map(t => t.table_name);
        tableNames.forEach(name => console.log(`      - ${name}`));

        // List of required tables based on schema
        const requiredTables = [
            'sales_data',
            'product_data', 
            'stock_data',
            'import_batches',
            'advertising_data',
            'categories',
            'brands',
            'materials',
            'boms',
            'bom_items', 
            'suppliers',
            'purchase_orders',
            'purchase_order_items',
            'cash_flow_entries',
            'dashboard_metrics',
            'import_history'
        ];

        console.log('\n3. ✅ Checking required tables...');
        const missingTables = [];
        
        for (const requiredTable of requiredTables) {
            const exists = tableNames.includes(requiredTable);
            if (exists) {
                console.log(`   ✅ ${requiredTable}`);
            } else {
                console.log(`   ❌ ${requiredTable} (MISSING)`);
                missingTables.push(requiredTable);
            }
        }

        if (missingTables.length > 0) {
            console.log('\n4. 🔧 Creating missing tables...');
            console.log('   Running Prisma DB Push to sync schema...');
            
            // Use Prisma to create all missing tables
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const prismaPush = spawn('npx', ['prisma', 'db', 'push'], {
                    stdio: 'inherit',
                    cwd: process.cwd()
                });

                prismaPush.on('close', async (code) => {
                    if (code === 0) {
                        console.log('   ✅ Prisma DB Push completed successfully');
                        
                        // Re-check tables after push
                        console.log('\n5. 🔍 Re-verifying tables after creation...');
                        const updatedTables = await prisma.$queryRaw`
                            SELECT table_name 
                            FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_type = 'BASE TABLE'
                            ORDER BY table_name;
                        `;
                        
                        const updatedTableNames = updatedTables.map(t => t.table_name);
                        const stillMissing = [];
                        
                        for (const requiredTable of requiredTables) {
                            const exists = updatedTableNames.includes(requiredTable);
                            if (exists) {
                                console.log(`   ✅ ${requiredTable}`);
                            } else {
                                console.log(`   ❌ ${requiredTable} (STILL MISSING)`);
                                stillMissing.push(requiredTable);
                            }
                        }
                        
                        if (stillMissing.length === 0) {
                            console.log('\n🎉 ALL REQUIRED TABLES ARE NOW PRESENT!');
                            resolve();
                        } else {
                            console.log(`\n❌ ${stillMissing.length} tables still missing:`, stillMissing);
                            reject(new Error(`Missing tables: ${stillMissing.join(', ')}`));
                        }
                        
                    } else {
                        reject(new Error(`Prisma DB Push failed with code ${code}`));
                    }
                });
            });
            
        } else {
            console.log('\n✅ ALL REQUIRED TABLES PRESENT!');
        }

        // Check for sample data in key tables
        console.log('\n6. 📊 Checking for data in key tables...');
        
        // Check sales_data
        try {
            const salesCount = await prisma.salesData.count();
            console.log(`   📈 sales_data: ${salesCount} records`);
            
            if (salesCount === 0) {
                console.log('   ⚠️  No sales data found - you may need to import sales data');
            }
        } catch (error) {
            console.log(`   ❌ Could not check sales_data: ${error.message}`);
        }

        // Check import_history
        try {
            const importCount = await prisma.importHistory.count();
            console.log(`   📥 import_history: ${importCount} records`);
        } catch (error) {
            console.log(`   ❌ Could not check import_history: ${error.message}`);
        }

        // Check cash_flow_entries  
        try {
            const cashFlowCount = await prisma.cashFlowEntry.count();
            console.log(`   💰 cash_flow_entries: ${cashFlowCount} records`);
        } catch (error) {
            console.log(`   ❌ Could not check cash_flow_entries: ${error.message}`);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('🎯 DATABASE SETUP COMPLETED SUCCESSFULLY!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Start backend server: cd backend && npm start');
        console.log('   2. Import sample data if tables are empty');
        console.log('   3. Access frontend: http://localhost:3000');
        console.log('   4. Test Revenue Analysis: http://localhost:3000/analytics');
        
    } catch (error) {
        console.error('\n❌ Database setup failed:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('   1. Make sure PostgreSQL is running');
        console.error('   2. Check DATABASE_URL in .env file'); 
        console.error('   3. Verify database credentials');
        console.error('   4. Try running: npx prisma db push');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    ensureAllTablesExist()
        .then(() => {
            console.log('✨ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { ensureAllTablesExist };