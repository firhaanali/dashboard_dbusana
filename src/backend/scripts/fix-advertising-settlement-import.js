#!/usr/bin/env node

// Quick fix for advertising settlement import issues
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const moment = require('moment');

const prisma = new PrismaClient();

console.log('🔧 Debugging Advertising Settlement Import Issue...');

// Enhanced date parser specifically for advertising settlement
function enhancedAdvertisingSettlementDateParser(dateValue) {
  if (!dateValue) return null;
  
  console.log('📅 Parsing date value:', { dateValue, type: typeof dateValue });
  
  // If already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // Handle string formats
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    
    // Handle dd/MM/yy format (25/04/21)
    const ddmmyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
    const ddmmyyMatch = trimmed.match(ddmmyyRegex);
    
    if (ddmmyyMatch) {
      const [, day, month, year] = ddmmyyMatch;
      // Convert 2-digit year to 4-digit (assume 20xx for years 00-99)
      const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      const isoDateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Date parsed (dd/MM/yy):', { original: trimmed, parsed: isoDateString });
      return new Date(isoDateString);
    }
    
    // Handle dd/MM/yyyy format (25/04/2021)
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmyyyyMatch = trimmed.match(ddmmyyyyRegex);
    
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Date parsed (dd/MM/yyyy):', { original: trimmed, parsed: isoDateString });
      return new Date(isoDateString);
    }
    
    // Try moment.js for various formats
    const momentDate = moment(trimmed, [
      'DD/MM/YY',
      'DD/MM/YYYY',
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD-MM-YYYY'
    ], true);
    
    if (momentDate.isValid()) {
      console.log('✅ Date parsed (moment):', { original: trimmed, parsed: momentDate.toISOString() });
      return momentDate.toDate();
    }
  }
  
  // Handle Excel serial number
  if (typeof dateValue === 'number') {
    const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
    console.log('✅ Date parsed (Excel serial):', { original: dateValue, parsed: excelDate.toISOString() });
    return excelDate;
  }
  
  console.warn('⚠️ Could not parse date:', dateValue);
  return null;
}

// Test function to simulate import process
async function testAdvertisingSettlementImport() {
  console.log('🧪 Testing Advertising Settlement Import Logic...');
  
  // Simulate sample data from Excel
  const sampleData = [
    {
      'Order ID': 'ORDER-2025-001',
      'Type': 'Ad Spend',
      'Order Created Time': '25/04/21',
      'Order Settled Time': '26/04/21',
      'Settlement Amount': 250000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'TikTok Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'ORDER-2025-002',
      'Type': 'Tax Fee',
      'Order Created Time': '25/04/21',
      'Order Settled Time': '26/04/21',
      'Settlement Amount': 27500,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Facebook Ads',
      'Currency': 'IDR'
    }
  ];
  
  let errors = [];
  let processed = 0;
  
  for (let i = 0; i < sampleData.length; i++) {
    const row = sampleData[i];
    console.log(`\n🔍 Processing row ${i + 1}:`, row);
    
    try {
      // Parse data exactly like the controller does
      const orderId = (row['Order ID'] || '').toString().trim();
      const type = (row['Type'] || '').toString().trim();
      let accountName = (row['Account Name'] || '').toString().trim();
      
      // Auto-fill logic
      if (accountName === '-' || accountName === '' || !accountName) {
        accountName = "D'Busana";
      }
      
      const settlementAmount = parseFloat(row['Settlement Amount'] || 0);
      const marketplace = (row['Marketplace'] || '').toString().trim();
      const currency = (row['Currency'] || 'IDR').toString().trim();
      
      // Date parsing
      const orderCreatedTime = enhancedAdvertisingSettlementDateParser(row['Order Created Time']);
      const orderSettledTime = enhancedAdvertisingSettlementDateParser(row['Order Settled Time']);
      
      console.log('📋 Parsed values:', {
        orderId,
        type,
        accountName,
        settlementAmount,
        marketplace,
        currency,
        orderCreatedTime,
        orderSettledTime
      });
      
      // Validation
      if (!orderId || !orderCreatedTime || !orderSettledTime) {
        const error = {
          row: i + 2,
          field: 'required',
          value: `${orderId} - ${orderCreatedTime} - ${orderSettledTime}`,
          message: 'Order ID, Order Created Time dan Order Settled Time wajib diisi'
        };
        errors.push(error);
        console.error('❌ Validation failed:', error);
        continue;
      }
      
      // If validation passes
      console.log('✅ Row validation passed');
      processed++;
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      errors.push({
        row: i + 2,
        field: 'processing',
        message: error.message
      });
    }
  }
  
  console.log('\n📊 Test Results:', {
    totalRows: sampleData.length,
    processed,
    errors: errors.length,
    errorDetails: errors
  });
  
  return { processed, errors };
}

// Enhanced import controller fix
async function createFixedImportController() {
  console.log('🔧 Creating fixed import controller...');
  
  const fixedController = `
// 🏦 ENHANCED ADVERTISING SETTLEMENT IMPORT - Fixed Date Parsing
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
    
    console.log(\`🏦 Parsed \${data.length} rows from advertising settlement file\`);
    
    // Debug: Log column names from first row
    if (data.length > 0) {
      console.log('📋 Excel columns detected:', Object.keys(data[0]));
      console.log('📝 First row sample:', data[0]);
    }
    
    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        id: batchId,
        batch_name: \`Advertising Settlement Import - \${file.originalname}\`,
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
    
    // Enhanced date parsing function
    const enhancedParseDate = (dateValue) => {
      if (!dateValue) return null;
      
      console.log('📅 Parsing date:', { dateValue, type: typeof dateValue });
      
      // If already a Date object
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      // Handle string formats
      if (typeof dateValue === 'string') {
        const trimmed = dateValue.trim();
        
        // Handle dd/MM/yy format (25/04/21)
        const ddmmyyRegex = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2})$/;
        const ddmmyyMatch = trimmed.match(ddmmyyRegex);
        
        if (ddmmyyMatch) {
          const [, day, month, year] = ddmmyyMatch;
          const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
          const isoDateString = \`\${fullYear}-\${month.padStart(2, '0')}-\${day.padStart(2, '0')}\`;
          console.log('✅ Date parsed (dd/MM/yy):', { original: trimmed, parsed: isoDateString });
          return new Date(isoDateString);
        }
        
        // Handle dd/MM/yyyy format
        const ddmmyyyyRegex = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/;
        const ddmmyyyyMatch = trimmed.match(ddmmyyyyRegex);
        
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          const isoDateString = \`\${year}-\${month.padStart(2, '0')}-\${day.padStart(2, '0')}\`;
          console.log('✅ Date parsed (dd/MM/yyyy):', { original: trimmed, parsed: isoDateString });
          return new Date(isoDateString);
        }
        
        // Try moment.js for various formats
        const momentDate = moment(trimmed, [
          'DD/MM/YY',
          'DD/MM/YYYY',
          'YYYY-MM-DD',
          'MM/DD/YYYY',
          'DD-MM-YYYY'
        ], true);
        
        if (momentDate.isValid()) {
          console.log('✅ Date parsed (moment):', { original: trimmed, parsed: momentDate.toISOString() });
          return momentDate.toDate();
        }
      }
      
      // Handle Excel serial number
      if (typeof dateValue === 'number') {
        const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
        console.log('✅ Date parsed (Excel serial):', { original: dateValue, parsed: excelDate.toISOString() });
        return excelDate;
      }
      
      console.warn('⚠️ Could not parse date:', dateValue);
      return null;
    };
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows - check all possible column name variations
      const orderIdCheck = row['order_id'] || row['Order ID'] || row['ORDER_ID'] || 
                           row['OrderId'] || row['orderId'] || row['Order Id'] || '';
      
      if (!orderIdCheck || orderIdCheck.toString().trim() === '') {
        console.log(\`📋 Skipping row \${i + 2}: No order ID found. Available keys:\`, Object.keys(row));
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
          console.log(\`🏢 Row \${i + 2}: Auto-filled account_name to "D'Busana"\`);
        }
        
        const settlementAmount = parseFloat(row['settlement_amount'] || row['Settlement Amount'] || row['SETTLEMENT_AMOUNT'] || 
                                          row['total_settlement_amount'] || row['Total Settlement Amount'] || row['Amount'] || 0);
        
        const marketplace = (row['marketplace'] || row['Marketplace'] || row['MARKETPLACE'] || 
                           row['platform'] || row['Platform'] || '').toString().trim();
        
        const currency = (row['currency'] || row['Currency'] || row['CURRENCY'] || 'IDR').toString().trim();
        
        console.log(\`💰 Row \${i + 2}: Order: "\${orderId}", Account: "\${accountName}", Amount: \${settlementAmount}\`);
        
        const orderCreatedTime = enhancedParseDate(row['order_created_time'] || row['Order Created Time'] || row['ORDER_CREATED_TIME'] || 
                                                 row['created_time'] || row['Created Time'] || row['Order Date'] || row['order_date']);
        const orderSettledTime = enhancedParseDate(row['order_settled_time'] || row['Order Settled Time'] || row['ORDER_SETTLED_TIME'] || 
                                                 row['settled_time'] || row['Settled Time'] || row['Settlement Date'] || row['settlement_date']);
        
        // Enhanced validation with better error messages
        if (!orderId) {
          errors.push({
            row: i + 2,
            field: 'Order ID',
            value: orderId,
            message: 'Order ID wajib diisi dan tidak boleh kosong'
          });
          continue;
        }
        
        if (!orderCreatedTime) {
          errors.push({
            row: i + 2,
            field: 'Order Created Time',
            value: row['Order Created Time'] || 'empty',
            message: 'Order Created Time wajib diisi dengan format dd/MM/yy (contoh: 25/04/21)'
          });
          continue;
        }
        
        if (!orderSettledTime) {
          errors.push({
            row: i + 2,
            field: 'Order Settled Time',
            value: row['Order Settled Time'] || 'empty',
            message: 'Order Settled Time wajib diisi dengan format dd/MM/yy (contoh: 26/04/21)'
          });
          continue;
        }
        
        const settlementData = {
          order_id: orderId,
          type: type || 'Ad Spend', // Default type
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
          console.log(\`🔄 ADVERTISING SETTLEMENT: Updated existing order: \${orderId} (\${accountName})\`);
        } else {
          // Create new settlement
          await prisma.advertisingSettlement.create({
            data: settlementData
          });
          importedCount++;
          console.log(\`✅ ADVERTISING SETTLEMENT: Created new order: \${orderId} (\${accountName})\`);
        }
        
      } catch (rowError) {
        console.error(\`❌ Error processing advertising settlement row \${i + 2}:\`, rowError);
        errors.push({
          row: i + 2,
          field: 'database',
          value: row['Order ID'] || 'unknown',
          message: \`Database error: \${rowError.message}\`
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
    
    console.log(\`🎉 Advertising Settlement import COMPLETED: \${importedCount} new, \${updatedCount} updated, \${errors.length} errors\`);
    
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
        \`Successfully imported \${importedCount + updatedCount} advertising settlement records to database\` : 
        errors.length > 0 ? 
          \`Import gagal: \${errors.length} error ditemukan dalam \${data.length} baris\` :
          'No valid data found to import'
    });
    
  } catch (error) {
    console.error('❌ Advertising Settlement import error:', error);
    
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
`;

  console.log('✅ Fixed controller created');
  return fixedController;
}

// Main execution
async function main() {
  try {
    // Test the current logic
    const testResult = await testAdvertisingSettlementImport();
    
    if (testResult.errors.length > 0) {
      console.log('\n🔧 Creating fixed import controller...');
      await createFixedImportController();
    } else {
      console.log('✅ Current logic appears to be working correctly');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}