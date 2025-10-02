/**
 * Flexible Column Validator v2.0
 * Validasi kolom yang fleksibel dengan smart matching untuk berbagai variasi nama kolom
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Interface untuk hasil validasi kolom
export interface FlexibleColumnValidationResult {
  isValid: boolean;
  expectedColumns: string[];
  actualColumns: string[];
  columnMappings: { [actualColumn: string]: string }; // actual -> expected mapping
  unmatchedExpected: string[];
  unmatchedActual: string[];
  suggestions?: string[];
  confidence: number; // 0-100 percentage of how confident we are in the matching
}

// Definisi kolom yang diperlukan untuk setiap import type
export const REQUIRED_COLUMNS = {
  sales: [
    'Order ID',
    'Seller SKU', 
    'Product Name',
    'Quantity',
    'Order Amount',
    'Created Time',
    'Customer',
    'Province',
    'Regency & City'
  ],
  
  products: [
    'Product Code',
    'Product Name',
    'Category',
    'Brand',
    'Size',
    'Color', 
    'Price',
    'Cost Price',
    'Stock Quantity',
    'Min Stock'
  ],
  
  stock: [
    'Product Code',
    'Movement Type',
    'Quantity', 
    'Reference Number',
    'Notes',
    'Movement Date'
  ],
  
  advertising: [
    'Campaign Name',
    'Date Range Start',
    'Date Range End', 
    'Platform',
    'Cost',
    'Impressions',
    'Clicks',
    'Conversions'
  ],
  
  'advertising-settlement': [
    'Order ID',
    'Type',
    'Order Created Time',
    'Order Settled Time', 
    'Settlement Amount'
  ]
} as const;

// Smart column matching patterns
const COLUMN_PATTERNS = {
  sales: {
    'Order ID': [
      'order_id', 'order-id', 'orderid', 'id', 'order_number', 'order_no',
      'Order_ID', 'OrderID', 'Order-ID', 'Order Number', 'Order No'
    ],
    'Seller SKU': [
      'seller_sku', 'seller-sku', 'sellersku', 'sku', 'product_code', 'product-code',
      'Seller_SKU', 'SellerSKU', 'Seller-SKU', 'Product Code', 'SKU'
    ],
    'Product Name': [
      'product_name', 'product-name', 'productname', 'name', 'nama_produk', 'nama-produk',
      'Product_Name', 'ProductName', 'Product-Name', 'Nama Produk', 'Name'
    ],
    'Quantity': [
      'quantity', 'qty', 'jumlah', 'amount', 'qty_sold', 'qty-sold',
      'Quantity', 'QTY', 'Jumlah', 'Amount', 'Qty Sold'
    ],
    'Order Amount': [
      'order_amount', 'order-amount', 'orderamount', 'amount', 'total', 'harga', 'price',
      'Order_Amount', 'OrderAmount', 'Order-Amount', 'Total', 'Harga', 'Price'
    ],
    'Created Time': [
      'created_time', 'created-time', 'createdtime', 'date', 'tanggal', 'waktu', 'timestamp',
      'Created_Time', 'CreatedTime', 'Created-Time', 'Date', 'Tanggal', 'Waktu'
    ],
    'Customer': [
      'customer', 'customer_name', 'customer-name', 'customername', 'nama_customer', 'buyer',
      'Customer', 'Customer_Name', 'CustomerName', 'Customer-Name', 'Nama Customer', 'Buyer'
    ],
    'Province': [
      'province', 'provinsi', 'state', 'region',
      'Province', 'Provinsi', 'State', 'Region'
    ],
    'Regency & City': [
      'regency_city', 'regency-city', 'regencycity', 'city', 'kota', 'regency', 'kabupaten',
      'Regency_City', 'RegencyCity', 'Regency-City', 'City', 'Kota', 'Regency', 'Kabupaten'
    ]
  },
  
  products: {
    'Product Code': [
      'product_code', 'product-code', 'productcode', 'code', 'sku', 'seller_sku',
      'Product_Code', 'ProductCode', 'Product-Code', 'Code', 'SKU'
    ],
    'Product Name': [
      'product_name', 'product-name', 'productname', 'name', 'nama_produk',
      'Product_Name', 'ProductName', 'Product-Name', 'Name', 'Nama Produk'
    ],
    'Category': [
      'category', 'kategori', 'cat', 'product_category',
      'Category', 'Kategori', 'Cat', 'Product Category'
    ],
    'Brand': [
      'brand', 'merek', 'brand_name', 'manufacturer',
      'Brand', 'Merek', 'Brand Name', 'Manufacturer'
    ],
    'Size': [
      'size', 'ukuran', 'sz', 'product_size',
      'Size', 'Ukuran', 'Sz', 'Product Size'
    ],
    'Color': [
      'color', 'warna', 'colour', 'product_color',
      'Color', 'Warna', 'Colour', 'Product Color'
    ],
    'Price': [
      'price', 'harga', 'selling_price', 'sell_price', 'retail_price',
      'Price', 'Harga', 'Selling Price', 'Sell Price', 'Retail Price'
    ],
    'Cost Price': [
      'cost_price', 'cost-price', 'costprice', 'cost', 'hpp', 'purchase_price',
      'Cost_Price', 'CostPrice', 'Cost-Price', 'Cost', 'HPP', 'Purchase Price'
    ],
    'Stock Quantity': [
      'stock_quantity', 'stock-quantity', 'stockquantity', 'stock', 'qty', 'quantity',
      'Stock_Quantity', 'StockQuantity', 'Stock-Quantity', 'Stock', 'QTY'
    ],
    'Min Stock': [
      'min_stock', 'min-stock', 'minstock', 'minimum_stock', 'safety_stock',
      'Min_Stock', 'MinStock', 'Min-Stock', 'Minimum Stock', 'Safety Stock'
    ]
  },
  
  stock: {
    'Product Code': [
      'product_code', 'product-code', 'productcode', 'code', 'sku',
      'Product_Code', 'ProductCode', 'Product-Code', 'Code', 'SKU'
    ],
    'Movement Type': [
      'movement_type', 'movement-type', 'movementtype', 'type', 'tipe', 'transaction_type',
      'Movement_Type', 'MovementType', 'Movement-Type', 'Type', 'Tipe'
    ],
    'Quantity': [
      'quantity', 'qty', 'jumlah', 'amount',
      'Quantity', 'QTY', 'Jumlah', 'Amount'
    ],
    'Reference Number': [
      'reference_number', 'reference-number', 'referencenumber', 'ref_no', 'ref_number',
      'Reference_Number', 'ReferenceNumber', 'Reference-Number', 'Ref No', 'Ref Number'
    ],
    'Notes': [
      'notes', 'note', 'catatan', 'keterangan', 'description', 'remarks',
      'Notes', 'Note', 'Catatan', 'Keterangan', 'Description', 'Remarks'
    ],
    'Movement Date': [
      'movement_date', 'movement-date', 'movementdate', 'date', 'tanggal', 'transaction_date',
      'Movement_Date', 'MovementDate', 'Movement-Date', 'Date', 'Tanggal'
    ]
  },
  
  advertising: {
    'Campaign Name': [
      'campaign_name', 'campaign-name', 'campaignname', 'name', 'nama_campaign',
      'Campaign_Name', 'CampaignName', 'Campaign-Name', 'Name', 'Nama Campaign'
    ],
    'Date Range Start': [
      'date_range_start', 'date-range-start', 'start_date', 'start-date', 'tanggal_mulai',
      'Date_Range_Start', 'Start Date', 'Start-Date', 'Tanggal Mulai'
    ],
    'Date Range End': [
      'date_range_end', 'date-range-end', 'end_date', 'end-date', 'tanggal_selesai',
      'Date_Range_End', 'End Date', 'End-Date', 'Tanggal Selesai'
    ],
    'Platform': [
      'platform', 'channel', 'media', 'ad_platform',
      'Platform', 'Channel', 'Media', 'Ad Platform'
    ],
    'Cost': [
      'cost', 'spend', 'biaya', 'budget', 'amount',
      'Cost', 'Spend', 'Biaya', 'Budget', 'Amount'
    ],
    'Impressions': [
      'impressions', 'impression', 'tayangan', 'views', 'reach',
      'Impressions', 'Impression', 'Tayangan', 'Views', 'Reach'
    ],
    'Clicks': [
      'clicks', 'click', 'klik', 'ctr_clicks',
      'Clicks', 'Click', 'Klik', 'CTR Clicks'
    ],
    'Conversions': [
      'conversions', 'conversion', 'konversi', 'sales', 'purchases',
      'Conversions', 'Conversion', 'Konversi', 'Sales', 'Purchases'
    ]
  },
  
  'advertising-settlement': {
    'Order ID': [
      'order_id', 'order-id', 'orderid', 'id', 'order_number',
      'Order_ID', 'OrderID', 'Order-ID', 'ID', 'Order Number'
    ],
    'Type': [
      'type', 'tipe', 'jenis', 'settlement_type', 'transaction_type',
      'Type', 'Tipe', 'Jenis', 'Settlement Type', 'Transaction Type'
    ],
    'Order Created Time': [
      'order_created_time', 'order-created-time', 'created_time', 'create_time', 'waktu_buat',
      'Order_Created_Time', 'Created Time', 'Create Time', 'Waktu Buat'
    ],
    'Order Settled Time': [
      'order_settled_time', 'order-settled-time', 'settled_time', 'settlement_time', 'waktu_settlement',
      'Order_Settled_Time', 'Settled Time', 'Settlement Time', 'Waktu Settlement'
    ],
    'Settlement Amount': [
      'settlement_amount', 'settlement-amount', 'amount', 'settled_amount', 'jumlah_settlement',
      'Settlement_Amount', 'Amount', 'Settled Amount', 'Jumlah Settlement'
    ]
  }
};

/**
 * Normalize string for comparison - removes spaces, underscores, hyphens and converts to lowercase
 */
