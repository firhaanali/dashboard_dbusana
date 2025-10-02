const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 🔧 ROBUST ADVERTISING SETTLEMENT TEMPLATE GENERATOR
// Mengatasi masalah corruption dan format Excel yang tidak valid

console.log('🏦 ROBUST ADVERTISING SETTLEMENT TEMPLATE GENERATOR STARTING...');

// Template data yang sesuai dengan kolom user requirements
const generateRobustTemplate = () => {
  console.log('📊 Creating robust advertising settlement template...');
  
  try {
    // Template data sesuai user requirements:
    // Order ID | Type | Order Created Time | Order Settled Time | Settlement Amount | Account Name | Marketplace | Currency
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

    // Step 1: Create new workbook dengan proper settings
    const workbook = XLSX.utils.book_new();
    
    // Set workbook properties untuk Excel compatibility
    workbook.Props = {
      Title: 'Advertising Settlement Template',
      Subject: 'D\'Busana Fashion Dashboard Template',
      Author: 'D\'Busana Dashboard System',
      CreatedDate: new Date()
    };

    // Step 2: Create worksheet dari template data
    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: [
        'Order ID', 'Type', 'Order Created Time', 'Order Settled Time',
        'Settlement Amount', 'Account Name', 'Marketplace', 'Currency'
      ]
    });

    // Step 3: Set column properties untuk optimal display
    worksheet['!cols'] = [
      { wch: 20, wpx: 160 }, // Order ID
      { wch: 12, wpx: 96 },  // Type
      { wch: 18, wpx: 144 }, // Order Created Time
      { wch: 18, wpx: 144 }, // Order Settled Time
      { wch: 16, wpx: 128 }, // Settlement Amount
      { wch: 25, wpx: 200 }, // Account Name
      { wch: 15, wpx: 120 }, // Marketplace
      { wch: 10, wpx: 80 }   // Currency
    ];

    // Step 4: Set row heights
    worksheet['!rows'] = [
      { hpx: 20 }, // Header row
      { hpx: 18 }, // Data rows
      { hpx: 18 },
      { hpx: 18 }
    ];

    // Step 5: Apply cell styling untuk better readability
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Step 6: Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Advertising Settlement');

    // Step 7: Ensure templates directory exists
    const templatesDir = path.join(__dirname);
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Step 8: Generate template file
    const templatePath = path.join(templatesDir, 'advertising_settlement_template_robust.xlsx');
    
    // Write with specific options untuk ensure Excel compatibility
    XLSX.writeFile(workbook, templatePath, {
      bookType: 'xlsx',
      type: 'buffer',
      compression: true
    });

    console.log('✅ Robust template generated:', templatePath);

    // Step 9: Verify template integrity
    if (fs.existsSync(templatePath)) {
      const stats = fs.statSync(templatePath);
      console.log(`📊 Template file size: ${stats.size} bytes`);
      
      // Test read untuk verify tidak corrupt
      try {
        const testWorkbook = XLSX.readFile(templatePath);
        const testWorksheet = testWorkbook.Sheets['Advertising Settlement'];
        const testData = XLSX.utils.sheet_to_json(testWorksheet);
        
        if (testData.length >= 3) {
          console.log('✅ Template verification successful');
          console.log('📋 Template columns:', Object.keys(testData[0]));
          
          return {
            success: true,
            templatePath: templatePath,
            data: testData,
            columns: Object.keys(testData[0]),
            message: 'Robust advertising settlement template generated and verified'
          };
        } else {
          throw new Error('Template appears to have insufficient data');
        }
      } catch (verifyError) {
        console.error('❌ Template verification failed:', verifyError);
        return {
          success: false,
          error: 'Template verification failed: ' + verifyError.message
        };
      }
    } else {
      return {
        success: false,
        error: 'Template file was not created'
      };
    }

  } catch (error) {
    console.error('❌ Error generating robust template:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate guided template dengan instructions
const generateGuidedTemplate = () => {
  console.log('📋 Creating guided template with instructions...');
  
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Set workbook properties
    workbook.Props = {
      Title: 'Advertising Settlement Template Guide',
      Subject: 'Complete template with instructions',
      Author: 'D\'Busana Dashboard System',
      CreatedDate: new Date()
    };

    // Sheet 1: Instructions
    const instructionsData = [
      {
        'Column': 'Order ID',
        'Required': 'YES',
        'Description': 'Unique Order ID dari platform advertising',
        'Format': 'Text',
        'Example': 'TIKTOK-AD-2025-001'
      },
      {
        'Column': 'Type',
        'Required': 'NO',
        'Description': 'Jenis settlement (Ad Spend, Tax Fee, Service Fee)',
        'Format': 'Text',
        'Example': 'Ad Spend'
      },
      {
        'Column': 'Order Created Time',
        'Required': 'YES',
        'Description': 'Tanggal order dibuat',
        'Format': 'DD/MM/YYYY',
        'Example': '01/01/2025'
      },
      {
        'Column': 'Order Settled Time',
        'Required': 'YES',
        'Description': 'Tanggal settlement/pembayaran',
        'Format': 'DD/MM/YYYY',
        'Example': '03/01/2025'
      },
      {
        'Column': 'Settlement Amount',
        'Required': 'YES',
        'Description': 'Total settlement amount dalam Rupiah',
        'Format': 'Number',
        'Example': '500000'
      },
      {
        'Column': 'Account Name',
        'Required': 'NO',
        'Description': 'Nama akun advertising',
        'Format': 'Text',
        'Example': 'D\'Busana Fashion Ads'
      },
      {
        'Column': 'Marketplace',
        'Required': 'NO',
        'Description': 'Platform advertising',
        'Format': 'Text',
        'Example': 'TikTok Ads'
      },
      {
        'Column': 'Currency',
        'Required': 'NO',
        'Description': 'Currency type (default: IDR)',
        'Format': 'Text',
        'Example': 'IDR'
      }
    ];

    const instructionsWorksheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsWorksheet['!cols'] = [
      { wch: 20 }, // Column
      { wch: 10 }, // Required
      { wch: 40 }, // Description
      { wch: 15 }, // Format
      { wch: 20 }  // Example
    ];
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions');

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

    const sampleWorksheet = XLSX.utils.json_to_sheet(sampleData);
    sampleWorksheet['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 16 }, { wch: 25 }, { wch: 15 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, sampleWorksheet, 'Sample Data');

    // Sheet 3: Empty Template
    const headers = [
      'Order ID', 'Type', 'Order Created Time', 'Order Settled Time',
      'Settlement Amount', 'Account Name', 'Marketplace', 'Currency'
    ];
    
    const emptyWorksheet = XLSX.utils.aoa_to_sheet([headers]);
    emptyWorksheet['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 16 }, { wch: 25 }, { wch: 15 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, emptyWorksheet, 'Advertising Settlement');

    // Save guided template
    const guidedTemplatePath = path.join(__dirname, 'advertising_settlement_template_guided_robust.xlsx');
    XLSX.writeFile(workbook, guidedTemplatePath, {
      bookType: 'xlsx',
      type: 'buffer',
      compression: true
    });

    console.log('✅ Guided template generated:', guidedTemplatePath);
    
    // Verify guided template
    if (fs.existsSync(guidedTemplatePath)) {
      const testWorkbook = XLSX.readFile(guidedTemplatePath);
      const sheetNames = testWorkbook.SheetNames;
      
      if (sheetNames.length >= 3) {
        console.log('✅ Guided template verified, sheets:', sheetNames);
        return {
          success: true,
          templatePath: guidedTemplatePath,
          sheets: sheetNames,
          message: 'Guided template generated successfully'
        };
      } else {
        throw new Error('Guided template missing required sheets');
      }
    } else {
      throw new Error('Guided template file was not created');
    }

  } catch (error) {
    console.error('❌ Error generating guided template:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Main generator function
// FIXED: Generate advertising settlement templates with correct column structure
const generateAllRobustTemplates = () => {
  console.log('🚀 GENERATING ALL ROBUST ADVERTISING SETTLEMENT TEMPLATES...');
  
  try {
    const basicResult = generateRobustTemplate();
    const guidedResult = generateGuidedTemplate();
    
    if (basicResult.success && guidedResult.success) {
      console.log('🎉 ALL ROBUST TEMPLATES GENERATED SUCCESSFULLY!');
      return {
        success: true,
        basicTemplate: basicResult.templatePath,
        guidedTemplate: guidedResult.templatePath,
        basicData: basicResult.data,
        guidedSheets: guidedResult.sheets,
        message: 'All robust advertising settlement templates generated and verified'
      };
    } else {
      const errors = [];
      if (!basicResult.success) errors.push(`Basic template: ${basicResult.error}`);
      if (!guidedResult.success) errors.push(`Guided template: ${guidedResult.error}`);
      
      throw new Error(errors.join('; '));
    }
    
  } catch (error) {
    console.error('❌ Template generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateRobustTemplate,
  generateGuidedTemplate,
  generateAllRobustTemplates
};

// Run jika called directly
if (require.main === module) {
  generateAllRobustTemplates();
}