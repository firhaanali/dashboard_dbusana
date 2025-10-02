const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Template generator untuk Transaction Management components
class TransactionManagementTemplateGenerator {
  
  // Generate Returns & Cancellations template
  static async generateReturnsTemplate() {
    try {
      console.log('📋 Generating Returns & Cancellations template...');
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Returns & Cancellations');

      // Set column headers
      const headers = [
        'Type',
        'Original Order ID',
        'Reason',
        'Return Date',
        'Returned Amount',
        'Refund Amount',
        'Restocking Fee',
        'Shipping Cost Loss',
        'Product Name',
        'Quantity Returned',
        'Original Price',
        'Marketplace',
        'Product Condition',
        'Resellable',
        'Notes'
      ];

      worksheet.addRow(headers);

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };

    // Set column widths
    worksheet.columns = [
      { width: 12 }, // Type
      { width: 20 }, // Original Order ID
      { width: 25 }, // Reason
      { width: 15 }, // Return Date
      { width: 18 }, // Returned Amount
      { width: 18 }, // Refund Amount
      { width: 18 }, // Restocking Fee
      { width: 20 }, // Shipping Cost Loss
      { width: 30 }, // Product Name
      { width: 18 }, // Quantity Returned
      { width: 18 }, // Original Price
      { width: 15 }, // Marketplace
      { width: 18 }, // Product Condition
      { width: 12 }, // Resellable
      { width: 30 }  // Notes
    ];

    // Add example data
    const exampleRows = [
      [
        'return',
        'ORD-12345',
        'Tidak sesuai ukuran',
        '2024-01-15',
        '250000',
        '225000',
        '15000',
        '10000',
        'Blouse Elegant Navy',
        '1',
        '250000',
        'TikTok Shop',
        'new',
        'TRUE',
        'Pelanggan ingin ukuran lebih besar'
      ],
      [
        'cancel',
        'ORD-67890',
        'Berubah pikiran',
        '2024-01-10',
        '180000',
        '180000',
        '0',
        '15000',
        'Dress Casual Pink',
        '1',
        '180000',
        'Shopee',
        'new',
        'TRUE',
        'Cancel sebelum dikirim'
      ]
    ];

    exampleRows.forEach(row => {
      worksheet.addRow(row);
    });

    // Add instructions sheet
    const instructionsWs = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Field', 'Description', 'Required', 'Format/Options'],
      ['Type', 'Jenis transaksi', 'YES', 'return atau cancel'],
      ['Original Order ID', 'ID order asli dari marketplace', 'NO', 'Text'],
      ['Reason', 'Alasan return/cancel', 'NO', 'Text'],
      ['Return Date', 'Tanggal return/cancel', 'YES', 'YYYY-MM-DD'],
      ['Returned Amount', 'Jumlah yang dikembalikan', 'YES', 'Number (tanpa koma/titik)'],
      ['Refund Amount', 'Jumlah refund actual', 'YES', 'Number (tanpa koma/titik)'],
      ['Restocking Fee', 'Biaya restocking', 'NO', 'Number (tanpa koma/titik)'],
      ['Shipping Cost Loss', 'Kerugian biaya shipping', 'NO', 'Number (tanpa koma/titik)'],
      ['Product Name', 'Nama produk', 'YES', 'Text'],
      ['Quantity Returned', 'Jumlah yang dikembalikan', 'YES', 'Number'],
      ['Original Price', 'Harga asli produk', 'YES', 'Number (tanpa koma/titik)'],
      ['Marketplace', 'Platform marketplace', 'NO', 'TikTok Shop, Shopee, Tokopedia, dll'],
      ['Product Condition', 'Kondisi produk return', 'NO', 'new, used, damaged'],
      ['Resellable', 'Apakah bisa dijual lagi', 'NO', 'TRUE atau FALSE'],
      ['Notes', 'Catatan tambahan', 'NO', 'Text']
    ];

