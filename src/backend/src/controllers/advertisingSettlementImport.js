const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const parseExcelDate = (excelDate) => {
  if (!excelDate) return null;
  
  if (excelDate instanceof Date) {
    return excelDate;
  }
  
  if (typeof excelDate === 'string') {
    // Enhanced parsing to support various date formats from advertising settlement data
    const trimmedDate = excelDate.toString().trim();
    
    // Try different date formats, prioritizing the format in user's data
    const date = moment(trimmedDate, [
      'YYYY/MM/DD',      // Format dari data user: 2025/02/01
      'DD/MM/YYYY',      // Standard Indonesian format
      'DD/MM/YY',        // Short year format
      'YYYY-MM-DD',      // ISO format
      'MM/DD/YYYY',      // US format
      'DD/MM/YYYY HH:mm:ss', 
      'YYYY/MM/DD HH:mm:ss',
      'MM/DD/YYYY HH:mm:ss'
    ], true); // Strict parsing
    
    if (date.isValid()) {
      return date.toDate();
    }
    
    // Try to parse Excel-style date strings
    if (trimmedDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      const parsedDate = moment(trimmedDate, 'YYYY/MM/DD', true);
      if (parsedDate.isValid()) {
        return parsedDate.toDate();
      }
    }
    
    console.warn(`⚠️ Could not parse date: "${excelDate}"`);
    return null;
  }
  
  if (typeof excelDate === 'number') {
    // Handle Excel serial date numbers
    try {
      const date = moment('1900-01-01').add(excelDate - 2, 'days');
      if (date.isValid()) {
        return date.toDate();
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse Excel serial date: ${excelDate}`);
    }
  }
  
  return null;
};

// ADVERTISING SETTLEMENT IMPORT - Enhanced with better period-aware duplicate detection
const importAdvertisingSettlementData = async (req, res) => {
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
    
    console.log('💰 ADVERTISING SETTLEMENT IMPORT - Processing file:', {
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
    }
    
    console.log(`📊 Parsed ${data.length} rows from advertising settlement file`);
    
    // Check if we have data and validate basic structure
    if (data.length === 0) {
      throw new Error('File kosong atau tidak dapat dibaca. Pastikan file memiliki data yang valid.');
    }
    
    // Enhanced column detection with fuzzy matching
    if (data.length > 0) {
      const firstRowColumns = Object.keys(data[0]);
      console.log('📋 Raw columns found in file:', firstRowColumns);
      
      // Normalize column names - remove spaces, special chars, convert to lowercase
      const normalizeColumnName = (colName) => {
        return colName
          .toString()
          .trim()
          .replace(/[\s\u00A0\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]/g, '') // Remove all types of spaces
          .replace(/[^\w]/g, '') // Remove special characters
          .toLowerCase();
      };
      
      const normalizedColumns = firstRowColumns.map(col => ({
        original: col,
        normalized: normalizeColumnName(col)
      }));
      
      console.log('🔧 Normalized columns:', normalizedColumns);
      
      // Enhanced required column matching with multiple variations
      const requiredColumnsMap = {
        'orderid': ['Order ID', 'order_id', 'orderid', 'ORDER_ID'],
        'settlementamount': ['Settlement Amount', 'settlement_amount', 'settlementamount', 'SETTLEMENT_AMOUNT'],
        'ordercreatedtime': ['Order Created Time', 'order_created_time', 'ordercreatedtime', 'ORDER_CREATED_TIME'],
        'ordersettledtime': ['Order Settled Time', 'order_settled_time', 'ordersettledtime', 'ORDER_SETTLED_TIME']
      };
      
      // Check for each required column with fuzzy matching
      const foundColumns = {};
      const missingColumns = [];
      
      for (const [normalizedRequired, variations] of Object.entries(requiredColumnsMap)) {
        const foundColumn = normalizedColumns.find(col => 
          col.normalized === normalizedRequired ||
          col.normalized.includes(normalizedRequired) ||
          normalizedRequired.includes(col.normalized) ||
          variations.some(variation => normalizeColumnName(variation) === col.normalized)
        );
        
        if (foundColumn) {
          foundColumns[normalizedRequired] = foundColumn.original;
          console.log(`✅ Found column '${normalizedRequired}': '${foundColumn.original}'`);
        } else {
          missingColumns.push(variations[0]); // Use the first variation as display name
          console.log(`❌ Missing column '${normalizedRequired}' (looking for variations: ${variations.join(', ')})`);
        }
      }
      
      // Require at least Order ID and Settlement Amount (core mandatory fields)
      const coreRequiredFields = ['orderid', 'settlementamount'];
      const missingCoreFields = coreRequiredFields.filter(field => !foundColumns[field]);
      
      if (missingCoreFields.length > 0) {
        const missingDisplayNames = missingCoreFields.map(field => 
          requiredColumnsMap[field][0]
        );
        
        console.error('❌ Core required settlement columns not found');
        console.error('Missing core columns:', missingDisplayNames);
        console.error('Found columns:', firstRowColumns);
        console.error('Normalized found columns:', normalizedColumns.map(c => c.normalized));
        
        throw new Error(`❌ KOLOM SETTLEMENT WAJIB TIDAK DITEMUKAN: File tidak mengandung kolom inti yang diperlukan.

🔍 KOLOM YANG DITEMUKAN:
${firstRowColumns.map(col => `• "${col}"`).join('\n')}

❌ KOLOM WAJIB YANG HILANG:
${missingDisplayNames.map(col => `• "${col}"`).join('\n')}

✅ KOLOM SETTLEMENT YANG DIPERLUKAN:
• "Order ID" (wajib) - ID unik dari platform advertising
• "Settlement Amount" (wajib) - Total biaya settlement
• "Order Created Time" (opsional) - Tanggal order dibuat
• "Order Settled Time" (opsional) - Tanggal settlement/pembayaran

📝 SOLUSI:
1. Pastikan file memiliki kolom "Order ID" dan "Settlement Amount"
2. Periksa tidak ada spasi atau karakter tersembunyi di nama kolom
3. Download template settlement yang benar jika masih bermasalah
4. Atau rename kolom sesuai format yang diperlukan

💡 CONTOH FORMAT YANG BENAR:
Order ID | Settlement Amount | Order Created Time | Order Settled Time`);
      }
      
      console.log('✅ Enhanced settlement columns validation passed');
      console.log('📊 Matched columns:', foundColumns);
    }
    
    // Create import batch with enhanced error handling
    let importBatch;
    try {
      console.log('🔄 Creating import batch for advertising settlement...');
      
      importBatch = await prisma.importBatch.create({
        data: {
          id: batchId,
          batch_name: `Advertising Settlement Import - ${file.originalname}`,
          import_type: 'ADVERTISING_SETTLEMENT',
          file_name: file.originalname,
          file_type: file.mimetype.includes('csv') ? 'csv' : 'excel',
          total_records: data.length,
          valid_records: 0, // Will be updated after processing
          invalid_records: 0, // Will be updated after processing
          imported_records: 0, // Will be updated after processing
          status: 'processing'
        }
      });
      
      console.log('✅ Import batch created successfully:', {
        batchId,
        fileName: file.originalname,
        totalRecords: data.length
      });
      
    } catch (batchError) {
      console.error('❌ PRISMA BATCH CREATION ERROR:', {
        error: batchError.message,
        code: batchError.code,
        meta: batchError.meta,
        clientVersion: batchError.clientVersion
      });
      
      // Handle specific Prisma errors
      let userFriendlyError = 'Failed to create import batch';
      
      if (batchError.code === 'P2002') {
        userFriendlyError = 'Import batch ID already exists - please try again';
      } else if (batchError.code === 'P2003') {
        userFriendlyError = 'Database constraint error - invalid import type or foreign key';
      } else if (batchError.code === 'P2025') {
        userFriendlyError = 'Import batch table not found - database migration required';
      } else if (batchError.message.includes('Unknown arg')) {
        userFriendlyError = 'Database schema mismatch - column structure changed';
      } else if (batchError.message.includes('timeout')) {
        userFriendlyError = 'Database connection timeout - please try again';
      }
      
      throw new Error(`❌ DATABASE ERROR: ${userFriendlyError}

🔧 TECHNICAL DETAILS:
${batchError.message}

📝 KEMUNGKINAN PENYEBAB:
• Database tidak tersedia atau timeout
• Tabel import_batches belum ada (perlu migration)
• Constraint atau foreign key error
• Schema mismatch antara kode dan database

💡 SOLUSI:
1. Pastikan database server berjalan
2. Check apakah migration sudah dijalankan
3. Restart backend server jika perlu
4. Contact administrator jika masalah berlanjut`);
    }
    
    let importedCount = 0;
    let updatedCount = 0;
    let errors = [];
    
    // Track settlement periods to avoid false duplicate detection
    const settlementPeriods = new Set();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Enhanced column extraction with fuzzy matching
      const getColumnValue = (row, possibleNames) => {
        // Try exact matches first
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name];
          }
        }
        
        // Try fuzzy matching if exact matches fail
        const rowKeys = Object.keys(row);
        for (const possibleName of possibleNames) {
          const normalized = possibleName.toLowerCase().replace(/[\s_]/g, '');
          const fuzzyMatch = rowKeys.find(key => 
            key.toLowerCase().replace(/[\s_]/g, '') === normalized ||
            key.toLowerCase().replace(/[\s_]/g, '').includes(normalized) ||
            normalized.includes(key.toLowerCase().replace(/[\s_]/g, ''))
          );
          
          if (fuzzyMatch && row[fuzzyMatch] !== undefined && row[fuzzyMatch] !== null && row[fuzzyMatch] !== '') {
            return row[fuzzyMatch];
          }
        }
        
        return null;
      };

      const hasOrderId = getColumnValue(row, ['Order ID', 'order_id', 'order_id', 'ORDER_ID', 'OrderID', 'orderId']);
      const hasSettlementAmount = getColumnValue(row, ['Settlement Amount', 'settlement_amount', 'settlement_amount', 'SETTLEMENT_AMOUNT', 'SettlementAmount', 'settlementAmount']);
      const hasOrderCreatedTime = getColumnValue(row, ['Order Created Time', 'order_created_time', 'order_created_time', 'ORDER_CREATED_TIME', 'OrderCreatedTime', 'orderCreatedTime']);
      const hasOrderSettledTime = getColumnValue(row, ['Order Settled Time', 'order_settled_time', 'order_settled_time', 'ORDER_SETTLED_TIME', 'OrderSettledTime', 'orderSettledTime']);
      const hasType = getColumnValue(row, ['Type', 'type', 'type', 'TYPE']);
      const hasAccountName = getColumnValue(row, ['Account Name', 'account_name', 'account_name', 'ACCOUNT_NAME', 'AccountName', 'accountName']);
      const hasCurrency = getColumnValue(row, ['Currency', 'currency', 'currency', 'CURRENCY']);
      const hasMarketplace = getColumnValue(row, ['Marketplace', 'marketplace', 'marketplace', 'MARKETPLACE']);
      
      // More flexible empty row detection
      const hasAnyData = hasOrderId || hasSettlementAmount || hasOrderCreatedTime || hasOrderSettledTime || hasType || hasAccountName || hasCurrency || hasMarketplace;
      
      if (!hasAnyData) {
        console.log(`⏭️ Skipping completely empty row ${i + 2}`);
        continue;
      }
      
      try {
        const orderId = hasOrderId ? hasOrderId.toString().trim() : null;
        
        // Enhanced Order ID validation
        if (!orderId || orderId === 'undefined' || orderId === 'null') {
          console.log(`⚠️ Row ${i + 2}: Missing or invalid Order ID`, {
            hasOrderId,
            orderId,
            rowData: row
          });
          
          errors.push({
            row: i + 2,
            field: 'order_id',
            value: hasOrderId,
            message: `Order ID wajib diisi dan tidak boleh kosong. Nilai ditemukan: "${hasOrderId || 'kosong'}"`
          });
          continue;
        }
        
        console.log(`📝 Processing Row ${i + 2}: Order ID = "${orderId}"`);
        
        // Parse settlement times with enhanced date handling
        console.log(`📅 Raw dates for Order ID ${orderId}:`, {
          orderCreatedTimeRaw: hasOrderCreatedTime,
          orderSettledTimeRaw: hasOrderSettledTime
        });
        
        const orderCreatedTime = parseExcelDate(hasOrderCreatedTime);
        const orderSettledTime = parseExcelDate(hasOrderSettledTime);
        
        console.log(`📅 Parsed dates for Order ID ${orderId}:`, {
          orderCreatedTime: orderCreatedTime,
          orderSettledTime: orderSettledTime
        });
        
        // Extract settlement period (month-year) for duplicate detection improvement
        let settlementPeriod = null;
        if (orderSettledTime) {
          settlementPeriod = moment(orderSettledTime).format('YYYY-MM');
          settlementPeriods.add(settlementPeriod);
        } else if (orderCreatedTime) {
          // Fallback to created time if settled time not available
          settlementPeriod = moment(orderCreatedTime).format('YYYY-MM');
          settlementPeriods.add(settlementPeriod);
        }
        
        console.log(`📅 Processing Order ID: ${orderId || 'N/A'} for settlement period: ${settlementPeriod || 'Unknown'}`);
        
        // Enhanced settlement amount parsing
        let settlementAmount = 0;
        if (hasSettlementAmount) {
          try {
            // Clean the amount string - remove currency symbols, commas, spaces
            const rawAmount = hasSettlementAmount.toString()
              .replace(/[Rp\$€£¥₹]/g, '') // Remove currency symbols
              .replace(/[,\s]/g, '') // Remove commas and spaces
              .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus
            
            settlementAmount = parseFloat(rawAmount) || 0;
            
            if (isNaN(settlementAmount) || settlementAmount < 0) {
              console.warn(`⚠️ Invalid settlement amount for Order ID ${orderId}:`, {
                original: hasSettlementAmount,
                cleaned: rawAmount,
                parsed: settlementAmount
              });
              settlementAmount = 0;
            }
          } catch (amountError) {
            console.error(`❌ Error parsing settlement amount for Order ID ${orderId}:`, amountError);
            settlementAmount = 0;
          }
        }
        
        console.log(`💰 Settlement Amount for Order ID ${orderId}:`, {
          raw: hasSettlementAmount,
          parsed: settlementAmount,
          isValid: settlementAmount > 0
        });
        
        const settlementData = {
          order_id: orderId, // Order ID is now the primary key - no auto-generation
          type: (hasType ? hasType.toString().trim() : 'GMV Payment for TikTok Ads'),
          order_created_time: orderCreatedTime,
          order_settled_time: orderSettledTime,
          settlement_amount: settlementAmount,
          settlement_period: settlementPeriod || moment().format('YYYY-MM'), // Current month as fallback
          account_name: (hasAccountName ? hasAccountName.toString().trim() : 'D\'Busana Fashion Ads'),
          marketplace: (hasMarketplace ? hasMarketplace.toString().trim() : 'Tiktok Shop'),
          currency: (hasCurrency ? hasCurrency.toString().trim() : 'IDR'),
          import_batch_id: batchId
        };
        
        // Check if record exists - since order_id is now primary key, findUnique is more efficient
        const existingRecord = await prisma.advertisingSettlement.findUnique({
          where: {
            order_id: settlementData.order_id
          }
        });
        
        if (existingRecord) {
          // Update existing record - order_id is unique primary key so we update in place
          await prisma.advertisingSettlement.update({
            where: { order_id: settlementData.order_id },
            data: {
              type: settlementData.type,
              order_created_time: settlementData.order_created_time,
              order_settled_time: settlementData.order_settled_time,
              settlement_amount: settlementData.settlement_amount,
              settlement_period: settlementData.settlement_period,
              account_name: settlementData.account_name,
              marketplace: settlementData.marketplace,
              currency: settlementData.currency,
              import_batch_id: settlementData.import_batch_id,
              updated_at: new Date()
            }
          });
          updatedCount++;
          console.log(`🔄 Updated existing settlement: ${orderId} (Period: ${settlementPeriod})`);
        } else {
          // Create new record - no existing record found
          await prisma.advertisingSettlement.create({
            data: settlementData
          });
          importedCount++;
          console.log(`✅ Created new settlement: ${orderId} (Period: ${settlementPeriod})`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing settlement row ${i + 2}:`, rowError);
        
        // More detailed error information with better user messaging
        const errorMessage = rowError.message || 'Unknown database error';
        let userFriendlyMessage = `Database error: ${errorMessage}`;
        
        // Handle specific common errors for settlement data
        if (errorMessage.includes('required') || errorMessage.includes('not null')) {
          userFriendlyMessage = 'Field wajib tidak boleh kosong - periksa Order ID dan Settlement Amount';
        } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
          userFriendlyMessage = 'Data settlement sudah ada untuk Order ID ini dalam periode yang sama';
        } else if (errorMessage.includes('foreign key')) {
          userFriendlyMessage = 'Referensi Order ID tidak ditemukan dalam data sales';
        } else if (errorMessage.includes('date') || errorMessage.includes('time')) {
          userFriendlyMessage = 'Format tanggal tidak valid - periksa Order Created Time dan Order Settled Time';
        } else if (errorMessage.includes('numeric') || errorMessage.includes('number')) {
          userFriendlyMessage = 'Format angka tidak valid - periksa Settlement Amount';
        }
        
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Order ID'] || row.order_id || 'unknown',
          message: userFriendlyMessage,
          originalError: errorMessage
        });
      }
    }
    
    // Log settlement periods processed
    console.log(`📅 Settlement periods processed: [${Array.from(settlementPeriods).join(', ')}]`);
    
    // Update batch status with more intelligent success criteria
    const totalProcessed = importedCount + updatedCount;
    const successRate = totalProcessed / data.length;
    
    let finalStatus;
    if (totalProcessed === 0) {
      finalStatus = 'failed';
    } else if (successRate >= 0.8) {
      finalStatus = 'completed';
    } else if (successRate >= 0.5) {
      finalStatus = 'partial';
    } else {
      finalStatus = 'partial';
    }
    
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        valid_records: totalProcessed,
        invalid_records: errors.length,
        imported_records: totalProcessed,
        status: finalStatus,
        error_details: errors.length > 0 ? { 
          errors: errors.slice(0, 10), // Limit error details to first 10
          settlement_periods: Array.from(settlementPeriods),
          summary: {
            total_rows: data.length,
            processed_periods: Array.from(settlementPeriods).length,
            new_records: importedCount,
            updated_records: updatedCount,
            failed_records: errors.length,
            success_rate: Math.round(successRate * 100)
          }
        } : null,
        updated_at: new Date()
      }
    });
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    // Activity logging
    try {
      if (totalProcessed > 0) {
        const activityData = {
          type: 'import',
          title: 'Import Data Settlement Advertising',
          description: `Import settlement advertising berhasil - ${totalProcessed} records (${importedCount} baru, ${updatedCount} update) untuk ${Array.from(settlementPeriods).length} periode: ${Array.from(settlementPeriods).join(', ')}`,
          status: 'success',
          metadata: {
            import_type: 'ADVERTISING_SETTLEMENT',
            file_name: file.originalname,
            total_records: data.length,
            imported_records: importedCount,
            updated_records: updatedCount,
            error_count: errors.length,
            batch_id: batchId,
            settlement_periods: Array.from(settlementPeriods)
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
          console.log('✅ Advertising settlement import activity logged successfully');
        }
      }
    } catch (activityError) {
      console.warn('Failed to log advertising settlement import activity:', activityError);
    }
    
    console.log(`🎉 ADVERTISING SETTLEMENT IMPORT COMPLETED: ${importedCount} new, ${updatedCount} updated, ${errors.length} errors`);
    console.log(`📈 Settlement periods: ${Array.from(settlementPeriods).join(', ')}`);
    
    const isSuccess = totalProcessed > 0;
    
    // Return success even if some errors exist, as long as some data was processed
    const shouldReturnSuccess = totalProcessed > 0 || (errors.length > 0 && successRate >= 0.3);
    
    res.status(shouldReturnSuccess ? 200 : 400).json({
      success: shouldReturnSuccess,
      data: {
        imported: importedCount,
        updated: updatedCount,
        errors: errors.length,
        batchId,
        totalRows: data.length,
        validRows: totalProcessed,
        errorDetails: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit error details
        settlementPeriods: Array.from(settlementPeriods),
        periodsCount: Array.from(settlementPeriods).length,
        fileName: file.originalname,
        fileType: file.mimetype.includes('csv') ? 'csv' : 'excel',
        successRate: Math.round(successRate * 100)
      },
      message: shouldReturnSuccess ? 
        `Successfully processed ${totalProcessed} settlement records for ${Array.from(settlementPeriods).length} period(s): ${Array.from(settlementPeriods).join(', ')}` :
        errors.length > 0 ? 
          `Import berhasil sebagian: ${totalProcessed} berhasil, ${errors.length} gagal dari ${data.length} baris. Periksa format data atau periode settlement.` :
          'No valid settlement data found to import'
    });
    
  } catch (error) {
    console.error('❌ ADVERTISING SETTLEMENT IMPORT ERROR:', {
      message: error.message,
      stack: error.stack,
      fileName: req.file?.originalname,
      fileSize: req.file?.size
    });
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup uploaded file:', cleanupError.message);
      }
    }
    
    // Enhanced error message categorization
    let userFriendlyMessage = 'Import gagal';
    let errorCategory = 'general';
    
    if (error.message.includes('KOLOM') || error.message.includes('column') || error.message.includes('property')) {
      errorCategory = 'column_missing';
      // Use the detailed message from our enhanced column validation
      userFriendlyMessage = error.message;
    } else if (error.message.includes('DATABASE ERROR') || error.message.includes('PRISMA')) {
      errorCategory = 'database_error';
      userFriendlyMessage = error.message;
    } else if (error.message.includes('date') || error.message.includes('time')) {
      errorCategory = 'date_format';
      userFriendlyMessage = `❌ FORMAT TANGGAL SALAH: Periksa format Order Created Time dan Order Settled Time.

📅 FORMAT YANG DIDUKUNG:
• YYYY/MM/DD (contoh: 2025/02/01)
• DD/MM/YYYY (contoh: 01/02/2025)  
• YYYY-MM-DD (contoh: 2025-02-01)

🔧 DETAIL ERROR:
${error.message}`;
    } else if (error.message.includes('amount') || error.message.includes('number') || error.message.includes('numeric')) {
      errorCategory = 'number_format';
      userFriendlyMessage = `❌ FORMAT ANGKA SALAH: Periksa Settlement Amount.

💰 FORMAT YANG BENAR:
• Gunakan angka tanpa mata uang: 500000
• Boleh pakai koma pemisah: 500,000
• Jangan pakai simbol: Rp 500.000

🔧 DETAIL ERROR:
${error.message}`;
    } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
      errorCategory = 'duplicate_data';
      userFriendlyMessage = `❌ DATA DUPLIKAT: Order ID sudah ada dalam database.

🔄 SOLUSI:
• Data dengan Order ID sama akan di-update
• Periksa apakah ini memang data baru atau update
• Jika ingin tetap import, data lama akan ditimpa

🔧 DETAIL ERROR:
${error.message}`;
    } else if (error.message.includes('File kosong') || error.message.includes('No valid data')) {
      errorCategory = 'empty_file';
      userFriendlyMessage = `❌ FILE KOSONG ATAU TIDAK VALID: File tidak mengandung data yang dapat dibaca.

📄 KEMUNGKINAN PENYEBAB:
• File Excel kosong atau corrupt
• Sheet pertama tidak ada data
• Format file tidak didukung

📝 SOLUSI:
1. Periksa file Excel memiliki data di sheet pertama
2. Coba save ulang file dalam format .xlsx
3. Download template baru dan copy data ke template`;
    } else {
      // Generic error with more helpful context
      userFriendlyMessage = `❌ SETTLEMENT IMPORT ERROR: ${error.message}

🔧 LANGKAH TROUBLESHOOTING:
1. Pastikan file memiliki kolom "Order ID" dan "Settlement Amount"
2. Periksa format tanggal menggunakan YYYY/MM/DD atau DD/MM/YYYY
3. Pastikan Settlement Amount berupa angka tanpa mata uang
4. Download template terbaru jika masih bermasalah
5. Coba convert file ke format CSV

📞 Jika masalah berlanjut, hubungi administrator dengan error details di atas.`;
    }
    
    // Log error for debugging
    console.error('📝 Categorized Error:', {
      category: errorCategory,
      originalMessage: error.message,
      userMessage: userFriendlyMessage.substring(0, 200) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: userFriendlyMessage,
      errorCategory,
      details: {
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  importAdvertisingSettlementData
};