/**
 * Strict Column Validator v1.0
 * Validasi kolom yang ketat untuk import - jika ada satu kolom saja berbeda, 
 * batalkan seluruh import dan tidak ada data yang masuk
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Interface untuk hasil validasi kolom
export interface ColumnValidationResult {
  isValid: boolean;
  expectedColumns: string[];
  actualColumns: string[];
  missingColumns: string[];
  extraColumns: string[];
  errorMessage?: string;
  suggestions?: string[];
}

// Definisi exact column names yang diperlukan untuk setiap import type
export const EXACT_REQUIRED_COLUMNS = {
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

// Alternative/common column name variations for better error messages
const COMMON_VARIATIONS = {
  sales: {
    'Order ID': ['order_id', 'id', 'Order_ID', 'OrderID'],
    'Seller SKU': ['seller_sku', 'sku', 'product_code', 'code'],
    'Product Name': ['product_name', 'nama_produk', 'name'],
    'Quantity': ['quantity', 'qty', 'jumlah'],
    'Order Amount': ['order_amount', 'amount', 'total', 'harga'],
    'Created Time': ['created_time', 'date', 'tanggal', 'waktu'],
    'Customer': ['customer', 'customer_name', 'nama_customer'],
    'Province': ['province', 'provinsi'],
    'Regency & City': ['regency_city', 'kota', 'city']
  },
  
  products: {
    'Product Code': ['product_code', 'code', 'sku', 'seller_sku'],
    'Product Name': ['product_name', 'name', 'nama_produk'],
    'Category': ['category', 'kategori'],
    'Brand': ['brand', 'merek'],
    'Size': ['size', 'ukuran'],
    'Color': ['color', 'warna'],
    'Price': ['price', 'harga', 'selling_price'],
    'Cost Price': ['cost_price', 'cost', 'hpp'],
    'Stock Quantity': ['stock_quantity', 'stock', 'qty'],
    'Min Stock': ['min_stock', 'minimum_stock', 'safety_stock']
  },
  
  stock: {
    'Product Code': ['product_code', 'code', 'sku'],
    'Movement Type': ['movement_type', 'type', 'tipe'],
    'Quantity': ['quantity', 'qty', 'jumlah'],
    'Reference Number': ['reference_number', 'ref_no', 'no_ref'],
    'Notes': ['notes', 'catatan', 'keterangan'],
    'Movement Date': ['movement_date', 'date', 'tanggal']
  },
  
  advertising: {
    'Campaign Name': ['campaign_name', 'name', 'nama_campaign'],
    'Date Range Start': ['date_range_start', 'start_date', 'tanggal_mulai'],
    'Date Range End': ['date_range_end', 'end_date', 'tanggal_selesai'],
    'Platform': ['platform', 'channel', 'media'],
    'Cost': ['cost', 'spend', 'biaya'],
    'Impressions': ['impressions', 'impression', 'tayangan'],
    'Clicks': ['clicks', 'click', 'klik'],
    'Conversions': ['conversions', 'conversion', 'konversi']
  },
  
  'advertising-settlement': {
    'Order ID': ['order_id', 'id', 'Order_ID'],
    'Type': ['type', 'tipe', 'jenis'],
    'Order Created Time': ['order_created_time', 'created_time', 'waktu_buat'],
    'Order Settled Time': ['order_settled_time', 'settled_time', 'waktu_settlement'],
    'Settlement Amount': ['settlement_amount', 'amount', 'jumlah_settlement']
  }
};

/**
 * Extract column headers from file without processing data
 */
