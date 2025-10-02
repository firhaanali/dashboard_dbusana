#!/usr/bin/env node

/**
 * Import History Migration Script
 * Menjalankan migration untuk menambahkan tabel import_history
 * 
 * Usage: node backend/src/scripts/runImportHistoryMigration.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function runImportHistoryMigration() {
    console.log('🚀 Starting Import History Migration...\n');

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../../prisma/migrations/008_add_import_history_table.sql');
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
                    // Skip if already exists
                    if (error.message.includes('already exists') || 
                        error.message.includes('duplicate key') ||
                        error.message.includes('relation') && error.message.includes('already exists')) {
                        console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
                    } else {
                        throw error; // Re-throw if it's not a "already exists" error
                    }
                }
            }
        }
        
        console.log('✅ All migration statements executed successfully\n');

        // Verify table creation
        console.log('🔍 Verifying import_history table...');
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'import_history' 
            ORDER BY ordinal_position;
        `;

        if (result.length > 0) {
            console.log('✅ Table import_history created successfully with columns:');
            result.forEach((col, index) => {
                console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        } else {
            throw new Error('Table import_history not found after migration');
        }

        // Check if sample data was inserted
        console.log('\n📊 Checking sample data...');
        const sampleCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM import_history;
        `;
        
        console.log(`✅ Found ${sampleCount[0]?.count || 0} sample records in import_history table`);

        // Show recent imports for verification
        const recentImports = await prisma.$queryRaw`
            SELECT 
                import_type,
                file_name,
                total_records,
                imported_records,
                success_rate,
                timestamp
            FROM import_history 
            ORDER BY timestamp DESC 
            LIMIT 5;
        `;

        if (recentImports.length > 0) {
            console.log('\n📋 Recent import history entries:');
            recentImports.forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.import_type}: ${entry.file_name} (${entry.imported_records}/${entry.total_records} - ${entry.success_rate}%)`);
            });
        }

        console.log('\n🎉 Import History Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Import History component sudah ready untuk digunakan');
        console.log('   2. Backend API akan automatically log ke database');
        console.log('   3. Frontend bisa fetch history dari /api/import/history');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Pastikan PostgreSQL server running');
        console.error('   2. Check DATABASE_URL di .env file');
        console.error('   3. Pastikan connection permission correct');
        
        if (error.message.includes('relation') && error.message.includes('already exists')) {
            console.log('\n⚠️  Table mungkin sudah ada. Checking existing structure...');
            try {
                const existing = await prisma.$queryRaw`
                    SELECT COUNT(*) as count FROM information_schema.tables 
                    WHERE table_name = 'import_history';
                `;
                if (existing[0]?.count > 0) {
                    console.log('✅ Table import_history already exists - migration may have been run before');
                }
            } catch (checkError) {
                console.error('❌ Could not verify existing table:', checkError.message);
            }
        }
        
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration if called directly
if (require.main === module) {
    runImportHistoryMigration()
        .then(() => {
            console.log('\n✨ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runImportHistoryMigration };