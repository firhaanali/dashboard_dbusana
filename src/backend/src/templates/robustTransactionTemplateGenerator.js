const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Robust Transaction Management Template Generator
 * Generates Excel files with strict validation and error handling
 */
class RobustTransactionTemplateGenerator {
  
  /**
   * Create a properly formatted workbook with metadata
   */
  static createWorkbook(title) {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'D\'Busana Dashboard';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.title = title;
    workbook.description = `Template for ${title} - D'Busana Fashion Business`;
    
    return workbook;
  }
  
  /**
   * Apply standard header formatting
   */
  static formatHeaderRow(worksheet, headerRow) {
    headerRow.eachCell((cell) => {
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' }
      };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Set row height
    headerRow.height = 25;
  }
  
  /**
   * Apply standard data row formatting
   */
  static formatDataRows(worksheet, startRow, endRow) {
    for (let i = startRow; i <= endRow; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell) => {
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'left',
          wrapText: false
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
      row.height = 20;
    }
  }
  
  /**
   * Create instructions worksheet
   */
  static createInstructionsSheet(workbook, instructions) {
    const instructionsWs = workbook.addWorksheet('📋 Instructions');
    
    // Add title
    const titleRow = instructionsWs.addRow(['D\'Busana Template Instructions']);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    titleRow.height = 30;
    instructionsWs.mergeCells('A1:D1');
    
    // Add empty row
    instructionsWs.addRow([]);
    
    // Add headers
    const headerRow = instructionsWs.addRow(['Field', 'Description', 'Required', 'Format/Options']);
    this.formatHeaderRow(instructionsWs, headerRow);
    
    // Add instructions data
    instructions.forEach((instruction, index) => {
      const row = instructionsWs.addRow(instruction);
      if (instruction[2] === 'YES') {
        row.getCell(3).font = { bold: true, color: { argb: 'FFD32F2F' } };
      }
    });
    
    // Format data rows
    this.formatDataRows(instructionsWs, 4, 3 + instructions.length);
    
    // Set column widths
    instructionsWs.columns = [
      { width: 25 },
      { width: 40 },
      { width: 12 },
      { width: 50 }
    ];
    
    return instructionsWs;
  }
  
  /**
   * Validate generated workbook
   */
  static async validateWorkbook(workbook, expectedSheets = 2) {
    try {
      // Check if workbook exists
      if (!workbook) {
        throw new Error('Workbook is null or undefined');
      }
      
      // Check worksheet count
      if (workbook.worksheets.length < expectedSheets) {
        throw new Error(`Expected at least ${expectedSheets} worksheets, got ${workbook.worksheets.length}`);
      }
      
      // Test buffer generation
      const buffer = await workbook.xlsx.writeBuffer();
      
      if (!buffer || buffer.length === 0) {
        throw new Error('Generated buffer is empty');
      }
      
      if (buffer.length < 1000) {
        throw new Error(`Generated buffer is too small (${buffer.length} bytes), likely corrupted`);
      }
      
      // Check if buffer starts with Excel signature
      const signature = buffer.toString('hex', 0, 4);
      if (signature !== '504b0304') {
        throw new Error('Buffer does not contain valid Excel signature');
      }
      
      console.log(`✅ Workbook validation passed: ${buffer.length} bytes`);
      return { valid: true, size: buffer.length };
      
    } catch (error) {
      console.error('❌ Workbook validation failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate Returns & Cancellations Template
   */
  static async generateReturnsTemplate() {
    try {
      console.log('📋 Generating Returns & Cancellations template...');
      
      const workbook = this.createWorkbook('Returns & Cancellations');
      const worksheet = workbook.addWorksheet('Returns & Cancellations', {
        properties: {
          defaultRowHeight: 20,
          defaultColWidth: 15
        }
      });
      
      // Define headers
      const headers = [
        'Type', 'Original Order ID', 'Reason', 'Return Date', 
        'Returned Amount', 'Refund Amount', 'Restocking Fee', 
        'Shipping Cost Loss', 'Product Name', 'Quantity Returned', 
        'Original Price', 'Marketplace', 'Product Condition', 
        'Resellable', 'Notes'
      ];
      
      // Add headers
      const headerRow = worksheet.addRow(headers);
      this.formatHeaderRow(worksheet, headerRow);
      
      // Set column widths
      worksheet.columns = [
        { width: 12 }, { width: 20 }, { width: 25 }, { width: 15 },
        { width: 18 }, { width: 18 }, { width: 18 }, { width: 20 },
        { width: 30 }, { width: 18 }, { width: 18 }, { width: 15 },
        { width: 18 }, { width: 12 }, { width: 30 }
      ];
      
      // Add example data
      const exampleRows = [
        [
          'return', 'ORD-12345', 'Tidak sesuai ukuran', '2024-01-15',
          '250000', '225000', '15000', '10000',
          'Blouse Elegant Navy', '1', '250000', 'TikTok Shop',
          'new', 'TRUE', 'Pelanggan ingin ukuran lebih besar'
        ],
        [
          'cancel', 'ORD-67890', 'Berubah pikiran', '2024-01-10',
          '180000', '180000', '0', '15000',
          'Dress Casual Pink', '1', '180000', 'Shopee',
          'new', 'TRUE', 'Cancel sebelum dikirim'
        ]
      ];
      
      exampleRows.forEach(row => {
        worksheet.addRow(row);
      });
      
      // Format data rows
      this.formatDataRows(worksheet, 2, 1 + exampleRows.length);
      
      // Create instructions
      const instructions = [
        ['Type', 'Jenis transaksi (return/cancel)', 'YES', 'return atau cancel'],
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
      
      this.createInstructionsSheet(workbook, instructions);
      
      // Validate workbook
      await this.validateWorkbook(workbook, 2);
      
      console.log('✅ Returns & Cancellations template generated successfully');
      return workbook;
      
    } catch (error) {
      console.error('❌ Error generating Returns & Cancellations template:', error);
      throw error;
    }
  }
  
  /**
   * Generate Marketplace Reimbursements Template
   */
  static async generateReimbursementsTemplate() {
    try {
      console.log('📋 Generating Marketplace Reimbursements template...');
      
      const workbook = this.createWorkbook('Marketplace Reimbursements');
      const worksheet = workbook.addWorksheet('Marketplace Reimbursements', {
        properties: {
          defaultRowHeight: 20,
          defaultColWidth: 15
        }
      });
      
      const headers = [
        'Claim ID', 'Reimbursement Type', 'Claim Amount', 'Approved Amount',
        'Received Amount', 'Processing Fee', 'Incident Date', 'Claim Date',
        'Approval Date', 'Received Date', 'Affected Order ID', 'Product Name',
        'Marketplace', 'Status', 'Notes', 'Evidence Provided'
      ];
      
      const headerRow = worksheet.addRow(headers);
      this.formatHeaderRow(worksheet, headerRow);
      
      worksheet.columns = [
        { width: 15 }, { width: 20 }, { width: 18 }, { width: 18 },
        { width: 18 }, { width: 18 }, { width: 15 }, { width: 15 },
        { width: 15 }, { width: 15 }, { width: 20 }, { width: 30 },
        { width: 15 }, { width: 12 }, { width: 30 }, { width: 25 }
      ];
      
      const exampleRows = [
        [
          'REIMB-001', 'lost_package', '150000', '150000',
          '145000', '5000', '2024-01-05', '2024-01-07',
          '2024-01-10', '2024-01-12', 'ORD-12345', 'Kemeja Formal Putih',
          'TikTok Shop', 'received', 'Paket hilang di ekspedisi', 'Screenshot resi dan chat ekspedisi'
        ]
      ];
      
      exampleRows.forEach(row => {
        worksheet.addRow(row);
      });
      
      this.formatDataRows(worksheet, 2, 1 + exampleRows.length);
      
      const instructions = [
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
      
      this.createInstructionsSheet(workbook, instructions);
      
      await this.validateWorkbook(workbook, 2);
      
      console.log('✅ Marketplace Reimbursements template generated successfully');
      return workbook;
      
    } catch (error) {
      console.error('❌ Error generating Marketplace Reimbursements template:', error);
      throw error;
    }
  }
  
  /**
   * Generate Commission Adjustments Template
   */
  static async generateCommissionAdjustmentsTemplate() {
    try {
      console.log('📋 Generating Commission Adjustments template...');
      
      const workbook = this.createWorkbook('Commission Adjustments');
      const worksheet = workbook.addWorksheet('Commission Adjustments', {
        properties: {
          defaultRowHeight: 20,
          defaultColWidth: 15
        }
      });
      
      const headers = [
        'Original Order ID', 'Adjustment Type', 'Reason', 'Original Commission',
        'Adjustment Amount', 'Final Commission', 'Marketplace', 'Commission Rate',
        'Dynamic Rate Applied', 'Transaction Date', 'Adjustment Date', 'Product Name',
        'Quantity', 'Product Price'
      ];
      
      const headerRow = worksheet.addRow(headers);
      this.formatHeaderRow(worksheet, headerRow);
      
      worksheet.columns = [
        { width: 20 }, { width: 25 }, { width: 30 }, { width: 20 },
        { width: 20 }, { width: 18 }, { width: 15 }, { width: 18 },
        { width: 20 }, { width: 18 }, { width: 18 }, { width: 30 },
        { width: 12 }, { width: 18 }
      ];
      
      const exampleRows = [
        [
          'ORD-12345', 'return_commission_loss', 'Return produk, komisi dikurangi',
          '25000', '-20000', '5000', 'TikTok Shop', '10.0',
          'FALSE', '2024-01-10', '2024-01-15', 'Blouse Elegant Navy',
          '1', '250000'
        ]
      ];
      
      exampleRows.forEach(row => {
        worksheet.addRow(row);
      });
      
      this.formatDataRows(worksheet, 2, 1 + exampleRows.length);
      
      const instructions = [
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
      
      this.createInstructionsSheet(workbook, instructions);
      
      await this.validateWorkbook(workbook, 2);
      
      console.log('✅ Commission Adjustments template generated successfully');
      return workbook;
      
    } catch (error) {
      console.error('❌ Error generating Commission Adjustments template:', error);
      throw error;
    }
  }
  
  /**
   * Generate Affiliate Samples Template
   */
  static async generateAffiliateSamplesTemplate() {
    try {
      console.log('📋 Generating Affiliate Samples template...');
      
      const workbook = this.createWorkbook('Affiliate Samples');
      const worksheet = workbook.addWorksheet('Affiliate Samples', {
        properties: {
          defaultRowHeight: 20,
          defaultColWidth: 15
        }
      });
      
      const headers = [
        'Affiliate Name', 'Affiliate Platform', 'Affiliate Contact', 'Product Name',
        'Product SKU', 'Quantity Given', 'Product Cost', 'Total Cost',
        'Shipping Cost', 'Packaging Cost', 'Campaign Name', 'Expected Reach',
        'Content Type', 'Given Date', 'Expected Content Date', 'Actual Content Date',
        'Content Delivered', 'Performance Notes', 'ROI Estimate', 'Status'
      ];
      
      const headerRow = worksheet.addRow(headers);
      this.formatHeaderRow(worksheet, headerRow);
      
      worksheet.columns = [
        { width: 25 }, { width: 18 }, { width: 20 }, { width: 30 },
        { width: 15 }, { width: 15 }, { width: 18 }, { width: 15 },
        { width: 18 }, { width: 18 }, { width: 25 }, { width: 18 },
        { width: 15 }, { width: 15 }, { width: 20 }, { width: 20 },
        { width: 18 }, { width: 30 }, { width: 15 }, { width: 12 }
      ];
      
      const exampleRows = [
        [
          'Sarah Fashion Blogger', 'Instagram', '@sarahfashion', 'Dress Summer Collection',
          'DSC-001', '2', '150000', '300000',
          '25000', '15000', 'Summer Launch 2024', '15000',
          'post', '2024-01-01', '2024-01-08', '2024-01-10',
          'TRUE', 'Post mendapat engagement tinggi', '200.0', 'completed'
        ]
      ];
      
      exampleRows.forEach(row => {
        worksheet.addRow(row);
      });
      
      this.formatDataRows(worksheet, 2, 1 + exampleRows.length);
      
      const instructions = [
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
      
      this.createInstructionsSheet(workbook, instructions);
      
      await this.validateWorkbook(workbook, 2);
      
      console.log('✅ Affiliate Samples template generated successfully');
      return workbook;
      
    } catch (error) {
      console.error('❌ Error generating Affiliate Samples template:', error);
      throw error;
    }
  }
  
  /**
   * Generate all templates
   */
  static async generateAllTemplates() {
    try {
      console.log('🚀 Generating all Transaction Management templates...');
      
      const templates = [
        {
          name: 'returns-cancellations-template.xlsx',
          generator: () => this.generateReturnsTemplate(),
          description: 'Returns & Cancellations'
        },
        {
          name: 'marketplace-reimbursements-template.xlsx',
          generator: () => this.generateReimbursementsTemplate(),
          description: 'Marketplace Reimbursements'
        },
        {
          name: 'commission-adjustments-template.xlsx',
          generator: () => this.generateCommissionAdjustmentsTemplate(),
          description: 'Commission Adjustments'
        },
        {
          name: 'affiliate-samples-template.xlsx',
          generator: () => this.generateAffiliateSamplesTemplate(),
          description: 'Affiliate Samples'
        }
      ];
      
      const templatesDir = path.join(__dirname, '../../templates');
      
      // Ensure templates directory exists
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
        console.log('📁 Created templates directory');
      }
      
      const results = [];
      
      for (const template of templates) {
        console.log(`📋 Creating ${template.description} template...`);
        
        try {
          const workbook = await template.generator();
          const filePath = path.join(templatesDir, template.name);
          
          await workbook.xlsx.writeFile(filePath);
          
          // Verify file was written correctly
          const stats = fs.statSync(filePath);
          console.log(`✅ ${template.description} template saved: ${stats.size} bytes`);
          
          results.push({
            name: template.name,
            description: template.description,
            path: filePath,
            size: stats.size,
            success: true
          });
          
        } catch (error) {
          console.error(`❌ Failed to generate ${template.description}:`, error.message);
          results.push({
            name: template.name,
            description: template.description,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`🎉 Template generation completed: ${successCount}/${results.length} successful`);
      
      return {
        success: successCount === results.length,
        message: `${successCount}/${results.length} templates generated successfully`,
        templates: results
      };
      
    } catch (error) {
      console.error('💥 Error generating templates:', error);
      throw error;
    }
  }
}

module.exports = RobustTransactionTemplateGenerator;

// Run if called directly
if (require.main === module) {
  RobustTransactionTemplateGenerator.generateAllTemplates()
    .then((result) => {
      console.log('✅ Template generation completed:', result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Template generation failed:', error);
      process.exit(1);
    });
}