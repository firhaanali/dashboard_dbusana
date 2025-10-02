const crypto = require('crypto');
const fs = require('fs');
const moment = require('moment');

/**
 * Calculate SHA-256 hash of a file for exact duplicate detection
 */
const calculateFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.warn('File hash calculation failed:', error);
    return null;
  }
};

/**
 * Extract date range from import data based on import type
 */
const extractDateRangeFromData = (data, importType) => {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const dates = [];
  let dateFields = [];
  
  // Define date fields based on import type
  switch (importType) {
    case 'sales':
      dateFields = [
        'Created Time', 'created_time', 'Created_Time',
        'Delivered Time', 'delivered_time', 'Delivered_Time',
        'Order Date', 'order_date', 'Order_Date'
      ];
      break;
    
    case 'advertising':
      dateFields = [
        'Date Range Start', 'date_start', 'Date_Range_Start',
        'Date Range End', 'date_end', 'Date_Range_End',
        'Start Date', 'End Date', 'Campaign_Start', 'Campaign_End'
      ];
      break;
    
    case 'advertising-settlement':
      dateFields = [
        'Order Created Time', 'order_created_time', 'Order_Created_Time',
        'Order Settled Time', 'order_settled_time', 'Order_Settled_Time',
        'Settlement Date', 'settlement_date', 'Settlement_Date'
      ];
      break;
    
    case 'products':
      // Products typically don't have date ranges, but check for creation dates
      dateFields = [
        'Created Date', 'created_date', 'Creation_Date',
        'Updated Date', 'updated_date', 'Update_Date'
      ];
      break;
    
    default:
      return null;
  }
  
  data.forEach(row => {
    for (const field of dateFields) {
      if (row[field]) {
        const date = moment(row[field], [
          'DD/MM/YY',          // New format for advertising
          'DD/MM/YYYY',        // Common format
          'YYYY-MM-DD HH:mm:ss',
          'YYYY-MM-DD',
          'DD/MM/YYYY HH:mm:ss',
          'MM/DD/YYYY HH:mm:ss',
          'MM/DD/YYYY'
        ], true);
        
        if (date.isValid()) {
          dates.push(date.toDate());
          break; // Found valid date for this row
        }
      }
    }
  });

  if (dates.length === 0) return null;

  dates.sort((a, b) => a.getTime() - b.getTime());
  
  return {
    start: dates[0].toISOString().split('T')[0],
    end: dates[dates.length - 1].toISOString().split('T')[0],
    total_dates: dates.length,
    import_type: importType
  };
};

/**
 * Generate metadata for import based on type
 */
const generateImportMetadata = (data, importType, fileInfo) => {
  const metadata = {
    file_info: {
      name: fileInfo.originalname,
      size: fileInfo.size,
      type: fileInfo.mimetype,
      hash: calculateFileHash(fileInfo.path)
    },
    data_info: {
      total_rows: data.length,
      import_type: importType,
      processed_at: new Date().toISOString()
    }
  };

  // Add date range if applicable
  const dateRange = extractDateRangeFromData(data, importType);
  if (dateRange) {
    metadata.date_range = dateRange;
  }

  // Add type-specific metadata
  switch (importType) {
    case 'products':
      metadata.product_info = analyzeProductData(data);
      break;
    
    case 'advertising':
      metadata.advertising_info = analyzeAdvertisingData(data);
      break;
    
    case 'advertising-settlement':
      metadata.settlement_info = analyzeSettlementData(data);
      break;
    
    case 'sales':
      metadata.sales_info = analyzeSalesData(data);
      break;
  }

  return metadata;
};

/**
 * Analyze product data for metadata
 */
const analyzeProductData = (data) => {
  const categories = new Set();
  const brands = new Set();
  const productCodes = new Set();

  data.forEach(row => {
    if (row['Category'] || row.category) {
      categories.add((row['Category'] || row.category).toString().trim());
    }
    if (row['Brand'] || row.brand) {
      brands.add((row['Brand'] || row.brand).toString().trim());
    }
    if (row['Product Code'] || row.product_code) {
      productCodes.add((row['Product Code'] || row.product_code).toString().trim());
    }
  });

  return {
    unique_categories: Array.from(categories),
    unique_brands: Array.from(brands),
    unique_product_codes: productCodes.size,
    total_categories: categories.size,
    total_brands: brands.size
  };
};

/**
 * Analyze advertising data for metadata
 */
const analyzeAdvertisingData = (data) => {
  const campaigns = new Set();
  const platforms = new Set();
  let totalCost = 0;
  let totalImpressions = 0;

  data.forEach(row => {
    if (row['Campaign Name'] || row.campaign_name) {
      campaigns.add((row['Campaign Name'] || row.campaign_name).toString().trim());
    }
    if (row['Platform'] || row.platform || row['Account Name'] || row.account_name) {
      platforms.add((row['Platform'] || row.platform || row['Account Name'] || row.account_name).toString().trim());
    }
    
    const cost = parseFloat(row['Cost'] || row.cost || row['Spending'] || row.spending || 0);
    const impressions = parseInt(row['Impressions'] || row.impressions || 0);
    
    totalCost += cost;
    totalImpressions += impressions;
  });

  return {
    unique_campaigns: Array.from(campaigns),
    unique_platforms: Array.from(platforms),
    total_campaigns: campaigns.size,
    total_platforms: platforms.size,
    total_cost: totalCost,
    total_impressions: totalImpressions,
    average_cost_per_campaign: campaigns.size > 0 ? totalCost / campaigns.size : 0
  };
};