    instructions.forEach((row, index) => {
      const excelRow = instructionsWs.addRow(row);
      if (index === 0) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }
        };
      }
    });

    instructionsWs.columns = [
      { width: 20 },
      { width: 35 },
      { width: 12 },
      { width: 40 }
    ];

    console.log('✅ Returns & Cancellations template generated successfully');
    return workbook;
    
    } catch (error) {
      console.error('❌ Error generating Returns & Cancellations template:', error);
      throw error;
    }
  }

  // Generate Marketplace Reimbursements template
  static async generateReimbursementsTemplate() {
    try {
      console.log('📋 Generating Marketplace Reimbursements template...');
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Marketplace Reimbursements');

    const headers = [
      'Claim ID',
      'Reimbursement Type',
      'Claim Amount',
      'Approved Amount',
      'Received Amount',
      'Processing Fee',
      'Incident Date',
      'Claim Date',
      'Approval Date',
      'Received Date',
      'Affected Order ID',
      'Product Name',
      'Marketplace',
      'Status',
      'Notes',
      'Evidence Provided'
    ];

    worksheet.addRow(headers);

    // Format header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };

    worksheet.columns = [
      { width: 15 }, // Claim ID
      { width: 20 }, // Reimbursement Type
      { width: 18 }, // Claim Amount
      { width: 18 }, // Approved Amount
      { width: 18 }, // Received Amount
      { width: 18 }, // Processing Fee
      { width: 15 }, // Incident Date
      { width: 15 }, // Claim Date
      { width: 15 }, // Approval Date
      { width: 15 }, // Received Date
      { width: 20 }, // Affected Order ID
      { width: 30 }, // Product Name
      { width: 15 }, // Marketplace
      { width: 12 }, // Status
      { width: 30 }, // Notes
      { width: 25 }  // Evidence Provided
    ];

    // Add example data
    const exampleRows = [
      [
        'REIMB-001',
        'lost_package',
        '150000',
        '150000',
        '145000',
        '5000',
        '2024-01-05',
        '2024-01-07',
        '2024-01-10',
        '2024-01-12',
        'ORD-12345',
        'Kemeja Formal Putih',
        'TikTok Shop',
        'received',
        'Paket hilang di ekspedisi',
        'Screenshot resi dan chat ekspedisi'
      ]
    ];

    exampleRows.forEach(row => {
      worksheet.addRow(row);
    });

    // Add instructions
    const instructionsWs = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Field', 'Description', 'Required', 'Format/Options'],
      ['Claim ID', 'ID klaim dari marketplace', 'NO', 'Text'],
      ['Reimbursement Type', 'Jenis reimbursement', 'YES', 'lost_package, fake_checkout, platform_error, damage_in_transit'],
      ['Claim Amount', 'Jumlah yang diklaim', 'YES', 'Number (tanpa koma/titik)'],
      ['Approved Amount', 'Jumlah yang disetujui', 'NO', 'Number (tanpa koma/titik)'],
      ['Received Amount', 'Jumlah yang diterima', 'NO', 'Number (tanpa koma/titik)'],
      ['Processing Fee', 'Biaya processing', 'NO', 'Number (tanpa koma/titik)'],
      ['Incident Date', 'Tanggal kejadian', 'YES', 'YYYY-MM-DD'],
      ['Claim Date', 'Tanggal pengajuan klaim', 'YES', 'YYYY-MM-DD'],
      ['Approval Date', 'Tanggal persetujuan', 'NO', 'YYYY-MM-DD'],
      ['Received Date', 'Tanggal penerimaan dana', 'NO', 'YYYY-MM-DD'],
      ['Affected Order ID', 'ID order yang terdampak', 'NO', 'Text'],
      ['Product Name', 'Nama produk', 'NO', 'Text'],
      ['Marketplace', 'Platform marketplace', 'YES', 'TikTok Shop, Shopee, Tokopedia, dll'],
      ['Status', 'Status klaim', 'YES', 'pending, approved, rejected, received'],
      ['Notes', 'Catatan tambahan', 'NO', 'Text'],
      ['Evidence Provided', 'Bukti yang diberikan', 'NO', 'Text']
    ];

    instructions.forEach((row, index) => {
      const excelRow = instructionsWs.addRow(row);
      if (index === 0) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }
        };
      }
    });

    instructionsWs.columns = [
      { width: 20 },
      { width: 35 },
      { width: 12 },
      { width: 50 }
    ];

    console.log('✅ Marketplace Reimbursements template generated successfully');
    return workbook;
    
    } catch (error) {
      console.error('❌ Error generating Marketplace Reimbursements template:', error);
      throw error;
    }
  }

  // Generate Commission Adjustments template
  static async generateCommissionAdjustmentsTemplate() {
    try {
      console.log('📋 Generating Commission Adjustments template...');
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Commission Adjustments');

    const headers = [
      'Original Order ID',
      'Adjustment Type',
      'Reason',
      'Original Commission',
      'Adjustment Amount',
      'Final Commission',
      'Marketplace',
      'Commission Rate',
      'Dynamic Rate Applied',
      'Transaction Date',
      'Adjustment Date',
      'Product Name',
      'Quantity',
      'Product Price'
    ];

    worksheet.addRow(headers);

    // Format header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };

    worksheet.columns = [
      { width: 20 }, // Original Order ID
      { width: 25 }, // Adjustment Type
      { width: 30 }, // Reason
      { width: 20 }, // Original Commission
      { width: 20 }, // Adjustment Amount
      { width: 18 }, // Final Commission
      { width: 15 }, // Marketplace
      { width: 18 }, // Commission Rate
      { width: 20 }, // Dynamic Rate Applied
      { width: 18 }, // Transaction Date
      { width: 18 }, // Adjustment Date
      { width: 30 }, // Product Name
      { width: 12 }, // Quantity
      { width: 18 }  // Product Price
    ];

    // Add example data
    const exampleRows = [
      [
        'ORD-12345',
        'return_commission_loss',
        'Return produk, komisi dikurangi',
        '25000',
        '-20000',
        '5000',
        'TikTok Shop',
        '10.0',
        'FALSE',
        '2024-01-10',
        '2024-01-15',
        'Blouse Elegant Navy',
        '1',
        '250000'
      ]
    ];

    exampleRows.forEach(row => {
      worksheet.addRow(row);
    });

    // Add instructions
    const instructionsWs = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Field', 'Description', 'Required', 'Format/Options'],
      ['Original Order ID', 'ID order asli', 'NO', 'Text'],
      ['Adjustment Type', 'Jenis adjustment', 'YES', 'return_commission_loss, dynamic_commission, platform_penalty'],
      ['Reason', 'Penjelasan adjustment', 'NO', 'Text'],
      ['Original Commission', 'Komisi asli', 'YES', 'Number (tanpa koma/titik)'],
      ['Adjustment Amount', 'Jumlah adjustment (negatif untuk pengurangan)', 'YES', 'Number (tanpa koma/titik)'],
      ['Final Commission', 'Komisi final', 'NO', 'Number (auto calculated if empty)'],
      ['Marketplace', 'Platform marketplace', 'YES', 'TikTok Shop, Shopee, Tokopedia, dll'],
      ['Commission Rate', 'Rate komisi (%)', 'NO', 'Number (desimal, contoh: 10.5)'],
      ['Dynamic Rate Applied', 'Menggunakan dynamic rate', 'NO', 'TRUE atau FALSE'],
      ['Transaction Date', 'Tanggal transaksi asli', 'YES', 'YYYY-MM-DD'],
      ['Adjustment Date', 'Tanggal adjustment', 'YES', 'YYYY-MM-DD'],
      ['Product Name', 'Nama produk', 'NO', 'Text'],
      ['Quantity', 'Jumlah produk', 'NO', 'Number'],
      ['Product Price', 'Harga produk', 'NO', 'Number (tanpa koma/titik)']
    ];

    instructions.forEach((row, index) => {
      const excelRow = instructionsWs.addRow(row);
      if (index === 0) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }
        };
      }
    });

    instructionsWs.columns = [
      { width: 20 },
      { width: 35 },
      { width: 12 },
      { width: 50 }
    ];

    console.log('✅ Commission Adjustments template generated successfully');
    return workbook;
    
    } catch (error) {
      console.error('❌ Error generating Commission Adjustments template:', error);
      throw error;
    }
  }

  // Generate Affiliate Samples template
  static async generateAffiliateSamplesTemplate() {
    try {
      console.log('📋 Generating Affiliate Samples template...');
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Affiliate Samples');

    const headers = [
      'Affiliate Name',
      'Affiliate Platform',
      'Affiliate Contact',
      'Product Name',
      'Product SKU',
      'Quantity Given',
      'Product Cost',
      'Total Cost',
      'Shipping Cost',
      'Packaging Cost',
      'Campaign Name',
      'Expected Reach',
      'Content Type',
      'Given Date',
      'Expected Content Date',
      'Actual Content Date',
      'Content Delivered',
      'Performance Notes',
      'ROI Estimate',
      'Status'
    ];

    worksheet.addRow(headers);

    // Format header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };

    worksheet.columns = [
      { width: 25 }, // Affiliate Name
      { width: 18 }, // Affiliate Platform
      { width: 20 }, // Affiliate Contact
      { width: 30 }, // Product Name
      { width: 15 }, // Product SKU
      { width: 15 }, // Quantity Given
      { width: 18 }, // Product Cost
      { width: 15 }, // Total Cost
      { width: 18 }, // Shipping Cost
      { width: 18 }, // Packaging Cost
      { width: 25 }, // Campaign Name
      { width: 18 }, // Expected Reach
      { width: 15 }, // Content Type
      { width: 15 }, // Given Date
      { width: 20 }, // Expected Content Date
      { width: 20 }, // Actual Content Date
      { width: 18 }, // Content Delivered
      { width: 30 }, // Performance Notes
      { width: 15 }, // ROI Estimate
      { width: 12 }  // Status
    ];

    // Add example data
    const exampleRows = [
      [
        'Sarah Fashion Blogger',
        'Instagram',
        '@sarahfashion',
        'Dress Summer Collection',
        'DSC-001',
        '2',
        '150000',
        '300000',
        '25000',
        '15000',
        'Summer Launch 2024',
        '15000',
        'post',
        '2024-01-01',
        '2024-01-08',
        '2024-01-10',
        'TRUE',
        'Post mendapat engagement tinggi',
        '200.0',
        'completed'
      ]
    ];

    exampleRows.forEach(row => {
      worksheet.addRow(row);
    });

    // Add instructions
    const instructionsWs = workbook.addWorksheet('Instructions');
    const instructions = [
      ['Field', 'Description', 'Required', 'Format/Options'],
      ['Affiliate Name', 'Nama affiliate/influencer', 'YES', 'Text'],
      ['Affiliate Platform', 'Platform affiliate', 'NO', 'Instagram, TikTok, YouTube, Facebook, dll'],
      ['Affiliate Contact', 'Kontak affiliate', 'NO', 'Text (username, email, phone)'],
      ['Product Name', 'Nama produk sample', 'YES', 'Text'],
      ['Product SKU', 'SKU produk', 'NO', 'Text'],
      ['Quantity Given', 'Jumlah yang diberikan', 'YES', 'Number'],
      ['Product Cost', 'HPP per produk', 'YES', 'Number (tanpa koma/titik)'],
      ['Total Cost', 'Total biaya produk', 'NO', 'Number (auto calculated if empty)'],
      ['Shipping Cost', 'Biaya shipping', 'NO', 'Number (tanpa koma/titik)'],
      ['Packaging Cost', 'Biaya packaging', 'NO', 'Number (tanpa koma/titik)'],
      ['Campaign Name', 'Nama campaign/kolaborasi', 'NO', 'Text'],
      ['Expected Reach', 'Expected audience reach', 'NO', 'Number'],
      ['Content Type', 'Jenis konten', 'NO', 'post, story, video, review'],
      ['Given Date', 'Tanggal pemberian sample', 'YES', 'YYYY-MM-DD'],
      ['Expected Content Date', 'Expected tanggal publish konten', 'NO', 'YYYY-MM-DD'],
      ['Actual Content Date', 'Actual tanggal publish konten', 'NO', 'YYYY-MM-DD'],
      ['Content Delivered', 'Apakah konten sudah dibuat', 'NO', 'TRUE atau FALSE'],
      ['Performance Notes', 'Catatan performa campaign', 'NO', 'Text'],
      ['ROI Estimate', 'Estimasi ROI (%)', 'NO', 'Number (desimal, contoh: 200.5)'],
      ['Status', 'Status sample', 'NO', 'planned, sent, delivered, content_created, completed']
    ];

    instructions.forEach((row, index) => {
      const excelRow = instructionsWs.addRow(row);
      if (index === 0) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }
        };
      }
    });

    instructionsWs.columns = [
      { width: 20 },
      { width: 35 },
      { width: 12 },
      { width: 50 }
    ];

    console.log('✅ Affiliate Samples template generated successfully');
    return workbook;
    
    } catch (error) {
      console.error('❌ Error generating Affiliate Samples template:', error);
      throw error;
    }
  }

  // Generate all templates
  static async generateAllTemplates() {
    try {
      console.log('🚀 Generating all Transaction Management templates...');

      const templatesDir = path.join(__dirname, '../../templates');
      
      // Ensure templates directory exists
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
        console.log('📁 Created templates directory');
      }

      // Generate all templates
      const templates = [
        {
          name: 'returns-cancellations-template.xlsx',
          generator: this.generateReturnsTemplate,
          description: 'Returns & Cancellations'
        },
        {
          name: 'marketplace-reimbursements-template.xlsx',
          generator: this.generateReimbursementsTemplate,
          description: 'Marketplace Reimbursements'
        },
        {
          name: 'commission-adjustments-template.xlsx',
          generator: this.generateCommissionAdjustmentsTemplate,
          description: 'Commission Adjustments'
        },
        {
          name: 'affiliate-samples-template.xlsx',
          generator: this.generateAffiliateSamplesTemplate,
          description: 'Affiliate Samples'
        }
      ];

      for (const template of templates) {
        console.log(`📋 Creating ${template.description} template...`);
        const workbook = await template.generator();
        const filePath = path.join(templatesDir, template.name);
        
        await workbook.xlsx.writeFile(filePath);
        console.log(`✅ ${template.description} template saved: ${filePath}`);
      }

      console.log('🎉 All Transaction Management templates generated successfully!');

      return {
        success: true,
        message: 'All Transaction Management templates generated successfully',
        templates: templates.map(t => ({
          name: t.name,
          description: t.description,
          path: path.join(templatesDir, t.name)
        }))
      };

    } catch (error) {
      console.error('❌ Error generating templates:', error);
      throw error;
    }
  }
}

module.exports = TransactionManagementTemplateGenerator;

// Run if called directly
if (require.main === module) {
  TransactionManagementTemplateGenerator.generateAllTemplates()
    .then((result) => {
      console.log('✅ Template generation completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Template generation failed:', error);
      process.exit(1);
    });
}