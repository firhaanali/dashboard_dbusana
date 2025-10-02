const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Generate advertising template with new column structure
const generateAdvertisingTemplate = () => {
  console.log('📈 Generating Advertising Template...');

  // Template data with EXACT USER COLUMN STRUCTURE
  const templateData = [
    {
      'Campaign Name': 'Summer Fashion Campaign',
      'Account Name': "D'Busana",
      'Ad Creative Type': 'Video',
      'Ad Creative': 'Summer Collection Video Ad',
      'Date Range Start': '01/09/25',
      'Date Range End': '15/09/25',
      'Impressions': 50000,
      'Clicks': 2500,
      'Conversions': 150,
      'Cost': 2500000,
      'Revenue': 7500000,
      'ROI': 200,
      'Marketplace': 'TikTok Shop',
      'Nama Produk': 'Dress Batik Premium'
    },
    {
      'Campaign Name': 'Back to School Promo',
      'Account Name': "D'Busana",
      'Ad Creative Type': 'Image',
      'Ad Creative': 'School Collection Banner',
      'Date Range Start': '15/08/25',
      'Date Range End': '15/09/25',
      'Impressions': 35000,
      'Clicks': 1750,
      'Conversions': 105,
      'Cost': 1750000,
      'Revenue': 5250000,
      'ROI': 200,
      'Marketplace': 'Shopee',
      'Nama Produk': 'Kemeja Batik Modern'
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths for EXACT USER COLUMN STRUCTURE
  ws['!cols'] = [
    { wch: 25 }, // Campaign Name
    { wch: 15 }, // Account Name
    { wch: 18 }, // Ad Creative Type
    { wch: 30 }, // Ad Creative
    { wch: 18 }, // Date Range Start
    { wch: 18 }, // Date Range End
    { wch: 12 }, // Impressions
    { wch: 10 }, // Clicks
    { wch: 12 }, // Conversions
    { wch: 15 }, // Cost
    { wch: 15 }, // Revenue
    { wch: 8 },  // ROI
    { wch: 15 }, // Marketplace
    { wch: 25 }  // Nama Produk
  ];

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Advertising Data');

  // Write the file
  const templatePath = path.join(__dirname, 'advertising_template.xlsx');
  XLSX.writeFile(wb, templatePath);

  console.log('✅ Advertising template generated:', templatePath);
  return templatePath;
};

// Generate template with column descriptions
const generateAdvertisingTemplateWithInstructions = () => {
  console.log('📋 Generating Advertising Template with Instructions...');

  // Instruction data with EXACT USER COLUMN STRUCTURE
  const instructionData = [
    {
      'Campaign Name': 'REQUIRED: Nama campaign/iklan',
      'Account Name': 'OPTIONAL: Nama akun advertising (default: D\'Busana)',
      'Ad Creative Type': 'OPTIONAL: Jenis creative (Video/Image/Carousel)',
      'Ad Creative': 'OPTIONAL: Deskripsi creative yang digunakan',
      'Date Range Start': 'REQUIRED: Tanggal mulai campaign (format: dd/mm/yy)',
      'Date Range End': 'REQUIRED: Tanggal selesai campaign (format: dd/mm/yy)',
      'Impressions': 'REQUIRED: Jumlah tayangan iklan',
      'Clicks': 'REQUIRED: Jumlah klik iklan',
      'Conversions': 'REQUIRED: Jumlah konversi/penjualan',
      'Cost': 'REQUIRED: Total biaya iklan (Rupiah)',
      'Revenue': 'REQUIRED: Total revenue dari iklan (Rupiah)',
      'ROI': 'OPTIONAL: ROI dari platform advertising (dalam %)',
      'Marketplace': 'OPTIONAL: Target marketplace (TikTok Shop, Shopee, dll)',
      'Nama Produk': 'REQUIRED: Nama produk yang diiklankan (untuk perhitungan True Profit ROI)'
    }
  ];

  // Sample data with EXACT USER COLUMN STRUCTURE
  const sampleData = [
    {
      'Campaign Name': 'Summer Fashion Campaign',
      'Account Name': "D'Busana",
      'Ad Creative Type': 'Video',
      'Ad Creative': 'Summer Collection Video Ad 30s',
      'Date Range Start': '01/09/25',
      'Date Range End': '15/09/25',
      'Impressions': 75000,
      'Clicks': 3750,
      'Conversions': 225,
      'Cost': 3750000,
      'Revenue': 11250000,
      'ROI': 200.0,
      'Marketplace': 'TikTok Shop',
      'Nama Produk': 'Dress Summer Collection'
    },
    {
      'Campaign Name': 'Back to School Promo',
      'Account Name': "D'Busana",
      'Ad Creative Type': 'Carousel',
      'Ad Creative': 'Student Fashion Collection',
      'Date Range Start': '16/08/25',
      'Date Range End': '31/08/25',
      'Impressions': 50000,
      'Clicks': 2500,
      'Conversions': 150,
      'Cost': 2500000,
      'Revenue': 7500000,
      'ROI': 200.0,
      'Marketplace': 'Shopee',
      'Nama Produk': 'Blazer Student Collection'
    }
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Instructions sheet
  const instructionWs = XLSX.utils.json_to_sheet(instructionData);
  instructionWs['!cols'] = Array(15).fill({ wch: 25 });
  XLSX.utils.book_append_sheet(wb, instructionWs, 'Instructions');

  // Sample data sheet
  const sampleWs = XLSX.utils.json_to_sheet(sampleData);
  sampleWs['!cols'] = [
    { wch: 25 }, // Campaign Name
    { wch: 15 }, // Account Name
    { wch: 18 }, // Ad Creative Type
    { wch: 30 }, // Ad Creative
    { wch: 18 }, // Date Range Start
    { wch: 18 }, // Date Range End
    { wch: 12 }, // Impressions
    { wch: 10 }, // Clicks
    { wch: 12 }, // Conversions
    { wch: 15 }, // Cost
    { wch: 15 }, // Revenue
    { wch: 8 },  // ROI
    { wch: 15 }, // Marketplace
    { wch: 25 }  // Nama Produk
  ];
  XLSX.utils.book_append_sheet(wb, sampleWs, 'Sample Data');

  // Empty template sheet for actual data entry
  const emptyData = [{}]; // Empty row for user to fill
  const emptyWs = XLSX.utils.json_to_sheet(emptyData);
  
  // Add headers manually for empty sheet - EXACT USER COLUMN STRUCTURE
  const headers = [
    'Campaign Name', 'Account Name', 'Ad Creative Type', 'Ad Creative',
    'Date Range Start', 'Date Range End', 'Impressions', 'Clicks', 'Conversions',
    'Cost', 'Revenue', 'ROI', 'Marketplace', 'Nama Produk'
  ];
  
  XLSX.utils.sheet_add_aoa(emptyWs, [headers], { origin: 'A1' });
  emptyWs['!cols'] = [
    { wch: 25 }, // Campaign Name
    { wch: 15 }, // Account Name
    { wch: 18 }, // Ad Creative Type
    { wch: 30 }, // Ad Creative
    { wch: 18 }, // Date Range Start
    { wch: 18 }, // Date Range End
    { wch: 12 }, // Impressions
    { wch: 10 }, // Clicks
    { wch: 12 }, // Conversions
    { wch: 15 }, // Cost
    { wch: 15 }, // Revenue
    { wch: 8 },  // ROI
    { wch: 15 }, // Marketplace
    { wch: 25 }  // Nama Produk
  ];
  XLSX.utils.book_append_sheet(wb, emptyWs, 'Advertising Data');

  // Write file
  const templatePath = path.join(__dirname, 'advertising_template_with_guide.xlsx');
  XLSX.writeFile(wb, templatePath);

  console.log('✅ Advertising template with instructions generated:', templatePath);
  return templatePath;
};

// Main function to generate both templates
const generateAdvertisingTemplates = () => {
  try {
    const basicTemplate = generateAdvertisingTemplate();
    const guidedTemplate = generateAdvertisingTemplateWithInstructions();
    
    return {
      success: true,
      basicTemplate,
      guidedTemplate,
      message: 'Advertising templates generated successfully'
    };
  } catch (error) {
    console.error('❌ Error generating advertising templates:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateAdvertisingTemplate,
  generateAdvertisingTemplateWithInstructions,
  generateAdvertisingTemplates
};

// Run if called directly
if (require.main === module) {
  generateAdvertisingTemplates();
}