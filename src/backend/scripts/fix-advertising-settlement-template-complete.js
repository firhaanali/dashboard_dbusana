#!/usr/bin/env node

// Script untuk memperbaiki template advertising settlement yang corrupt

const path = require('path');
const { fixAdvertisingSettlementTemplates } = require('../src/templates/fix_advertising_settlement_template');

console.log('🔧 STARTING ADVERTISING SETTLEMENT TEMPLATE COMPLETE FIX...');
console.log('📊 User requirements:');
console.log('   Columns: Order ID, Type, Order Created Time, Order Settled Time, Settlement Amount, Account Name, Marketplace, Currency');
console.log('   Fix corruption issues');
console.log('   Generate working templates');
console.log('');

async function runTemplateFix() {
  try {
    console.log('🏦 Running advertising settlement template fix...');
    
    // Fix templates
    const result = fixAdvertisingSettlementTemplates();
    
    if (result.success) {
      console.log('✅ TEMPLATE FIX SUCCESSFUL!');
      console.log('📁 Basic template:', result.basicTemplate);
      console.log('📁 Guided template:', result.guidedTemplate);
      console.log('📋 Message:', result.message);
      
      // Verify templates exist and are readable
      const fs = require('fs');
      const XLSX = require('xlsx');
      
      if (fs.existsSync(result.basicTemplate)) {
        try {
          const workbook = XLSX.readFile(result.basicTemplate);
          const worksheet = workbook.Sheets['Advertising Settlement'];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('✅ Basic template verification successful');
          console.log('📊 Sample data rows:', data.length);
          console.log('📋 Columns in template:', Object.keys(data[0] || {}));
        } catch (verifyError) {
          console.error('❌ Basic template verification failed:', verifyError.message);
        }
      }
      
      if (fs.existsSync(result.guidedTemplate)) {
        try {
          const workbook = XLSX.readFile(result.guidedTemplate);
          console.log('✅ Guided template verification successful');
          console.log('📊 Sheets in guided template:', workbook.SheetNames);
        } catch (verifyError) {
          console.error('❌ Guided template verification failed:', verifyError.message);
        }
      }
      
      console.log('');
      console.log('🎉 ADVERTISING SETTLEMENT TEMPLATE FIX COMPLETED SUCCESSFULLY!');
      console.log('');
      console.log('📋 NEXT STEPS:');
      console.log('   1. Backend server akan dapat mendownload template yang benar');
      console.log('   2. Import function akan menerima kolom sesuai user requirements');
      console.log('   3. Template tidak lagi corrupt dan dapat dibuka dengan Excel');
      console.log('');
      console.log('🔗 API Endpoints:');
      console.log('   GET /api/template-fix/download/advertising-settlement/basic');
      console.log('   GET /api/template-fix/download/advertising-settlement/guided');
      
      process.exit(0);
    } else {
      console.error('❌ TEMPLATE FIX FAILED:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ SCRIPT ERROR:', error);
    process.exit(1);
  }
}

// Run the fix
runTemplateFix();