function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[_\-\s]+/g, '')
    .trim();
}

/**
 * Calculate similarity score between two strings (0-100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  // Exact match after normalization
  if (norm1 === norm2) return 100;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  
  if (maxLength === 0) return 100;
  
  const similarity = (1 - distance / maxLength) * 100;
  return Math.max(0, similarity);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find best match for a column using patterns and similarity
 */
function findBestMatch(actualColumn: string, expectedColumns: string[], importType: keyof typeof COLUMN_PATTERNS): {
  match: string | null;
  confidence: number;
  method: string;
} {
  const patterns = COLUMN_PATTERNS[importType] || {};
  
  // First, try exact pattern matching
  for (const [expectedCol, variations] of Object.entries(patterns)) {
    if (expectedColumns.includes(expectedCol)) {
      // Check exact match with variations
      for (const variation of variations) {
        if (normalizeString(actualColumn) === normalizeString(variation)) {
          return { match: expectedCol, confidence: 100, method: 'pattern_exact' };
        }
      }
    }
  }
  
  // Then try similarity matching with expected columns
  let bestMatch = null;
  let bestScore = 0;
  let bestMethod = 'similarity';
  
  for (const expectedCol of expectedColumns) {
    // Direct similarity with expected column
    const directScore = calculateSimilarity(actualColumn, expectedCol);
    if (directScore > bestScore && directScore >= 70) {
      bestScore = directScore;
      bestMatch = expectedCol;
      bestMethod = 'direct_similarity';
    }
    
    // Similarity with pattern variations
    const variations = patterns[expectedCol] || [];
    for (const variation of variations) {
      const varScore = calculateSimilarity(actualColumn, variation);
      if (varScore > bestScore && varScore >= 80) {
        bestScore = varScore;
        bestMatch = expectedCol;
        bestMethod = 'pattern_similarity';
      }
    }
  }
  
  return { 
    match: bestScore >= 70 ? bestMatch : null, 
    confidence: bestScore, 
    method: bestMethod 
  };
}

