#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Robust Transaction Management Templates Generation...\n');

async function testRobustTemplates() {
  try {
    // Import the robust generator
    const RobustTransactionTemplateGenerator = require('../src/templates/robustTransactionTemplateGenerator');
    
    console.log('📋 Testing robust template generation...\n');
    
    const templateTests = [
      {
        name: 'Returns & Cancellations',
        method: 'generateReturnsTemplate'
      },
      {
        name: 'Marketplace Reimbursements',
        method: 'generateReimbursementsTemplate'
      },
      {
        name: 'Commission Adjustments',
        method: 'generateCommissionAdjustmentsTemplate'
      },
      {
        name: 'Affiliate Samples',
        method: 'generateAffiliateSamplesTemplate'
      }
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const test of templateTests) {
      console.log(`🔍 Testing ${test.name} template...`);
      
      try {
        // Generate the template
        const workbook = await RobustTransactionTemplateGenerator[test.method]();
        
        if (!workbook) {
          throw new Error('Generator returned null workbook');
        }
        
        // Validate the workbook
        const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
        
        if (!validation.valid) {
          throw new Error('Workbook validation failed');
        }
        
        // Test buffer generation
        const buffer = await workbook.xlsx.writeBuffer();
        
        console.log(`✅ ${test.name}: Generated successfully`);
        console.log(`   📊 Size: ${buffer.length} bytes`);
        console.log(`   📄 Worksheets: ${workbook.worksheets.length}`);
        console.log(`   🔍 Validation: Passed`);
        
        // Check if buffer has valid Excel signature
        const signature = buffer.toString('hex', 0, 4);
        if (signature === '504b0304') {
          console.log(`   ✅ Excel signature: Valid (${signature})`);
        } else {
          console.log(`   ⚠️  Excel signature: ${signature} (might be issue)`);
        }
        
        successCount++;
        
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Error: ${error.message}`);
        failCount++;
      }
      
      console.log('');
    }
    
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Success Rate: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);
    
    if (failCount === 0) {
      console.log('\n🎉 All robust template tests passed!');
      
      // Test bulk generation
      console.log('\n🧪 Testing bulk generation...');
      try {
        const bulkResult = await RobustTransactionTemplateGenerator.generateAllTemplates();
        
        if (bulkResult.success) {
          console.log('✅ Bulk generation: SUCCESS');
          console.log(`   📊 Generated: ${bulkResult.templates.length} templates`);
          
          // List generated files with sizes
          bulkResult.templates.forEach(template => {
            if (template.success) {
              console.log(`   📄 ${template.name}: ${template.size} bytes`);
            } else {
              console.log(`   ❌ ${template.name}: FAILED - ${template.error}`);
            }
          });
          
        } else {
          console.log('❌ Bulk generation: FAILED');
        }
        
      } catch (bulkError) {
        console.log(`❌ Bulk generation: ERROR - ${bulkError.message}`);
      }
      
    } else {
      console.log('\n⚠️  Some template tests failed. Check the errors above.');
    }
    
    return { successCount, failCount, totalTests: templateTests.length };
    
  } catch (error) {
    console.error('💥 Robust template testing failed:', error);
    throw error;
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
      
      // Check Excel signature
      const signature = buffer.toString('hex', 0, 4);
      if (signature === '504b0304') {
        console.log('✅ Excel signature: Valid');
      } else {
        console.log(`⚠️  Excel signature: ${signature}`);
      }
      
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
async function runAllTests() {
  try {
    console.log('🚀 Starting Robust Transaction Template Tests...\n');
    
    // Test ExcelJS first
    const excelJSWorking = await testExcelJSInstallation();
    
    if (!excelJSWorking) {
      console.log('\n💥 ExcelJS is not working properly. Please fix the installation first.');
      console.log('Try running: npm install exceljs@latest');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test robust templates
    const results = await testRobustTemplates();
    
    if (results.failCount === 0) {
      console.log('\n✅ All tests completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Start your backend server: npm start');
      console.log('   2. Test downloads at: http://localhost:5000/api/templates');
      console.log('   3. Templates should now download without corruption');
      
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();