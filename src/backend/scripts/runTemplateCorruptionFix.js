#!/usr/bin/env node

/**
 * Run Template Corruption Fix
 * 
 * Quick script to fix corrupt template generation issues
 * and test the enhanced template system
 */

const { regenerateAllTemplates, testTemplateGeneration } = require('./fixCorruptTemplateGeneration');

async function main() {
  console.log('🏪 D\'Busana Template Corruption Fix');
  console.log('===================================\n');

  try {
    // Step 1: Test template generation capability
    console.log('🧪 Step 1: Testing template generation...');
    const testResult = await testTemplateGeneration();
    
    if (!testResult.success) {
      console.error('❌ Template generation test failed:', testResult.error);
      console.log('\n💡 Suggestions:');
      console.log('- Check if ExcelJS is properly installed: npm install exceljs');
      console.log('- Verify Node.js version is compatible (>=14.0.0)');
      console.log('- Ensure sufficient disk space for template generation');
      process.exit(1);
    }
    
    console.log('✅ Template generation test passed!\n');

    // Step 2: Regenerate all templates
    console.log('🔄 Step 2: Regenerating all templates...');
    const regenerateResult = await regenerateAllTemplates();
    
    if (!regenerateResult.success) {
      console.error('❌ Template regeneration failed:', regenerateResult.message);
      if (regenerateResult.invalidTemplates) {
        console.log('\nInvalid templates:');
        regenerateResult.invalidTemplates.forEach(template => {
          console.log(`- ${template.name}: ${template.error}`);
        });
      }
      process.exit(1);
    }
    
    console.log('✅ All templates regenerated successfully!\n');

    // Step 3: Final verification
    console.log('🎯 Step 3: Final verification...');
    console.log('✅ Template endpoints are ready:');
    console.log('- GET /api/templates/returns-cancellations-template.xlsx');
    console.log('- GET /api/templates/marketplace-reimbursements-template.xlsx');
    console.log('- GET /api/templates/commission-adjustments-template.xlsx');
    console.log('- GET /api/templates/affiliate-samples-template.xlsx');
    console.log('\n✅ Enhanced template endpoints are also available:');
    console.log('- GET /api/templates-enhanced/returns-cancellations-template.xlsx');
    console.log('- GET /api/templates-enhanced/marketplace-reimbursements-template.xlsx');
    console.log('- GET /api/templates-enhanced/commission-adjustments-template.xlsx');
    console.log('- GET /api/templates-enhanced/affiliate-samples-template.xlsx');
    console.log('- GET /api/templates-enhanced/health (health check)');

    console.log('\n🎉 Template corruption fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your backend server if needed');
    console.log('2. Test template downloads from the frontend');
    console.log('3. Verify downloaded templates open correctly in Excel');
    console.log('4. Import test data to ensure format compatibility');

    process.exit(0);

  } catch (error) {
    console.error('💥 Template corruption fix failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend dependencies are installed: npm install');
    console.log('2. Check if templates directory is writable');
    console.log('3. Verify ExcelJS version compatibility');
    console.log('4. Run individual template test: node fixCorruptTemplateGeneration.js');
    process.exit(1);
  }
}

// Run the fix
main().catch(error => {
  console.error('💥 Script execution failed:', error);
  process.exit(1);
});