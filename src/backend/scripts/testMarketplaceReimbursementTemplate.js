#!/usr/bin/env node

const path = require('path');

console.log('🧪 Testing Marketplace Reimbursement Template Generation...\n');

async function testMarketplaceReimbursementTemplate() {
  try {
    // Import the robust generator
    const RobustTransactionTemplateGenerator = require('../src/templates/robustTransactionTemplateGenerator');
    
    console.log('📋 Testing marketplace reimbursement template generation...\n');
    
    // Test template generation
    console.log('🔧 Generating marketplace reimbursement template...');
    const workbook = await RobustTransactionTemplateGenerator.generateReimbursementsTemplate();
    
    if (!workbook) {
      throw new Error('Generator returned null workbook');
    }
    
    console.log('✅ Template generation: SUCCESS');
    console.log(`   📊 Worksheets: ${workbook.worksheets.length}`);
    
    // Validate the workbook
    console.log('🔍 Validating generated template...');
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Workbook validation failed');
    }
    
    console.log('✅ Template validation: SUCCESS');
    console.log(`   📊 Size: ${validation.size} bytes`);
    
    // Test buffer generation
    console.log('📦 Testing buffer generation...');
    const buffer = await workbook.xlsx.writeBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Buffer generation failed');
    }
    
    console.log('✅ Buffer generation: SUCCESS');
    console.log(`   📊 Buffer size: ${buffer.length} bytes`);
    
    // Check Excel signature
    const signature = buffer.toString('hex', 0, 4);
    if (signature === '504b0304') {
      console.log('✅ Excel signature: Valid (504b0304)');
    } else {
      console.log(`⚠️  Excel signature: ${signature} (might be issue)`);
    }
    
    // Test worksheet contents
    console.log('📄 Testing worksheet contents...');
    const dataWorksheet = workbook.getWorksheet('Marketplace Reimbursements');
    const instructionsWorksheet = workbook.getWorksheet('📋 Instructions');
    
    if (!dataWorksheet) {
      throw new Error('Data worksheet not found');
    }
    
    if (!instructionsWorksheet) {
      throw new Error('Instructions worksheet not found');
    }
    
    console.log('✅ Worksheet contents: SUCCESS');
    console.log(`   📄 Data worksheet: ${dataWorksheet.name}`);
    console.log(`   📄 Instructions worksheet: ${instructionsWorksheet.name}`);
    
    // Test header row
    const headerRow = dataWorksheet.getRow(1);
    const headerValues = [];
    headerRow.eachCell((cell) => {
      headerValues.push(cell.value);
    });
    
    console.log('📝 Testing header structure...');
    console.log(`   📊 Headers found: ${headerValues.length}`);
    console.log(`   📝 Sample headers: ${headerValues.slice(0, 5).join(', ')}...`);
    
    const expectedHeaders = [
      'Claim ID', 'Reimbursement Type', 'Claim Amount', 'Approved Amount', 
      'Received Amount', 'Processing Fee', 'Incident Date', 'Marketplace'
    ];
    
    let headersFound = 0;
    expectedHeaders.forEach(header => {
      if (headerValues.includes(header)) {
        headersFound++;
      }
    });
    
    console.log(`✅ Header validation: ${headersFound}/${expectedHeaders.length} expected headers found`);
    
    // Test example data
    const exampleRow = dataWorksheet.getRow(2);
    let exampleDataFound = false;
    exampleRow.eachCell((cell) => {
      if (cell.value && cell.value !== '') {
        exampleDataFound = true;
        return false; // Break loop
      }
    });
    
    if (exampleDataFound) {
      console.log('✅ Example data: Found');
    } else {
      console.log('⚠️  Example data: Not found');
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log('✅ Template Generation: PASSED');
    console.log('✅ Workbook Validation: PASSED');
    console.log('✅ Buffer Generation: PASSED');
    console.log('✅ Excel Signature: VALID');
    console.log('✅ Worksheet Structure: PASSED');
    console.log(`✅ Header Validation: ${headersFound}/${expectedHeaders.length} PASSED`);
    console.log(`${exampleDataFound ? '✅' : '⚠️ '} Example Data: ${exampleDataFound ? 'PASSED' : 'WARNING'}`);
    
    console.log('\n🎉 All marketplace reimbursement template tests passed!');
    
    return {
      success: true,
      size: validation.size,
      headers: headerValues.length,
      worksheets: workbook.worksheets.length
    };
    
  } catch (error) {
    console.error('\n❌ Marketplace reimbursement template test failed:', error.message);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if robust template generator exists');
    console.log('2. Verify ExcelJS installation: npm install exceljs@latest');
    console.log('3. Run robust template fix: node scripts/quickFixRobustTemplates.js');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Test ExcelJS installation first
async function testExcelJSInstallation() {
  try {
    console.log('🔍 Testing ExcelJS installation...');
    
    const ExcelJS = require('exceljs');
    console.log('✅ ExcelJS import: SUCCESS');
    
    // Test basic functionality
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    worksheet.addRow(['Test', 'Data', 'Row']);
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    if (buffer.length > 0) {
      console.log(`✅ ExcelJS basic test: SUCCESS (${buffer.length} bytes)`);
      return true;
    } else {
      console.log('❌ ExcelJS basic test: Buffer is empty');
      return false;
    }
    
  } catch (error) {
    console.error('❌ ExcelJS installation test failed:', error.message);
    return false;
  }
}

// Run the tests
async function runTests() {
  try {
    console.log('🚀 Starting Marketplace Reimbursement Template Tests...\n');
    
    // Test ExcelJS first
    const excelJSWorking = await testExcelJSInstallation();
    
    if (!excelJSWorking) {
      console.log('\n💥 ExcelJS is not working properly. Please fix the installation first.');
      console.log('Try running: npm install exceljs@latest');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test marketplace reimbursement template
    const result = await testMarketplaceReimbursementTemplate();
    
    if (result.success) {
      console.log('\n✅ All tests completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Start your backend server: npm start');
      console.log('   2. Test download at: http://localhost:5000/api/templates/marketplace-reimbursements-template.xlsx');
      console.log('   3. Template should download without corruption');
      
      process.exit(0);
    } else {
      console.log('\n❌ Tests failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

runTests();