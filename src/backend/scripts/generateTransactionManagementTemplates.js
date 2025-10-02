const { execSync } = require('child_process');
const path = require('path');

async function runTransactionManagementTemplateGeneration() {
  console.log('🚀 Starting Transaction Management Template Generation...\n');
  
  try {
    console.log('📋 Generating templates for:');
    console.log('   🔄 Returns & Cancellations');
    console.log('   💰 Marketplace Reimbursements');
    console.log('   📉 Commission Adjustments');
    console.log('   🎁 Affiliate Samples\n');

    // Run the template generator
    const templatePath = path.join(__dirname, '../src/templates/generateTransactionManagementTemplates.js');
    execSync(`node "${templatePath}"`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    console.log('\n🎉 TRANSACTION MANAGEMENT TEMPLATES GENERATED SUCCESSFULLY!');
    console.log('\n📁 Templates created in /backend/src/templates/:');
    console.log('   ✅ returns-cancellations-template.xlsx');
    console.log('   ✅ marketplace-reimbursements-template.xlsx');
    console.log('   ✅ commission-adjustments-template.xlsx');
    console.log('   ✅ affiliate-samples-template.xlsx');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Templates are ready for download via API');
    console.log('   2. Import functionality is integrated in frontend components');
    console.log('   3. Users can now import data for all transaction types');
    
    console.log('\n📊 Features Added:');
    console.log('   📤 Excel template download for each transaction type');
    console.log('   📥 File import with validation');
    console.log('   🔄 Auto-refresh after successful import');
    console.log('   ❌ Removed refresh buttons (replaced with import)');

  } catch (error) {
    console.error('❌ Template generation failed:', error.message);
    
    if (error.message.includes('ExcelJS')) {
      console.log('\n💡 ExcelJS dependency missing. Installing...');
      try {
        execSync('npm install exceljs', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        console.log('✅ ExcelJS installed. Please run the script again.');
      } catch (installError) {
        console.log('❌ Failed to install ExcelJS:', installError.message);
      }
    }
    
    process.exit(1);
  }
}

// Run template generation
runTransactionManagementTemplateGeneration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});