export async function extractColumnHeaders(file: File): Promise<string[]> {
  try {
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    
    if (isCSV) {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          preview: 1, // Only read first row
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
      
      // Get range to determine column headers
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      const headers: string[] = [];
      
      // Extract headers from first row
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
 * Validate column names strictly - must match exactly
 */
export function validateColumnNamesStrict(
  actualColumns: string[], 
  importType: keyof typeof EXACT_REQUIRED_COLUMNS
): ColumnValidationResult {
  
  const expectedColumns = [...EXACT_REQUIRED_COLUMNS[importType]];
  const normalizedActual = actualColumns.map(col => col.trim());
  const normalizedExpected = expectedColumns.map(col => col.trim());
  
  console.log('🔍 Strict Column Validation:', {
    importType,
    expectedColumns: normalizedExpected,
    actualColumns: normalizedActual
  });
  
  // Check for exact match
  const isExactMatch = normalizedExpected.length === normalizedActual.length &&
    normalizedExpected.every(expected => normalizedActual.includes(expected));
  
  if (isExactMatch) {
    return {
      isValid: true,
      expectedColumns: normalizedExpected,
      actualColumns: normalizedActual,
      missingColumns: [],
      extraColumns: []
    };
  }
  
  // Find missing and extra columns
  const missingColumns = normalizedExpected.filter(col => !normalizedActual.includes(col));
  const extraColumns = normalizedActual.filter(col => !normalizedExpected.includes(col));
  
  // Generate detailed error message
  let errorMessage = `❌ **KOLOM TIDAK SESUAI - IMPORT DIBATALKAN**\\n\\n`;
  errorMessage += `🗂️ **File Import Type**: ${getImportTypeDisplayName(importType)}\\n\\n`;
  
  if (missingColumns.length > 0) {
    errorMessage += `📋 **Kolom yang Hilang** (${missingColumns.length}):\\n`;
    missingColumns.forEach((col, index) => {
      errorMessage += `   ${index + 1}. "${col}"\\n`;
    });
    errorMessage += `\\n`;
  }
  
  if (extraColumns.length > 0) {
    errorMessage += `➕ **Kolom Tambahan** (${extraColumns.length}):\\n`;
    extraColumns.forEach((col, index) => {
      errorMessage += `   ${index + 1}. "${col}"\\n`;
    });
    errorMessage += `\\n`;
  }
  
  errorMessage += `✅ **Kolom yang Diharapkan** (${normalizedExpected.length}):\\n`;
  normalizedExpected.forEach((col, index) => {
    const isPresent = normalizedActual.includes(col);
    errorMessage += `   ${index + 1}. "${col}" ${isPresent ? '✅' : '❌'}\\n`;
  });
  
  errorMessage += `\\n📝 **Solusi:**\\n`;
  errorMessage += `1. Download template yang benar dengan tombol "Download Template"\\n`;
  errorMessage += `2. Copy data Anda ke template tersebut\\n`;
  errorMessage += `3. Pastikan nama kolom persis sama (case-sensitive)\\n`;
  errorMessage += `4. Jangan tambah atau kurangi kolom apapun\\n`;
  errorMessage += `\\n⚠️ **PENTING**: Semua nama kolom harus persis sama dengan template!`;
  
  // Generate suggestions based on common variations
  const suggestions = generateColumnSuggestions(missingColumns, extraColumns, importType);
  
  return {
    isValid: false,
    expectedColumns: normalizedExpected,
    actualColumns: normalizedActual,
    missingColumns,
    extraColumns,
    errorMessage,
    suggestions
  };
}

/**
 * Generate suggestions for common column name mistakes
 */
function generateColumnSuggestions(
  missingColumns: string[],
  extraColumns: string[],
  importType: keyof typeof EXACT_REQUIRED_COLUMNS
): string[] {
  const suggestions: string[] = [];
  const variations = COMMON_VARIATIONS[importType] || {};
  
  missingColumns.forEach(missing => {
    const possibleMatches = variations[missing] || [];
    const foundMatch = extraColumns.find(extra => 
      possibleMatches.some(variation => 
        extra.toLowerCase() === variation.toLowerCase()
      )
    );
    
    if (foundMatch) {
      suggestions.push(`Kolom "${foundMatch}" mungkin maksudnya "${missing}"`);
    }
  });
  
  return suggestions;
}

/**
 * Get display name for import types
 */
function getImportTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'sales': 'Data Penjualan',
    'products': 'Data Produk', 
    'stock': 'Data Stok',
    'advertising': 'Data Advertising',
    'advertising-settlement': 'Data Settlement Advertising'
  };
  return typeMap[type] || type;
}

/**
 * Validate import file columns before processing
 * Returns validation result - if invalid, import should be cancelled completely
 */
export async function validateImportColumns(
  file: File, 
  importType: keyof typeof EXACT_REQUIRED_COLUMNS
): Promise<ColumnValidationResult> {
  
  try {
    console.log('🔍 Starting strict column validation for:', { 
      fileName: file.name, 
      importType,
      fileSize: `${(file.size / 1024).toFixed(1)}KB`
    });
    
    // Extract column headers from file
    const actualColumns = await extractColumnHeaders(file);
    
    console.log('📋 Extracted columns from file:', actualColumns);
    
    // Perform strict validation
    const validation = validateColumnNamesStrict(actualColumns, importType);
    
    if (!validation.isValid) {
      console.error('❌ Column validation failed:', validation);
    } else {
      console.log('✅ Column validation passed - all columns match exactly');
    }
    
    return validation;
    
  } catch (error) {
    console.error('❌ Column validation error:', error);
    
    return {
      isValid: false,
      expectedColumns: EXACT_REQUIRED_COLUMNS[importType],
      actualColumns: [],
      missingColumns: [],
      extraColumns: [],
      errorMessage: `❌ **GAGAL MEMBACA FILE**\\n\\nTidak dapat membaca struktur kolom dari file.\\n\\n**Error**: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\n📝 **Solusi:**\\n1. Pastikan file tidak corrupt\\n2. Gunakan format .xlsx atau .csv\\n3. Download template baru jika diperlukan`,
      suggestions: []
    };
  }
}

/**
 * Pre-validate file before sending to backend
 * This is called from the frontend before making API request
 */
export async function preValidateImportFile(
  file: File,
  importType: 'sales' | 'products' | 'stock' | 'advertising' | 'advertising-settlement'
): Promise<{
  canProceed: boolean;
  validation: ColumnValidationResult;
}> {
  
  console.log('🚀 Pre-validating import file:', {
    fileName: file.name,
    importType,
    fileSize: file.size
  });
  
  // Validate columns first
  const validation = await validateImportColumns(file, importType);
  
  if (!validation.isValid) {
    console.log('🚫 Import cancelled due to column validation failure');
    return {
      canProceed: false,
      validation
    };
  }
  
  console.log('✅ Pre-validation passed - import can proceed');
  return {
    canProceed: true,
    validation
  };
}

/**
 * Get expected template structure for display in UI
 */
export function getExpectedColumnStructure(importType: keyof typeof EXACT_REQUIRED_COLUMNS) {
  const columns = EXACT_REQUIRED_COLUMNS[importType];
  const variations = COMMON_VARIATIONS[importType] || {};
  
  return {
    requiredColumns: [...columns],
    totalColumns: columns.length,
    commonVariations: variations,
    importType: getImportTypeDisplayName(importType)
  };
}

/**
 * Generate helpful error message for UI display
 */
export function formatColumnValidationError(validation: ColumnValidationResult): string {
  if (validation.isValid) return '';
  
  let message = validation.errorMessage || '';
  
  if (validation.suggestions && validation.suggestions.length > 0) {
    message += `\\n\\n💡 **Kemungkinan Perbaikan:**\\n`;
    validation.suggestions.forEach((suggestion, index) => {
      message += `${index + 1}. ${suggestion}\\n`;
    });
  }
  
  return message;
}

// Note: EXACT_REQUIRED_COLUMNS and COMMON_VARIATIONS are already exported above
// No need to re-export them here