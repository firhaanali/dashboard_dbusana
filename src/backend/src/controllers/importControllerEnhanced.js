const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { 
  calculateFileHash, 
  generateImportMetadata, 
  createImportHistoryWithMetadata 
} = require('../utils/duplicateDetectionUtils');

const prisma = new PrismaClient();

// Enhanced import functions with duplicate detection

// Enhanced advertising import
const importAdvertisingDataEnhanced = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload an Excel or CSV file'
      });
    }
    
    const file = req.file;
    const batchId = uuidv4();
    let data = [];
    
    console.log('📈 ENHANCED ADVERTISING IMPORT - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // Parse file
    if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else if (file.mimetype.includes('csv') || file.originalname.endsWith('.csv')) {
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
      data = results;
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only Excel (.xlsx, .xls) and CSV files are supported'
      });
    }
    
    console.log(`📊 Parsed ${data.length} rows from advertising file`);
    
    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        id: batchId,
        batch_name: `Advertising Import - ${file.originalname}`,
        import_type: 'advertising',
        file_name: file.originalname,
        file_type: file.mimetype.includes('csv') ? 'csv' : 'excel',
        total_records: data.length,
        valid_records: 0,
        invalid_records: 0,
        imported_records: 0,
        status: 'processing'
      }
    });
    
    let importedCount = 0;
    let updatedCount = 0;
    let errors = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row['Campaign Name'] && !row.campaign_name) {
        continue;
      }
      
      try {
        const campaignName = (row['Campaign Name'] || row.campaign_name || '').toString().trim();
        const accountName = (row['Account Name'] || row.account_name || row['Platform'] || row.platform || '').toString().trim();
        
        if (!campaignName) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: campaignName,
            message: 'Campaign Name wajib diisi'
          });
          continue;
        }
        
        // Parse dates
        const dateStart = row['Date Range Start'] || row.date_start ? 
          (row['Date Range Start'] || row.date_start) : null;
        const dateEnd = row['Date Range End'] || row.date_end ? 
          (row['Date Range End'] || row.date_end) : null;
          
        const parsedDateStart = dateStart ? moment(dateStart, ['DD/MM/YY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true) : null;
        const parsedDateEnd = dateEnd ? moment(dateEnd, ['DD/MM/YY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true) : null;
        
        const advertisingData = {
          campaign_name: campaignName,
          ad_creative_type: (row['Ad Creative Type'] || row.ad_creative_type || '').toString().trim(),
          ad_creative: (row['Ad Creative'] || row.ad_creative || '').toString().trim(),
          account_name: accountName,
          cost: parseFloat(row['Cost'] || row.cost || row['Spending'] || row.spending || 0),
          conversions: parseInt(row['Conversions'] || row.conversions || 0),
          cpa: parseFloat(row['CPA'] || row.cpa || 0),
          revenue: parseFloat(row['Revenue'] || row.revenue || 0),
          roi: parseFloat(row['ROI'] || row.roi || 0),
          impressions: parseInt(row['Impressions'] || row.impressions || 0),
          clicks: parseInt(row['Clicks'] || row.clicks || 0),
          ctr: parseFloat(row['CTR'] || row.ctr || 0),
          conversion_rate: parseFloat(row['Conversion Rate'] || row.conversion_rate || 0),
          date_start: parsedDateStart && parsedDateStart.isValid() ? parsedDateStart.toDate() : new Date(),
          date_end: parsedDateEnd && parsedDateEnd.isValid() ? parsedDateEnd.toDate() : new Date(),
          marketplace: (row['Marketplace'] || row.marketplace || 'TikTok Shop').toString().trim(),
          nama_produk: (row['Product Name'] || row['Nama Produk'] || row.nama_produk || row.product_name || '').toString().trim(),
          import_batch_id: batchId
        };
        
        // Check for existing campaign with same name and date range
        const existingCampaign = await prisma.advertisingData.findFirst({
          where: {
            campaign_name: campaignName,
            account_name: accountName,
            date_start: advertisingData.date_start,
            date_end: advertisingData.date_end
          }
        });
        
        if (existingCampaign) {
          // Update existing campaign
          await prisma.advertisingData.update({
            where: { id: existingCampaign.id },
            data: {
              ...advertisingData,
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`🔄 ENHANCED ADVERTISING: Updated campaign: ${campaignName}`);
        } else {
          // Create new campaign
          await prisma.advertisingData.create({
            data: advertisingData
          });
          importedCount++;
          console.log(`✅ ENHANCED ADVERTISING: Created campaign: ${campaignName}`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing advertising row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Campaign Name'] || row.campaign_name || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }
    
    // Update import batch with results
    const finalStatus = (importedCount + updatedCount) > 0 ? 'completed' : 
                        errors.length > 0 ? 'partial' : 'failed';
    
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount + updatedCount,
        invalid_records: errors.length,
        imported_records: importedCount + updatedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date()
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    // 🔍 SAVE IMPORT HISTORY WITH METADATA FOR DUPLICATE DETECTION
    try {
      await createImportHistoryWithMetadata(prisma, {
        import_type: 'advertising',
        total_records: data.length,
        imported_records: importedCount + updatedCount,
        failed_records: errors.length,
        success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100),
        processing_time_ms: processingTime,
        import_status: finalStatus,
        import_summary: {
          imported: importedCount,
          updated: updatedCount,
          errors: errors.length,
          batch_id: batchId,
          success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100)
        },
        user_id: 'admin'
      }, file, data);
      
      console.log('✅ Advertising import history with metadata saved for duplicate detection');
    } catch (historyError) {
      console.warn('Failed to save advertising import history with metadata:', historyError);
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    console.log(`🎉 Enhanced Advertising Import COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    
    const isSuccess = (importedCount + updatedCount) > 0;
    
    res.status(isSuccess ? 200 : 400).json({
      success: isSuccess,
      data: {
        imported: importedCount,
        updated: updatedCount,
        errors: errors.length,
        batchId: batchId,
        validRows: importedCount + updatedCount,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname,
        fileType: file.mimetype.includes('csv') ? 'csv' : 'excel'
      },
      message: (importedCount + updatedCount) > 0 ? 
        `Successfully imported ${importedCount} new and updated ${updatedCount} advertising campaigns` : 
        errors.length > 0 ? 
          `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
          'No valid advertising data found to import'
    });
    
  } catch (error) {
    console.error('❌ Enhanced Advertising import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Advertising import failed',
      message: error.message
    });
  }
};

// Enhanced advertising settlement import
const importAdvertisingSettlementDataEnhanced = async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload an Excel or CSV file'
      });
    }
    
    const file = req.file;
    const batchId = uuidv4();
    let data = [];
    
    console.log('💰 ENHANCED ADVERTISING SETTLEMENT IMPORT - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // Parse file
    if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else if (file.mimetype.includes('csv') || file.originalname.endsWith('.csv')) {
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
      data = results;
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only Excel (.xlsx, .xls) and CSV files are supported'
      });
    }
    
    console.log(`💰 Parsed ${data.length} rows from settlement file`);
    
    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        id: batchId,
        batch_name: `Advertising Settlement Import - ${file.originalname}`,
        import_type: 'advertising_settlement',
        file_name: file.originalname,
        file_type: file.mimetype.includes('csv') ? 'csv' : 'excel',
        total_records: data.length,
        valid_records: 0,
        invalid_records: 0,
        imported_records: 0,
        status: 'processing'
      }
    });
    
    let importedCount = 0;
    let updatedCount = 0;
    let errors = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row['Order ID'] && !row.order_id) {
        continue;
      }
      
      try {
        const orderId = (row['Order ID'] || row.order_id || '').toString().trim();
        
        if (!orderId) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: orderId,
            message: 'Order ID wajib diisi'
          });
          continue;
        }
        
        // Parse settlement dates
        const parseExcelDate = (excelDate) => {
          if (!excelDate) return null;
          const date = moment(excelDate, ['YYYY-MM-DD HH:mm:ss', 'DD/MM/YYYY HH:mm:ss', 'MM/DD/YYYY HH:mm:ss'], true);
          return date.isValid() ? date.toDate() : null;
        };
        
        const settlementData = {
          order_id: orderId,
          type: (row['Type'] || row.type || 'Ad Spend').toString().trim(),
          order_created_time: parseExcelDate(row['Order Created Time'] || row.order_created_time) || new Date(),
          order_settled_time: parseExcelDate(row['Order Settled Time'] || row.order_settled_time) || new Date(),
          settlement_amount: parseFloat(row['Settlement Amount'] || row.settlement_amount || 0),
          account_name: (row['Account Name'] || row.account_name || '').toString().trim(),
          marketplace: (row['Marketplace'] || row.marketplace || 'TikTok Ads').toString().trim(),
          currency: (row['Currency'] || row.currency || 'IDR').toString().trim(),
          import_batch_id: batchId
        };
        
        // Check for existing settlement with same Order ID
        const existingSettlement = await prisma.advertisingSettlement.findFirst({
          where: { order_id: orderId }
        });
        
        if (existingSettlement) {
          // Update existing settlement
          await prisma.advertisingSettlement.update({
            where: { id: existingSettlement.id },
            data: {
              ...settlementData,
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`🔄 ENHANCED SETTLEMENT: Updated settlement: ${orderId}`);
        } else {
          // Create new settlement
          await prisma.advertisingSettlement.create({
            data: settlementData
          });
          importedCount++;
          console.log(`✅ ENHANCED SETTLEMENT: Created settlement: ${orderId}`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing settlement row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Order ID'] || row.order_id || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }
    
    // Update import batch with results
    const finalStatus = (importedCount + updatedCount) > 0 ? 'completed' : 
                        errors.length > 0 ? 'partial' : 'failed';
    
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount + updatedCount,
        invalid_records: errors.length,
        imported_records: importedCount + updatedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date()
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    // 🔍 SAVE IMPORT HISTORY WITH METADATA FOR DUPLICATE DETECTION
    try {
      await createImportHistoryWithMetadata(prisma, {
        import_type: 'advertising-settlement',
        total_records: data.length,
        imported_records: importedCount + updatedCount,
        failed_records: errors.length,
        success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100),
        processing_time_ms: processingTime,
        import_status: finalStatus,
        import_summary: {
          imported: importedCount,
          updated: updatedCount,
          errors: errors.length,
          batch_id: batchId,
          success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100)
        },
        user_id: 'admin'
      }, file, data);
      
      console.log('✅ Advertising settlement import history with metadata saved for duplicate detection');
    } catch (historyError) {
      console.warn('Failed to save settlement import history with metadata:', historyError);
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    console.log(`🎉 Enhanced Settlement Import COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    
    const isSuccess = (importedCount + updatedCount) > 0;
    
    res.status(isSuccess ? 200 : 400).json({
      success: isSuccess,
      data: {
        imported: importedCount,
        updated: updatedCount,
        errors: errors.length,
        batchId: batchId,
        validRows: importedCount + updatedCount,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname,
        fileType: file.mimetype.includes('csv') ? 'csv' : 'excel'
      },
      message: (importedCount + updatedCount) > 0 ? 
        `Successfully imported ${importedCount} new and updated ${updatedCount} advertising settlements` : 
        errors.length > 0 ? 
          `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
          'No valid settlement data found to import'
    });
    
  } catch (error) {
    console.error('❌ Enhanced Settlement import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Settlement import failed',
      message: error.message
    });
  }
};

module.exports = {
  importAdvertisingDataEnhanced,
  importAdvertisingSettlementDataEnhanced
};