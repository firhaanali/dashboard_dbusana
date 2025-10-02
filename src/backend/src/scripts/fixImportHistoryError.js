#!/usr/bin/env node

/**
 * Fix Import History Error Script
 * Creates the missing import_history table and fixes the API error
 * 
 * Usage: node backend/src/scripts/fixImportHistoryError.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixImportHistoryError() {
    console.log('🔧 Fixing Import History Error...\n');

    try {
        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // 2. Check if import_history table exists
        console.log('2️⃣ Checking if import_history table exists...');
        try {
            const tableExists = await prisma.$queryRaw`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'import_history'
                );
            `;
            
            if (!tableExists[0].exists) {
                console.log('❌ import_history table does not exist');
                console.log('🔧 Creating import_history table...\n');
                
                // Run the migration SQL
                const migrationPath = path.join(__dirname, '../../prisma/migrations/008_add_import_history_table.sql');
                
                if (fs.existsSync(migrationPath)) {
                    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                    
                    // Execute the migration
                    await prisma.$executeRawUnsafe(migrationSQL);
                    console.log('✅ import_history table created successfully with sample data\n');
                } else {
                    // Create table manually if migration file doesn't exist
                    console.log('📝 Migration file not found, creating table manually...');
                    
                    await prisma.$executeRaw`
                        CREATE TABLE IF NOT EXISTS import_history (
                            id SERIAL PRIMARY KEY,
                            timestamp TIMESTAMPTZ DEFAULT NOW(),
                            user_id VARCHAR(100),
                            import_type VARCHAR(50) NOT NULL,
                            file_name VARCHAR(255),
                            file_size INTEGER,
                            total_records INTEGER NOT NULL,
                            imported_records INTEGER NOT NULL,
                            failed_records INTEGER DEFAULT 0,
                            duplicate_records INTEGER DEFAULT 0,
                            success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
                                CASE 
                                    WHEN total_records > 0 THEN (imported_records::DECIMAL / total_records::DECIMAL) * 100
                                    ELSE 0
                                END
                            ) STORED,
                            processing_time_ms INTEGER,
                            import_status VARCHAR(20) DEFAULT 'completed',
                            error_details TEXT,
                            import_summary JSONB,
                            source_ip VARCHAR(45),
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
                        );
                    `;
                    
                    // Create indexes
                    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_import_history_timestamp ON import_history(timestamp DESC);`;
                    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_import_history_type ON import_history(import_type);`;
                    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_import_history_user ON import_history(user_id);`;
                    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(import_status);`;
                    
                    // Add sample data
                    await prisma.$executeRaw`
                        INSERT INTO import_history (
                            import_type, file_name, file_size, total_records, imported_records, 
                            failed_records, duplicate_records, processing_time_ms, import_summary, user_id
                        ) VALUES 
                        ('sales', 'sales_data_2024.xlsx', 153600, 150, 148, 1, 1, 2340, 
                         '{"marketplace_breakdown": {"tokopedia": 45, "shopee": 52, "tiktok": 51}, "date_range": "2024-01-01 to 2024-12-19"}', 'admin'),
                        ('products', 'product_master.xlsx', 89200, 75, 75, 0, 0, 1890,
                         '{"categories_added": 12, "brands_added": 8, "variants_created": 45}', 'admin'),
                        ('stock', 'stock_update_dec.xlsx', 45800, 120, 118, 2, 0, 1567,
                         '{"total_stock_value": 25000000, "products_updated": 118, "warnings": 2}', 'admin')
                        ON CONFLICT DO NOTHING;
                    `;
                    
                    console.log('✅ import_history table created manually with sample data');
                }
            } else {
                console.log('✅ import_history table already exists');
            }
        } catch (error) {
            console.log('❌ Error with table:', error.message);
            throw error;
        }

        // 3. Test the API query
        console.log('\n3️⃣ Testing import history query...');
        try {
            const historyTest = await prisma.importHistory.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' }
            });
            
            console.log(`✅ Query successful: ${historyTest.length} history records found`);
            
            if (historyTest.length > 0) {
                console.log('📋 Sample record:');
                const sample = historyTest[0];
                console.log(`   Type: ${sample.import_type}`);
                console.log(`   File: ${sample.file_name}`);
                console.log(`   Records: ${sample.imported_records}/${sample.total_records}`);
                console.log(`   Success Rate: ${sample.success_rate}%`);
                console.log(`   Date: ${sample.timestamp?.toISOString()}`);
            }
        } catch (error) {
            console.log('❌ Query test failed:', error.message);
            throw error;
        }

        // 4. Test total count query
        console.log('\n4️⃣ Testing count query...');
        const totalCount = await prisma.importHistory.count();
        console.log(`✅ Total import history records: ${totalCount}`);

        console.log('\n🎉 Import History Fix Complete!');
        console.log('===================================');
        console.log(`✅ Database: Connected`);
        console.log(`✅ Table: import_history created/verified`);
        console.log(`✅ Data: ${totalCount} records available`);
        console.log(`✅ Query: Working correctly`);
        
        console.log('\n🚀 The Import History API should now work correctly!');
        console.log('Try refreshing your frontend to see the import history data.');

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
    fixImportHistoryError()
        .then(() => {
            console.log('\n✨ Import history fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fix script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixImportHistoryError };