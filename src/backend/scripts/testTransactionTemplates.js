#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Transaction Management Templates Generation...\n');

async function testTransactionTemplates() {
  try {
    // Import the generator
    const TransactionManagementTemplateGenerator = require('../src/templates/generateTransactionManagementTemplates');
    
    console.log('📋 Testing individual template generation...\n');
    
    // Test Returns & Cancellations template
    console.log('1. Testing Returns & Cancellations template...');
    try {
      const returnsWorkbook = await TransactionManagementTemplateGenerator.generateReturnsTemplate();
      console.log('✅ Returns & Cancellations template generated successfully');
      
      // Test writing to buffer to verify it's not corrupted
      const buffer = await returnsWorkbook.xlsx.writeBuffer();
      console.log(`   📊 Template size: ${buffer.length} bytes`);
      
    } catch (error) {
      console.error('❌ Returns & Cancellations template failed:', error.message);
    }
    
    console.log('');
    
    // Test Marketplace Reimbursements template
    console.log('2. Testing Marketplace Reimbursements template...');
    try {
      const reimbursementsWorkbook = await TransactionManagementTemplateGenerator.generateReimbursementsTemplate();
      console.log('✅ Marketplace Reimbursements template generated successfully');
      
      const buffer = await reimbursementsWorkbook.xlsx.writeBuffer();
      console.log(`   📊 Template size: ${buffer.length} bytes`);
      
    } catch (error) {
      console.error('❌ Marketplace Reimbursements template failed:', error.message);
    }
    
    console.log('');
    
    // Test Commission Adjustments template
    console.log('3. Testing Commission Adjustments template...');
    try {
      const commissionWorkbook = await TransactionManagementTemplateGenerator.generateCommissionAdjustmentsTemplate();
      console.log('✅ Commission Adjustments template generated successfully');
      
      const buffer = await commissionWorkbook.xlsx.writeBuffer();
      console.log(`   📊 Template size: ${buffer.length} bytes`);
      
    } catch (error) {
      console.error('❌ Commission Adjustments template failed:', error.message);
    }
    
    console.log('');
    
    // Test Affiliate Samples template
    console.log('4. Testing Affiliate Samples template...');
    try {
      const affiliateWorkbook = await TransactionManagementTemplateGenerator.generateAffiliateSamplesTemplate();
      console.log('✅ Affiliate Samples template generated successfully');
      
      const buffer = await affiliateWorkbook.xlsx.writeBuffer();
      console.log(`   📊 Template size: ${buffer.length} bytes`);
      
    } catch (error) {
      console.error('❌ Affiliate Samples template failed:', error.message);
    }
    
    console.log('\n📋 Testing bulk template generation...\n');
    
    // Test generateAllTemplates method
    try {
      const result = await TransactionManagementTemplateGenerator.generateAllTemplates();
      console.log('✅ All templates generated successfully');
      console.log(`   📊 Generated ${result.templates.length} templates`);
      
      // List generated files
      result.templates.forEach(template => {
        console.log(`   📄 ${template.name} - ${template.description}`);
        if (fs.existsSync(template.path)) {
          const stats = fs.statSync(template.path);
          console.log(`      💾 File size: ${stats.size} bytes`);
        } else {
          console.log('      ❌ File not found on disk');
        }
      });
      
    } catch (error) {
      console.error('❌ Bulk template generation failed:', error.message);
    }
    
    console.log('\n🎉 Transaction Management Templates testing completed!');
    
  } catch (error) {
    console.error('💥 Template testing failed:', error);
    process.exit(1);
  }
}

// Run the test
testTransactionTemplates()
  .then(() => {
    console.log('\n✅ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });