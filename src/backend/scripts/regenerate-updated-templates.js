#!/usr/bin/env node

/**
 * Regenerate All Templates Script with Updated Structure
 * Menjalankan template generator untuk create semua template dengan struktur terbaru
 * Includes Customer, Province, Regency, City columns untuk sales template
 * 
 * Usage: node backend/scripts/regenerate-updated-templates.js
 */

const { generateAllTemplates } = require('../src/templates/generate_templates');
const path = require('path');

async function regenerateUpdatedTemplates() {
    console.log('🏭 Starting Template Regeneration with Updated Structure...\n');

    try {
        console.log('📝 Regenerating templates with latest database structure:');
        console.log('   - Sales Template: Added Customer, Province, Regency, City columns');
        console.log('   - Products Template: Latest structure with all fields');
        console.log('   - Stock Template: Latest movement-based structure');
        console.log('   - Advertising Template: Complete campaign analytics structure\n');

        // Run template generation
        const result = await generateAllTemplates();

        if (result.success) {
            console.log('🎉 Template regeneration completed successfully!\n');
            
            console.log('✅ Generated Templates:');
            Object.entries(result.paths).forEach(([type, filePath]) => {
                console.log(`   - ${type.toUpperCase()}: ${filePath}`);
            });

            console.log('\n📋 Template Structure Summary:');
            console.log('   📊 SALES TEMPLATE includes:');
            console.log('      • Order ID, Seller SKU, Product Name, Color, Size');
            console.log('      • Quantity, Order Amount, Created Time, Delivered Time');
            console.log('      • Total settlement amount, Total revenue, HPP, Total');
            console.log('      • Marketplace, Customer');
            console.log('      • Province, Regency, City (NEW)');
            
            console.log('\n   📦 PRODUCTS TEMPLATE includes:');
            console.log('      • Product Code, Product Name, Category, Brand');
            console.log('      • Size, Color, Price, Cost');
            console.log('      • Stock Quantity, Min Stock, Description');
            
            console.log('\n   📋 STOCK TEMPLATE includes:');
            console.log('      • Product Code, Movement Type (in/out/adjustment)');
            console.log('      • Quantity, Reference Number, Notes, Movement Date');
            
            console.log('\n   📈 ADVERTISING TEMPLATE includes:');
            console.log('      • Campaign Name, Campaign Type, Platform');
            console.log('      • Ad Group Name, Keyword, Ad Creative');
            console.log('      • Date Range Start/End, Impressions, Clicks');
            console.log('      • Conversions, Cost, Revenue, Marketplace');

            console.log('\n🔄 Next Steps:');
            console.log('   1. Templates are ready for download in frontend');
            console.log('   2. All download template buttons should work');
            console.log('   3. Test import process with new templates');
            console.log('   4. Verify customer and location data imports correctly');

        } else {
            console.error('❌ Template regeneration failed:', result.error);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Template regeneration error:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check if backend/src/templates/generate_templates.js exists');
        console.error('   2. Ensure XLSX package is installed');
        console.error('   3. Check file permissions in templates directory');
        
        process.exit(1);
    }
}

// Run regeneration if called directly
if (require.main === module) {
    regenerateUpdatedTemplates()
        .then(() => {
            console.log('\n✨ Template regeneration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Template regeneration script failed:', error);
            process.exit(1);
        });
}

module.exports = { regenerateUpdatedTemplates };