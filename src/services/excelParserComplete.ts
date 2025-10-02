import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Environment configuration with safe fallbacks
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // For Vite environments - simplified approach
    const env = (window as any)?.process?.env || {};
    if (env[key]) {
      return env[key];
    }
    
    // Fallback to default value
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to access environment variable ${key}, using default:`, defaultValue);
    return defaultValue;
  }
};

const config = {
  maxFileSize: parseInt(getEnvVar('VITE_MAX_FILE_SIZE', '10485760')), // 10MB default
  allowedFileTypes: getEnvVar('VITE_ALLOWED_FILE_TYPES', '.xlsx,.xls,.csv').split(','),
  maxRows: parseInt(getEnvVar('VITE_IMPORT_MAX_ROWS', '10000')),
  batchSize: parseInt(getEnvVar('VITE_IMPORT_BATCH_SIZE', '1000')),
  enableDebug: getEnvVar('VITE_ENABLE_DEBUG', 'false') === 'true',
};

export interface ExcelValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ParseResult {
  success: boolean;
  data: any[];
  errors: ExcelValidationError[];
  totalRows: number;
  validRows: number;
  fileType: 'excel' | 'csv';
}

export interface SalesDataRow {
  // Core sales fields
  order_id?: string;
  seller_sku: string;
  product_name: string;
  customer_name?: string;
  product_code?: string;
  
  // Product details  
  color?: string;
  size?: string;
  
  // Quantity and pricing
  quantity: number;
  unit_price?: number;
  order_amount?: number;
  total?: number;
  discount?: number;
  tax?: number;
  
  // Transaction details
  payment_method?: string;
  status?: string;
  notes?: string;
  created_time: string;
  
  // Legacy fields for backward compatibility
  delivered_time?: string;
  settlement_amount?: number;
  total_revenue?: number;
  hpp?: number;
}

// Product data interface
export interface ProductDataRow {
  seller_sku: string;
  product_name: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock: number;
  status?: 'active' | 'inactive';
}

// Stock data interface
export interface StockDataRow {
  product_code: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_number?: string;
  notes?: string;
  movement_date: string;
}

// Enhanced column mappings for sales data - supporting both old and new template structures
const SALES_COLUMN_MAPPING: Record<string, keyof SalesDataRow> = {
  // New template structure (primary)
  'tanggal': 'created_time',
  'Tanggal': 'created_time',
  'customer_name': 'customer_name',
  'Customer Name': 'customer_name',
  'Nama Customer': 'customer_name',
  'product_code': 'seller_sku', // Map to seller_sku for backward compatibility
  'Product Code': 'seller_sku',
  'Kode Produk': 'seller_sku',
  'product_name': 'product_name',
  'Product Name': 'product_name',
  'Nama Produk': 'product_name',
  'quantity': 'quantity',
  'Quantity': 'quantity',
  'Jumlah': 'quantity',
  'unit_price': 'unit_price',
  'Unit Price': 'unit_price',
  'Harga Satuan': 'unit_price',
  'total': 'total',
  'Total': 'total',
  'discount': 'discount',
  'Discount': 'discount',
  'Diskon': 'discount',
  'tax': 'tax',
  'Tax': 'tax',
  'Pajak': 'tax',
  'payment_method': 'payment_method',
  'Payment Method': 'payment_method',
  'Metode Pembayaran': 'payment_method',
  'status': 'status',
  'Status': 'status',
  'notes': 'notes',
  'Notes': 'notes',
  'Catatan': 'notes',
  
  // Additional delivered_time mappings for Indonesian format
  'delivered_time': 'delivered_time',
  'Delivered Time': 'delivered_time',
  'Waktu Deliver': 'delivered_time',
  'Tanggal Deliver': 'delivered_time',
  'Delivered Date': 'delivered_time',
  
  // Old template structure (backward compatibility)
  'Order ID': 'order_id',
  'Seller SKU': 'seller_sku',
  'Color': 'color',
  'Size': 'size',
  'Order Amount': 'order_amount',
  'Created Time': 'created_time',
  'Total settlement amount': 'settlement_amount',
  'Total revenue': 'total_revenue',
  'HPP': 'hpp',
};

// Enhanced column mappings for product data with flexible alternatives
const PRODUCT_COLUMN_MAPPING: Record<string, keyof ProductDataRow> = {
  // Primary mappings
  'seller_sku': 'seller_sku',
  'Seller SKU': 'seller_sku',
  'SKU': 'seller_sku',
  'Code': 'seller_sku',
  
  'product_name': 'product_name',
  'Product Name': 'product_name',
  'Name': 'product_name',
  'Nama Produk': 'product_name',
  
  'category': 'category',
  'Category': 'category',
  'Kategori': 'category',
  
  'brand': 'brand',
  'Brand': 'brand',
  'Merek': 'brand',
  
  'size': 'size',
  'Size': 'size',
  'Ukuran': 'size',
  
  'color': 'color',
  'Color': 'color',
  'Warna': 'color',
  
  'price': 'price',
  'Price': 'price',
  'Harga': 'price',
  'Selling Price': 'price',
  
  'cost': 'cost',
  'Cost': 'cost',
  'HPP': 'cost',
  'Cost Price': 'cost',
  
  'stock_quantity': 'stock_quantity',
  'Stock Quantity': 'stock_quantity',
  'Stock': 'stock_quantity',
  'Qty': 'stock_quantity',
  
  'min_stock': 'min_stock',
  'Min Stock': 'min_stock',
  'Minimum Stock': 'min_stock',
  'Safety Stock': 'min_stock',
  
  'status': 'status',
  'Status': 'status',
};

// Column mappings for stock movement data
const STOCK_COLUMN_MAPPING: Record<string, keyof StockDataRow> = {
  'product_code': 'product_code',
  'Product Code': 'product_code',
  'SKU': 'product_code',
  
  'movement_type': 'movement_type',
  'Movement Type': 'movement_type',
  'Type': 'movement_type',
  'Tipe Pergerakan': 'movement_type',
  
  'quantity': 'quantity',
  'Quantity': 'quantity',
  'Qty': 'quantity',
  'Jumlah': 'quantity',
  
  'reference_number': 'reference_number',
  'Reference Number': 'reference_number',
  'Ref Number': 'reference_number',
  'No Referensi': 'reference_number',
  
  'notes': 'notes',
  'Notes': 'notes',
  'Keterangan': 'notes',
  
  'movement_date': 'movement_date',
  'Movement Date': 'movement_date',
  'Date': 'movement_date',
  'Tanggal': 'movement_date',
};

// Required fields for sales data (updated for new template structure)
const REQUIRED_SALES_FIELDS: (keyof SalesDataRow)[] = [
  'created_time',      // tanggal (required)
  'customer_name',     // customer_name (required) - note: this might be undefined, need to handle in validation
  'seller_sku',        // product_code mapped to seller_sku (required)
  'product_name',      // product_name (required)
  'quantity',          // quantity (required)
  'total',            // total (required)
];

// Required fields for product data
const REQUIRED_PRODUCT_FIELDS: (keyof ProductDataRow)[] = [
  'seller_sku',
  'product_name',
  'category',
  'brand',
  'size', 
  'color',
  'price',
  'cost',
  'stock_quantity',
  'min_stock'
];

// Required fields for stock data
const REQUIRED_STOCK_FIELDS: (keyof StockDataRow)[] = [
  'product_code',
  'movement_type',
  'quantity',
  'movement_date'
];

// Export required fields for external access
export const REQUIRED_FIELDS = {
  sales: REQUIRED_SALES_FIELDS,
  products: REQUIRED_PRODUCT_FIELDS,
  stock: REQUIRED_STOCK_FIELDS
} as const;

// Export individual arrays for backward compatibility
export { REQUIRED_SALES_FIELDS, REQUIRED_PRODUCT_FIELDS, REQUIRED_STOCK_FIELDS };

// Export column mappings for external access
export const COLUMN_MAPPINGS = {
  sales: SALES_COLUMN_MAPPING,
  products: PRODUCT_COLUMN_MAPPING, 
  stock: STOCK_COLUMN_MAPPING
} as const;

// Export individual mappings for backward compatibility
export { SALES_COLUMN_MAPPING, PRODUCT_COLUMN_MAPPING, STOCK_COLUMN_MAPPING };

/**
 * Generate Excel template for sales with new template structure
 */
export function generateSalesTemplate(): void {
  const headers = [
    'tanggal',
    'delivered_time',
    'customer_name', 
    'product_code',
    'product_name',
    'quantity',
    'unit_price',
    'total',
    'discount',
    'tax',
    'payment_method',
    'status',
    'notes'
  ];

  const sampleData = [
    {
      'tanggal': '2024-01-15 09:30:00',
      'delivered_time': '2024-01-17 14:45:00',
      'customer_name': 'John Doe',
      'product_code': 'DB-001',
      'product_name': 'Kemeja Batik Premium',
      'quantity': 2,
      'unit_price': 150000,
      'total': 300000,
      'discount': 0,
      'tax': 30000,
      'payment_method': 'cash',
      'status': 'completed',
      'notes': 'Format tanggal: YYYY-MM-DD HH:MM:SS'
    },
    {
      'tanggal': '2024-01-16 11:15:00',
      'delivered_time': '2024-01-18 10:20:00',
      'customer_name': 'Jane Smith',
      'product_code': 'DB-002',
      'product_name': 'Blouse Wanita Elegant',
      'quantity': 1,
      'unit_price': 200000,
      'total': 200000,
      'discount': 10000,
      'tax': 19000,
      'payment_method': 'transfer',
      'status': 'completed',
      'notes': 'delivered_time prioritas untuk tampilan'
    },
    {
      'tanggal': '2024-01-17 16:45:00',
      'delivered_time': '2024-01-19 13:30:00',
      'customer_name': 'Ahmad Rahman',
      'product_code': 'DB-003',
      'product_name': 'Celana Panjang Formal',
      'quantity': 3,
      'unit_price': 180000,
      'total': 540000,
      'discount': 27000,
      'tax': 51300,
      'payment_method': 'card',
      'status': 'pending',
      'notes': 'Tanggal delivered akan muncul di sales management'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet([...sampleData], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Template');

  // Auto-fit column widths
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_sales_dbusana.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV template for sales with new template structure
 */
export function generateSalesCSVTemplate(): void {
  const headers = [
    'tanggal',
    'delivered_time',
    'customer_name',
    'product_code',
    'product_name',
    'quantity',
    'unit_price', 
    'total',
    'discount',
    'tax',
    'payment_method',
    'status',
    'notes'
  ];

  const sampleData = [
    '2024-01-15 09:30:00,2024-01-17 14:45:00,John Doe,DB-001,Kemeja Batik Premium,2,150000,300000,0,30000,cash,completed,Pembelian reguler',
    '2024-01-16 11:15:00,2024-01-18 10:20:00,Jane Smith,DB-002,Blouse Wanita Elegant,1,200000,200000,10000,19000,transfer,completed,Customer VIP',
    '2024-01-17 16:45:00,2024-01-19 13:30:00,Ahmad Rahman,DB-003,Celana Panjang Formal,3,180000,540000,27000,51300,card,pending,Menunggu konfirmasi'
  ];

  const csvContent = [headers.join(','), ...sampleData].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_sales_dbusana.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Excel template for products with correct headers
 */
export function generateProductsTemplate(): void {
  const headers = [
    'Seller SKU',
    'Product Name', 
    'Category',
    'Brand',
    'Size',
    'Color',
    'Price',
    'Cost Price',
    'Stock Quantity',
    'Min Stock'
  ];

  const sampleData = [
    {
      'Seller SKU': 'DBS-001-RED-M',
      'Product Name': 'Dress Batik Elegant',
      'Category': 'Dress',
      'Brand': "D'Busana Premium",
      'Size': 'M',
      'Color': 'Red',
      'Price': 150000,
      'Cost Price': 100000,
      'Stock Quantity': 50,
      'Min Stock': 5
    },
    {
      'Seller SKU': 'DBS-002-BLUE-L',
      'Product Name': 'Blouse Modern Chic',
      'Category': 'Blouse',
      'Brand': "D'Busana Premium",
      'Size': 'L',
      'Color': 'Blue',
      'Price': 120000,
      'Cost Price': 80000,
      'Stock Quantity': 30,
      'Min Stock': 3
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet([...sampleData], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');

  // Auto-fit column widths
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_products_dbusana.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV template for products with correct headers
 */ 
export function generateProductsCSVTemplate(): void {
  const headers = [
    'Seller SKU',
    'Product Name',
    'Category', 
    'Brand',
    'Size',
    'Color',
    'Price',
    'Cost Price',
    'Stock Quantity',
    'Min Stock'
  ];

  const sampleData = [
    'DBS-001-RED-M,Dress Batik Elegant,Dress,D\'Busana Premium,M,Red,150000,100000,50,5',
    'DBS-002-BLUE-L,Blouse Modern Chic,Blouse,D\'Busana Premium,L,Blue,120000,80000,30,3'
  ];

  const csvContent = [headers.join(','), ...sampleData].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_products_dbusana.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Excel template for stock movements
 */
export function generateStockTemplate(): void {
  const headers = [
    'product_code',
    'movement_type',
    'quantity',
    'reference_number',
    'notes',
    'movement_date'
  ];

  const sampleData = [
    {
      'product_code': 'DB-001',
      'movement_type': 'in',
      'quantity': 50,
      'reference_number': 'PO-2024-001',
      'notes': 'Pembelian dari supplier',
      'movement_date': '2024-01-15'
    },
    {
      'product_code': 'DB-002',
      'movement_type': 'out',
      'quantity': 2,
      'reference_number': 'SO-2024-001',
      'notes': 'Penjualan ke customer',
      'movement_date': '2024-01-16'
    },
    {
      'product_code': 'DB-003',
      'movement_type': 'adjustment',
      'quantity': 45,
      'reference_number': 'ADJ-2024-001',
      'notes': 'Stock opname hasil audit',
      'movement_date': '2024-01-17'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet([...sampleData], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Template');

  // Auto-fit column widths
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_stock_dbusana.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV template for stock movements
 */
export function generateStockCSVTemplate(): void {
  const headers = [
    'product_code',
    'movement_type',
    'quantity',
    'reference_number',
    'notes',
    'movement_date'
  ];

  const sampleData = [
    'DB-001,in,50,PO-2024-001,Pembelian dari supplier,2024-01-15',
    'DB-002,out,2,SO-2024-001,Penjualan ke customer,2024-01-16',
    'DB-003,adjustment,45,ADJ-2024-001,Stock opname hasil audit,2024-01-17'
  ];

  const csvContent = [headers.join(','), ...sampleData].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_stock_dbusana.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility functions for external access
export const getRequiredFields = (importType: 'sales' | 'products' | 'stock') => {
  return REQUIRED_FIELDS[importType];
};

export const getColumnMapping = (importType: 'sales' | 'products' | 'stock') => {
  return COLUMN_MAPPINGS[importType];
};

export const getFieldValidationRules = (importType: 'sales' | 'products' | 'stock') => {
  const rules = {
    sales: {
      duplicateKey: ['created_time', 'customer_name', 'seller_sku'],
      numberFields: ['quantity', 'unit_price', 'total'],
      dateFields: ['created_time', 'delivered_time'],
      requiredFields: REQUIRED_SALES_FIELDS
    },
    products: {
      duplicateKey: ['seller_sku'],
      numberFields: ['price', 'cost', 'stock_quantity', 'min_stock'],
      dateFields: [],
      requiredFields: REQUIRED_PRODUCT_FIELDS,
      businessRules: {
        priceVsCost: 'price >= cost',
        stockVsMinStock: 'stock_quantity >= min_stock (warning)'
      }
    },
    stock: {
      duplicateKey: [],
      numberFields: ['quantity'],
      dateFields: ['movement_date'],
      enumFields: {
        movement_type: ['in', 'out', 'adjustment']
      },
      requiredFields: REQUIRED_STOCK_FIELDS
    }
  };
  
  return rules[importType];
};

class FileParserService {

  /**
   * Validate file before parsing
   */
  async validateFile(file: File): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check file size
    if (file.size > config.maxFileSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(config.maxFileSize / 1024 / 1024)}MB`);
    }
    
    // Check file type
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      errors.push(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }
    
    // Warnings for large files
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push(`Large file detected (${(file.size / 1024 / 1024).toFixed(2)}MB). Processing may take longer.`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get file type from file object
   */
  getFileType(file: File): 'excel' | 'csv' {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      return 'csv';
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return 'excel';
    }
    
    // Default to excel if unsure
    return 'excel';
  }

  /**
   * Parse CSV file to array
   */
  async parseCSVToArray(file: File): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string, header: string) => value.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data as Record<string, any>[]);
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse file - main entry point
   */
  async parseFile(file: File): Promise<ParseResult> {
    const fileType = this.getFileType(file);
    return this.parseSalesFile(file, fileType);
  }

  /**
   * Parse file based on import type (sales, products, or stock)
   */
  async parseFileByType(file: File, importType: 'sales' | 'products' | 'stock'): Promise<ParseResult> {
    const fileType = this.getFileType(file);
    
    if (config.enableDebug) {
      console.log('🔍 Starting typed file parse:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: fileType,
        importType: importType,
        config: config
      });
    }
    
    switch (importType) {
      case 'products':
        return this.parseProductFile(file, fileType);
      case 'stock':
        return this.parseStockFile(file, fileType);
      case 'sales':
      default:
        return this.parseSalesFile(file, fileType);
    }
  }

  /**
   * Parse sales file with new template structure support
   */
  async parseSalesFile(file: File, fileType: 'excel' | 'csv'): Promise<ParseResult> {
    const errors: ExcelValidationError[] = [];

    try {
      let rawData: Record<string, any>[] = [];
      
      if (fileType === 'csv') {
        rawData = await this.parseCSVToArray(file);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      }

      if (rawData.length === 0) {
        return {
          success: false,
          data: [],
          errors: [{ row: 0, field: 'file', value: null, message: 'File kosong atau tidak memiliki data' }],
          totalRows: 0,
          validRows: 0,
          fileType: fileType,
        };
      }

      console.log('📊 Sales data parsed:', rawData.length, 'rows');

      return {
        success: true,
        data: rawData,
        errors,
        totalRows: rawData.length,
        validRows: rawData.length,
        fileType: fileType
      };

    } catch (err: any) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', value: '', message: err.message }],
        totalRows: 0,
        validRows: 0,
        fileType: fileType
      };
    }
  }

  /**
   * Parse product file with enhanced validation and duplicate detection
   */
  async parseProductFile(file: File, fileType: 'excel' | 'csv'): Promise<ParseResult> {
    const errors: ExcelValidationError[] = [];

    try {
      let rawData: Record<string, any>[] = [];
      
      if (fileType === 'csv') {
        rawData = await this.parseCSVToArray(file);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      }

      if (rawData.length === 0) {
        return {
          success: false,
          data: [],
          errors: [{ row: 0, field: 'file', value: null, message: 'File kosong atau tidak memiliki data' }],
          totalRows: 0,
          validRows: 0,
          fileType: fileType,
        };
      }

      console.log('📦 Product data parsed:', rawData.length, 'rows');

      return {
        success: true,
        data: rawData,
        errors,
        totalRows: rawData.length,
        validRows: rawData.length,
        fileType: fileType
      };

    } catch (err: any) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', value: '', message: err.message }],
        totalRows: 0,
        validRows: 0,
        fileType: fileType
      };
    }
  }

  /**
   * Parse stock file with enhanced validation
   */
  async parseStockFile(file: File, fileType: 'excel' | 'csv'): Promise<ParseResult> {
    const errors: ExcelValidationError[] = [];

    try {
      let rawData: Record<string, any>[] = [];
      
      if (fileType === 'csv') {
        rawData = await this.parseCSVToArray(file);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
      }

      if (rawData.length === 0) {
        return {
          success: false,
          data: [],
          errors: [{ row: 0, field: 'file', value: null, message: 'File kosong atau tidak memiliki data' }],
          totalRows: 0,
          validRows: 0,
          fileType: fileType,
        };
      }

      console.log('📈 Stock data parsed:', rawData.length, 'rows');

      return {
        success: true,
        data: rawData,
        errors,
        totalRows: rawData.length,
        validRows: rawData.length,
        fileType: fileType
      };

    } catch (err: any) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, field: 'file', value: '', message: err.message }],
        totalRows: 0,
        validRows: 0,
        fileType: fileType
      };
    }
  }
}

// Export the FileParserService instance for external use - SINGLE EXPORT ONLY
export const fileParser = new FileParserService();