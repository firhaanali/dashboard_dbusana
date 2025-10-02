#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Transaction Management Template Setup...\n');

async function verifySetup() {
  let issues = [];
  let warnings = [];
  
  try {
    console.log('1. 📦 Checking package.json dependencies...');
    
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (!fs.existsSync(packageJsonPath)) {
      issues.push('package.json not found in backend directory');
    } else {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check ExcelJS dependency
        const hasExcelJS = packageJson.dependencies?.exceljs || packageJson.devDependencies?.exceljs;
        if (hasExcelJS) {
          console.log(`   ✅ ExcelJS dependency found: ${hasExcelJS}`);
        } else {
          issues.push('ExcelJS dependency not found in package.json');
        }
        
        // Check Express dependency
        const hasExpress = packageJson.dependencies?.express;
        if (hasExpress) {
          console.log(`   ✅ Express dependency found: ${hasExpress}`);
        } else {
          issues.push('Express dependency not found in package.json');
        }
        
      } catch (parseError) {
        issues.push('Failed to parse package.json: ' + parseError.message);
      }
    }
    
    console.log('\n2. 📁 Checking file structure...');
    
    const requiredFiles = [
      '../src/templates/generateTransactionManagementTemplates.js',
      '../src/controllers/transactionTemplatesController.js',
      '../src/routes/transactionTemplates.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file.replace('../', '')} exists`);
      } else {
        issues.push(`Required file not found: ${file}`);
      }
    }
    
    console.log('\n3. 🧪 Testing imports and dependencies...');
    
    // Test ExcelJS import
    try {
      const ExcelJS = require('exceljs');
      console.log('   ✅ ExcelJS import successful');
      
      // Test basic Excel functionality
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test');
      worksheet.addRow(['Test', 'Cell']);
      
      const buffer = await workbook.xlsx.writeBuffer();
      if (buffer.length > 0) {
        console.log(`   ✅ ExcelJS basic functionality works (${buffer.length} bytes)`);
      } else {
        issues.push('ExcelJS buffer generation returned empty buffer');
      }
      
    } catch (error) {
      issues.push('ExcelJS import/functionality failed: ' + error.message);
    }
    
    // Test template generator import
    try {
      const TransactionManagementTemplateGenerator = require('../src/templates/generateTransactionManagementTemplates');
      console.log('   ✅ Template generator import successful');
      
      // Check if all required methods exist
      const requiredMethods = [
        'generateReturnsTemplate',
        'generateReimbursementsTemplate', 
        'generateCommissionAdjustmentsTemplate',
        'generateAffiliateSamplesTemplate',
        'generateAllTemplates'
      ];
      
      for (const method of requiredMethods) {
        if (typeof TransactionManagementTemplateGenerator[method] === 'function') {
          console.log(`   ✅ Method ${method} exists`);
        } else {
          issues.push(`Required method ${method} not found in template generator`);
        }
      }
      
    } catch (error) {
      issues.push('Template generator import failed: ' + error.message);
    }
    
    // Test controller import
    try {
      const controller = require('../src/controllers/transactionTemplatesController');
      console.log('   ✅ Template controller import successful');
      
      const requiredControllerMethods = [
        'getReturnsTemplate',
        'getReimbursementsTemplate',
        'getCommissionAdjustmentsTemplate', 
        'getAffiliateSamplesTemplate',
        'getAllTemplates'
      ];
      
      for (const method of requiredControllerMethods) {
        if (typeof controller[method] === 'function') {
          console.log(`   ✅ Controller method ${method} exists`);
        } else {
          issues.push(`Required controller method ${method} not found`);
        }
      }
      
    } catch (error) {
      issues.push('Template controller import failed: ' + error.message);
    }
    
    console.log('\n4. 🛣️  Checking route configuration...');
    
    // Check if routes are properly configured
    try {
      const routes = require('../src/routes/transactionTemplates');
      console.log('   ✅ Transaction template routes import successful');
    } catch (error) {
      issues.push('Transaction template routes import failed: ' + error.message);
    }
    
    // Check main routes file includes transaction templates
    try {
      const mainRoutesPath = path.join(__dirname, '../src/routes/index.js');
      if (fs.existsSync(mainRoutesPath)) {
        const mainRoutesContent = fs.readFileSync(mainRoutesPath, 'utf8');
        
        if (mainRoutesContent.includes('transactionTemplates')) {
          console.log('   ✅ Transaction templates routes included in main routes');
        } else {
          warnings.push('Transaction templates routes may not be included in main routes file');
        }
        
        if (mainRoutesContent.includes('/templates')) {
          console.log('   ✅ /templates endpoint configured');
        } else {
          warnings.push('/templates endpoint may not be configured in main routes');
        }
        
      } else {
        warnings.push('Main routes file not found at expected location');
      }
    } catch (error) {
      warnings.push('Failed to check main routes configuration: ' + error.message);
    }
    
    console.log('\n5. 📂 Checking templates directory...');
    
    const templatesDir = path.join(__dirname, '../templates');
    if (!fs.existsSync(templatesDir)) {
      console.log('   ⚠️  Templates directory does not exist (will be created automatically)');
      warnings.push('Templates directory will be created on first template generation');
    } else {
      console.log('   ✅ Templates directory exists');
      
      // Check for existing template files
      const templateFiles = [
        'returns-cancellations-template.xlsx',
        'marketplace-reimbursements-template.xlsx',
        'commission-adjustments-template.xlsx',
        'affiliate-samples-template.xlsx'
      ];
      
      let existingCount = 0;
      for (const templateFile of templateFiles) {
        const filePath = path.join(templatesDir, templateFile);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`   📄 ${templateFile}: ${stats.size} bytes`);
          existingCount++;
        }
      }
      
      if (existingCount === 0) {
        warnings.push('No pre-generated template files found (they will be generated on-demand)');
      } else {
        console.log(`   ✅ Found ${existingCount}/${templateFiles.length} pre-generated template files`);
      }
    }
    
    console.log('\n📊 Verification Summary:');
    console.log('========================');
    
    if (issues.length === 0) {
      console.log('✅ All critical checks passed!');
    } else {
      console.log(`❌ Found ${issues.length} critical issue(s):`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  Found ${warnings.length} warning(s):`);
      warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    console.log('========================');
    
    if (issues.length === 0) {
      console.log('\n🎉 Transaction Management Template setup is ready!');
      console.log('\n📋 Next steps:');
      console.log('   1. Start your backend server: npm start');
      console.log('   2. Test template downloads at: http://localhost:5000/api/templates');
      console.log('   3. Individual templates available at:');
      console.log('      - /api/templates/returns-cancellations-template.xlsx');
      console.log('      - /api/templates/marketplace-reimbursements-template.xlsx');
      console.log('      - /api/templates/commission-adjustments-template.xlsx');
      console.log('      - /api/templates/affiliate-samples-template.xlsx');
      
      return true;
    } else {
      console.log('\n❌ Please fix the critical issues above before using the template system.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
    return false;
  }
}

// Run the verification
verifySetup()
  .then((success) => {
    if (success) {
      console.log('\n✅ Verification completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Verification found critical issues');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });