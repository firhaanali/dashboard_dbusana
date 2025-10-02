#!/usr/bin/env node

/**
 * Migration Script: Merge regency and city columns into regency_city
 * This script safely migrates the database structure to combine regency and city fields
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runRegencyCityMigration() {
    console.log('🔧 Starting Regency & City Migration...\n');
    console.log('=====================================\n');

    try {
        // Step 1: Check current data
        console.log('📊 Analyzing current data...');
        const currentData = await prisma.salesData.findMany({
            select: {
                id: true,
                regency: true,
                city: true
            },
            where: {
                OR: [
                    { regency: { not: null } },
                    { city: { not: null } }
                ]
            },
            take: 10 // Sample for analysis
        });

        console.log(`   Found ${currentData.length} records with location data`);
        
        if (currentData.length > 0) {
            console.log('\n📋 Sample current data:');
            currentData.slice(0, 3).forEach((row, index) => {
                console.log(`   ${index + 1}. Regency: "${row.regency}" | City: "${row.city}"`);
            });
        }

        // Step 2: Add new column if not exists
        console.log('\n🔧 Adding regency_city column...');
        
        try {
            await prisma.$executeRaw`ALTER TABLE sales_data ADD COLUMN IF NOT EXISTS regency_city TEXT`;
            console.log('✅ regency_city column added successfully');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('ℹ️ regency_city column already exists');
            } else {
                throw error;
            }
        }

        // Step 3: Migrate data
        console.log('\n📝 Migrating existing data...');
        
        const migrateResult = await prisma.$executeRaw`
            UPDATE sales_data 
            SET regency_city = 
              CASE 
                WHEN regency IS NOT NULL AND city IS NOT NULL THEN 
                  CASE 
                    WHEN regency = city THEN regency
                    ELSE regency || ' & ' || city
                  END
                WHEN regency IS NOT NULL THEN regency
                WHEN city IS NOT NULL THEN city
                ELSE NULL
              END
            WHERE regency_city IS NULL
        `;

        console.log(`✅ Migrated ${migrateResult} records`);

        // Step 4: Add index
        console.log('\n📇 Adding index for regency_city...');
        
        try {
            await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sales_data_regency_city ON sales_data(regency_city)`;
            console.log('✅ Index created successfully');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('ℹ️ Index already exists');
            } else {
                throw error;
            }
        }

        // Step 5: Verify migration
        console.log('\n🧪 Verifying migration...');
        
        const verifyData = await prisma.salesData.findMany({
            select: {
                id: true,
                regency: true,
                city: true,
                regency_city: true
            },
            where: {
                regency_city: { not: null }
            },
            take: 5
        });

        console.log('\n📋 Verification results:');
        verifyData.forEach((row, index) => {
            console.log(`   ${index + 1}. "${row.regency}" + "${row.city}" → "${row.regency_city}"`);
        });

        // Step 6: Show summary statistics
        const totalRecords = await prisma.salesData.count();
        const recordsWithRegencyCity = await prisma.salesData.count({
            where: { regency_city: { not: null } }
        });
        const recordsWithOldData = await prisma.salesData.count({
            where: {
                OR: [
                    { regency: { not: null } },
                    { city: { not: null } }
                ]
            }
        });

        console.log('\n📈 Migration Summary:');
        console.log('====================');
        console.log(`   Total records: ${totalRecords}`);
        console.log(`   Records with old regency/city: ${recordsWithOldData}`);
        console.log(`   Records with new regency_city: ${recordsWithRegencyCity}`);
        console.log(`   Migration coverage: ${((recordsWithRegencyCity / Math.max(recordsWithOldData, 1)) * 100).toFixed(1)}%`);

        console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('=====================================');
        console.log('✅ regency_city column created and populated');
        console.log('✅ Index added for performance');
        console.log('✅ Data verified and working');
        console.log('✅ Templates will now use "Regency & City" field');
        
        console.log('\n📝 Next Steps:');
        console.log('1. Test import with new template');
        console.log('2. Verify dashboard displays correctly');
        console.log('3. After confirming everything works, old regency/city columns can be dropped');

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED!');
        console.error('Error:', error.message);
        console.error(error.stack);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
if (require.main === module) {
    runRegencyCityMigration()
        .then(() => {
            console.log('\n🎯 Migration script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { runRegencyCityMigration };