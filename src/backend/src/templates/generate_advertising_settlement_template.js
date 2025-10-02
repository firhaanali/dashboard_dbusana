const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Generate advertising settlement template with user-friendly structure
const generateAdvertisingSettlementTemplate = () => {
  console.log('🏦 Generating Advertising Settlement Template...');

  // Template data with USER-FRIENDLY column names
  const templateData = [
    {
      'Order ID': 'ORDER-2025-001',
      'Type': 'Ad Spend',
      'Order Created Time': '01/09/25',
      'Order Settled Time': '02/09/25',
      'Settlement Amount': 250000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'TikTok Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'ORDER-2025-002',
      'Type': 'Tax Fee',
      'Order Created Time': '01/09/25',
      'Order Settled Time': '02/09/25',
      'Settlement Amount': 27500,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Facebook Ads',
      'Currency': 'IDR'
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths for user-friendly column names
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

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Advertising Settlement');

  // Write the file
  const templatePath = path.join(__dirname, 'advertising_settlement_template.xlsx');
  XLSX.writeFile(wb, templatePath);

  console.log('✅ Advertising Settlement template generated:', templatePath);
  return templatePath;
};

// Generate template with instructions
const generateAdvertisingSettlementTemplateWithInstructions = () => {
  console.log('📋 Generating Advertising Settlement Template with Instructions...');

  // Instruction data
  const instructionData = [
    {
      'Order ID': 'REQUIRED: Order ID dari platform advertising',
      'Type': 'OPTIONAL: Jenis settlement (Ad Spend, Tax Fee, Service Fee)',
      'Order Created Time': 'REQUIRED: Tanggal order dibuat (format: dd/mm/yy)',
      'Order Settled Time': 'REQUIRED: Tanggal settlement/pembayaran (format: dd/mm/yy)',
      'Settlement Amount': 'REQUIRED: Total settlement amount termasuk pajak (Rupiah)',
      'Account Name': 'OPTIONAL: Nama akun advertising (auto-fill ke D\'Busana jika kosong)',
      'Marketplace': 'OPTIONAL: Platform advertising (TikTok Ads, Facebook Ads, dll)',
      'Currency': 'OPTIONAL: Currency type (default: IDR)'
    }
  ];

  // Sample data
  const sampleData = [
    {
      'Order ID': 'TIKTOK-AD-2025-001',
      'Type': 'Ad Spend',
      'Order Created Time': '01/09/25',
      'Order Settled Time': '03/09/25',
      'Settlement Amount': 500000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'TikTok Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'FB-AD-2025-002',
      'Type': 'Tax Fee',
      'Order Created Time': '02/09/25',
      'Order Settled Time': '04/09/25',
      'Settlement Amount': 55000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Facebook Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'GOOGLE-AD-2025-003',
      'Type': 'Service Fee',
      'Order Created Time': '03/09/25',
      'Order Settled Time': '05/09/25',
      'Settlement Amount': 25000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Google Ads',
      'Currency': 'IDR'
    }
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Instructions sheet
  const instructionWs = XLSX.utils.json_to_sheet(instructionData);
  instructionWs['!cols'] = Array(8).fill({ wch: 30 });
  XLSX.utils.book_append_sheet(wb, instructionWs, 'Instructions');

  // Sample data sheet
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

  // Empty template sheet for actual data entry
  const emptyData = [{}]; // Empty row for user to fill
  const emptyWs = XLSX.utils.json_to_sheet(emptyData);
  
  // Add headers manually for empty sheet
  const headers = [
    'Order ID', 'Type', 'Order Created Time', 'Order Settled Time',
    'Settlement Amount', 'Account Name', 'Marketplace', 'Currency'
  ];
  
  XLSX.utils.sheet_add_aoa(emptyWs, [headers], { origin: 'A1' });
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

  // Write file
  const templatePath = path.join(__dirname, 'advertising_settlement_template_with_guide.xlsx');
  XLSX.writeFile(wb, templatePath);

  console.log('✅ Advertising Settlement template with instructions generated:', templatePath);
  return templatePath;
};

// Main function to generate both templates
const generateAdvertisingSettlementTemplates = () => {
  try {
    const basicTemplate = generateAdvertisingSettlementTemplate();
    const guidedTemplate = generateAdvertisingSettlementTemplateWithInstructions();
    
    return {
      success: true,
      basicTemplate,
      guidedTemplate,
      message: 'Advertising Settlement templates generated successfully'
    };
  } catch (error) {
    console.error('❌ Error generating advertising settlement templates:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateAdvertisingSettlementTemplate,
  generateAdvertisingSettlementTemplateWithInstructions,
  generateAdvertisingSettlementTemplates
};

// Run if called directly
if (require.main === module) {
  generateAdvertisingSettlementTemplates();
}