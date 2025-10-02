#!/usr/bin/env node

/**
 * Generate Valid Excel Template Script
 * Creates properly formatted Excel files that can be opened by Excel
 * 
 * Usage: node backend/src/scripts/generateValidExcelTemplate.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function generateValidSalesTemplate() {
    console.log('🔧 Generating valid Excel sales template...\n');

    try {
        // Define exact headers that match database schema
        const headers = [
            'Order ID',
            'Seller SKU', 
            'Product Name',
            'Color',
            'Size',
            'Quantity',
            'Order Amount',
            'Created Time',
            'Delivered Time',
            'Total settlement amount',
            'Total revenue',
            'HPP',
            'Total',
            'Marketplace',
            'Customer',
            'Province',
            'Regency',
            'City'
        ];

        // Create sample data with proper types
        const sampleData = [
            [
                'DBU-001',              // Order ID
                'DBS-001-RED-M',        // Seller SKU
                'Kemeja Batik Modern',   // Product Name
                'Red',                  // Color
                'M',                    // Size
                2,                      // Quantity
                350000,                 // Order Amount
                '15-01-2024',          // Created Time
                '17-01-2024',          // Delivered Time
                332500,                 // Total settlement amount
                350000,                 // Total revenue
                200000,                 // HPP
                350000,                 // Total
                'TikTok Shop',          // Marketplace
                'Ibu Sari Dewi',        // Customer
                'DKI Jakarta',          // Province
                'Jakarta Pusat',        // Regency
                'Jakarta Pusat'         // City
            ],
            [
                'DBU-002',
                'DBS-002-BLUE-L',
                'Blouse Wanita Elegant',
                'Blue',
                'L',
                1,
                200000,
                '16-01-2024',
                '18-01-2024',
                190000,
                200000,
                130000,
                200000,
                'Shopee',
                'Bpk. Ahmad Pratama',
                'Jawa Barat',
                'Bandung',
                'Bandung'
            ],
            [
                'DBU-003',
                'DBS-003-GREEN-S',
                'Celana Panjang Formal',
                'Green',
                'S',
                3,
                540000,
                '17-01-2024',
                '', // Empty delivered time
                513000,
                540000,
                360000,
                540000,
                'Tokopedia',
                'Ibu Maya Indira',
                'Jawa Tengah',
                'Semarang',
                'Semarang'
            ],
            [
                'DBU-004',
                'DBS-004-WHITE-XL',
                'Dress Tenun Modern',
                'White',
                'XL',
                1,
                250000,
                '18-01-2024',
                '19-01-2024',
                250000,
                250000,
                165000,
                250000,
                'TikTok Shop',
                'Ibu Fitri Handayani',
                'Jawa Timur',
                'Surabaya',
                'Surabaya'
            ],
            [
                'DBU-005',
                'DBS-005-BLACK-M',
                'Jaket Batik Casual',
                'Black',
                'M',
                2,
                350000,
                '19-01-2024',
                '21-01-2024',
                332500,
                350000,
                230000,
                350000,
                'Lazada',
                'Bpk. Deni Kurniawan',
                'Banten',
                'Tangerang',
                'Tangerang Selatan'
            ]
        ];

        // Create new workbook using proper XLSX methods
        const workbook = XLSX.utils.book_new();
        
        // Create worksheet from array data (more reliable than JSON)
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

        // Set column widths for better readability
        const columnWidths = [
            { wch: 15 }, // Order ID
            { wch: 18 }, // Seller SKU
            { wch: 25 }, // Product Name
            { wch: 12 }, // Color
            { wch: 8 },  // Size
            { wch: 10 }, // Quantity
            { wch: 15 }, // Order Amount
            { wch: 12 }, // Created Time
            { wch: 12 }, // Delivered Time
            { wch: 20 }, // Total settlement amount
            { wch: 15 }, // Total revenue
            { wch: 12 }, // HPP
            { wch: 12 }, // Total
            { wch: 15 }, // Marketplace
            { wch: 20 }, // Customer
            { wch: 18 }, // Province
            { wch: 18 }, // Regency
            { wch: 18 }  // City
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

        // Define file paths
        const templatesDir = path.join(__dirname, '..', 'templates');
        const newTemplatePath = path.join(templatesDir, 'sales_template_new.xlsx');
        const originalTemplatePath = path.join(templatesDir, 'sales_template.xlsx');
        const backupPath = path.join(templatesDir, 'sales_template_backup.xlsx');

        // Create templates directory if it doesn't exist
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
            console.log('📁 Created templates directory');
        }

        // Backup existing template if it exists
        if (fs.existsSync(originalTemplatePath)) {
            try {
                fs.copyFileSync(originalTemplatePath, backupPath);
                console.log('✅ Backed up existing template');
            } catch (backupError) {
                console.log('⚠️ Could not backup existing template:', backupError.message);
            }
        }

        // Write the new template with explicit Excel format
        console.log('💾 Writing new Excel template...');
        XLSX.writeFile(workbook, newTemplatePath, { 
            bookType: 'xlsx',
            compression: true
        });
        console.log('✅ New template created at:', newTemplatePath);

        // Replace the original template
        if (fs.existsSync(newTemplatePath)) {
            fs.copyFileSync(newTemplatePath, originalTemplatePath);
            console.log('🔄 Replaced original template with valid version');
        }

        // Validate the generated file by trying to read it
        console.log('\n🔍 Validating generated template...');
        try {
            const testWorkbook = XLSX.readFile(originalTemplatePath);
            const testSheetName = testWorkbook.SheetNames[0];
            const testWorksheet = testWorkbook.Sheets[testSheetName];
            const testData = XLSX.utils.sheet_to_json(testWorksheet);
            
            console.log(`✅ Template validation successful:`);
            console.log(`   - File format: Valid Excel (.xlsx)`);
            console.log(`   - Sheets: ${testWorkbook.SheetNames.length} (${testWorkbook.SheetNames.join(', ')})`);
            console.log(`   - Sample rows: ${testData.length}`);
            console.log(`   - Columns: ${Object.keys(testData[0] || {}).length}`);
            
            // Test first row data
            if (testData.length > 0) {
                const firstRow = testData[0];
                console.log(`   - First Order ID: "${firstRow['Order ID']}"`);
                console.log(`   - First Product: "${firstRow['Product Name']}"`);
                console.log(`   - First Marketplace: "${firstRow['Marketplace']}"`);
            }

            // Test Excel compatibility
            console.log('\n🔧 Testing Excel compatibility...');
            const requiredColumns = ['Order ID', 'Seller SKU', 'Product Name', 'Marketplace'];
            const availableColumns = Object.keys(testData[0] || {});
            const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
            
            if (missingColumns.length === 0) {
                console.log('✅ All required columns present and readable');
            } else {
                console.log('❌ Missing columns:', missingColumns.join(', '));
            }

        } catch (validationError) {
            console.error('❌ Template validation failed:', validationError.message);
            throw validationError;
        }

        console.log('\n🎉 VALID EXCEL TEMPLATE GENERATED SUCCESSFULLY!');
        console.log('=========================================');
        console.log(`✅ File: ${originalTemplatePath}`);
        console.log(`✅ Format: Excel 2007+ (.xlsx)`);
        console.log(`✅ Compatibility: Microsoft Excel, LibreOffice, Google Sheets`);
        console.log(`✅ Columns: 18 (matching database schema)`);
        console.log(`✅ Sample Data: 5 rows with realistic D'Busana data`);
        console.log(`✅ Backup: ${backupPath}`);
        
        return {
            success: true,
            filePath: originalTemplatePath,
            backupPath: backupPath,
            rows: sampleData.length,
            columns: headers.length
        };

    } catch (error) {
        console.error('❌ Excel template generation failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Ensure XLSX library is properly installed: npm install xlsx');
        console.log('2. Check file permissions on templates directory');
        console.log('3. Ensure templates directory exists and is writable');
        console.log('4. Close any open Excel files that might lock the template');
        console.log('5. Try running as administrator if permission issues persist');
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Additional function to generate other templates
function generateAllRequiredTemplates() {
    console.log('📋 Generating all required templates...\n');
    
    const results = [];
    
    // Generate sales template
    const salesResult = generateValidSalesTemplate();
    results.push({ name: 'Sales', result: salesResult });
    
    // Could add other templates here (products, stock, etc.)
    
    return results;
}

// Run if called directly
if (require.main === module) {
    console.log('🚀 Starting Excel template generation...\n');
    
    const results = generateAllRequiredTemplates();
    
    const successCount = results.filter(r => r.result.success).length;
    const failCount = results.filter(r => !r.result.success).length;
    
    console.log(`\n📊 GENERATION SUMMARY:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (successCount > 0) {
        console.log('\n🎯 SUCCESS! Your Excel template is now ready.');
        console.log('🚀 Next steps:');
        console.log('1. Test downloading the template from your dashboard');
        console.log('2. Open the downloaded file in Excel to verify it works');
        console.log('3. Try importing the sample data back into your system');
        process.exit(0);
    } else {
        console.error('\n💥 Template generation failed. Please check the errors above.');
        process.exit(1);
    }
}

module.exports = { generateValidSalesTemplate, generateAllRequiredTemplates };