/**
 * Analyze settlement data for metadata
 */
const analyzeSettlementData = (data) => {
  const orderIds = new Set();
  const types = new Set();
  let totalSettlement = 0;

  data.forEach(row => {
    if (row['Order ID'] || row.order_id) {
      orderIds.add((row['Order ID'] || row.order_id).toString().trim());
    }
    if (row['Type'] || row.type) {
      types.add((row['Type'] || row.type).toString().trim());
    }
    
    const settlement = parseFloat(row['Settlement Amount'] || row.settlement_amount || 0);
    totalSettlement += settlement;
  });

  return {
    unique_order_ids: orderIds.size,
    settlement_types: Array.from(types),
    total_settlement_amount: totalSettlement,
    average_settlement: orderIds.size > 0 ? totalSettlement / orderIds.size : 0
  };
};

/**
 * Analyze sales data for metadata
 */
const analyzeSalesData = (data) => {
  const orderIds = new Set();
  const marketplaces = new Set();
  const products = new Set();
  let totalRevenue = 0;

  data.forEach(row => {
    if (row['Order ID'] || row.order_id) {
      orderIds.add((row['Order ID'] || row.order_id).toString().trim());
    }
    if (row['Marketplace'] || row.marketplace) {
      marketplaces.add((row['Marketplace'] || row.marketplace).toString().trim());
    }
    if (row['Product Name'] || row.product_name) {
      products.add((row['Product Name'] || row.product_name).toString().trim());
    }
    
    const revenue = parseFloat(row['Order Amount'] || row.order_amount || row['Total Revenue'] || row.total_revenue || 0);
    totalRevenue += revenue;
  });

  return {
    unique_orders: orderIds.size,
    unique_marketplaces: Array.from(marketplaces),
    unique_products: products.size,
    total_revenue: totalRevenue,
    average_order_value: orderIds.size > 0 ? totalRevenue / orderIds.size : 0
  };
};

/**
 * Save import metadata to database
 */
const saveImportMetadata = async (prisma, importHistoryId, metadata) => {
  try {
    // Save general metadata
    await prisma.importMetadata.create({
      data: {
        import_history_id: importHistoryId,
        metadata_type: 'general',
        metadata: {
          file_info: metadata.file_info,
          data_info: metadata.data_info
        }
      }
    });

    // Save date range metadata if available
    if (metadata.date_range) {
      await prisma.importMetadata.create({
        data: {
          import_history_id: importHistoryId,
          metadata_type: 'date_range',
          metadata: metadata.date_range
        }
      });
    }

    // Save type-specific metadata
    const typeSpecificKeys = ['product_info', 'advertising_info', 'settlement_info', 'sales_info'];
    for (const key of typeSpecificKeys) {
      if (metadata[key]) {
        await prisma.importMetadata.create({
          data: {
            import_history_id: importHistoryId,
            metadata_type: key.replace('_info', ''),
            metadata: metadata[key]
          }
        });
      }
    }

    console.log('✅ Import metadata saved successfully');
  } catch (error) {
    console.warn('Failed to save detailed import metadata:', error);
    // Don't fail the import if metadata saving fails
  }
};

/**
 * Create comprehensive import history entry with metadata
 */
const createImportHistoryWithMetadata = async (prisma, importData, fileInfo, data) => {
  try {
    // Generate comprehensive metadata
    const metadata = generateImportMetadata(data, importData.import_type, fileInfo);
    
    // Create import history entry
    const importHistory = await prisma.importHistory.create({
      data: {
        import_type: importData.import_type,
        file_name: fileInfo.originalname,
        file_size: fileInfo.size,
        file_hash: metadata.file_info.hash,
        total_records: importData.total_records,
        imported_records: importData.imported_records,
        failed_records: importData.failed_records || 0,
        duplicate_records: importData.duplicate_records || 0,
        success_rate: importData.success_rate,
        processing_time_ms: importData.processing_time_ms,
        import_status: importData.import_status || 'completed',
        import_summary: importData.import_summary,
        metadata: metadata,
        user_id: importData.user_id || 'admin'
      }
    });

    // Save detailed metadata in separate table
    await saveImportMetadata(prisma, importHistory.id, metadata);

    return importHistory;
  } catch (error) {
    console.error('Failed to create import history with metadata:', error);
    throw error;
  }
};

module.exports = {
  calculateFileHash,
  extractDateRangeFromData,
  generateImportMetadata,
  analyzeProductData,
  analyzeAdvertisingData,
  analyzeSettlementData,
  analyzeSalesData,
  saveImportMetadata,
  createImportHistoryWithMetadata
};