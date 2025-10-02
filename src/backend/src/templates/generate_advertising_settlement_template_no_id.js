const XLSX = require('xlsx');
const path = require('path');

// Generate updated advertising settlement template without auto-generated ID
function generateAdvertisingSettlementTemplateNoId() {
  console.log('📋 Generating Advertising Settlement Template (No Auto-ID)...');

  // Template data with clear instructions
  const templateData = [
    {
      'Order ID': 'ORD-001-2024', // MANDATORY - Primary Key
      'Type': 'Commission',
      'Order Created Time': '01/02/2024',
      'Order Settled Time': '05/02/2024',
      'Settlement Amount': 50000,
      'Marketplace': 'TikTok Shop'
    },
    {
      'Order ID': 'ORD-002-2024', // MANDATORY - Primary Key
      'Type': 'Ad Spend',
      'Order Created Time': '02/02/2024',
      'Order Settled Time': '06/02/2024',
      'Settlement Amount': 125000,
      'Marketplace': 'TikTok Ads'
    },
    {
      'Order ID': 'ORD-003-2024', // MANDATORY - Primary Key
      'Type': 'Tax',
      'Order Created Time': '03/02/2024',
      'Order Settled Time': '07/02/2024',
      'Settlement Amount': 15000,
      'Marketplace': 'Facebook Ads'
    }
  ];

  // Column descriptions for the second sheet
  const columnDescriptions = [
    {
      'Column Name': 'Order ID',
      'Type': 'Text (MANDATORY)',
      'Description': 'Unique identifier for settlement order - WAJIB DIISI karena primary key',
      'Example': 'ORD-001-2024, SETTLE-FB-001',
      'Notes': 'Tidak boleh kosong, harus unik per import'
    },
    {
      'Column Name': 'Type',
      'Type': 'Text (Optional)',
      'Description': 'Type of settlement expense',
      'Example': 'Commission, Ad Spend, Tax, Fee',
      'Notes': 'Default: Commission jika kosong'
    },
    {
      'Column Name': 'Order Created Time',
      'Type': 'Date',
      'Description': 'When the advertising order was created',
      'Example': '01/02/2024, 2024-02-01',
      'Notes': 'Format: DD/MM/YYYY atau YYYY-MM-DD'
    },
    {
      'Column Name': 'Order Settled Time',
      'Type': 'Date',
      'Description': 'When the settlement was processed',
      'Example': '05/02/2024, 2024-02-05',
      'Notes': 'Format: DD/MM/YYYY atau YYYY-MM-DD'
    },
    {
      'Column Name': 'Settlement Amount',
      'Type': 'Number',
      'Description': 'Total amount of settlement (cost + tax)',
      'Example': '50000, 125000.50',
      'Notes': 'Dalam Rupiah, tanpa titik atau koma ribuan'
    },
    {
      'Column Name': 'Marketplace',
      'Type': 'Text (Optional)',
      'Description': 'Platform or marketplace name',
      'Example': 'TikTok Shop, TikTok Ads, Facebook Ads, Google Ads',
      'Notes': 'Default: TikTok Shop jika kosong'
    }
  ];

  // Important notes for users
  const importantNotes = [
    {
      'IMPORTANT NOTES': '1. Order ID WAJIB DIISI',
      'Details': 'Order ID sekarang menjadi primary key, tidak ada auto-generated ID lagi'
    },
    {
      'IMPORTANT NOTES': '2. Order ID Harus Unik',
      'Details': 'Setiap Order ID hanya boleh ada satu dalam database'
    },
    {
      'IMPORTANT NOTES': '3. Format Tanggal Fleksibel',
      'Details': 'Bisa menggunakan DD/MM/YYYY atau YYYY-MM-DD'
    },
    {
      'IMPORTANT NOTES': '4. Settlement Period Auto-Calculate',
      'Details': 'Sistem akan otomatis menghitung periode berdasarkan tanggal'
    },
    {
      'IMPORTANT NOTES': '5. Update Data Existing',
      'Details': 'Jika Order ID sudah ada, data akan di-update dengan nilai baru'
    },
    {
      'IMPORTANT NOTES': '6. No Duplicate Detection by Period',
      'Details': 'Sistem tidak lagi membedakan berdasarkan periode - Order ID langsung unique'
    }
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Add main data sheet
  const dataSheet = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Advertising Settlement Data');

  // Add column descriptions sheet
  const descSheet = XLSX.utils.json_to_sheet(columnDescriptions);
  XLSX.utils.book_append_sheet(workbook, descSheet, 'Column Descriptions');

  // Add important notes sheet
  const notesSheet = XLSX.utils.json_to_sheet(importantNotes);
  XLSX.utils.book_append_sheet(workbook, notesSheet, 'Important Notes');

  // Set column widths for better readability
  const columnWidths = [
    { wch: 20 }, // Order ID
    { wch: 15 }, // Type
    { wch: 20 }, // Order Created Time
    { wch: 20 }, // Order Settled Time
    { wch: 18 }, // Settlement Amount
    { wch: 15 }  // Marketplace
  ];
  
  dataSheet['!cols'] = columnWidths;
  descSheet['!cols'] = [
    { wch: 25 }, // Column Name
    { wch: 20 }, // Type
    { wch: 40 }, // Description
    { wch: 30 }, // Example
    { wch: 35 }  // Notes
  ];
  notesSheet['!cols'] = [
    { wch: 35 }, // Important Notes
    { wch: 60 }  // Details
  ];

  // Output path
  const outputPath = path.join(__dirname, 'advertising_settlement_template_no_id.xlsx');
  
  try {
    XLSX.writeFile(workbook, outputPath);
    console.log('✅ Advertising Settlement Template (No Auto-ID) generated successfully!');
    console.log('📁 File location:', outputPath);
    console.log('📋 Template includes:');
    console.log('  ✅ Sample data with mandatory Order ID');
    console.log('  ✅ Column descriptions and requirements');
    console.log('  ✅ Important notes about primary key changes');
    console.log('  ✅ No auto-generated ID - Order ID is now primary key');
    
    return {
      success: true,
      filePath: outputPath,
      message: 'Advertising Settlement template (No Auto-ID) generated successfully'
    };
    
  } catch (error) {
    console.error('❌ Error generating advertising settlement template:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate advertising settlement template'
    };
  }
}

module.exports = { generateAdvertisingSettlementTemplateNoId };

// Run if called directly
if (require.main === module) {
  generateAdvertisingSettlementTemplateNoId();
}