/**
 * Extract column headers from file
 */
export async function extractColumnHeaders(file: File): Promise<string[]> {
  try {
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    
    if (isCSV) {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          preview: 1,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV header extraction error: ${results.errors[0].message}`));
              return;
            }
            
            const headers = results.meta.fields || [];
            resolve(headers.map(h => h.trim()));
          },
          error: (error) => {
            reject(new Error(`CSV parsing error: ${error.message}`));
          }
        });
      });
    } else {
      // Excel file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      const headers: string[] = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          headers.push(String(cell.v).trim());
        }
      }
      
      return headers;
    }
  } catch (error) {
    throw new Error(`Failed to extract headers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Flexible column validation with smart matching
 */
export function validateColumnNamesFlexible(
  actualColumns: string[], 
  importType: keyof typeof REQUIRED_COLUMNS
): FlexibleColumnValidationResult {
  
  const expectedColumns = [...REQUIRED_COLUMNS[importType]];
  const normalizedActual = actualColumns.map(col => col.trim()).filter(col => col.length > 0);
  
  console.log('🔍 Flexible Column Validation:', {
    importType,
    expectedColumns,
    actualColumns: normalizedActual
  });
  
  // Create column mappings
  const columnMappings: { [actualColumn: string]: string } = {};
  const matchedExpected = new Set<string>();
  const matchedActual = new Set<string>();
  let totalConfidence = 0;
  const matchDetails: Array<{actual: string, expected: string, confidence: number, method: string}> = [];
  
  // Find best matches for each actual column
  for (const actualCol of normalizedActual) {
    const availableExpected = expectedColumns.filter(exp => !matchedExpected.has(exp));
    const bestMatch = findBestMatch(actualCol, availableExpected, importType);
    
    if (bestMatch.match && bestMatch.confidence >= 70) {
      columnMappings[actualCol] = bestMatch.match;
      matchedExpected.add(bestMatch.match);
      matchedActual.add(actualCol);
      totalConfidence += bestMatch.confidence;
      matchDetails.push({
        actual: actualCol,
        expected: bestMatch.match,
        confidence: bestMatch.confidence,
        method: bestMatch.method
      });
    }
  }
  
  const unmatchedExpected = expectedColumns.filter(col => !matchedExpected.has(col));
  const unmatchedActual = normalizedActual.filter(col => !matchedActual.has(col));
  
  const averageConfidence = matchDetails.length > 0 ? totalConfidence / matchDetails.length : 0;
  const coverageRatio = matchedExpected.size / expectedColumns.length;
  const finalConfidence = Math.round(averageConfidence * coverageRatio);
  
  // Determine if validation passes
  const isValid = unmatchedExpected.length === 0 && finalConfidence >= 70;
  
  console.log('📊 Column Matching Results:', {
    matchDetails,
    columnMappings,
    unmatchedExpected,
    unmatchedActual,
    finalConfidence,
    isValid
  });
  
  // Generate suggestions for unmatched columns
  const suggestions: string[] = [];
  
  for (const unmatched of unmatchedExpected) {
    const patterns = COLUMN_PATTERNS[importType]?.[unmatched] || [];
    if (patterns.length > 0) {
      suggestions.push(`Kolom "${unmatched}" bisa juga bernama: ${patterns.slice(0, 3).join(', ')}`);
    }
  }
  
  for (const actualCol of unmatchedActual) {
    const possibleMatches = expectedColumns.map(exp => ({
      expected: exp,
      similarity: calculateSimilarity(actualCol, exp)
    })).filter(m => m.similarity >= 50).sort((a, b) => b.similarity - a.similarity);
    
    if (possibleMatches.length > 0) {
      suggestions.push(`Kolom "${actualCol}" mungkin maksudnya "${possibleMatches[0].expected}" (${Math.round(possibleMatches[0].similarity)}% mirip)`);
    }
  }
  
  return {
    isValid,
    expectedColumns,
    actualColumns: normalizedActual,
    columnMappings,
    unmatchedExpected,
    unmatchedActual,
    suggestions,
    confidence: finalConfidence
  };
}

/**
 * Validate import file columns with flexible matching
 */
export async function validateImportColumnsFlexible(
  file: File, 
  importType: keyof typeof REQUIRED_COLUMNS
): Promise<FlexibleColumnValidationResult> {
  
  try {
    console.log('🔍 Starting flexible column validation for:', { 
      fileName: file.name, 
      importType,
      fileSize: `${(file.size / 1024).toFixed(1)}KB`
    });
    
    const actualColumns = await extractColumnHeaders(file);
    console.log('📋 Extracted columns from file:', actualColumns);
    
    const validation = validateColumnNamesFlexible(actualColumns, importType);
    
    if (!validation.isValid) {
      console.warn('⚠️ Column validation passed with warnings:', validation);
    } else {
      console.log('✅ Column validation passed with flexible matching');
    }
    
    return validation;
    
  } catch (error) {
    console.error('❌ Column validation error:', error);
    
    return {
      isValid: false,
      expectedColumns: REQUIRED_COLUMNS[importType],
      actualColumns: [],
      columnMappings: {},
      unmatchedExpected: REQUIRED_COLUMNS[importType],
      unmatchedActual: [],
      suggestions: ['Pastikan file tidak corrupt dan gunakan format .xlsx atau .csv'],
      confidence: 0
    };
  }
}

/**
 * Get display name for import types
 */
export function getImportTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'sales': 'Data Penjualan',
    'products': 'Data Produk', 
    'stock': 'Data Stok',
    'advertising': 'Data Advertising',
    'advertising-settlement': 'Data Settlement Advertising'
  };
  return typeMap[type] || type;
}