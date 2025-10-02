#!/usr/bin/env node

// 🔧 SCRIPT UNTUK TEST ADVERTISING SETTLEMENT TEMPLATE FIX
// Mengatasi template corruption dan memastikan Excel compatibility

const { generateAllRobustTemplates } = require('../src/templates/advertisingSettlementTemplateGenerator');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🔧 TESTING ADVERTISING SETTLEMENT TEMPLATE FIX...');
console.log('');

async function testTemplateFix() {
  try {
    console.log('🎯 Step 1: Generate robust templates...');
    
    // Generate templates
    const result = generateAllRobustTemplates();
    
    if (!result.success) {
      throw new Error(`Template generation failed: ${result.error}`);
    }
    
    console.log('✅ Templates generated successfully!');
    console.log(`📁 Basic template: ${result.basicTemplate}`);
    console.log(`📁 Guided template: ${result.guidedTemplate}`);
    console.log('');

    console.log('🔍 Step 2: Verify basic template...');
    
    // Test basic template
    if (!fs.existsSync(result.basicTemplate)) {
      throw new Error('Basic template file not found');
    }
    
    const basicStats = fs.statSync(result.basicTemplate);
    console.log(`📊 Basic template size: ${basicStats.size} bytes`);
    
    // Test Excel readability
    try {
      const workbook = XLSX.readFile(result.basicTemplate);
      const worksheet = workbook.Sheets['Advertising Settlement'];
      
      if (!worksheet) {
        throw new Error('Advertising Settlement worksheet not found');
      }
      
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        throw new Error('Template has no data');
      }
      
      console.log(`✅ Basic template verified: ${data.length} rows`);
      console.log(`📋 Columns: ${Object.keys(data[0]).join(', ')}`);
      
      // Verify all required columns are present
      const requiredColumns = [
        'Order ID', 'Type', 'Order Created Time', 'Order Settled Time',
        'Settlement Amount', 'Account Name', 'Marketplace', 'Currency'
      ];
      
      const templateColumns = Object.keys(data[0]);
      const missingColumns = requiredColumns.filter(col => !templateColumns.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }
      
      console.log('✅ All required columns present in basic template');
      
    } catch (excelError) {
      throw new Error(`Basic template Excel test failed: ${excelError.message}`);
    }
    
    console.log('');
    console.log('🔍 Step 3: Verify guided template...');
    
    // Test guided template
    if (!fs.existsSync(result.guidedTemplate)) {
      throw new Error('Guided template file not found');
    }
    
    const guidedStats = fs.statSync(result.guidedTemplate);
    console.log(`📊 Guided template size: ${guidedStats.size} bytes`);
    
    try {
      const workbook = XLSX.readFile(result.guidedTemplate);
      const sheetNames = workbook.SheetNames;
      
      console.log(`✅ Guided template verified: ${sheetNames.length} sheets`);
      console.log(`📋 Sheets: ${sheetNames.join(', ')}`);
      
      // Verify required sheets
      const requiredSheets = ['Instructions', 'Sample Data', 'Advertising Settlement'];
      const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
      
      if (missingSheets.length > 0) {
        throw new Error(`Missing required sheets: ${missingSheets.join(', ')}`);
      }
      
      console.log('✅ All required sheets present in guided template');
      
      // Test each sheet
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log(`   📄 ${sheetName}: ${data.length} rows`);
      });
      
    } catch (excelError) {
      throw new Error(`Guided template Excel test failed: ${excelError.message}`);
    }
    
    console.log('');
    console.log('🧪 Step 4: Test template data integrity...');
    
    // Test data samples
    const workbook = XLSX.readFile(result.basicTemplate);
    const worksheet = workbook.Sheets['Advertising Settlement'];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Check sample data values
    const sampleRow = data[0];
    
    if (!sampleRow['Order ID'] || !sampleRow['Settlement Amount']) {
      throw new Error('Template sample data missing critical values');
    }
    
    if (typeof sampleRow['Settlement Amount'] !== 'number') {
      throw new Error('Settlement Amount should be numeric');
    }
    
    console.log('✅ Template data integrity verified');
    console.log(`   📊 Sample Order ID: ${sampleRow['Order ID']}`);
    console.log(`   💰 Sample Settlement Amount: ${sampleRow['Settlement Amount']}`);
    console.log(`   🏪 Sample Marketplace: ${sampleRow['Marketplace']}`);
    
    console.log('');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log(`✅ Basic template: ${path.basename(result.basicTemplate)}`);
    console.log(`✅ Guided template: ${path.basename(result.guidedTemplate)}`);
    console.log('✅ Excel compatibility: Verified');
    console.log('✅ Required columns: Present');
    console.log('✅ Data integrity: Verified');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Start backend server: npm run dev');
    console.log('2. Test download endpoints:');
    console.log('   GET /api/advertising-settlement-template/download/basic');
    console.log('   GET /api/advertising-settlement-template/download/guided');
    console.log('3. Test import dengan template yang sudah diisi data');
    console.log('');
    console.log('🔗 Template fix complete! Templates are now Excel-compatible and not corrupted.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ TEMPLATE TEST FAILED:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('1. Check if XLSX library is properly installed');
    console.error('2. Verify templates directory permissions');
    console.error('3. Ensure no other process is using template files');
    console.error('4. Check for disk space issues');
    
    process.exit(1);
  }
}

// Run the test
testTemplateFix();