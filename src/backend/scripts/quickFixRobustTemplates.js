#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔧 Quick Fix: Robust Transaction Templates\n');

async function quickFixTemplates() {
  try {
    console.log('1. 🧪 Testing ExcelJS dependency...');
    
    // Test ExcelJS
    try {
      const ExcelJS = require('exceljs');
      const testWorkbook = new ExcelJS.Workbook();
      const testWorksheet = testWorkbook.addWorksheet('Test');
      testWorksheet.addRow(['Test']);
      
      const testBuffer = await testWorkbook.xlsx.writeBuffer();
      
      if (testBuffer.length === 0) {
        throw new Error('ExcelJS generated empty buffer');
      }
      
      console.log(`   ✅ ExcelJS working: ${testBuffer.length} bytes`);
      
    } catch (excelError) {
      console.log('   ❌ ExcelJS test failed:', excelError.message);
      console.log('   🔧 Attempting to reinstall ExcelJS...');
      
      const { execSync } = require('child_process');
      execSync('npm install exceljs@latest', { stdio: 'inherit' });
      
      console.log('   ✅ ExcelJS reinstalled');
    }
    
    console.log('\n2. 📋 Testing robust template generator...');
    
    const RobustTransactionTemplateGenerator = require('../src/templates/robustTransactionTemplateGenerator');
    
    // Quick test of one template
    try {
      const testWorkbook = await RobustTransactionTemplateGenerator.generateReturnsTemplate();
      const validation = await RobustTransactionTemplateGenerator.validateWorkbook(testWorkbook, 2);
      
      console.log(`   ✅ Template generation working: ${validation.size} bytes`);
      
    } catch (genError) {
      console.log('   ❌ Template generation failed:', genError.message);
      throw genError;
    }
    
    console.log('\n3. 🚀 Generating all templates...');
    
    const result = await RobustTransactionTemplateGenerator.generateAllTemplates();
    
    if (result.success) {
      console.log('   ✅ All templates generated successfully');
      
      result.templates.forEach(template => {
        if (template.success) {
          console.log(`   📄 ${template.description}: ${template.size} bytes`);
        } else {
          console.log(`   ❌ ${template.description}: FAILED`);
        }
      });
      
    } else {
      console.log('   ⚠️  Some templates failed to generate');
    }
    
    console.log('\n4. 🔍 Verifying template files...');
    
    const templatesDir = path.join(__dirname, '../templates');
    const expectedFiles = [
      'returns-cancellations-template.xlsx',
      'marketplace-reimbursements-template.xlsx',
      'commission-adjustments-template.xlsx',
      'affiliate-samples-template.xlsx'
    ];
    
    let validCount = 0;
    
    for (const filename of expectedFiles) {
      const filePath = path.join(templatesDir, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.size > 10000) { // At least 10KB
          console.log(`   ✅ ${filename}: ${stats.size} bytes`);
          validCount++;
        } else {
          console.log(`   ⚠️  ${filename}: ${stats.size} bytes (too small)`);
        }
      } else {
        console.log(`   ❌ ${filename}: NOT FOUND`);
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log('================');
    console.log(`✅ Valid templates: ${validCount}/${expectedFiles.length}`);
    
    if (validCount === expectedFiles.length) {
      console.log('\n🎉 Quick fix completed successfully!');
      console.log('\n📋 Templates are now ready for download');
      console.log('   • Start backend server: npm start');
      console.log('   • Test downloads at: http://localhost:5000/api/templates');
      console.log('   • All templates should now work without corruption');
      
      return true;
    } else {
      console.log('\n⚠️  Quick fix partially successful');
      console.log(`   ${validCount} out of ${expectedFiles.length} templates are working`);
      
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 Quick fix failed:', error);
    
    console.log('\n🔧 Manual troubleshooting steps:');
    console.log('1. Reinstall ExcelJS: npm install exceljs@latest');
    console.log('2. Check Node.js version: node --version (should be 14+)');
    console.log('3. Clear node_modules: rm -rf node_modules && npm install');
    console.log('4. Run full test: node scripts/testRobustTransactionTemplates.js');
    
    return false;
  }
}

// Run the quick fix
quickFixTemplates()
  .then((success) => {
    if (success) {
      console.log('\n✅ Quick fix completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Quick fix had issues - check manual steps above');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Quick fix failed:', error);
    process.exit(1);
  });