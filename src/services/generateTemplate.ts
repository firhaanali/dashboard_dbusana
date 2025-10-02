import * as XLSX from 'xlsx';

/**
 * Generate clean Excel template for sales data
 * This creates a new non-corrupt template for D'Busana sales import
 */
export function generateCleanSalesTemplate(): void {
  console.log('🏭 Generating clean sales template with new structure...');
  
  // New structure: Order ID | Seller SKU | Product Name | Color | Size | Quantity | Order Amount | Created Time | Delivered Time | Total settlement amount | Total revenue | HPP | Total | Marketplace
  const headers = [
    'Order ID',
    'Seller SKU',
    'Product Name',
    'Color',
    'Size',
    'Quantity',
    'Order Amount',
    'Created Time',
    'Delivered Time',
    'Total settlement amount',
    'Total revenue',
    'HPP',
    'Total',
    'Marketplace'
  ];

  const sampleData = [
    {
      'Order ID': 'DBU-2024-001',
      'Seller SKU': 'DBS-001-RED-M',
      'Product Name': 'Kemeja Batik Premium',
      'Color': 'Red',
      'Size': 'M',
      'Quantity': 2,
      'Order Amount': 300000,
      'Created Time': '2024-01-15',
      'Delivered Time': '2024-01-17',
      'Total settlement amount': 300000,
      'Total revenue': 300000,
      'HPP': 200000,
      'Total': 300000,
      'Marketplace': 'TikTok Shop'
    },
    {
      'Order ID': 'DBU-2024-002',
      'Seller SKU': 'DBS-002-BLUE-L',
      'Product Name': 'Blouse Wanita Elegant',
      'Color': 'Blue',
      'Size': 'L',
      'Quantity': 1,
      'Order Amount': 200000,
      'Created Time': '2024-01-16',
      'Delivered Time': '2024-01-18',
      'Total settlement amount': 190000,
      'Total revenue': 200000,
      'HPP': 130000,
      'Total': 200000,
      'Marketplace': 'Shopee'
    },
    {
      'Order ID': 'DBU-2024-003',
      'Seller SKU': 'DBS-003-GREEN-S',
      'Product Name': 'Celana Panjang Formal',
      'Color': 'Green',
      'Size': 'S',
      'Quantity': 3,
      'Order Amount': 540000,
      'Created Time': '2024-01-17',
      'Delivered Time': '',
      'Total settlement amount': 513000,
      'Total revenue': 540000,
      'HPP': 360000,
      'Total': 540000,
      'Marketplace': 'Tokopedia'
    },
    {
      'Order ID': 'DBU-2024-004',
      'Seller SKU': 'DBS-004-WHITE-XL',
      'Product Name': 'Dress Tenun Modern',
      'Color': 'White',
      'Size': 'XL',
      'Quantity': 1,
      'Order Amount': 250000,
      'Created Time': '2024-01-18',
      'Delivered Time': '2024-01-19',
      'Total settlement amount': 250000,
      'Total revenue': 250000,
      'HPP': 165000,
      'Total': 250000,
      'Marketplace': 'TikTok Shop'
    },
    {
      'Order ID': 'DBU-2024-005',
      'Seller SKU': 'DBS-005-BLACK-M',
      'Product Name': 'Jaket Batik Casual',
      'Color': 'Black',
      'Size': 'M',
      'Quantity': 2,
      'Order Amount': 350000,
      'Created Time': '2024-01-19',
      'Delivered Time': '2024-01-21',
      'Total settlement amount': 332500,
      'Total revenue': 350000,
      'HPP': 230000,
      'Total': 350000,
      'Marketplace': 'Lazada'
    }
  ];

  try {
    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // Order ID
      { wch: 18 }, // Seller SKU
      { wch: 25 }, // Product Name
      { wch: 12 }, // Color
      { wch: 8 },  // Size
      { wch: 10 }, // Quantity
      { wch: 15 }, // Order Amount
      { wch: 15 }, // Created Time
      { wch: 15 }, // Delivered Time
      { wch: 20 }, // Total settlement amount
      { wch: 15 }, // Total revenue
      { wch: 12 }, // HPP
      { wch: 12 }, // Total
      { wch: 15 }  // Marketplace
    ];
    worksheet['!cols'] = colWidths;

    // Style headers (bold)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
      worksheet[cellAddress].s.font = { bold: true };
    }

    // Generate buffer and create blob
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true 
    });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_sales_dbusana_new_structure.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Clean sales template generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error generating clean sales template:', error);
    throw error;
  }
}

