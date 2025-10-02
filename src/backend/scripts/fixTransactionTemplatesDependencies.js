#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Transaction Management Templates Dependencies...\n');

async function fixDependencies() {
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json not found in backend directory');
      process.exit(1);
    }
    
    console.log('📦 Installing/updating ExcelJS dependency...');
    
    // Install or update ExcelJS
    try {
      execSync('npm install exceljs@latest', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('✅ ExcelJS installed/updated successfully');
    } catch (error) {
      console.error('❌ Failed to install ExcelJS:', error.message);
      throw error;
    }
    
    console.log('\n📋 Verifying ExcelJS installation...');
    
    // Test ExcelJS import
    try {
      const ExcelJS = require('exceljs');
      console.log('✅ ExcelJS import successful');
      
      // Test basic functionality
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test');
      worksheet.addRow(['Test', 'Data']);
      
      // Test buffer generation
      const buffer = await workbook.xlsx.writeBuffer();
      console.log(`✅ ExcelJS basic functionality test passed (${buffer.length} bytes)`);
      
    } catch (error) {
      console.error('❌ ExcelJS verification failed:', error.message);
      throw error;
    }
    
    console.log('\n🧪 Testing Transaction Templates Generator...');
    
    // Test the generator
    try {
      const TransactionManagementTemplateGenerator = require('../src/templates/generateTransactionManagementTemplates');
      console.log('✅ Template generator import successful');
      
      // Test one template generation
      const workbook = await TransactionManagementTemplateGenerator.generateReturnsTemplate();
      const buffer = await workbook.xlsx.writeBuffer();
      console.log(`✅ Template generation test passed (${buffer.length} bytes)`);
      
    } catch (error) {
      console.error('❌ Template generator test failed:', error.message);
      throw error;
    }
    
    console.log('\n🔧 Checking Node.js version compatibility...');
    
    const nodeVersion = process.version;
    console.log(`📍 Current Node.js version: ${nodeVersion}`);
    
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 14) {
      console.warn('⚠️  Warning: Node.js version below 14 may have compatibility issues with ExcelJS');
      console.log('   Consider upgrading to Node.js 14+ for better compatibility');
    } else {
      console.log('✅ Node.js version is compatible');
    }
    
    console.log('\n🎉 Dependency fix completed successfully!');
    
  } catch (error) {
    console.error('💥 Dependency fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixDependencies()
  .then(() => {
    console.log('\n✅ All dependency fixes completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Dependency fix failed:', error);
    process.exit(1);
  });