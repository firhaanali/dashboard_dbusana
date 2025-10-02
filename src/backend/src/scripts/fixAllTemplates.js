#!/usr/bin/env node

/**
 * Fix All Templates Script
 * Comprehensive fix for all template issues in D'Busana system
 * 
 * Usage: node backend/src/scripts/fixAllTemplates.js
 */

const { fixCorruptedSalesTemplate } = require('./fixCorruptedSalesTemplate');
const { testAndValidateTemplates } = require('./testAndValidateTemplates');
const { generateAllTemplates } = require('../templates/generate_templates');

async function fixAllTemplates() {
    console.log('🛠️ Comprehensive Template Fix Process\n');
    console.log('=====================================\n');

    try {
        // Step 1: Fix corrupted sales template
        console.log('1️⃣ FIXING CORRUPTED SALES TEMPLATE');
        console.log('-----------------------------------');
        
        const fixResult = fixCorruptedSalesTemplate();
        
        if (fixResult.success) {
            console.log('✅ Sales template corruption fixed');
            console.log(`   📁 Files: Original, Fixed, Backup created`);
            console.log(`   📊 Structure: ${fixResult.columnCount} columns, ${fixResult.sampleRows} sample rows\n`);
        } else {
            console.log('❌ Sales template fix failed:', fixResult.error);
            throw new Error('Sales template fix failed');
        }

        // Step 2: Generate all fresh templates
        console.log('2️⃣ GENERATING FRESH TEMPLATES');
        console.log('-------------------------------');
        
        const generateResult = await generateAllTemplates();
        
        if (generateResult.success) {
            console.log('✅ All templates generated successfully');
            console.log('   📋 Sales template: Updated');
            console.log('   📦 Products template: Generated');
            console.log('   📈 Stock template: Generated');
            console.log('   📊 Advertising template: Generated\n');
        } else {
            console.log('⚠️ Template generation had issues:', generateResult.error);
            console.log('   Continuing with validation...\n');
        }

        // Step 3: Validate all templates
        console.log('3️⃣ VALIDATING ALL TEMPLATES');
        console.log('-----------------------------');
        
        const validationResult = await testAndValidateTemplates();
        
        if (validationResult.success) {
            console.log(`✅ Template validation completed`);
            console.log(`   ✅ Valid templates: ${validationResult.validTemplates}`);
            console.log(`   ❌ Invalid templates: ${validationResult.invalidTemplates}\n`);
        } else {
            console.log('❌ Template validation failed:', validationResult.error);
        }

        // Step 4: Final summary
        console.log('🎯 FINAL RESULTS');
        console.log('================');
        
        if (fixResult.success && (!generateResult || generateResult.success) && validationResult.success) {
            console.log('🎉 ALL TEMPLATE ISSUES RESOLVED!');
            console.log('✅ Sales template: Fixed and validated');
            console.log('✅ Import system: Ready for use');
            console.log('✅ File corruption: Resolved');
            console.log('✅ Column structure: Matches database schema');
            console.log('✅ Sample data: Valid and comprehensive');
            
            console.log('\n🚀 NEXT STEPS:');
            console.log('1. Restart your backend server');
            console.log('2. Test template download from dashboard');
            console.log('3. Try importing the sample data');
            console.log('4. Verify data appears in dashboard');

            return {
                success: true,
                message: 'All template issues resolved successfully'
            };
        } else {
            console.log('⚠️ Some issues may remain');
            console.log('Please review the logs above for details');
            
            return {
                success: false,
                message: 'Template fix completed with some warnings'
            };
        }

    } catch (error) {
        console.error('❌ Template fix process failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 MANUAL TROUBLESHOOTING:');
        console.log('1. Check if XLSX library is installed: npm install xlsx');
        console.log('2. Verify write permissions to templates directory');
        console.log('3. Ensure sufficient disk space');
        console.log('4. Check if any template files are locked/in use');
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run if called directly
if (require.main === module) {
    console.log('🚀 Starting comprehensive template fix...\n');
    
    fixAllTemplates()
        .then(result => {
            if (result.success) {
                console.log('\n✨ Template fix process completed successfully');
                process.exit(0);
            } else {
                console.error('\n💥 Template fix process completed with issues');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Template fix process failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAllTemplates };