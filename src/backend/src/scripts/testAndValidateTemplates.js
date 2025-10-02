#!/usr/bin/env node

/**
 * Test and Validate Templates Script
 * Tests template generation and validates against import system
 * 
 * Usage: node backend/src/scripts/testAndValidateTemplates.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { fixCorruptedSalesTemplate } = require('./fixCorruptedSalesTemplate');

async function testAndValidateTemplates() {
    console.log('🧪 Testing and validating D\'Busana templates...\n');

    try {
        // 1. Fix the corrupted sales template first
        console.log('1️⃣ Fixing corrupted sales template...');
        const fixResult = fixCorruptedSalesTemplate();
        
        if (!fixResult.success) {
            throw new Error(`Template fix failed: ${fixResult.error}`);
        }
        console.log('✅ Sales template fixed successfully\n');

        // 2. Test all template files
        console.log('2️⃣ Testing template files...');
        const templatesDir = path.join(__dirname, '..', 'templates');
        const templateFiles = [
            { name: 'Sales Template', file: 'sales_template.xlsx', type: 'sales' },
            { name: 'Sales Template Fixed', file: 'sales_template_fixed.xlsx', type: 'sales' }
        ];

        const testResults = [];

        for (const template of templateFiles) {
            const filePath = path.join(templatesDir, template.file);
            
            console.log(`\n📋 Testing ${template.name}...`);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ File not found: ${template.file}`);
                testResults.push({
                    name: template.name,
                    exists: false,
                    valid: false,
                    error: 'File not found'
                });
                continue;
            }

            try {
                // Test file reading
                const workbook = XLSX.readFile(filePath);
                console.log(`   ✅ File readable: ${workbook.SheetNames.length} sheets`);

                // Test first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet);

                console.log(`   📊 Data: ${data.length} sample rows`);
                console.log(`   📝 Sheet: "${sheetName}"`);

                if (data.length > 0) {
                    const headers = Object.keys(data[0]);
                    console.log(`   🏷️ Columns (${headers.length}): ${headers.slice(0, 5).join(', ')}...`);

                    // Validate required headers for sales template
                    if (template.type === 'sales') {
                        const requiredHeaders = [
                            'Order ID', 'Seller SKU', 'Product Name', 
                            'Marketplace', 'Customer', 'Province', 'Regency', 'City'
                        ];
                        
                        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                        const extraHeaders = headers.filter(h => !requiredHeaders.concat([
                            'Color', 'Size', 'Quantity', 'Order Amount', 'Created Time', 
                            'Delivered Time', 'Total settlement amount', 'Total revenue', 'HPP', 'Total'
                        ]).includes(h));

                        if (missingHeaders.length === 0) {
                            console.log(`   ✅ All required headers present`);
                        } else {
                            console.log(`   ❌ Missing headers: ${missingHeaders.join(', ')}`);
                        }

                        if (extraHeaders.length > 0) {
                            console.log(`   ⚠️ Extra headers: ${extraHeaders.join(', ')}`);
                        }

                        // Test sample data validity
                        let validRowCount = 0;
                        for (let i = 0; i < Math.min(3, data.length); i++) {
                            const row = data[i];
                            if (row['Order ID'] && row['Seller SKU'] && row['Product Name']) {
                                validRowCount++;
                            }
                        }
                        console.log(`   ✅ Valid sample rows: ${validRowCount}/${Math.min(3, data.length)}`);
                    }

                    testResults.push({
                        name: template.name,
                        exists: true,
                        valid: true,
                        sheets: workbook.SheetNames.length,
                        rows: data.length,
                        columns: headers.length,
                        headers: headers
                    });

                } else {
                    console.log(`   ⚠️ No data rows found`);
                    testResults.push({
                        name: template.name,
                        exists: true,
                        valid: false,
                        error: 'No data rows'
                    });
                }

            } catch (readError) {
                console.log(`   ❌ Read error: ${readError.message}`);
                testResults.push({
                    name: template.name,
                    exists: true,
                    valid: false,
                    error: readError.message
                });
            }
        }

        // 3. Test import compatibility
        console.log('\n3️⃣ Testing import compatibility...');
        
        const salesTemplatePath = path.join(templatesDir, 'sales_template.xlsx');
        if (fs.existsSync(salesTemplatePath)) {
            try {
                const workbook = XLSX.readFile(salesTemplatePath);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const testData = XLSX.utils.sheet_to_json(worksheet);

                if (testData.length > 0) {
                    const testRow = testData[0];
                    
                    // Simulate import controller field mapping
                    const mappedFields = {
                        order_id: testRow['Order ID'],
                        seller_sku: testRow['Seller SKU'],
                        product_name: testRow['Product Name'],
                        color: testRow['Color'],
                        size: testRow['Size'],
                        quantity: parseInt(testRow['Quantity'] || 0),
                        order_amount: parseFloat(testRow['Order Amount'] || 0),
                        marketplace: testRow['Marketplace'],
                        customer: testRow['Customer'],
                        province: testRow['Province'],
                        regency: testRow['Regency'],
                        city: testRow['City']
                    };

                    console.log('   📋 Field mapping test:');
                    Object.entries(mappedFields).forEach(([key, value]) => {
                        const status = value ? '✅' : '⚠️';
                        console.log(`     ${status} ${key}: ${value || 'empty'}`);
                    });

                    const requiredFields = ['order_id', 'seller_sku', 'product_name'];
                    const missingRequired = requiredFields.filter(field => !mappedFields[field]);
                    
                    if (missingRequired.length === 0) {
                        console.log('   ✅ Import compatibility: PASSED');
                    } else {
                        console.log(`   ❌ Import compatibility: FAILED - Missing: ${missingRequired.join(', ')}`);
                    }
                } else {
                    console.log('   ⚠️ No test data available for compatibility check');
                }
            } catch (compatError) {
                console.log(`   ❌ Compatibility test failed: ${compatError.message}`);
            }
        } else {
            console.log('   ❌ Sales template not found for compatibility test');
        }

        // 4. Generate summary report
        console.log('\n📊 TEMPLATE VALIDATION SUMMARY');
        console.log('=====================================');
        
        const validTemplates = testResults.filter(r => r.valid);
        const invalidTemplates = testResults.filter(r => !r.valid);
        
        console.log(`✅ Valid templates: ${validTemplates.length}`);
        console.log(`❌ Invalid templates: ${invalidTemplates.length}`);
        console.log(`📁 Total tested: ${testResults.length}`);

        if (validTemplates.length > 0) {
            console.log('\n✅ VALID TEMPLATES:');
            validTemplates.forEach(t => {
                console.log(`   - ${t.name}: ${t.columns} columns, ${t.rows} rows`);
            });
        }

        if (invalidTemplates.length > 0) {
            console.log('\n❌ INVALID TEMPLATES:');
            invalidTemplates.forEach(t => {
                console.log(`   - ${t.name}: ${t.error || 'Unknown error'}`);
            });
        }

        // 5. Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (invalidTemplates.length > 0) {
            console.log('   🔧 Run the fix script again to resolve template issues');
            console.log('   📝 Check file permissions and disk space');
            console.log('   🗂️ Ensure templates directory exists');
        } else {
            console.log('   🎉 All templates are valid and ready for use');
            console.log('   🚀 Import system should work correctly');
        }

        return {
            success: true,
            validTemplates: validTemplates.length,
            invalidTemplates: invalidTemplates.length,
            results: testResults
        };

    } catch (error) {
        console.error('❌ Template validation failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run if called directly
if (require.main === module) {
    testAndValidateTemplates()
        .then(result => {
            if (result.success) {
                console.log('\n✨ Template validation completed');
                process.exit(0);
            } else {
                console.error('\n💥 Template validation failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testAndValidateTemplates };