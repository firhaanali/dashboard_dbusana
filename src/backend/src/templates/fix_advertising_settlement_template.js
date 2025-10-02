const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('🔧 FIXING ADVERTISING SETTLEMENT TEMPLATE...');

// Memperbaiki template advertising settlement sesuai kolom yang diminta user
const fixAdvertisingSettlementTemplate = () => {
  console.log('🏦 Generating FIXED Advertising Settlement Template...');

  // Template data sesuai kolom yang diminta user:
  // Order ID	Type	Order Created Time	Order Settled Time	Settlement Amount	Account Name	Marketplace	Currency
  const templateData = [
    {
      'Order ID': 'TIKTOK-AD-2025-001',
      'Type': 'Ad Spend',
      'Order Created Time': '01/01/2025',
      'Order Settled Time': '03/01/2025',
      'Settlement Amount': 500000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'TikTok Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'FB-AD-2025-002',
      'Type': 'Tax Fee',
      'Order Created Time': '02/01/2025',
      'Order Settled Time': '04/01/2025',
      'Settlement Amount': 55000,
      'Account Name': 'D\'Busana Facebook Ads',
      'Marketplace': 'Facebook Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'GOOGLE-AD-2025-003',
      'Type': 'Service Fee',
      'Order Created Time': '03/01/2025',
      'Order Settled Time': '05/01/2025',
      'Settlement Amount': 75000,
      'Account Name': 'D\'Busana Google Ads',
      'Marketplace': 'Google Ads',
      'Currency': 'IDR'
    }
  ];

  try {
    // Create workbook dan worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths untuk readability
    ws['!cols'] = [
      { wch: 20 }, // Order ID
      { wch: 15 }, // Type
      { wch: 18 }, // Order Created Time
      { wch: 18 }, // Order Settled Time
      { wch: 16 }, // Settlement Amount
      { wch: 25 }, // Account Name
      { wch: 15 }, // Marketplace
      { wch: 10 }  // Currency
    ];

    // Add worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Advertising Settlement');

    // Ensure template directory exists
    const templatesDir = path.join(__dirname);
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Write file dengan nama yang jelas
    const templatePath = path.join(templatesDir, 'advertising_settlement_template_fixed.xlsx');
    XLSX.writeFile(wb, templatePath);

    console.log('✅ FIXED Advertising Settlement template generated successfully:', templatePath);
    
    // Verify file exists dan dapat dibaca
    if (fs.existsSync(templatePath)) {
      const stats = fs.statSync(templatePath);
      console.log(`📊 Template file size: ${stats.size} bytes`);
      
      // Test read file to verify it's not corrupted
      const testWb = XLSX.readFile(templatePath);
      const testWs = testWb.Sheets['Advertising Settlement'];
      const testData = XLSX.utils.sheet_to_json(testWs);
      
      if (testData.length > 0) {
        console.log('✅ Template verification successful - file is readable');
        console.log('📋 Template columns:', Object.keys(testData[0]));
        return {
          success: true,
          templatePath,
          message: 'Advertising Settlement template fixed and verified successfully'
        };
      } else {
        throw new Error('Template generated but appears empty');
      }
    } else {
      throw new Error('Template file was not created');
    }

  } catch (error) {
    console.error('❌ Error fixing advertising settlement template:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate template dengan instruksi lengkap
const generateTemplateWithInstructions = () => {
  console.log('📋 Generating Advertising Settlement Template with Instructions...');

  try {
    // Create workbook dengan multiple sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Instructions
    const instructionData = [
      {
        'Column Name': 'Order ID',
        'Description': 'REQUIRED: Unique Order ID dari platform advertising',
        'Format': 'Text',
        'Example': 'TIKTOK-AD-2025-001'
      },
      {
        'Column Name': 'Type',
        'Description': 'OPTIONAL: Jenis settlement (Ad Spend, Tax Fee, Service Fee)',
        'Format': 'Text',
        'Example': 'Ad Spend'
      },
      {
        'Column Name': 'Order Created Time',
        'Description': 'REQUIRED: Tanggal order dibuat',
        'Format': 'Date (DD/MM/YYYY)',
        'Example': '01/01/2025'
      },
      {
        'Column Name': 'Order Settled Time',
        'Description': 'REQUIRED: Tanggal settlement/pembayaran',
        'Format': 'Date (DD/MM/YYYY)',
        'Example': '03/01/2025'
      },
      {
        'Column Name': 'Settlement Amount',
        'Description': 'REQUIRED: Total settlement amount dalam Rupiah',
        'Format': 'Number',
        'Example': '500000'
      },
      {
        'Column Name': 'Account Name',
        'Description': 'OPTIONAL: Nama akun advertising',
        'Format': 'Text',
        'Example': 'D\'Busana Fashion Ads'
      },
      {
        'Column Name': 'Marketplace',
        'Description': 'OPTIONAL: Platform advertising',
        'Format': 'Text',
        'Example': 'TikTok Ads'
      },
      {
        'Column Name': 'Currency',
        'Description': 'OPTIONAL: Currency type (default: IDR)',
        'Format': 'Text',
        'Example': 'IDR'
      }
    ];

    const instructionWs = XLSX.utils.json_to_sheet(instructionData);
    instructionWs['!cols'] = [
      { wch: 20 }, // Column Name
      { wch: 40 }, // Description
      { wch: 20 }, // Format
      { wch: 20 }  // Example
    ];
    XLSX.utils.book_append_sheet(wb, instructionWs, 'Instructions');

    // Sheet 2: Sample Data
    const sampleData = [
      {
        'Order ID': 'TIKTOK-AD-2025-001',
        'Type': 'Ad Spend',
        'Order Created Time': '01/01/2025',
        'Order Settled Time': '03/01/2025',
        'Settlement Amount': 500000,
        'Account Name': 'D\'Busana Fashion Ads',
        'Marketplace': 'TikTok Ads',
        'Currency': 'IDR'
      },
      {
        'Order ID': 'FB-AD-2025-002',
        'Type': 'Tax Fee',
        'Order Created Time': '02/01/2025',
        'Order Settled Time': '04/01/2025',
        'Settlement Amount': 55000,
        'Account Name': 'D\'Busana Facebook Ads',
        'Marketplace': 'Facebook Ads',
        'Currency': 'IDR'
      }
    ];

    const sampleWs = XLSX.utils.json_to_sheet(sampleData);
    sampleWs['!cols'] = [
      { wch: 20 }, // Order ID
      { wch: 15 }, // Type
      { wch: 18 }, // Order Created Time
      { wch: 18 }, // Order Settled Time
      { wch: 16 }, // Settlement Amount
      { wch: 25 }, // Account Name
      { wch: 15 }, // Marketplace
      { wch: 10 }  // Currency
    ];
    XLSX.utils.book_append_sheet(wb, sampleWs, 'Sample Data');

    // Sheet 3: Empty Template untuk data entry
    const headers = [
      'Order ID', 'Type', 'Order Created Time', 'Order Settled Time',
      'Settlement Amount', 'Account Name', 'Marketplace', 'Currency'
    ];
    
    const emptyWs = XLSX.utils.aoa_to_sheet([headers]);
    emptyWs['!cols'] = [
      { wch: 20 }, // Order ID
      { wch: 15 }, // Type
      { wch: 18 }, // Order Created Time
      { wch: 18 }, // Order Settled Time
      { wch: 16 }, // Settlement Amount
      { wch: 25 }, // Account Name
      { wch: 15 }, // Marketplace
      { wch: 10 }  // Currency
    ];
    XLSX.utils.book_append_sheet(wb, emptyWs, 'Advertising Settlement');

    // Save template dengan instruksi
    const templatePath = path.join(__dirname, 'advertising_settlement_template_with_guide_fixed.xlsx');
    XLSX.writeFile(wb, templatePath);

    console.log('✅ Advertising Settlement template with instructions generated:', templatePath);
    return {
      success: true,
      templatePath,
      message: 'Advertising Settlement template with instructions generated successfully'
    };

  } catch (error) {
    console.error('❌ Error generating template with instructions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Main function
const fixAdvertisingSettlementTemplates = () => {
  console.log('🔧 STARTING ADVERTISING SETTLEMENT TEMPLATE FIX...');
  
  try {
    const basicResult = fixAdvertisingSettlementTemplate();
    const guidedResult = generateTemplateWithInstructions();
    
    if (basicResult.success && guidedResult.success) {
      console.log('🎉 ALL ADVERTISING SETTLEMENT TEMPLATES FIXED SUCCESSFULLY!');
      return {
        success: true,
        basicTemplate: basicResult.templatePath,
        guidedTemplate: guidedResult.templatePath,
        message: 'All advertising settlement templates fixed and verified'
      };
    } else {
      throw new Error('One or more templates failed to generate');
    }
  } catch (error) {
    console.error('❌ Template fix failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  fixAdvertisingSettlementTemplate,
  generateTemplateWithInstructions,
  fixAdvertisingSettlementTemplates
};

// Run jika called directly
if (require.main === module) {
  fixAdvertisingSettlementTemplates();
}