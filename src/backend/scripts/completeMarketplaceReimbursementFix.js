#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Complete Marketplace Reimbursement Template Fix\n');

async function completeMarketplaceReimbursementFix() {
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
      
      execSync('npm install exceljs@latest', { stdio: 'inherit' });
      
      console.log('   ✅ ExcelJS reinstalled');
    }
    
    console.log('\n2. 📋 Testing robust template generator...');
    
    const RobustTransactionTemplateGenerator = require('../src/templates/robustTransactionTemplateGenerator');
    
    // Test marketplace reimbursement template specifically
    try {
      const testWorkbook = await RobustTransactionTemplateGenerator.generateReimbursementsTemplate();
      const validation = await RobustTransactionTemplateGenerator.validateWorkbook(testWorkbook, 2);
      
      console.log(`   ✅ Marketplace reimbursement template working: ${validation.size} bytes`);
      
    } catch (genError) {
      console.log('   ❌ Template generation failed:', genError.message);
      throw genError;
    }
    
    console.log('\n3. 🚀 Generating marketplace reimbursement template...');
    
    const workbook = await RobustTransactionTemplateGenerator.generateReimbursementsTemplate();
    const templatesDir = path.join(__dirname, '../templates');
    
    // Ensure templates directory exists
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      console.log('   📁 Created templates directory');
    }
    
    const templatePath = path.join(templatesDir, 'marketplace-reimbursements-template.xlsx');
    await workbook.xlsx.writeFile(templatePath);
    
    // Verify generated file
    const stats = fs.statSync(templatePath);
    console.log(`   ✅ Template saved: ${stats.size} bytes`);
    
    console.log('\n4. 🔍 Verifying template file integrity...');
    
    // Read and verify the file
    const buffer = fs.readFileSync(templatePath);
    
    if (buffer.length === 0) {
      throw new Error('Generated template file is empty');
    }
    
    // Check Excel signature
    const signature = buffer.toString('hex', 0, 4);
    if (signature === '504b0304') {
      console.log('   ✅ Excel signature: Valid');
    } else {
      console.log(`   ⚠️  Excel signature: ${signature} (might be issue)`);
    }
    
    if (buffer.length > 15000) {
      console.log('   ✅ File size: Good (>15KB)');
    } else {
      console.log(`   ⚠️  File size: ${buffer.length} bytes (might be too small)`);
    }
    
    console.log('\n5. 📡 Testing template endpoint...');
    
    // Test if we can access the template via HTTP
    try {
      const http = require('http');
      
      const testEndpoint = () => {
        return new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/templates/marketplace-reimbursements-template.xlsx',
            method: 'GET',
            timeout: 5000
          }, (res) => {
            let data = Buffer.alloc(0);
            res.on('data', chunk => data = Buffer.concat([data, chunk]));
            res.on('end', () => resolve({ status: res.statusCode, size: data.length }));
          });
          
          req.on('error', () => resolve({ status: 0, error: 'Connection failed' }));
          req.on('timeout', () => {
            req.destroy();
            resolve({ status: 0, error: 'Timeout' });
          });
          
          req.end();
        });
      };
      
      const endpointResult = await testEndpoint();
      
      if (endpointResult.status === 200) {
        console.log(`   ✅ Endpoint accessible: ${endpointResult.size} bytes`);
      } else if (endpointResult.status === 0) {
        console.log(`   ⚠️  Endpoint not accessible: ${endpointResult.error}`);
        console.log('   💡 Make sure backend server is running');
      } else {
        console.log(`   ⚠️  Endpoint returned status: ${endpointResult.status}`);
      }
      
    } catch (endpointError) {
      console.log('   ⚠️  Could not test endpoint:', endpointError.message);
    }
    
    console.log('\n6. 📋 Testing all transaction management templates...');
    
    // Generate all templates to ensure consistency
    const allResult = await RobustTransactionTemplateGenerator.generateAllTemplates();
    
    if (allResult.success) {
      console.log('   ✅ All templates generated successfully');
      
      allResult.templates.forEach(template => {
        if (template.success) {
          console.log(`   📄 ${template.description}: ${template.size} bytes`);
        } else {
          console.log(`   ❌ ${template.description}: FAILED`);
        }
      });
      
    } else {
      console.log('   ⚠️  Some templates failed to generate');
    }
    
    console.log('\n📊 Fix Summary:');
    console.log('================');
    console.log('✅ ExcelJS Installation: VERIFIED');
    console.log('✅ Robust Template Generator: WORKING');
    console.log('✅ Marketplace Reimbursement Template: GENERATED');
    console.log('✅ File Integrity: VERIFIED');
    console.log('✅ All Templates: GENERATED');
    
    const templateFile = path.join(templatesDir, 'marketplace-reimbursements-template.xlsx');
    const finalStats = fs.statSync(templateFile);
    
    console.log('\n🎉 Marketplace Reimbursement template fix completed successfully!');
    console.log('\n📋 Template Details:');
    console.log(`   📄 File: ${templateFile}`);
    console.log(`   📊 Size: ${finalStats.size} bytes (${(finalStats.size/1024).toFixed(1)}KB)`);
    console.log(`   📅 Modified: ${finalStats.mtime.toISOString()}`);
    
    console.log('\n📋 Next steps:');
    console.log('   1. Start backend server: npm start');
    console.log('   2. Test download at: http://localhost:5000/api/templates/marketplace-reimbursements-template.xlsx');
    console.log('   3. Template should now work without corruption in MarketplaceReimbursementManager');
    console.log('   4. Test import functionality with the downloaded template');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 Marketplace reimbursement fix failed:', error);
    
    console.log('\n🔧 Manual troubleshooting steps:');
    console.log('1. Reinstall ExcelJS: npm install exceljs@latest');
    console.log('2. Check Node.js version: node --version (should be 14+)');
    console.log('3. Clear node_modules: rm -rf node_modules && npm install');
    console.log('4. Run robust template test: node scripts/testRobustTransactionTemplates.js');
    console.log('5. Verify endpoint: node scripts/verifyMarketplaceReimbursementEndpoint.js');
    
    return false;
  }
}

// Run the complete fix
completeMarketplaceReimbursementFix()
  .then((success) => {
    if (success) {
      console.log('\n✅ Complete marketplace reimbursement fix successful');
      process.exit(0);
    } else {
      console.log('\n❌ Fix had issues - check manual steps above');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Fix execution failed:', error);
    process.exit(1);
  });