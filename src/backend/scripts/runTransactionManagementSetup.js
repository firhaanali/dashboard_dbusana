#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Running Transaction Management Setup...');

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';
    const fullScriptPath = path.resolve(__dirname, scriptPath);
    
    console.log(`📜 Running: ${fullScriptPath}`);
    
    const child = spawn(nodeCmd, [fullScriptPath, ...args], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Script completed successfully: ${scriptPath}`);
        resolve();
      } else {
        console.error(`❌ Script failed with code ${code}: ${scriptPath}`);
        reject(new Error(`Script failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`💥 Error running script ${scriptPath}:`, error);
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('🔧 Step 1: Setting up Transaction Management database tables...');
    await runScript('./setupTransactionManagementComplete.js');
    
    console.log('📋 Step 2: Generating Transaction Management templates...');
    await runScript('../src/templates/generateTransactionManagementTemplates.js');
    
    console.log('🎉 Transaction Management setup completed successfully!');
    console.log('\n📊 Available Transaction Management Components:');
    console.log('  - Returns & Cancellations Manager');
    console.log('  - Marketplace Reimbursements Manager');
    console.log('  - Commission Adjustments Manager');
    console.log('  - Affiliate Samples Manager');
    
    console.log('\n📋 Available Templates:');
    console.log('  - returns-cancellations-template.xlsx');
    console.log('  - marketplace-reimbursements-template.xlsx');
    console.log('  - commission-adjustments-template.xlsx');
    console.log('  - affiliate-samples-template.xlsx');
    
    console.log('\n🌐 API Endpoints:');
    console.log('  - GET /api/returns-cancellations');
    console.log('  - GET /api/marketplace-reimbursements');
    console.log('  - GET /api/commission-adjustments');
    console.log('  - GET /api/affiliate-samples');
    console.log('  - GET /api/templates/returns-cancellations-template.xlsx');
    console.log('  - GET /api/templates/marketplace-reimbursements-template.xlsx');
    console.log('  - GET /api/templates/commission-adjustments-template.xlsx');
    console.log('  - GET /api/templates/affiliate-samples-template.xlsx');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Transaction Management setup failed:', error);
    process.exit(1);
  }
}

main();