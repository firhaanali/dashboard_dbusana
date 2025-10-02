#!/usr/bin/env node

/**
 * Fix Corrupt Template Generation Script
 * 
 * Regenerates all transaction templates using the robust generator
 * and verifies their integrity to prevent corrupt downloads
 */

const path = require('path');
const fs = require('fs');
const RobustTransactionTemplateGenerator = require('../src/templates/robustTransactionTemplateGenerator');

async function verifyTemplate(filePath, templateName) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file does not exist: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    
    if (stats.size < 1000) {
      throw new Error(`Template file is too small (${stats.size} bytes), likely corrupted`);
    }

    // Read first few bytes to verify Excel signature
    const buffer = fs.readFileSync(filePath, { start: 0, end: 4 });
    const signature = buffer.toString('hex');
    
    if (signature !== '504b0304') {
      throw new Error(`Invalid Excel signature: ${signature}`);
    }

    console.log(`✅ ${templateName} template verified: ${stats.size} bytes`);
    return { valid: true, size: stats.size };

  } catch (error) {
    console.error(`❌ ${templateName} template verification failed:`, error.message);
    return { valid: false, error: error.message };
  }
}

async function regenerateAllTemplates() {
  try {
    console.log('🚀 Starting template regeneration process...');
    
    // Ensure templates directory exists
    const templatesDir = path.join(__dirname, '../templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      console.log('📁 Created templates directory');
    }

    // Clean up any existing corrupt templates
    const templateFiles = [
      'returns-cancellations-template.xlsx',
      'marketplace-reimbursements-template.xlsx',
      'commission-adjustments-template.xlsx',
      'affiliate-samples-template.xlsx'
    ];

    console.log('🧹 Cleaning up existing templates...');
    templateFiles.forEach(filename => {
      const filePath = path.join(templatesDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed existing ${filename}`);
      }
    });

    // Generate all templates using the robust generator
    console.log('📋 Generating new templates...');
    const result = await RobustTransactionTemplateGenerator.generateAllTemplates();

    if (!result.success) {
      throw new Error(`Template generation failed: ${result.message}`);
    }

    console.log('✅ All templates generated successfully');

    // Verify each template
    console.log('🔍 Verifying template integrity...');
    const verificationResults = [];

    for (const template of result.templates) {
      if (template.success) {
        const verification = await verifyTemplate(template.path, template.description);
        verificationResults.push({
          name: template.description,
          filename: template.name,
          ...verification
        });
      }
    }

    // Print verification summary
    console.log('\n📊 Template Verification Summary:');
    console.log('=' .repeat(50));
    
    verificationResults.forEach(result => {
      const status = result.valid ? '✅ VALID' : '❌ CORRUPT';
      const size = result.valid ? `(${result.size} bytes)` : `(${result.error})`;
      console.log(`${status} ${result.name} ${size}`);
    });

    const validCount = verificationResults.filter(r => r.valid).length;
    const totalCount = verificationResults.length;

    console.log('=' .repeat(50));
    console.log(`🎉 Template regeneration completed: ${validCount}/${totalCount} templates valid`);

    if (validCount === totalCount) {
      console.log('🎊 All templates are valid and ready for download!');
      return { success: true, message: 'All templates regenerated successfully' };
    } else {
      console.log('⚠️ Some templates are still corrupt, manual investigation needed');
      return { 
        success: false, 
        message: `Only ${validCount}/${totalCount} templates are valid`,
        invalidTemplates: verificationResults.filter(r => !r.valid)
      };
    }

  } catch (error) {
    console.error('💥 Template regeneration failed:', error);
    return { success: false, error: error.message };
  }
}

// Test individual template generation
async function testTemplateGeneration() {
  try {
    console.log('🧪 Testing individual template generation...');

    // Test Returns & Cancellations template specifically
    console.log('📋 Testing Returns & Cancellations template...');
    const workbook = await RobustTransactionTemplateGenerator.generateReturnsTemplate();
    
    if (!workbook) {
      throw new Error('Returns template generation returned null');
    }

    // Validate the workbook
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Returns template failed validation');
    }

    console.log(`✅ Returns template test passed (${validation.size} bytes)`);

    // Test buffer generation (this is what gets sent to frontend)
    const buffer = await workbook.xlsx.writeBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Template buffer generation failed');
    }

    console.log(`✅ Buffer generation test passed (${buffer.length} bytes)`);

    return { success: true, message: 'Template generation test passed' };

  } catch (error) {
    console.error('❌ Template generation test failed:', error);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('🏪 D\'Busana Template Fix Utility');
  console.log('================================\n');

  // First test individual template generation
  const testResult = await testTemplateGeneration();
  
  if (!testResult.success) {
    console.log('❌ Individual template test failed, aborting full regeneration');
    process.exit(1);
  }

  console.log('✅ Individual template test passed, proceeding with full regeneration\n');

  // Regenerate all templates
  const result = await regenerateAllTemplates();

  if (result.success) {
    console.log('\n🎉 Template fix completed successfully!');
    console.log('Templates are now available for download at:');
    console.log('- /api/templates/returns-cancellations-template.xlsx');
    console.log('- /api/templates/marketplace-reimbursements-template.xlsx');
    console.log('- /api/templates/commission-adjustments-template.xlsx');
    console.log('- /api/templates/affiliate-samples-template.xlsx');
    process.exit(0);
  } else {
    console.log('\n💥 Template fix failed:', result.message);
    if (result.invalidTemplates) {
      console.log('Invalid templates:', result.invalidTemplates);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  regenerateAllTemplates,
  testTemplateGeneration,
  verifyTemplate
};