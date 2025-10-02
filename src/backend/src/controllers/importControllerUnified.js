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
const { 
  getBestCustomerMatch 
} = require('./customerMatchingController');

const prisma = new PrismaClient();

const parseExcelDate = (excelDate) => {
  if (!excelDate) return null;
  
  if (excelDate instanceof Date) {
    return excelDate;
  }
  
  if (typeof excelDate === 'string') {
    // Enhanced parsing to support dd/mm/yy format for advertising data
    const date = moment(excelDate, [
      'DD/MM/YY',        // New format for advertising
      'DD/MM/YYYY',      // Existing format
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD',
      'DD/MM/YYYY HH:mm:ss', 
      'MM/DD/YYYY HH:mm:ss',
      'MM/DD/YYYY'
    ], true); // Strict parsing
    
    if (date.isValid()) {
      const parsedDate = date.toDate();
      return parsedDate;
    }
    return null;
  }
  
  if (typeof excelDate === 'number') {
    // Handle Excel serial date numbers - these are typically dates only (no time)
    const date = moment('1900-01-01').add(excelDate - 2, 'days');
    if (date.isValid()) {
      return date.toDate();
    }
  }
  
  return null;
};

// 📦 UNIFIED IMPORT CONTROLLER - All import functions consolidated here
const importProductData = async (req, res) => {
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
    
    console.log('🔧 UNIFIED PRODUCT IMPORT - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // 📁 PARSE FILE - Simple approach
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
    
    console.log(`📊 UNIFIED IMPORT: Parsed ${data.length} rows`);
    
    // 🔍 SIMPLE VALIDATION AND PROCESSING
    let importedCount = 0;
    let updatedCount = 0;
    let errors = [];
    
    // Create import batch first
    const importBatch = await prisma.importBatch.create({
      data: {
        id: batchId,
        batch_name: `Product Import - ${file.originalname}`,
        import_type: 'products',
        file_name: file.originalname,
        file_type: file.mimetype.includes('csv') ? 'csv' : 'excel',
        total_records: data.length,
        valid_records: 0,
        invalid_records: 0,
        imported_records: 0,
        status: 'processing'
      }
    });
    
    console.log('✅ UNIFIED IMPORT: Import batch created');
    
    // Process each row - Simple approach
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row['Product Code'] && !row.product_code) {
        continue;
      }
      
      try {
        // Simple validation
        const productCode = (row['Product Code'] || row.product_code).toString().trim();
        const productName = (row['Product Name'] || row.product_name || '').toString().trim();
        const category = (row['Category'] || row.category || '').toString().trim();
        const price = parseFloat(row['Price'] || row.price || 0);
        const stockQuantity = parseInt(row['Stock Quantity'] || row.stock_quantity || 0);
        
        if (!productCode || !productName) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: `${productCode} - ${productName}`,
            message: 'Product Code dan Product Name wajib diisi'
          });
          continue;
        }
        
        // Prepare product data
        const productData = {
          product_code: productCode,
          product_name: productName,
          category: category || 'Uncategorized',
          brand: (row['Brand'] || row.brand || 'D\'Busana').toString().trim(),
          size: (row['Size'] || row.size || '').toString().trim(),
          color: (row['Color'] || row.color || '').toString().trim(),
          price: price,
          cost: parseFloat(row['Cost'] || row.cost || 0),
          stock_quantity: stockQuantity,
          min_stock: parseInt(row['Min Stock'] || row.min_stock || 5),
          description: (row['Description'] || row.description || '').toString().trim(),
          import_batch_id: batchId
        };
        
        // Check if product exists
        const existingProduct = await prisma.productData.findFirst({
          where: { product_code: productCode }
        });
        
        if (existingProduct) {
          // Update existing product
          await prisma.productData.update({
            where: { product_code: productCode },
            data: {
              product_name: productData.product_name,
              category: productData.category,
              brand: productData.brand,
              size: productData.size,
              color: productData.color,
              price: productData.price,
              cost: productData.cost,
              stock_quantity: productData.stock_quantity,
              min_stock: productData.min_stock,
              description: productData.description,
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`✅ UNIFIED IMPORT: Updated product: ${productCode}`);
        } else {
          // Create new product
          await prisma.productData.create({
            data: productData
          });
          importedCount++;
          console.log(`✅ UNIFIED IMPORT: Created product: ${productCode}`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Product Code'] || row.product_code || 'unknown',
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
    
    // 🔍 SAVE IMPORT HISTORY WITH METADATA FOR DUPLICATE DETECTION
    try {
      await createImportHistoryWithMetadata(prisma, {
        import_type: 'products',
        total_records: data.length,
        imported_records: importedCount + updatedCount,
        failed_records: errors.length,
        success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100),
        processing_time_ms: Date.now() - startTime,
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
      
      console.log('✅ Product import history with metadata saved for duplicate detection');
    } catch (historyError) {
      console.warn('Failed to save import history with metadata:', historyError);
      // Don't fail the import if history logging fails
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    // ✅ LOG ACTIVITY - Real-time activity logging for products import
    try {
      const totalRecords = importedCount + updatedCount;
      if (totalRecords > 0) {
        // Log successful import activity
        const activityData = {
          type: 'import',
          title: 'Import Data Produk',
          description: `Import data produk berhasil - ${totalRecords} records (${importedCount} baru, ${updatedCount} update)`,
          status: 'success',
          metadata: {
            import_type: 'products',
            file_name: file.originalname,
            total_records: data.length,
            imported_records: importedCount,
            updated_records: updatedCount,
            error_count: errors.length,
            batch_id: batchId
          },
          user_id: 'admin',
          related_id: batchId,
          related_type: 'import_batch'
        };

        // Check if activity logs table exists before logging
        const tableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'activity_logs'
          );
        `;

        if (tableExists[0].exists) {
          await prisma.activityLogs.create({
            data: activityData
          });
          console.log('✅ Products import activity logged successfully');
        } else {
          console.log('⚠️ Activity logs table not available, skipping activity log');
        }
      } else if (errors.length > 0) {
        // Log failed import activity
        const activityData = {
          type: 'import',
          title: 'Import Data Produk',
          description: `Import data produk gagal - ${errors.length} errors dalam ${data.length} records`,
          status: 'error',
          metadata: {
            import_type: 'products',
            file_name: file.originalname,
            total_records: data.length,
            error_count: errors.length,
            batch_id: batchId
          },
          user_id: 'admin',
          related_id: batchId,
          related_type: 'import_batch'
        };

        const tableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'activity_logs'
          );
        `;

        if (tableExists[0].exists) {
          await prisma.activityLogs.create({
            data: activityData
          });
          console.log('✅ Products import failure activity logged successfully');
        }
      }
    } catch (activityError) {
      console.warn('Failed to log products import activity:', activityError);
      // Don't fail the import if activity logging fails
    }
    
    console.log(`🎉 UNIFIED IMPORT COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    
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
      message: importedCount > 0 ? 
        `Successfully imported ${importedCount} new products to database` : 
        updatedCount > 0 ?
          `Successfully updated ${updatedCount} existing products in database` :
          errors.length > 0 ? 
            `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
            'No valid data found to import'
    });
    
  } catch (error) {
    console.error('❌ UNIFIED IMPORT: Error occurred:', error);
    
    // Log critical error activity
    try {
      const activityData = {
        type: 'import',
        title: 'Import Data Produk',
        description: `Import data produk error: ${error.message}`,
        status: 'error',
        metadata: {
          import_type: 'products',
          file_name: req.file ? req.file.originalname : 'unknown',
          error_message: error.message
        },
        user_id: 'admin'
      };

      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'activity_logs'
        );
      `;

      if (tableExists[0].exists) {
        await prisma.activityLogs.create({
          data: activityData
        });
        console.log('✅ Products import error activity logged successfully');
      }
    } catch (activityError) {
      console.warn('Failed to log products import error activity:', activityError);
    }
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// Unified sales import
const importSalesData = async (req, res) => {
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
    
    console.log('📂 UNIFIED Sales import - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // Parse file based on type
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
    
    console.log(`📊 Parsed ${data.length} rows from sales file`);
    
    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        id: batchId,
        batch_name: `Sales Import - ${file.originalname}`,
        import_type: 'sales',
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
    let customerMatches = [];
    
    // Get existing customers for name matching
    console.log('🔍 Getting existing customers for name matching...');
    const existingCustomersData = await prisma.salesData.findMany({
      select: {
        customer: true
      },
      where: {
        customer: {
          not: null
        }
      },
      distinct: ['customer']
    });
    
    const existingCustomers = existingCustomersData
      .map(c => c.customer)
      .filter(name => name && name.trim() !== '');
    
    console.log(`📊 Found ${existingCustomers.length} existing customers for matching`);
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row['Seller SKU'] && !row.seller_sku && !row['Product Name'] && !row.product_name) {
        continue;
      }
      
      try {
        const sellerSku = (row['Seller SKU'] || row.seller_sku || '').toString().trim();
        const productName = (row['Product Name'] || row.product_name || '').toString().trim();
        const quantity = parseInt(row['Quantity'] || row.quantity || 1);
        const orderAmount = parseFloat(row['Order Amount'] || row.order_amount || 0);
        const createdTime = parseExcelDate(row['Created Time'] || row.created_time) || new Date();
        
        if (!sellerSku || !productName) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: `${sellerSku} - ${productName}`,
            message: 'Seller SKU dan Product Name wajib diisi'
          });
          continue;
        }
        
        // Preserve original Order ID from Excel - DO NOT CHANGE IT
        const originalOrderId = row['Order ID'] || row.order_id;
        const orderId = originalOrderId ? originalOrderId.toString().trim() : null;
        
        // Skip rows without Order ID instead of creating auto-generated ones
        if (!orderId) {
          errors.push({
            row: i + 2,
            field: 'order_id',
            value: originalOrderId,
            message: 'Order ID wajib diisi dan tidak boleh kosong'
          });
          continue;
        }
        
        console.log(`📋 Processing Order ID: "${orderId}" (from Excel: "${originalOrderId}")`);

        const salesData = {
          order_id: orderId, // Keep original Order ID exactly as provided in Excel
          seller_sku: sellerSku,
          product_name: productName,
          color: (row['Color'] || row.color || '').toString().trim(),
          size: (row['Size'] || row.size || '').toString().trim(),
          quantity: quantity,
          order_amount: orderAmount,
          created_time: createdTime,
          delivered_time: row['Delivered Time'] || row.delivered_time ? 
            parseExcelDate(row['Delivered Time'] || row.delivered_time) : null,
          settlement_amount: row['Settlement Amount'] || row['Total settlement amount'] || row.settlement_amount ? 
            parseFloat(row['Settlement Amount'] || row['Total settlement amount'] || row.settlement_amount) : null,
          total_revenue: row['Total Revenue'] || row['Total revenue'] || row.total_revenue ? 
            parseFloat(row['Total Revenue'] || row['Total revenue'] || row.total_revenue) : null,
          hpp: row['HPP'] || row.hpp ? parseFloat(row['HPP'] || row.hpp) : null,
          total: row['Total'] || row.total ? parseFloat(row['Total'] || row.total) : null,
          marketplace: (row['Marketplace'] || row.marketplace || 'TikTok Shop').toString().trim(), // Add marketplace field
          customer: (() => {
            // Process customer name with similarity matching for censored names
            const originalCustomerName = (row['Customer'] || row.customer || '').toString().trim() || '-';
            let finalCustomerName = originalCustomerName;
            
            // Only attempt matching if customer name contains *** (censored)
            if (originalCustomerName !== '-' && originalCustomerName.includes('***')) {
              console.log(`🔍 Attempting to match censored customer: "${originalCustomerName}"`);
              
              try {
                const matchResult = getBestCustomerMatch(originalCustomerName, existingCustomers, {
                  minConfidence: 75,
                  strictMode: false
                });
                
                if (matchResult.bestMatch && matchResult.confidence >= 75) {
                  finalCustomerName = matchResult.bestMatch;
                  customerMatches.push({
                    original: originalCustomerName,
                    matched: matchResult.bestMatch,
                    confidence: matchResult.confidence,
                    reason: matchResult.reason
                  });
                  
                  console.log(`✅ Customer matched: "${originalCustomerName}" → "${matchResult.bestMatch}" (${matchResult.confidence}% confidence)`);
                } else {
                  console.log(`❌ No suitable match found for: "${originalCustomerName}"`);
                  // Add to existing customers for future matching
                  existingCustomers.push(originalCustomerName);
                }
              } catch (matchError) {
                console.warn(`⚠️ Error matching customer "${originalCustomerName}":`, matchError);
                // Keep original name on error
              }
            } else if (originalCustomerName !== '-') {
              // Add non-censored names to existing customers list
              if (!existingCustomers.includes(originalCustomerName)) {
                existingCustomers.push(originalCustomerName);
              }
            }
            
            return finalCustomerName;
          })(), // Customer field with matching logic
          province: (row['Province'] || row.province || '').toString().trim(), // Add province field
          regency_city: (row['Regency & City'] || row['regency_city'] || row.regency_city || 
                        (row['Regency'] && row['City'] ? 
                          (row['Regency'] === row['City'] ? row['Regency'] : row['Regency'] + ' & ' + row['City']) : 
                          row['Regency'] || row['City'] || '')).toString().trim(), // Combined regency & city field
          import_batch_id: batchId
        };

        // Check for existing record with same unique combination (order_id, seller_sku, color, size)
        const existingRecord = await prisma.salesData.findFirst({
          where: {
            order_id: orderId,
            seller_sku: sellerSku,
            color: salesData.color,
            size: salesData.size
          }
        });

        if (existingRecord) {
          // Update existing record instead of creating duplicate
          await prisma.salesData.update({
            where: { id: existingRecord.id },
            data: {
              product_name: salesData.product_name,
              quantity: salesData.quantity,
              order_amount: salesData.order_amount,
              created_time: salesData.created_time,
              delivered_time: salesData.delivered_time,
              settlement_amount: salesData.settlement_amount,
              total_revenue: salesData.total_revenue,
              hpp: salesData.hpp,
              total: salesData.total,
              marketplace: salesData.marketplace, // Add marketplace field to update
              customer: salesData.customer, // Add customer field to update
              province: salesData.province, // Add province field to update
              regency_city: salesData.regency_city, // Add combined regency & city field to update
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`🔄 UNIFIED SALES: Updated existing record for Order ID: ${orderId}`);
        } else {
          // Create new record
          await prisma.salesData.create({
            data: salesData
          });
          importedCount++;
          console.log(`✅ UNIFIED SALES: Created new record for Order ID: ${orderId}`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing sales row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Seller SKU'] || row.seller_sku || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }
    
    // Update import batch with results
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount,
        invalid_records: errors.length,
        imported_records: importedCount,
        status: importedCount > 0 ? 'completed' : errors.length > 0 ? 'partial' : 'failed',
        error_details: errors.length > 0 ? { errors } : null
      }
    });
    
    // 🔍 SAVE IMPORT HISTORY WITH METADATA FOR DUPLICATE DETECTION
    try {
      await createImportHistoryWithMetadata(prisma, {
        import_type: 'sales',
        total_records: data.length,
        imported_records: importedCount + updatedCount,
        failed_records: errors.length,
        success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100),
        processing_time_ms: Date.now() - startTime,
        import_status: importedCount > 0 ? 'completed' : errors.length > 0 ? 'partial' : 'failed',
        import_summary: {
          imported: importedCount,
          updated: updatedCount,
          errors: errors.length,
          batch_id: batchId,
          success_rate: Math.round(((importedCount + updatedCount) / data.length) * 100)
        },
        user_id: 'admin'
      }, file, data);
      
      console.log('✅ Sales import history with metadata saved for duplicate detection');
    } catch (historyError) {
      console.warn('Failed to save sales import history with metadata:', historyError);
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    // ✅ LOG ACTIVITY - Real-time activity logging for sales import
    try {
      const totalRecords = importedCount + updatedCount;
      if (totalRecords > 0) {
        // Log successful import activity
        const activityData = {
          type: 'import',
          title: 'Import Data Penjualan',
          description: `Import data penjualan berhasil - ${totalRecords} records (${importedCount} baru, ${updatedCount} update)`,
          status: 'success',
          metadata: {
            import_type: 'sales',
            file_name: file.originalname,
            total_records: data.length,
            imported_records: importedCount,
            updated_records: updatedCount,
            error_count: errors.length,
            batch_id: batchId
          },
          user_id: 'admin', // TODO: Get from auth context
          related_id: batchId,
          related_type: 'import_batch'
        };

        // Check if activity logs table exists before logging
        const tableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'activity_logs'
          );
        `;

        if (tableExists[0].exists) {
          await prisma.activityLogs.create({
            data: activityData
          });
          console.log('✅ Sales import activity logged successfully');
        } else {
          console.log('⚠️ Activity logs table not available, skipping activity log');
        }
      }
    } catch (activityError) {
      console.warn('Failed to log sales import activity:', activityError);
      // Don't fail the import if activity logging fails
    }

    console.log(`🎉 Sales import COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    
    // Log customer matching statistics
    if (customerMatches.length > 0) {
      console.log(`👥 Customer matching summary: ${customerMatches.length} customers matched`);
      customerMatches.forEach(match => {
        console.log(`   📋 "${match.original}" → "${match.matched}" (${match.confidence}%)`);
      });
    }
    
    const isSuccess = (importedCount + updatedCount) > 0;
    
    res.status(isSuccess ? 200 : 400).json({
      success: isSuccess,
      data: {
        imported: importedCount,
        updated: updatedCount,
        skipped: 0,
        errors: errors.length,
        batchId: batchId,
        validRows: importedCount + updatedCount,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname,
        fileType: file.mimetype.includes('csv') ? 'csv' : 'excel'
      },
      message: (importedCount + updatedCount) > 0 ? 
        `Successfully imported ${importedCount} new and updated ${updatedCount} sales records to database` : 
        errors.length > 0 ? 
          `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
          'No valid data found to import'
    });
    
  } catch (error) {
    console.error('❌ Sales import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// Unified stock import
const importStockData = async (req, res) => {
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
    
    console.log('📦 UNIFIED Stock import - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // Parse file based on type
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
    
    console.log(`📦 Parsed ${data.length} rows from stock file`);
    
    // Debug: Log column names from first row to identify correct field names
    if (data.length > 0) {
      console.log('📋 Excel columns detected:', Object.keys(data[0]));
      console.log('📝 First row sample:', data[0]);
    }
    
    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        id: batchId,
        batch_name: `Stock Import - ${file.originalname}`,
        import_type: 'stock',
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
    let errors = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row['Product Code'] && !row.product_code) {
        continue;
      }
      
      try {
        const productCode = (row['Product Code'] || row.product_code || '').toString().trim();
        
        // Enhanced quantity parsing - support multiple column name variations
        const quantityRaw = row['Stock Quantity'] || 
                           row['stock_quantity'] || 
                           row['Quantity'] || 
                           row['quantity'] || 
                           row['Qty'] || 
                           row['qty'] || 
                           row['Stock'] || 
                           row['stock'] || 
                           row['Stok'] || 
                           row['stok'] || 
                           row['STOCK_QUANTITY'] ||
                           row['QUANTITY'] ||
                           row['QTY'] ||
                           row['STOCK'] ||
                           row['STOK'] ||
                           0;
        
        // Robust quantity parsing - handle different data types
        let stockQuantity = 0;
        if (quantityRaw !== null && quantityRaw !== undefined && quantityRaw !== '') {
          if (typeof quantityRaw === 'number') {
            stockQuantity = Math.floor(quantityRaw); // Handle decimal numbers
          } else if (typeof quantityRaw === 'string') {
            // Remove any non-numeric characters except decimal point
            const cleanedQuantity = quantityRaw.toString().replace(/[^\d.-]/g, '');
            stockQuantity = parseInt(cleanedQuantity) || 0;
          }
        }
        
        // Debug logging for quantity parsing
        console.log(`📊 Row ${i + 2}: Product: ${productCode}, Raw Quantity: "${quantityRaw}", Parsed: ${stockQuantity}`);
        
        if (!productCode) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: productCode,
            message: 'Product Code wajib diisi'
          });
          continue;
        }
        
        // Parse movement date with proper current timestamp fallback
        let movementDate = parseExcelDate(row['Movement Date'] || row.movement_date);
        if (!movementDate) {
          // Use current timestamp with proper timezone handling
          movementDate = new Date();
        }
        
        // Ensure we have valid date with both date and time components
        if (!(movementDate instanceof Date) || isNaN(movementDate.getTime())) {
          movementDate = new Date();
        }
        
        // If date has 00:00:00 time (midnight), set to current time to show actual import time
        if (movementDate.getHours() === 0 && movementDate.getMinutes() === 0 && movementDate.getSeconds() === 0 && movementDate.getMilliseconds() === 0) {
          const now = new Date();
          movementDate.setHours(now.getHours());
          movementDate.setMinutes(now.getMinutes());
          movementDate.setSeconds(now.getSeconds());
          movementDate.setMilliseconds(now.getMilliseconds());
        }
        
        console.log(`📅 Movement timestamp: ${movementDate.toISOString()} (${movementDate.toLocaleString('id-ID')})`);
        
        // Map to correct schema according to prisma/schema.prisma
        const stockData = {
          product_code: productCode,
          movement_type: (row['Movement Type'] || row.movement_type || 'in'), // Required field based on schema
          quantity: stockQuantity, // This is the movement quantity, not stock_quantity
          reference_number: (row['Reference Number'] || row.reference_number || '').toString().trim(),
          notes: (row['Notes'] || row.notes || '').toString().trim(),
          movement_date: movementDate,
          import_batch_id: batchId
        };
        
        // Create stock movement record
        await prisma.stockData.create({
          data: stockData
        });
        
        // **FIX**: Also update actual stock quantity in product table
        try {
          // Find the product to update its stock
          const existingProduct = await prisma.productData.findFirst({
            where: { product_code: productCode }
          });
          
          if (existingProduct) {
            // Calculate new stock based on movement type
            let newStockQuantity = existingProduct.stock_quantity || 0;
            
            if (stockData.movement_type === 'in') {
              newStockQuantity += stockQuantity;
            } else if (stockData.movement_type === 'out') {
              newStockQuantity = Math.max(0, newStockQuantity - stockQuantity); // Prevent negative stock
            } else if (stockData.movement_type === 'adjustment') {
              newStockQuantity = stockQuantity; // Direct set for adjustments
            }
            
            // Update product stock quantity
            await prisma.productData.update({
              where: { product_code: productCode },
              data: { 
                stock_quantity: newStockQuantity,
                updated_at: new Date()
              }
            });
            
            console.log(`✅ UNIFIED STOCK: Updated product stock: ${productCode} -> ${newStockQuantity} (${stockData.movement_type}: ${stockQuantity})`);
          } else {
            console.warn(`⚠️ Product not found for stock update: ${productCode}`);
          }
        } catch (stockUpdateError) {
          console.warn(`⚠️ Failed to update product stock for ${productCode}:`, stockUpdateError.message);
          // Don't fail the import if stock update fails
        }
        
        importedCount++;
        console.log(`✅ UNIFIED STOCK: Created stock movement record: ${productCode}`);
        
      } catch (rowError) {
        console.error(`❌ Error processing stock row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Product Code'] || row.product_code || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }
    
    // Update import batch with results
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount,
        invalid_records: errors.length,
        imported_records: importedCount,
        status: importedCount > 0 ? 'completed' : errors.length > 0 ? 'partial' : 'failed',
        error_details: errors.length > 0 ? { errors } : null
      }
    });
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    console.log(`🎉 Stock import COMPLETED: ${importedCount} imported, ${errors.length} errors`);
    
    const isSuccess = importedCount > 0;
    
    res.status(isSuccess ? 200 : 400).json({
      success: isSuccess,
      data: {
        imported: importedCount,
        updated: 0,
        errors: errors.length,
        batchId: batchId,
        validRows: importedCount,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname,
        fileType: file.mimetype.includes('csv') ? 'csv' : 'excel'
      },
      message: importedCount > 0 ? 
        `Successfully imported ${importedCount} stock records to database` : 
        errors.length > 0 ? 
          `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
          'No valid data found to import'
    });
    
  } catch (error) {
    console.error('❌ Stock import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// 📣 UNIFIED ADVERTISING IMPORT - NEW
const importAdvertisingData = async (req, res) => {
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
    
    console.log('📣 UNIFIED Advertising import - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // Parse file based on type
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
    
    console.log(`📣 Parsed ${data.length} rows from advertising file`);
    
    // Debug: Log column names from first row to identify correct field names
    if (data.length > 0) {
      console.log('📋 Excel columns detected:', Object.keys(data[0]));
      console.log('📝 First row sample:', data[0]);
    }
    
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
      
      // Skip empty rows - check all possible column name variations
      const campaignNameCheck = row['campaign_name'] || row['Campaign Name'] || row['CAMPAIGN_NAME'] || 
                                row['Campaign_Name'] || row['campaignName'] || row['nama_campaign'] || 
                                row['Nama Campaign'] || '';
      
      if (!campaignNameCheck || campaignNameCheck.toString().trim() === '') {
        console.log(`📋 Skipping row ${i + 2}: No campaign name found. Available keys:`, Object.keys(row));
        continue;
      }
      
      try {
        // Parse data with flexible column name matching
        const campaignName = (row['campaign_name'] || row['Campaign Name'] || row['CAMPAIGN_NAME'] || 
                              row['Campaign_Name'] || row['campaignName'] || row['nama_campaign'] || 
                              row['Nama Campaign'] || '').toString().trim();
        
        const campaignType = (row['campaign_type'] || row['Campaign Type'] || row['CAMPAIGN_TYPE'] || 
                             row['CampaignType'] || row['jenis_campaign'] || '').toString().trim();
        
        let accountName = (row['account_name'] || row['Account Name'] || row['ACCOUNT_NAME'] || 
                            row['AccountName'] || row['nama_akun'] || '').toString().trim();
        
        // AUTO-FILL: Replace "-" with "D'Busana" for account_name
        if (accountName === '-' || accountName === '' || !accountName) {
          accountName = "D'Busana";
          console.log(`🏢 Row ${i + 2}: Auto-filled account_name from "${row['account_name'] || row['Account Name'] || 'empty'}" to "D'Busana"`);
        }
        
        const adCreativeType = (row['ad_creative_type'] || row['Ad Creative Type'] || row['AD_CREATIVE_TYPE'] || 
                               row['AdCreativeType'] || row['jenis_creative'] || '').toString().trim();
        
        const adCreative = (row['ad_creative'] || row['Ad Creative'] || row['AD_CREATIVE'] || 
                           row['AdCreative'] || row['creative'] || '').toString().trim();
        
        const cost = parseFloat(row['Cost'] || row['cost'] || row['COST'] || row['biaya'] || row['Biaya'] || 0);
        const conversions = parseInt(row['Conversions'] || row['conversions'] || row['CONVERSIONS'] || row['konversi'] || 0);
        const cpa = parseFloat(row['cpa'] || row['CPA'] || row['Cpa'] || 0);
        const revenue = parseFloat(row['Revenue'] || row['revenue'] || row['REVENUE'] || row['pendapatan'] || 0);
        const roi = parseFloat(row['ROI'] || row['roi'] || row['Roi'] || 0);
        const impressions = parseInt(row['Impressions'] || row['impressions'] || row['IMPRESSIONS'] || row['tayangan'] || 0);
        const clicks = parseInt(row['Clicks'] || row['clicks'] || row['CLICKS'] || row['klik'] || 0);
        const ctr = parseFloat(row['ctr'] || row['CTR'] || row['Ctr'] || 0);
        const conversionRate = parseFloat(row['conversion_rate'] || row['Conversion Rate'] || row['CONVERSION_RATE'] || row['tingkat_konversi'] || 0);
        const marketplace = (row['Marketplace'] || row['marketplace'] || row['MARKETPLACE'] || row['platform'] || '').toString().trim();
        
        // ✅ NEW: Product Name for True Business ROI calculation
        const namaProduk = (row['Nama Produk'] || row['nama_produk'] || row['NAMA_PRODUK'] || 
                           row['product_name'] || row['Product Name'] || row['PRODUCT_NAME'] || 
                           row['ProductName'] || row['produk'] || row['Produk'] || '').toString().trim();
        
        console.log(`📊 Row ${i + 2}: Campaign: "${campaignName}", Cost: ${cost}, Revenue: ${revenue}`);
        
        // Enhanced date parsing with support for dd/mm/yy format
        const enhancedParseDate = (dateValue) => {
          if (!dateValue) return null;
          
          // Handle dd/mm/yy format specifically
          if (typeof dateValue === 'string') {
            const ddmmyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
            const match = dateValue.match(ddmmyyRegex);
            
            if (match) {
              const [, day, month, year] = match;
              // Convert 2-digit year to 4-digit (assume 20xx for years 00-99)
              const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
              // Create date in YYYY-MM-DD format for parsing
              const isoDateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              return new Date(isoDateString);
            }
          }
          
          // Fallback to existing parseExcelDate function
          return parseExcelDate(dateValue);
        };
        
        const dateStart = enhancedParseDate(row['Date Range Start'] || row['date_range_start'] || row['DATE_RANGE_START'] || 
                                           row['date_start'] || row['Date Start'] || row['DATE_START'] || 
                                           row['DateStart'] || row['tanggal_mulai']);
        const dateEnd = enhancedParseDate(row['Date Range End'] || row['date_range_end'] || row['DATE_RANGE_END'] || 
                                         row['date_end'] || row['Date End'] || row['DATE_END'] || 
                                         row['DateEnd'] || row['tanggal_selesai']);
        
        // Debug logging for date parsing
        console.log(`📅 Row ${i + 2}: Date Start: "${row['date_start'] || row['Date Start']}" -> ${dateStart}`);
        console.log(`📅 Row ${i + 2}: Date End: "${row['date_end'] || row['Date End']}" -> ${dateEnd}`);
        
        if (!campaignName || !dateStart || !dateEnd) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: `${campaignName} - ${dateStart} - ${dateEnd}`,
            message: 'Campaign Name, Date Start dan Date End wajib diisi'
          });
          continue;
        }
        
        const advertisingData = {
          campaign_name: campaignName,
          // Remove campaign_type as it's deprecated in schema - use ad_creative_type instead
          account_name: accountName,
          ad_creative_type: adCreativeType || campaignType || null, // Use ad_creative_type or fallback to campaignType
          ad_creative: adCreative,
          cost: cost,
          conversions: conversions,
          cpa: cpa > 0 ? cpa : (conversions > 0 ? cost / conversions : null), // Calculate CPA if not provided
          revenue: revenue,
          roi: roi > 0 ? roi : (revenue > 0 && cost > 0 ? ((revenue - cost) / cost) * 100 : null), // Calculate ROI only if both revenue and cost exist
          impressions: impressions,
          clicks: clicks,
          ctr: ctr > 0 ? ctr : (impressions > 0 ? (clicks / impressions) * 100 : null), // Calculate CTR if not provided
          conversion_rate: conversionRate > 0 ? conversionRate : (clicks > 0 ? (conversions / clicks) * 100 : null), // Calculate conversion rate if not provided
          date_start: dateStart,
          date_end: dateEnd,
          marketplace: marketplace,
          nama_produk: namaProduk || null, // New field for True Business ROI
          import_batch_id: batchId
        };
        
        // Check for existing campaign with same name, account, and date range for deduplication
        const existingCampaign = await prisma.advertisingData.findFirst({
          where: {
            campaign_name: campaignName,
            account_name: accountName,
            date_start: dateStart,
            date_end: dateEnd
          }
        });
        
        if (existingCampaign) {
          // Update existing campaign with aggregated data (accumulate metrics)
          await prisma.advertisingData.update({
            where: { id: existingCampaign.id },
            data: {
              ad_creative_type: advertisingData.ad_creative_type,
              ad_creative: advertisingData.ad_creative,
              // Accumulate numeric metrics for campaign consolidation
              cost: existingCampaign.cost + advertisingData.cost,
              conversions: existingCampaign.conversions + advertisingData.conversions,
              revenue: existingCampaign.revenue + advertisingData.revenue,
              impressions: existingCampaign.impressions + advertisingData.impressions,
              clicks: existingCampaign.clicks + advertisingData.clicks,
              // Recalculate derived metrics based on accumulated data
              cpa: (existingCampaign.conversions + advertisingData.conversions) > 0 ? 
                (existingCampaign.cost + advertisingData.cost) / (existingCampaign.conversions + advertisingData.conversions) : null,
              roi: (existingCampaign.cost + advertisingData.cost) > 0 ? 
                (((existingCampaign.revenue + advertisingData.revenue) - (existingCampaign.cost + advertisingData.cost)) / (existingCampaign.cost + advertisingData.cost)) * 100 : null,
              ctr: (existingCampaign.impressions + advertisingData.impressions) > 0 ? 
                ((existingCampaign.clicks + advertisingData.clicks) / (existingCampaign.impressions + advertisingData.impressions)) * 100 : null,
              conversion_rate: (existingCampaign.clicks + advertisingData.clicks) > 0 ? 
                ((existingCampaign.conversions + advertisingData.conversions) / (existingCampaign.clicks + advertisingData.clicks)) * 100 : null,
              marketplace: advertisingData.marketplace,
              nama_produk: advertisingData.nama_produk, // Update product name for True Business ROI
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`🔄 UNIFIED ADVERTISING: Updated and aggregated existing campaign: ${campaignName} (${accountName})`);
        } else {
          // Create new campaign
          await prisma.advertisingData.create({
            data: advertisingData
          });
          importedCount++;
          console.log(`✅ UNIFIED ADVERTISING: Created new campaign: ${campaignName} (${accountName})`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing advertising row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: campaignName || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }
    
    // Update import batch with results
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount + updatedCount,
        invalid_records: errors.length,
        imported_records: importedCount + updatedCount,
        status: (importedCount + updatedCount) > 0 ? 'completed' : errors.length > 0 ? 'partial' : 'failed',
        error_details: errors.length > 0 ? { errors } : null
      }
    });
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    console.log(`🎉 Advertising import COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    
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
        `Successfully imported ${importedCount} new and updated ${updatedCount} advertising campaigns to database` : 
        errors.length > 0 ? 
          `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
          'No valid data found to import'
    });
    
  } catch (error) {
    console.error('❌ Advertising import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// ✅ Additional utility functions consolidated
const getImportStatus = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: `Import batch with ID ${batchId} not found`
      });
    }
    
    res.json({
      success: true,
      data: batch
    });
    
  } catch (error) {
    console.error('❌ Get import status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import status',
      message: error.message
    });
  }
};

const getImportHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = type ? { import_type: type } : {};
    
    const [batches, total] = await Promise.all([
      prisma.importBatch.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.importBatch.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        batches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Get import history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import history',
      message: error.message
    });
  }
};

// Download template function with auto-generation
const downloadTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`📥 Template download requested for: ${type}`);
    
    // Generate fresh templates if they don't exist
    const { generateAllTemplates } = require('../templates/generate_templates');
    
    const templateMappings = {
      'sales': 'sales_template.xlsx',
      'products': 'products_template_fixed.xlsx',
      'stock': 'stock_template_fixed.xlsx',
      'advertising': 'advertising_template.xlsx',
      'advertising-settlement': 'advertising_settlement_template.xlsx',
      'returns-cancellations': 'returns-cancellations-template.xlsx',
      'marketplace-reimbursements': 'marketplace-reimbursements-template.xlsx',
      'commission-adjustments': 'commission-adjustments-template.xlsx',
      'affiliate-samples': 'affiliate-samples-template.xlsx'
    };
    
    const templateFileName = templateMappings[type];
    
    if (!templateFileName) {
      return res.status(404).json({
        success: false,
        error: 'Invalid template type',
        message: `Template type '${type}' is not supported. Available: sales, products, stock, advertising, advertising-settlement`
      });
    }
    
    const templatePath = path.join(__dirname, '../templates', templateFileName);
    
    // Generate templates if they don't exist
    if (!fs.existsSync(templatePath)) {
      console.log(`🏭 Template not found, generating: ${templatePath}`);
      const result = await generateAllTemplates();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Template generation failed',
          message: result.error
        });
      }
    }
    
    // Check again after generation
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: `Template for ${type} not found even after generation`
      });
    }
    
    console.log(`✅ Sending template: ${templatePath}`);
    
    // Set proper headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_template.xlsx"`);
    
    res.download(templatePath, `${type}_template.xlsx`, (err) => {
      if (err) {
        console.error('❌ Template download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Template download failed',
            message: err.message
          });
        }
      } else {
        console.log(`✅ Template ${type} downloaded successfully`);
      }
    });
    
  } catch (error) {
    console.error('❌ Template download error:', error);
    res.status(500).json({
      success: false,
      error: 'Template download failed',
      message: error.message
    });
  }
};

