#!/usr/bin/env node

/**
 * Fix Corrupted Sales Template Script
 * Generates a new, clean Excel template file that matches D'Busana requirements
 * 
 * Usage: node backend/src/scripts/fixCorruptedSalesTemplate.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function fixCorruptedSalesTemplate() {
    console.log('🔧 Fixing corrupted sales template...\n');

    try {
        // Define headers that match database schema and import controller
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

        // Create comprehensive sample data with various scenarios
        const sampleData = [
            {
                'Order ID': 'DBU-001',
                'Seller SKU': 'DBS-001-RED-M',
                'Product Name': 'Kemeja Batik Modern',
                'Color': 'Red',
                'Size': 'M',
                'Quantity': 2,
                'Order Amount': 350000,
                'Created Time': '2024-01-15',
                'Delivered Time': '2024-01-17',
                'Total settlement amount': 332500,
                'Total revenue': 350000,
                'HPP': 200000,
                'Total': 350000,
                'Marketplace': 'TikTok Shop',
                'Customer': 'Ibu Sari Dewi',
                'Province': 'DKI Jakarta',
                'Regency': 'Jakarta Pusat',
                'City': 'Jakarta Pusat'
            },
            {
                'Order ID': 'DBU-002',
                'Seller SKU': 'DBS-002-BLUE-L',
                'Product Name': 'Blouse Wanita Elegant',
                'Color': 'Blue',
                'Size': 'L',
                'Quantity': 1,
                'Order Amount': 200000,
                'Created Time': '2024-01-16',
                'Delivered Time': '2024-01-18',
                'Total settlement amount': 190000,
                'Total revenue': 200000,
                'HPP': 130000,
                'Total': 200000,
                'Marketplace': 'Shopee',
                'Customer': 'Bpk. Ahmad Pratama',
                'Province': 'Jawa Barat',
                'Regency': 'Bandung',
                'City': 'Bandung'
            },
            {
                'Order ID': 'DBU-003',
                'Seller SKU': 'DBS-003-GREEN-S',
                'Product Name': 'Celana Panjang Formal',
                'Color': 'Green',
                'Size': 'S',
                'Quantity': 3,
                'Order Amount': 540000,
                'Created Time': '2024-01-17',
                'Delivered Time': '',
                'Total settlement amount': 513000,
                'Total revenue': 540000,
                'HPP': 360000,
                'Total': 540000,
                'Marketplace': 'Tokopedia',
                'Customer': 'Ibu Maya Indira',
                'Province': 'Jawa Tengah',
                'Regency': 'Semarang',
                'City': 'Semarang'
            },
            {
                'Order ID': 'DBU-004',
                'Seller SKU': 'DBS-004-WHITE-XL',
                'Product Name': 'Dress Tenun Modern',
                'Color': 'White',
                'Size': 'XL',
                'Quantity': 1,
                'Order Amount': 250000,
                'Created Time': '2024-01-18',
                'Delivered Time': '2024-01-19',
                'Total settlement amount': 250000,
                'Total revenue': 250000,
                'HPP': 165000,
                'Total': 250000,
                'Marketplace': 'TikTok Shop',
                'Customer': 'Ibu Fitri Handayani',
                'Province': 'Jawa Timur',
                'Regency': 'Surabaya',
                'City': 'Surabaya'
            },
            {
                'Order ID': 'DBU-005',
                'Seller SKU': 'DBS-005-BLACK-M',
                'Product Name': 'Jaket Batik Casual',
                'Color': 'Black',
                'Size': 'M',
                'Quantity': 2,
                'Order Amount': 350000,
                'Created Time': '2024-01-19',
                'Delivered Time': '2024-01-21',
                'Total settlement amount': 332500,
                'Total revenue': 350000,
                'HPP': 230000,
                'Total': 350000,
                'Marketplace': 'Lazada',
                'Customer': 'Bpk. Deni Kurniawan',
                'Province': 'Banten',
                'Regency': 'Tangerang',
                'City': 'Tangerang Selatan'
            },
            {
                'Order ID': 'DBU-006',
                'Seller SKU': 'DBS-006-YELLOW-L',
                'Product Name': 'Rok Batik Tradisional',
                'Color': 'Yellow',
                'Size': 'L',
                'Quantity': 1,
                'Order Amount': 180000,
                'Created Time': '2024-01-20',
                'Delivered Time': '2024-01-22',
                'Total settlement amount': 171000,
                'Total revenue': 180000,
                'HPP': 120000,
                'Total': 180000,
                'Marketplace': 'Bukalapak',
                'Customer': 'Ibu Rina Sari',
                'Province': 'Yogyakarta',
                'Regency': 'Yogyakarta',
                'City': 'Yogyakarta'
            }
        ];

        // Create worksheet with proper formatting
        const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data Template');

        // Set comprehensive column widths for better readability
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

        // Add data validation and formatting
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Format headers with bold styling
        for (let col = range.s.c; col <= range.e.c; col++) {
            const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[headerCell]) {
                worksheet[headerCell].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "DDDDDD" } }
                };
            }
        }

        // Set number format for monetary columns
        const monetaryColumns = ['Order Amount', 'Total settlement amount', 'Total revenue', 'HPP', 'Total'];
        monetaryColumns.forEach(colName => {
            const colIndex = headers.indexOf(colName);
            if (colIndex !== -1) {
                for (let row = 1; row <= range.e.r; row++) {
                    const cellAddr = XLSX.utils.encode_cell({ r: row, c: colIndex });
                    if (worksheet[cellAddr]) {
                        worksheet[cellAddr].z = '#,##0';
                    }
                }
            }
        });

        // Set date format for date columns
        const dateColumns = ['Created Time', 'Delivered Time'];
        dateColumns.forEach(colName => {
            const colIndex = headers.indexOf(colName);
            if (colIndex !== -1) {
                for (let row = 1; row <= range.e.r; row++) {
                    const cellAddr = XLSX.utils.encode_cell({ r: row, c: colIndex });
                    if (worksheet[cellAddr]) {
                        worksheet[cellAddr].z = 'dd-mm-yyyy';
                    }
                }
            }
        });

        // Define file paths
        const templatesDir = path.join(__dirname, '..', 'templates');
        const newTemplatePath = path.join(templatesDir, 'sales_template_fixed.xlsx');
        const originalTemplatePath = path.join(templatesDir, 'sales_template.xlsx');
        const backupPath = path.join(templatesDir, 'sales_template_corrupted_backup.xlsx');

        // Create templates directory if it doesn't exist
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
        }

        // Backup the corrupted template if it exists
        if (fs.existsSync(originalTemplatePath)) {
            console.log('📁 Backing up corrupted template...');
            fs.copyFileSync(originalTemplatePath, backupPath);
            console.log('✅ Corrupted template backed up to:', backupPath);
        }

        // Write the new fixed template
        console.log('💾 Generating new fixed template...');
        XLSX.writeFile(workbook, newTemplatePath);
        console.log('✅ New template created at:', newTemplatePath);

        // Replace the original corrupted template
        if (fs.existsSync(newTemplatePath)) {
            fs.copyFileSync(newTemplatePath, originalTemplatePath);
            console.log('🔄 Replaced corrupted template with fixed version');
        }

        // Validate the generated file
        console.log('\n🔍 Validating generated template...');
        try {
            const testWorkbook = XLSX.readFile(originalTemplatePath);
            const testSheetName = testWorkbook.SheetNames[0];
            const testWorksheet = testWorkbook.Sheets[testSheetName];
            const testData = XLSX.utils.sheet_to_json(testWorksheet);
            
            console.log(`✅ Template validation successful:`);
            console.log(`   - Sheets: ${testWorkbook.SheetNames.length}`);
            console.log(`   - Columns: ${Object.keys(testData[0] || {}).length}`);
            console.log(`   - Sample rows: ${testData.length}`);
            console.log(`   - Headers: ${Object.keys(testData[0] || {}).join(', ')}`);
            
            // Test column mapping
            const requiredColumns = ['Order ID', 'Seller SKU', 'Product Name', 'Marketplace', 'Customer', 'Province'];
            const missingColumns = requiredColumns.filter(col => !Object.keys(testData[0] || {}).includes(col));
            
            if (missingColumns.length === 0) {
                console.log('✅ All required columns present');
            } else {
                console.log('⚠️ Missing columns:', missingColumns.join(', '));
            }

        } catch (validationError) {
            console.error('❌ Template validation failed:', validationError.message);
            throw validationError;
        }

        console.log('\n🎉 Sales template corruption fix completed successfully!');
        console.log('================================');
        console.log(`✅ Original template: ${originalTemplatePath}`);
        console.log(`✅ Backup created: ${backupPath}`);
        console.log(`✅ Fixed template: ${newTemplatePath}`);
        console.log(`✅ Structure: 18 columns, 6 sample rows`);
        console.log(`✅ Compatible with: D'Busana import system`);
        
        return {
            success: true,
            files: {
                original: originalTemplatePath,
                fixed: newTemplatePath,
                backup: backupPath
            },
            columnCount: headers.length,
            sampleRows: sampleData.length
        };

    } catch (error) {
        console.error('❌ Template fix failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 Manual troubleshooting steps:');
        console.log('1. Ensure XLSX library is installed: npm install xlsx');
        console.log('2. Check write permissions to templates directory');
        console.log('3. Verify template directory exists');
        console.log('4. Clear any file locks on template files');
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run if called directly
if (require.main === module) {
    console.log('🚀 Starting Sales Template Fix...\n');
    
    const result = fixCorruptedSalesTemplate();
    
    if (result.success) {
        console.log('\n✨ Template fix completed successfully');
        process.exit(0);
    } else {
        console.error('\n💥 Template fix failed:', result.error);
        process.exit(1);
    }
}

module.exports = { fixCorruptedSalesTemplate };