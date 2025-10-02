#!/usr/bin/env node

/**
 * Template Structure Validation Script
 * Memvalidasi semua template memiliki struktur yang benar sesuai database schema
 * 
 * Usage: node backend/src/scripts/validateTemplateStructure.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Expected template structures
const EXPECTED_STRUCTURES = {
  sales: [
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
  ],
  products: [
    'product_code',
    'product_name',
    'category',
    'brand',
    'size',
    'color',
    'price',
    'cost',
    'stock_quantity',
    'min_stock'
  ],
  stock: [
    'product_code',
    'movement_type',
    'quantity',
    'reference_number',
    'notes',
    'movement_date'
  ],
  advertising: [
    'Campaign Name',
    'Campaign Type',
    'Platform',
    'Ad Group Name',
    'Keyword',
    'Ad Creative',
    'Date Range Start',
    'Date Range End',
    'Impressions',
    'Clicks',
    'Conversions',
    'Cost',
    'Revenue',
    'Marketplace'
  ]
};

// Template file mappings
const TEMPLATE_FILES = {
  sales: 'sales_template.xlsx',
  products: 'products_template_fixed.xlsx',
  stock: 'stock_template_fixed.xlsx',
  advertising: 'advertising_template.xlsx'
};

async function validateTemplateStructure() {
  console.log('🔍 Starting Template Structure Validation...\n');

  const templatesDir = path.join(__dirname, '../templates');
  const results = {};
  let allValid = true;

  // First, check if templates directory exists
  if (!fs.existsSync(templatesDir)) {
    console.error('❌ Templates directory not found:', templatesDir);
    console.log('💡 Run template generation first:');
    console.log('   node backend/scripts/regenerate-updated-templates.js\n');
    process.exit(1);
  }

  for (const [templateType, expectedHeaders] of Object.entries(EXPECTED_STRUCTURES)) {
    console.log(`🔍 Validating ${templateType.toUpperCase()} template...`);
    
    const templateFile = TEMPLATE_FILES[templateType];
    const templatePath = path.join(templatesDir, templateFile);
    
    try {
      // Check if template file exists
      if (!fs.existsSync(templatePath)) {
        console.log(`   ❌ Template file not found: ${templateFile}`);
        results[templateType] = {
          valid: false,
          error: 'Template file not found',
          missing: true
        };
        allValid = false;
        continue;
      }

      // Read Excel file
      const workbook = XLSX.readFile(templatePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get headers from first row
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const actualHeaders = data[0] || [];
      
      // Validate headers
      const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
      const extraHeaders = actualHeaders.filter(header => !expectedHeaders.includes(header));
      
      const isValid = missingHeaders.length === 0;
      
      results[templateType] = {
        valid: isValid,
        expectedCount: expectedHeaders.length,
        actualCount: actualHeaders.length,
        expectedHeaders,
        actualHeaders,
        missingHeaders,
        extraHeaders,
        hasData: data.length > 1
      };

      if (isValid) {
        console.log(`   ✅ Structure valid (${actualHeaders.length} columns)`);
        console.log(`   📊 Sample data rows: ${Math.max(0, data.length - 1)}`);
      } else {
        console.log(`   ❌ Structure invalid`);
        console.log(`   📋 Expected: ${expectedHeaders.length} columns`);
        console.log(`   📋 Actual: ${actualHeaders.length} columns`);
        
        if (missingHeaders.length > 0) {
          console.log(`   ❌ Missing: ${missingHeaders.join(', ')}`);
        }
        
        if (extraHeaders.length > 0) {
          console.log(`   ⚠️  Extra: ${extraHeaders.join(', ')}`);
        }
        
        allValid = false;
      }

    } catch (error) {
      console.log(`   ❌ Validation error: ${error.message}`);
      results[templateType] = {
        valid: false,
        error: error.message
      };
      allValid = false;
    }
    
    console.log('');
  }

  // Generate summary report
  console.log('📋 VALIDATION SUMMARY');
  console.log('=====================\n');
  
  const validTemplates = Object.values(results).filter(r => r.valid).length;
  const totalTemplates = Object.keys(results).length;
  
  console.log(`📊 Overall Result: ${validTemplates}/${totalTemplates} templates valid`);
  console.log(`📈 Success Rate: ${Math.round((validTemplates / totalTemplates) * 100)}%\n`);

  // Detailed results
  for (const [templateType, result] of Object.entries(results)) {
    const status = result.valid ? '✅ VALID' : '❌ INVALID';
    console.log(`${status} ${templateType.toUpperCase()} Template`);
    
    if (result.missing) {
      console.log(`   📁 File: NOT FOUND`);
    } else if (result.valid) {
      console.log(`   📁 File: ${TEMPLATE_FILES[templateType]}`);
      console.log(`   📋 Columns: ${result.actualCount}/${result.expectedCount}`);
      console.log(`   📊 Sample Data: ${result.hasData ? 'Available' : 'Header Only'}`);
    } else {
      console.log(`   📁 File: ${TEMPLATE_FILES[templateType]}`);
      console.log(`   📋 Issues: ${result.error || 'Structure mismatch'}`);
      
      if (result.missingHeaders?.length > 0) {
        console.log(`   ❌ Missing: ${result.missingHeaders.join(', ')}`);
      }
    }
    console.log('');
  }

  // Recommendations
  console.log('🔧 RECOMMENDATIONS');
  console.log('==================\n');
  
  if (allValid) {
    console.log('✅ All templates are valid and ready for use');
    console.log('✅ Download template buttons should work correctly');
    console.log('✅ Import process should work with generated templates');
    console.log('✅ Customer and location columns are included in sales template');
  } else {
    console.log('❌ Some templates need attention:');
    console.log('');
    console.log('1. Regenerate templates with latest structure:');
    console.log('   node backend/scripts/regenerate-updated-templates.js');
    console.log('');
    console.log('2. Check template generation script for errors:');
    console.log('   node backend/src/templates/generate_templates.js');
    console.log('');
    console.log('3. Verify database schema matches template structure');
    console.log('   Check backend/prisma/schema.prisma');
  }

  console.log('\n✨ Template validation completed');
  
  // Exit with appropriate code
  process.exit(allValid ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  validateTemplateStructure()
    .catch((error) => {
      console.error('\n💥 Template validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateTemplateStructure, EXPECTED_STRUCTURES, TEMPLATE_FILES };