// 🏦 ADVERTISING SETTLEMENT IMPORT - Biaya pengeluaran iklan dengan pajak
const importAdvertisingSettlementData = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a file for advertising settlement import'
      });
    }
    
    const batchId = uuidv4();
    let data = [];
    
    console.log('🏦 ADVERTISING SETTLEMENT import - Processing file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      batchId
    });
    
    // Parse file based on type
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
    
    console.log(`🏦 Parsed ${data.length} rows from advertising settlement file`);
    
    // Debug: Log column names from first row
    if (data.length > 0) {
      console.log('📋 Excel columns detected:', Object.keys(data[0]));
      console.log('📝 First row sample:', data[0]);
    }
    
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
      
      // Skip empty rows - check all possible column name variations
      const orderIdCheck = row['order_id'] || row['Order ID'] || row['ORDER_ID'] || 
                           row['OrderId'] || row['orderId'] || row['Order Id'] || '';
      
      if (!orderIdCheck || orderIdCheck.toString().trim() === '') {
        console.log(`📋 Skipping row ${i + 2}: No order ID found. Available keys:`, Object.keys(row));
        continue;
      }
      
      try {
        // Parse data with flexible column name matching
        const orderId = (row['order_id'] || row['Order ID'] || row['ORDER_ID'] || 
                        row['OrderId'] || row['orderId'] || row['Order Id'] || '').toString().trim();
        
        const type = (row['type'] || row['Type'] || row['TYPE'] || 
                     row['Settlement Type'] || row['settlement_type'] || '').toString().trim();
        
        let accountName = (row['account_name'] || row['Account Name'] || row['ACCOUNT_NAME'] || 
                          row['AccountName'] || row['nama_akun'] || '').toString().trim();
        
        // AUTO-FILL: Replace "-" with "D'Busana" for account_name
        if (accountName === '-' || accountName === '' || !accountName) {
          accountName = "D'Busana";
          console.log(`🏢 Row ${i + 2}: Auto-filled account_name from "${row['account_name'] || row['Account Name'] || 'empty'}" to "D'Busana"`);
        }
        
        const settlementAmount = parseFloat(row['settlement_amount'] || row['Settlement Amount'] || row['SETTLEMENT_AMOUNT'] || 
                                          row['total_settlement_amount'] || row['Total Settlement Amount'] || row['Amount'] || 0);
        
        const marketplace = (row['marketplace'] || row['Marketplace'] || row['MARKETPLACE'] || 
                           row['platform'] || row['Platform'] || '').toString().trim();
        
        const currency = (row['currency'] || row['Currency'] || row['CURRENCY'] || 'IDR').toString().trim();
        
        console.log(`💰 Row ${i + 2}: Order: "${orderId}", Account: "${accountName}", Amount: ${settlementAmount}`);
        
        // Enhanced date parsing
        const enhancedParseDate = (dateValue) => {
          if (!dateValue) return null;
          
          // Handle dd/mm/yy format specifically
          if (typeof dateValue === 'string') {
            const ddmmyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
            const match = dateValue.match(ddmmyyRegex);
            
            if (match) {
              const [, day, month, year] = match;
              const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
              const isoDateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              return new Date(isoDateString);
            }
          }
          
          // Fallback to existing parseExcelDate function
          return parseExcelDate(dateValue);
        };
        
        const orderCreatedTime = enhancedParseDate(row['order_created_time'] || row['Order Created Time'] || row['ORDER_CREATED_TIME'] || 
                                                 row['created_time'] || row['Created Time'] || row['Order Date'] || row['order_date']);
        const orderSettledTime = enhancedParseDate(row['order_settled_time'] || row['Order Settled Time'] || row['ORDER_SETTLED_TIME'] || 
                                                 row['settled_time'] || row['Settled Time'] || row['Settlement Date'] || row['settlement_date']);
        
        // Debug logging for date parsing
        console.log(`📅 Row ${i + 2}: Order Created: "${row['order_created_time'] || row['Order Created Time']}" -> ${orderCreatedTime}`);
        console.log(`📅 Row ${i + 2}: Order Settled: "${row['order_settled_time'] || row['Order Settled Time']}" -> ${orderSettledTime}`);
        
        if (!orderId || !orderCreatedTime || !orderSettledTime) {
          errors.push({
            row: i + 2,
            field: 'required',
            value: `${orderId} - ${orderCreatedTime} - ${orderSettledTime}`,
            message: 'Order ID, Order Created Time dan Order Settled Time wajib diisi'
          });
          continue;
        }
        
        const settlementData = {
          order_id: orderId,
          type: type,
          order_created_time: orderCreatedTime,
          order_settled_time: orderSettledTime,
          settlement_amount: settlementAmount,
          account_name: accountName,
          marketplace: marketplace,
          currency: currency,
          import_batch_id: batchId
        };
        
        // Check for existing settlement with same order_id for deduplication
        const existingSettlement = await prisma.advertisingSettlement.findUnique({
          where: {
            order_id: orderId
          }
        });
        
        if (existingSettlement) {
          // Update existing settlement
          await prisma.advertisingSettlement.update({
            where: { id: existingSettlement.id },
            data: {
              type: settlementData.type,
              order_settled_time: settlementData.order_settled_time,
              settlement_amount: settlementData.settlement_amount,
              account_name: settlementData.account_name,
              marketplace: settlementData.marketplace,
              currency: settlementData.currency,
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`🔄 ADVERTISING SETTLEMENT: Updated existing order: ${orderId} (${accountName})`);
        } else {
          // Create new settlement
          await prisma.advertisingSettlement.create({
            data: settlementData
          });
          importedCount++;
          console.log(`✅ ADVERTISING SETTLEMENT: Created new order: ${orderId} (${accountName})`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing settlement row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: orderId || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }
    
    // Update import batch with results
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount + updatedCount,
        invalid_records: errors.length,
        imported_records: importedCount + updatedCount,
        status: (importedCount + updatedCount) > 0 ? 'completed' : errors.length > 0 ? 'partial' : 'failed',
        error_details: errors.length > 0 ? { errors } : null
      }
    });
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    console.log(`🎉 Advertising Settlement import COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    
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
        `Successfully imported ${importedCount} new and updated ${updatedCount} advertising settlement records to database` : 
        errors.length > 0 ? 
          `Import gagal: ${errors.length} error ditemukan dalam ${data.length} baris` :
          'No valid data found to import'
    });
    
  } catch (error) {
    console.error('❌ Advertising settlement import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};





// ⭐ NEW: Import Returns and Cancellations Data
const importReturnsAndCancellationsData = async (req, res) => {
  try {
    console.log('🔄 Starting Returns & Cancellations import...');
    const startTime = Date.now();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a CSV or Excel file'
      });
    }

    const file = req.file;
    let data = [];

    // Parse file
    if (file.mimetype.includes('csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    if (!data.length) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Empty file',
        message: 'The uploaded file contains no data'
      });
    }

    console.log(`📊 Processing ${data.length} returns/cancellations records...`);

    // Create import batch
    const batchId = uuidv4();
    await prisma.importBatch.create({
      data: {
        id: batchId,
        import_type: 'returns_and_cancellations',
        file_name: file.originalname,
        total_records: data.length,
        status: 'processing'
      }
    });

    let importedCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Extract and validate data
        const returnsData = {
          type: row.type || 'return',
          product_name: row.product_name,
          marketplace: row.marketplace,
          returned_amount: parseFloat(row.returned_amount) || 0,
          refund_amount: parseFloat(row.refund_amount) || 0,
          restocking_fee: parseFloat(row.restocking_fee) || 0,
          shipping_cost_loss: parseFloat(row.shipping_cost_loss) || 0,
          quantity_returned: parseInt(row.quantity_returned) || 1,
          original_price: parseFloat(row.original_price) || 0,
          return_date: parseExcelDate(row.return_date) || new Date(),
          reason: row.reason || '',
          product_condition: row.product_condition || 'used',
          resellable: row.resellable === 'true' || row.resellable === true,
          original_order_id: row.original_order_id || null
        };

        // Validate required fields
        if (!returnsData.product_name || !returnsData.marketplace) {
          errors.push({
            row: i + 2,
            field: 'product_name/marketplace',
            value: returnsData.product_name || returnsData.marketplace,
            message: 'Product name and marketplace are required'
          });
          continue;
        }

        // Insert into database
        await prisma.returnsAndCancellations.create({
          data: returnsData
        });
        
        importedCount++;
        
      } catch (rowError) {
        console.error(`❌ Error processing returns row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row.product_name || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }

    // Update batch status
    const finalStatus = importedCount > 0 ? 'completed' : 'failed';
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount,
        invalid_records: errors.length,
        imported_records: importedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date()
      }
    });

    // Clean up file
    fs.unlinkSync(file.path);

    console.log(`🎉 Returns & Cancellations import completed: ${importedCount} imported, ${errors.length} errors`);

    res.json({
      success: importedCount > 0,
      data: {
        imported: importedCount,
        errors: errors.length,
        batchId: batchId,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname
      },
      message: importedCount > 0 ? 
        `Successfully imported ${importedCount} returns/cancellations records` : 
        'Import failed: No valid records found'
    });

  } catch (error) {
    console.error('❌ Returns & Cancellations import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// ⭐ NEW: Import Marketplace Reimbursements Data
const importMarketplaceReimbursementsData = async (req, res) => {
  try {
    console.log('💰 Starting Marketplace Reimbursements import...');
    const startTime = Date.now();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a CSV or Excel file'
      });
    }

    const file = req.file;
    let data = [];

    // Parse file
    if (file.mimetype.includes('csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    if (!data.length) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Empty file',
        message: 'The uploaded file contains no data'
      });
    }

    console.log(`📊 Processing ${data.length} reimbursement records...`);

    // Create import batch
    const batchId = uuidv4();
    await prisma.importBatch.create({
      data: {
        id: batchId,
        import_type: 'marketplace_reimbursements',
        file_name: file.originalname,
        total_records: data.length,
        status: 'processing'
      }
    });

    let importedCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Extract and validate data
        const reimbursementData = {
          claim_id: row.claim_id || null,
          reimbursement_type: row.reimbursement_type || 'lost_package',
          claim_amount: parseFloat(row.claim_amount) || 0,
          approved_amount: parseFloat(row.approved_amount) || 0,
          received_amount: parseFloat(row.received_amount) || 0,
          processing_fee: parseFloat(row.processing_fee) || 0,
          incident_date: parseExcelDate(row.incident_date) || new Date(),
          claim_date: parseExcelDate(row.claim_date) || new Date(),
          approval_date: row.approval_date ? parseExcelDate(row.approval_date) : null,
          received_date: row.received_date ? parseExcelDate(row.received_date) : null,
          affected_order_id: row.affected_order_id || null,
          product_name: row.product_name || null,
          marketplace: row.marketplace,
          status: row.status || 'pending',
          notes: row.notes || null,
          evidence_provided: row.evidence_provided || null
        };

        // Validate required fields
        if (!reimbursementData.marketplace || !reimbursementData.reimbursement_type) {
          errors.push({
            row: i + 2,
            field: 'marketplace/reimbursement_type',
            value: reimbursementData.marketplace || reimbursementData.reimbursement_type,
            message: 'Marketplace and reimbursement type are required'
          });
          continue;
        }

        // Insert into database
        await prisma.marketplaceReimbursement.create({
          data: reimbursementData
        });
        
        importedCount++;
        
      } catch (rowError) {
        console.error(`❌ Error processing reimbursement row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row.claim_id || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }

    // Update batch status
    const finalStatus = importedCount > 0 ? 'completed' : 'failed';
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount,
        invalid_records: errors.length,
        imported_records: importedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date()
      }
    });

    // Clean up file
    fs.unlinkSync(file.path);

    console.log(`🎉 Marketplace Reimbursement import completed: ${importedCount} imported, ${errors.length} errors`);

    res.json({
      success: importedCount > 0,
      data: {
        imported: importedCount,
        errors: errors.length,
        batchId: batchId,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname
      },
      message: importedCount > 0 ? 
        `Successfully imported ${importedCount} reimbursement records` : 
        'Import failed: No valid records found'
    });

  } catch (error) {
    console.error('❌ Marketplace Reimbursement import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// ⭐ NEW: Import Commission Adjustments Data
const importCommissionAdjustmentsData = async (req, res) => {
  try {
    console.log('📉 Starting Commission Adjustments import...');
    const startTime = Date.now();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a CSV or Excel file'
      });
    }

    const file = req.file;
    let data = [];

    // Parse file
    if (file.mimetype.includes('csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    if (!data.length) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Empty file',
        message: 'The uploaded file contains no data'
      });
    }

    console.log(`📊 Processing ${data.length} commission adjustment records...`);

    // Create import batch
    const batchId = uuidv4();
    await prisma.importBatch.create({
      data: {
        id: batchId,
        import_type: 'commission_adjustments',
        file_name: file.originalname,
        total_records: data.length,
        status: 'processing'
      }
    });

    let importedCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Extract and validate data
        const adjustmentData = {
          original_order_id: row.original_order_id || null,
          original_sales_id: row.original_sales_id || null,
          adjustment_type: row.adjustment_type || 'return_commission_loss',
          reason: row.reason || null,
          original_commission: parseFloat(row.original_commission) || 0,
          adjustment_amount: parseFloat(row.adjustment_amount) || 0,
          final_commission: row.final_commission ? parseFloat(row.final_commission) : 
                           (parseFloat(row.original_commission) || 0) + (parseFloat(row.adjustment_amount) || 0),
          marketplace: row.marketplace,
          commission_rate: row.commission_rate ? parseFloat(row.commission_rate) : null,
          dynamic_rate_applied: row.dynamic_rate_applied === 'true' || row.dynamic_rate_applied === true,
          transaction_date: parseExcelDate(row.transaction_date) || new Date(),
          adjustment_date: parseExcelDate(row.adjustment_date) || new Date(),
          product_name: row.product_name || null,
          quantity: parseInt(row.quantity) || 1,
          product_price: parseFloat(row.product_price) || 0
        };

        // Validate required fields
        if (!adjustmentData.marketplace || !adjustmentData.adjustment_type) {
          errors.push({
            row: i + 2,
            field: 'marketplace/adjustment_type',
            value: adjustmentData.marketplace || adjustmentData.adjustment_type,
            message: 'Marketplace and adjustment type are required'
          });
          continue;
        }

        // Insert into database
        await prisma.commissionAdjustments.create({
          data: adjustmentData
        });
        
        importedCount++;
        
      } catch (rowError) {
        console.error(`❌ Error processing commission adjustment row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row.original_order_id || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }

    // Update batch status
    const finalStatus = importedCount > 0 ? 'completed' : 'failed';
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount,
        invalid_records: errors.length,
        imported_records: importedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date()
      }
    });

    // Clean up file
    fs.unlinkSync(file.path);

    console.log(`🎉 Commission Adjustments import completed: ${importedCount} imported, ${errors.length} errors`);

    res.json({
      success: importedCount > 0,
      data: {
        imported: importedCount,
        errors: errors.length,
        batchId: batchId,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname
      },
      message: importedCount > 0 ? 
        `Successfully imported ${importedCount} commission adjustment records` : 
        'Import failed: No valid records found'
    });

  } catch (error) {
    console.error('❌ Commission Adjustments import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

// ⭐ NEW: Import Affiliate Samples Data
const importAffiliateSamplesData = async (req, res) => {
  try {
    console.log('🎁 Starting Affiliate Samples import...');
    const startTime = Date.now();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a CSV or Excel file'
      });
    }

    const file = req.file;
    let data = [];

    // Parse file
    if (file.mimetype.includes('csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    if (!data.length) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Empty file',
        message: 'The uploaded file contains no data'
      });
    }

    console.log(`📊 Processing ${data.length} affiliate sample records...`);

    // Create import batch
    const batchId = uuidv4();
    await prisma.importBatch.create({
      data: {
        id: batchId,
        import_type: 'affiliate_samples',
        file_name: file.originalname,
        total_records: data.length,
        status: 'processing'
      }
    });

    let importedCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Extract and validate data
        const sampleData = {
          affiliate_name: row.affiliate_name,
          affiliate_platform: row.affiliate_platform || null,
          affiliate_contact: row.affiliate_contact || null,
          product_name: row.product_name,
          product_sku: row.product_sku || null,
          quantity_given: parseInt(row.quantity_given) || 1,
          product_cost: parseFloat(row.product_cost) || 0,
          total_cost: row.total_cost ? parseFloat(row.total_cost) : 
                      (parseFloat(row.product_cost) || 0) * (parseInt(row.quantity_given) || 1),
          shipping_cost: parseFloat(row.shipping_cost) || 0,
          packaging_cost: parseFloat(row.packaging_cost) || 0,
          campaign_name: row.campaign_name || null,
          expected_reach: row.expected_reach ? parseInt(row.expected_reach) : null,
          content_type: row.content_type || null,
          given_date: parseExcelDate(row.given_date) || new Date(),
          expected_content_date: row.expected_content_date ? parseExcelDate(row.expected_content_date) : null,
          actual_content_date: row.actual_content_date ? parseExcelDate(row.actual_content_date) : null,
          content_delivered: row.content_delivered === 'true' || row.content_delivered === true,
          performance_notes: row.performance_notes || null,
          roi_estimate: row.roi_estimate ? parseFloat(row.roi_estimate) : null,
          status: row.status || 'sent'
        };

        // Validate required fields
        if (!sampleData.affiliate_name || !sampleData.product_name) {
          errors.push({
            row: i + 2,
            field: 'affiliate_name/product_name',
            value: sampleData.affiliate_name || sampleData.product_name,
            message: 'Affiliate name and product name are required'
          });
          continue;
        }

        // Insert into database
        await prisma.affiliateSamples.create({
          data: sampleData
        });
        
        importedCount++;
        
      } catch (rowError) {
        console.error(`❌ Error processing affiliate sample row ${i + 2}:`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row.affiliate_name || 'unknown',
          message: `Database error: ${rowError.message}`
        });
      }
    }

    // Update batch status
    const finalStatus = importedCount > 0 ? 'completed' : 'failed';
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: importedCount,
        invalid_records: errors.length,
        imported_records: importedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date()
      }
    });

    // Clean up file
    fs.unlinkSync(file.path);

    console.log(`🎉 Affiliate Samples import completed: ${importedCount} imported, ${errors.length} errors`);

    res.json({
      success: importedCount > 0,
      data: {
        imported: importedCount,
        errors: errors.length,
        batchId: batchId,
        totalRows: data.length,
        errorDetails: errors.length > 0 ? errors : undefined,
        fileName: file.originalname
      },
      message: importedCount > 0 ? 
        `Successfully imported ${importedCount} affiliate sample records` : 
        'Import failed: No valid records found'
    });

  } catch (error) {
    console.error('❌ Affiliate Samples import error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
};

module.exports = {
  importSalesData,
  importProductData,  
  importStockData,
  importAdvertisingData,
  importAdvertisingSettlementData,
  importReturnsAndCancellationsData,
  importMarketplaceReimbursementsData,
  importCommissionAdjustmentsData,
  importAffiliateSamplesData,
  getImportStatus,
  getImportHistory,
  downloadTemplate
};