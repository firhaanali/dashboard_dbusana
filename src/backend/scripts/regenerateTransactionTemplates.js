#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔄 Regenerating Transaction Management Templates...\n');

async function regenerateTemplates() {
  try {
    // Import the generator
    const TransactionManagementTemplateGenerator = require('../src/templates/generateTransactionManagementTemplates');
    
    console.log('📂 Setting up templates directory...');
    
    // Ensure templates directory exists
    const templatesDir = path.join(__dirname, '../templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      console.log('✅ Templates directory created');
    } else {
      console.log('✅ Templates directory exists');
    }
    
    // Clean up old templates
    console.log('\n🧹 Cleaning up old template files...');
    const oldTemplates = [
      'returns-cancellations-template.xlsx',
      'marketplace-reimbursements-template.xlsx', 
      'commission-adjustments-template.xlsx',
      'affiliate-samples-template.xlsx'
    ];
    
    for (const templateFile of oldTemplates) {
      const filePath = path.join(templatesDir, templateFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed old ${templateFile}`);
      }
    }
    
    console.log('\n📋 Generating new templates...\n');
    
    // Generate templates individually with detailed logging
    const templateConfigs = [
      {
        name: 'Returns & Cancellations',
        filename: 'returns-cancellations-template.xlsx',
        generator: () => TransactionManagementTemplateGenerator.generateReturnsTemplate()
      },
      {
        name: 'Marketplace Reimbursements',
        filename: 'marketplace-reimbursements-template.xlsx',
        generator: () => TransactionManagementTemplateGenerator.generateReimbursementsTemplate()
      },
      {
        name: 'Commission Adjustments',
        filename: 'commission-adjustments-template.xlsx',
        generator: () => TransactionManagementTemplateGenerator.generateCommissionAdjustmentsTemplate()
      },
      {
        name: 'Affiliate Samples',
        filename: 'affiliate-samples-template.xlsx',
        generator: () => TransactionManagementTemplateGenerator.generateAffiliateSamplesTemplate()
      }
    ];
    
    const results = [];
    
    for (const config of templateConfigs) {
      console.log(`📋 Generating ${config.name} template...`);
      
      try {
        // Generate the workbook
        const workbook = await config.generator();
        
        if (!workbook) {
          throw new Error('Generator returned null/undefined workbook');
        }
        
        // Test buffer generation first
        const buffer = await workbook.xlsx.writeBuffer();
        console.log(`   📊 Buffer generated: ${buffer.length} bytes`);
        
        // Validate buffer
        if (buffer.length < 1000) {
          throw new Error('Generated buffer is too small, likely corrupted');
        }
        
        // Write to file
        const filePath = path.join(templatesDir, config.filename);
        await workbook.xlsx.writeFile(filePath);
        
        // Verify file was written
        if (!fs.existsSync(filePath)) {
          throw new Error('File was not created on disk');
        }
        
        const stats = fs.statSync(filePath);
        console.log(`   ✅ ${config.name} saved: ${stats.size} bytes`);
        
        results.push({
          name: config.name,
          filename: config.filename,
          success: true,
          size: stats.size,
          path: filePath
        });
        
      } catch (error) {
        console.error(`   ❌ Failed to generate ${config.name}:`, error.message);
        
        results.push({
          name: config.name,
          filename: config.filename,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('\n📊 Generation Summary:');
    console.log('========================');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const result of results) {
      if (result.success) {
        console.log(`✅ ${result.name}: ${result.size} bytes`);
        successCount++;
      } else {
        console.log(`❌ ${result.name}: ${result.error}`);
        failCount++;
      }
    }
    
    console.log('========================');
    console.log(`📈 Success: ${successCount}/${results.length} templates`);
    
    if (failCount > 0) {
      console.log(`📉 Failed: ${failCount}/${results.length} templates`);
      console.log('\n⚠️  Some templates failed to generate. Check the error messages above.');
    } else {
      console.log('\n🎉 All templates generated successfully!');
    }
    
    // Test bulk generation method as well
    console.log('\n🧪 Testing bulk generation method...');
    try {
      const bulkResult = await TransactionManagementTemplateGenerator.generateAllTemplates();
      console.log('✅ Bulk generation method works correctly');
      console.log(`   📊 Generated ${bulkResult.templates.length} templates via bulk method`);
    } catch (error) {
      console.log('❌ Bulk generation method failed:', error.message);
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Template regeneration failed:', error);
    throw error;
  }
}

// Run the regeneration
regenerateTemplates()
  .then((results) => {
    const successCount = results.filter(r => r.success).length;
    if (successCount === results.length) {
      console.log('\n✅ All templates regenerated successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some templates failed to regenerate');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Template regeneration failed:', error);
    process.exit(1);
  });