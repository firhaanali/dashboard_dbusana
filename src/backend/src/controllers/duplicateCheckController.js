const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const moment = require('moment');

const prisma = new PrismaClient();

/**
 * Calculate string similarity using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost,
      );
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

/**
 * Advanced Import Duplicate Checker
 * Checks for potential duplicate imports based on:
 * 1. File hash (exact duplicates)
 * 2. File name similarity
 * 3. Date range overlap (for sales data)
 * 4. File size similarity
 * 5. Import timing patterns
 */
const checkImportDuplicates = async (req, res) => {
  try {
    // Handle both FormData and regular body data
    let fileName, fileSize, fileHash, importType, dateRange, checkPeriod = 30;
    
    if (req.file) {
      // FormData from frontend
      fileName = req.file.originalname;
      fileSize = req.file.size;
      importType = req.body.importType;
      
      // Generate file hash if file is available
      if (req.file.buffer) {
        fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
      }
      
      // Try to parse dateRange if provided
      if (req.body.dateRange) {
        try {
          dateRange = JSON.parse(req.body.dateRange);
        } catch (e) {
          dateRange = null;
        }
      }
      
      checkPeriod = parseInt(req.body.checkPeriod) || 30;
    } else {
      // Regular JSON body
      const body = req.body;
      fileName = body.fileName;
      fileSize = body.fileSize;
      fileHash = body.fileHash;
      importType = body.importType;
      dateRange = body.dateRange;
      checkPeriod = body.checkPeriod || 30;
    }

    console.log('🔍 DUPLICATE CHECK - Starting analysis:', {
      fileName,
      fileSize,
      importType,
      dateRange,
      checkPeriod
    });

    // Define check period (default: last 30 days)
    const checkFromDate = moment().subtract(checkPeriod, 'days').toDate();

    // 1. EXACT DUPLICATE CHECK - File Hash
    let exactDuplicates = [];
    if (fileHash) {
      try {
        // Check if we have a file_hash column in import_history table
        const hashCheckQuery = `
          SELECT * FROM import_history 
          WHERE file_hash = $1 
          AND import_type = $2 
          AND created_at >= $3
          ORDER BY created_at DESC
        `;
        
        try {
          exactDuplicates = await prisma.$queryRawUnsafe(hashCheckQuery, fileHash, importType, checkFromDate);
        } catch (hashError) {
          console.log('📝 File hash column not available, using alternative methods');
          exactDuplicates = [];
        }
      } catch (error) {
        console.warn('Hash-based duplicate check failed:', error);
        exactDuplicates = [];
      }
    }

    // 2. SIMILAR FILE NAME CHECK
    const similarNameImports = await prisma.importHistory.findMany({
      where: {
        import_type: importType,
        created_at: {
          gte: checkFromDate
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 50 // Check last 50 imports
    });

    // Calculate name similarity scores
    const similarImports = similarNameImports
      .map(imp => ({
        ...imp,
        similarity_score: calculateStringSimilarity(fileName, imp.file_name),
        size_similarity: fileSize && imp.file_size ? 
          1 - Math.abs(fileSize - imp.file_size) / Math.max(fileSize, imp.file_size) : 0
      }))
      .filter(imp => imp.similarity_score > 0.6 || imp.size_similarity > 0.9)
      .sort((a, b) => b.similarity_score - a.similarity_score);

    // 3. DATE RANGE OVERLAP CHECK (for sales and advertising data)
    let dateOverlapImports = [];
    if ((importType === 'sales' || importType === 'advertising' || importType === 'advertising-settlement') && dateRange) {
      try {
        // Check for imports with overlapping date ranges
        const overlapQuery = `
          SELECT ih.*, 
                 im.metadata->>'date_range_start' as range_start,
                 im.metadata->>'date_range_end' as range_end
          FROM import_history ih
          LEFT JOIN import_metadata im ON ih.id = im.import_history_id
          WHERE ih.import_type = $1
            AND ih.created_at >= $2
            AND (
              (im.metadata->>'date_range_start' <= $3 AND im.metadata->>'date_range_end' >= $4)
              OR (im.metadata->>'date_range_start' <= $5 AND im.metadata->>'date_range_end' >= $6)
              OR (im.metadata->>'date_range_start' >= $7 AND im.metadata->>'date_range_end' <= $8)
            )
          ORDER BY ih.created_at DESC
        `;

        dateOverlapImports = await prisma.$queryRawUnsafe(
          overlapQuery,
          importType,
          checkFromDate,
          dateRange.start, dateRange.start, // Check if import range contains our start date
          dateRange.end, dateRange.end,     // Check if import range contains our end date
          dateRange.start, dateRange.end    // Check if our range contains import range
        );
      } catch (error) {
        console.warn('Date overlap check failed:', error);
        dateOverlapImports = [];
      }
    }

    // 4. COMBINE AND ANALYZE RESULTS
    const allSuspiciousImports = new Map();

    // Add exact duplicates (highest priority)
    exactDuplicates.forEach(imp => {
      allSuspiciousImports.set(imp.id, {
        ...imp,
        similarity_score: 1.0,
        duplicate_type: 'exact_hash',
        risk_level: 'high'
      });
    });

    // Add similar name/size imports
    similarImports.forEach(imp => {
      if (!allSuspiciousImports.has(imp.id)) {
        const riskLevel = imp.similarity_score > 0.9 ? 'high' :
                         imp.similarity_score > 0.7 ? 'medium' : 'low';
        
        allSuspiciousImports.set(imp.id, {
          ...imp,
          duplicate_type: 'similar_file',
          risk_level: riskLevel
        });
      }
    });

    // Add date overlap imports
    dateOverlapImports.forEach(imp => {
      if (!allSuspiciousImports.has(imp.id)) {
        allSuspiciousImports.set(imp.id, {
          ...imp,
          similarity_score: 0.8, // High score for date overlap
          duplicate_type: 'date_overlap',
          risk_level: 'medium',
          date_range: {
            start: imp.range_start,
            end: imp.range_end
          }
        });
      } else {
        // Upgrade existing entry if it has date overlap
        const existing = allSuspiciousImports.get(imp.id);
        existing.duplicate_type = `${existing.duplicate_type}+date_overlap`;
        existing.risk_level = 'high';
        existing.date_range = {
          start: imp.range_start,
          end: imp.range_end
        };
      }
    });

    // 5. DETERMINE OVERALL RISK ASSESSMENT
    const suspiciousImportsList = Array.from(allSuspiciousImports.values());
    const isDuplicate = suspiciousImportsList.length > 0;
    
    let overallRiskLevel = 'low';
    if (suspiciousImportsList.some(imp => imp.risk_level === 'high')) {
      overallRiskLevel = 'high';
    } else if (suspiciousImportsList.some(imp => imp.risk_level === 'medium')) {
      overallRiskLevel = 'medium';
    }

    // 6. GENERATE WARNINGS AND RECOMMENDATIONS
    const warnings = [];
    const recommendations = [];

    // Type-specific warning and recommendation generation
    const generateTypeSpecificMessages = (importType, exactDuplicates, similarImports, dateOverlapImports) => {
      const messages = { warnings: [], recommendations: [] };

      if (exactDuplicates.length > 0) {
        messages.warnings.push('File yang persis sama telah di-import sebelumnya');
        messages.warnings.push('Data kemungkinan besar sudah ada di database');
        messages.recommendations.push('Periksa import history untuk konfirmasi');
      }

      if (similarImports.some(imp => imp.similarity_score > 0.8)) {
        messages.warnings.push('File dengan nama sangat mirip telah di-import');
        messages.recommendations.push('Pastikan ini bukan file yang sama dengan nama berbeda');
      }

      if (dateOverlapImports.length > 0) {
        if (importType === 'sales') {
          messages.warnings.push('Ada import penjualan sebelumnya dengan rentang tanggal yang overlap');
          messages.recommendations.push('Periksa periode penjualan untuk menghindari duplikat transaksi');
        } else if (importType === 'advertising') {
          messages.warnings.push('Ada import advertising sebelumnya dengan periode campaign yang overlap');
          messages.recommendations.push('Periksa periode campaign untuk menghindari duplikat data iklan');
        } else if (importType === 'advertising-settlement') {
          messages.warnings.push('Ada import settlement sebelumnya dengan periode yang overlap');
          messages.recommendations.push('Periksa periode settlement untuk menghindari duplikat pembayaran');
        }
        messages.recommendations.push('Gunakan filter untuk memastikan data unique');
      }

      // Import type specific recommendations
      switch (importType) {
        case 'products':
          if (similarImports.length > 0) {
            messages.warnings.push('Produk dengan kode serupa mungkin akan di-update');
            messages.recommendations.push('Pastikan Product Code sesuai dengan yang diinginkan');
            messages.recommendations.push('Review kategori dan brand untuk konsistensi');
          }
          break;
        
        case 'advertising':
          if (similarImports.length > 0) {
            messages.recommendations.push('Periksa Campaign Name untuk menghindari duplikat campaign');
            messages.recommendations.push('Validasi platform dan periode iklan');
          }
          break;
        
        case 'advertising-settlement':
          if (similarImports.length > 0) {
            messages.recommendations.push('Periksa Order ID settlement untuk menghindari duplikat');
            messages.recommendations.push('Validasi tanggal dan jumlah settlement');
          }
          break;
        
        case 'sales':
          if (similarImports.length > 0) {
            messages.recommendations.push('Periksa Order ID dan tanggal penjualan');
            messages.recommendations.push('Gunakan filter tanggal untuk validasi data');
          }
          break;
      }

      if (overallRiskLevel === 'low') {
        messages.recommendations.push('Import dapat dilanjutkan dengan aman');
        messages.recommendations.push('Monitor hasil import untuk memastikan data konsisten');
      }

      return messages;
    };

    const typeMessages = generateTypeSpecificMessages(importType, exactDuplicates, similarImports, dateOverlapImports);
    warnings.push(...typeMessages.warnings);
    recommendations.push(...typeMessages.recommendations);

    // 7. SAVE DUPLICATE CHECK LOG
    try {
      await prisma.duplicateCheckLog.create({
        data: {
          file_name: fileName,
          file_size: fileSize,
          file_hash: fileHash || null,
          import_type: importType,
          check_result: {
            is_duplicate: isDuplicate,
            risk_level: overallRiskLevel,
            similar_imports_count: suspiciousImportsList.length,
            exact_duplicates_count: exactDuplicates.length,
            date_range: dateRange || null
          },
          created_at: new Date()
        }
      });
    } catch (logError) {
      console.warn('Failed to log duplicate check:', logError);
      // Don't fail the check if logging fails
    }

    console.log(`✅ DUPLICATE CHECK COMPLETED: ${isDuplicate ? 'DUPLICATES FOUND' : 'NO DUPLICATES'} (Risk: ${overallRiskLevel})`);

    // 8. RETURN RESULTS
    res.json({
      success: true,
      data: {
        isDuplicate,
        riskLevel: overallRiskLevel,
        previousImports: suspiciousImportsList.slice(0, 10).map(imp => ({
          id: imp.id,
          file_name: imp.file_name,
          imported_at: imp.created_at,
          total_records: imp.total_records || 0,
          imported_records: imp.imported_records || 0,
          batch_name: imp.batch_name || `${importType} Import`,
          similarity_score: imp.similarity_score || 0,
          duplicate_type: imp.duplicate_type || 'unknown',
          date_range: imp.date_range || null,
          file_size: imp.file_size || null
        })),
        warnings,
        recommendations,
        fileHash: fileHash || null,
        checkSummary: {
          total_checked: similarNameImports.length,
          exact_duplicates: exactDuplicates.length,
          similar_files: similarImports.length,
          date_overlaps: dateOverlapImports.length,
          check_period_days: checkPeriod
        }
      }
    });

  } catch (error) {
    console.error('❌ DUPLICATE CHECK ERROR:', error);
    
    res.status(500).json({
      success: false,
      error: 'Duplicate check failed',
      message: error.message,
      data: {
        isDuplicate: false,
        riskLevel: 'low',
        previousImports: [],
        warnings: ['Duplicate check failed - proceed with caution'],
        recommendations: ['Monitor import results carefully']
      }
    });
  }
};

/**
 * Get Import History with Enhanced Metadata
 */
const getImportHistory = async (req, res) => {
  try {
    const { 
      importType, 
      limit = 20, 
      offset = 0,
      includeMetadata = true 
    } = req.query;

    const whereClause = importType ? { import_type: importType } : {};

    const imports = await prisma.importHistory.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: includeMetadata ? {
        importMetadata: true
      } : undefined
    });

    const total = await prisma.importHistory.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        imports,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > (parseInt(offset) + parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ GET IMPORT HISTORY ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get import history',
      message: error.message
    });
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

module.exports = {
  checkImportDuplicates,
  getImportHistory,
  extractDateRangeFromData,
  calculateStringSimilarity
};