/**
 * Generate clean Excel template for products data
 */
export function generateCleanProductsTemplate(): void {
  console.log('🏭 Generating clean products template...');
  
  const headers = [
    'product_code',
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

  const sampleData = [
    {
      'product_code': 'DBS-001-RED-M',
      'product_name': 'Dress Batik Elegant',
      'category': 'Dress',
      'brand': "D'Busana Premium",
      'size': 'M',
      'color': 'Red',
      'price': 150000,
      'cost': 100000,
      'stock_quantity': 50,
      'min_stock': 5
    },
    {
      'product_code': 'DBS-002-BLUE-L',
      'product_name': 'Blouse Modern Chic',
      'category': 'Blouse',
      'brand': "D'Busana Premium",
      'size': 'L',
      'color': 'Blue',
      'price': 120000,
      'cost': 80000,
      'stock_quantity': 30,
      'min_stock': 3
    },
    {
      'product_code': 'DBS-003-GREEN-S',
      'product_name': 'Kemeja Tenun Traditional',
      'category': 'Kemeja',
      'brand': "D'Busana Classic",
      'size': 'S',
      'color': 'Green',
      'price': 180000,
      'cost': 120000,
      'stock_quantity': 25,
      'min_stock': 5
    }
  ];

  try {
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Data');

    // Set column widths
    const colWidths = [
      { wch: 18 }, // product_code
      { wch: 25 }, // product_name
      { wch: 15 }, // category
      { wch: 18 }, // brand
      { wch: 8 },  // size
      { wch: 12 }, // color
      { wch: 12 }, // price
      { wch: 12 }, // cost
      { wch: 15 }, // stock_quantity
      { wch: 12 }  // min_stock
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_products_dbusana_clean.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Clean products template generated successfully');
  } catch (error) {
    console.error('❌ Error generating clean products template:', error);
    throw error;
  }
}

/**
 * Generate clean Excel template for stock movements
 */
export function generateCleanStockTemplate(): void {
  console.log('🏭 Generating clean stock template...');
  
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

  try {
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Movements');

    // Set column widths
    const colWidths = [
      { wch: 15 }, // product_code
      { wch: 15 }, // movement_type
      { wch: 10 }, // quantity
      { wch: 18 }, // reference_number
      { wch: 25 }, // notes
      { wch: 15 }  // movement_date
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_stock_dbusana_clean.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Clean stock template generated successfully');
  } catch (error) {
    console.error('❌ Error generating clean stock template:', error);
    throw error;
  }
}

/**
 * Template validation helper
 */
export function validateTemplateStructure(data: any[], importType: 'sales' | 'products' | 'stock'): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Template kosong atau tidak memiliki data');
    return { isValid: false, errors, warnings };
  }

  const requiredFields = {
    sales: ['Seller SKU', 'Product Name', 'Quantity', 'Order Amount', 'Created Time'], // Marketplace is optional
    products: ['product_code', 'product_name', 'category', 'brand', 'size', 'color', 'price', 'cost', 'stock_quantity', 'min_stock'],
    stock: ['product_code', 'movement_type', 'quantity', 'movement_date']
  };

  const required = requiredFields[importType] || [];
  const firstRow = data[0];
  const availableFields = Object.keys(firstRow);

  // Check for missing required fields
  const missingFields = required.filter(field => !availableFields.includes(field));
  if (missingFields.length > 0) {
    errors.push(`Field wajib tidak ditemukan: ${missingFields.join(', ')}`);
  }

  // Check for extra fields
  const extraFields = availableFields.filter(field => !required.includes(field));
  if (extraFields.length > 0) {
    warnings.push(`Field tambahan ditemukan: ${extraFields.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Export all functions
export const templateGenerator = {
  generateCleanSalesTemplate,
  generateCleanProductsTemplate, 
  generateCleanStockTemplate,
  validateTemplateStructure
};