#!/usr/bin/env node

/**
 * Generate Templates Script
 * 
 * Script untuk generate template Excel untuk import data
 * Dapat dijalankan langsung atau melalui npm script
 */

const path = require('path');
const { generateAllTemplates } = require('../src/templates/generate_templates');

async function main() {
  console.log('🚀 D\'Busana Template Generator');
  console.log('=====================================');
  console.log('');

  try {
    console.log('📋 Generating import templates...');
    const result = await generateAllTemplates();
    
    if (result.success) {
      console.log('');
      console.log('🎉 Templates generated successfully!');
      console.log('');
      console.log('📁 Generated files:');
      console.log(`   - Sales: ${result.paths.sales}`);
      console.log(`   - Products: ${result.paths.products}`);
      console.log(`   - Stock: ${result.paths.stock}`);
      console.log('');
      console.log('✅ Templates are now ready for download via API');
      console.log('   GET /api/import/templates/sales');
      console.log('   GET /api/import/templates/products'); 
      console.log('   GET /api/import/templates/stock');
      
      process.exit(0);
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Template generation failed:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   - Make sure you have write permissions to templates directory');
    console.error('   - Check if XLSX package is installed (npm install xlsx)');
    console.error('   - Verify templates directory exists: backend/src/templates/');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };