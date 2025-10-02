const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Generate clean template Excel files for D'Busana import system
 * This replaces the corrupt template with a new valid one
 */

function generateSalesTemplate() {
  console.log('🏭 Generating clean sales template with new structure...');
  
  // FIXED: Headers yang konsisten dengan format template lainnya - dengan Regency & City digabung
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
    'Marketplace',
    'Customer',
    'Province',
    'Regency & City'
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
      'Marketplace': 'TikTok Shop',
      'Customer': 'Ibu Sari Dewi',
      'Province': 'DKI Jakarta',
      'Regency & City': 'Jakarta Pusat'
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
      'Marketplace': 'Shopee',
      'Customer': 'Bpk. Ahmad Pratama',
      'Province': 'Jawa Barat',
      'Regency & City': 'Bandung'
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
      'Marketplace': 'Tokopedia',
      'Customer': '', // Kosong = akan menjadi "-" otomatis
      'Province': 'Jawa Tengah',
      'Regency & City': 'Semarang'
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
      'Marketplace': 'TikTok Shop',
      'Customer': 'Ibu Fitri Handayani',
      'Province': 'Jawa Timur',
      'Regency & City': 'Surabaya'
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
      'Marketplace': 'Lazada',
      'Customer': '', // Contoh lain: customer kosong
      'Province': 'Banten',
      'Regency & City': 'Tangerang & Tangerang Selatan'
    }
  ];

  try {
    // Gunakan metode yang sama seperti template lainnya
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    // Set column widths
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
      { wch: 15 }, // Marketplace
      { wch: 20 }, // Customer
      { wch: 18 }, // Province
      { wch: 25 }  // Regency & City (wider for combined data)
    ];
    worksheet['!cols'] = colWidths;

    // Write file dengan cara yang sama seperti template lainnya
    const filePath = path.join(__dirname, 'sales_template_fixed.xlsx');
    const originalPath = path.join(__dirname, 'sales_template.xlsx');
    
    XLSX.writeFile(workbook, filePath);
    XLSX.writeFile(workbook, originalPath);
    
    console.log('✅ Clean sales template created at:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Error generating sales template:', error);
    throw error;
  }
}

function generateProductsTemplate() {
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

    const filePath = path.join(__dirname, 'products_template_fixed.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Clean products template created at:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Error generating products template:', error);
    throw error;
  }
}

function generateStockTemplate() {
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

    const filePath = path.join(__dirname, 'stock_template_fixed.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Clean stock template created at:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Error generating stock template:', error);
    throw error;
  }
}

function generateAdvertisingTemplate() {
  console.log('🏭 Generating clean advertising template...');
  
  const headers = [
    'Campaign Name',
    'Campaign Type',
    'Platform',
    'Ad Group Name',
    'Keyword',
    'Ad Creative',
    'Date Range Start',
    'Date Range End',
    'Impressions',
    'Clicks',
    'Conversions',
    'Cost',
    'Revenue',
    'Marketplace'
  ];

  const sampleData = [
    {
      'Campaign Name': 'Summer Collection 2024',
      'Campaign Type': 'social',
      'Platform': 'facebook_ads',
      'Ad Group Name': 'Dress Collection',
      'Keyword': 'dress batik wanita',
      'Ad Creative': 'Stunning Batik Dress Campaign',
      'Date Range Start': '2024-01-01',
      'Date Range End': '2024-01-31',
      'Impressions': 15000,
      'Clicks': 750,
      'Conversions': 45,
      'Cost': 2500000,
      'Revenue': 6750000,
      'Marketplace': 'TikTok Shop'
    },
    {
      'Campaign Name': 'Traditional Wear Q1',
      'Campaign Type': 'display',
      'Platform': 'google_ads',
      'Ad Group Name': 'Kemeja Premium',
      'Keyword': 'kemeja batik pria',
      'Ad Creative': 'Professional Batik Shirts',
      'Date Range Start': '2024-02-01',
      'Date Range End': '2024-02-28',
      'Impressions': 12000,
      'Clicks': 600,
      'Conversions': 30,
      'Cost': 1800000,
      'Revenue': 4500000,
      'Marketplace': 'Shopee'
    },
    {
      'Campaign Name': 'Elegant Blouse Campaign',
      'Campaign Type': 'shopping',
      'Platform': 'tiktok_ads',
      'Ad Group Name': 'Blouse Modern',
      'Keyword': 'blouse elegant',
      'Ad Creative': 'Modern Elegant Blouse',
      'Date Range Start': '2024-03-01',
      'Date Range End': '2024-03-31',
      'Impressions': 20000,
      'Clicks': 1000,
      'Conversions': 75,
      'Cost': 3000000,
      'Revenue': 9000000,
      'Marketplace': 'Tokopedia'
    }
  ];

  try {
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Advertising Data');

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Campaign Name
      { wch: 15 }, // Campaign Type
      { wch: 15 }, // Platform
      { wch: 20 }, // Ad Group Name
      { wch: 20 }, // Keyword
      { wch: 25 }, // Ad Creative
      { wch: 15 }, // Date Range Start
      { wch: 15 }, // Date Range End
      { wch: 12 }, // Impressions
      { wch: 10 }, // Clicks
      { wch: 12 }, // Conversions
      { wch: 15 }, // Cost
      { wch: 15 }, // Revenue
      { wch: 15 }  // Marketplace
    ];
    worksheet['!cols'] = colWidths;

    const filePath = path.join(__dirname, 'advertising_template.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Clean advertising template created at:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Error generating advertising template:', error);
    throw error;
  }
}

// Generate advertising settlement template
function generateAdvertisingSettlementTemplate() {
  console.log('🏦 Generating clean advertising settlement template...');
  
  const headers = [
    'Order ID',
    'Type',
    'Order Created Time',
    'Order Settled Time',
    'Settlement Amount',
    'Account Name',
    'Marketplace',
    'Currency'
  ];

  const sampleData = [
    {
      'Order ID': 'TIKTOK-AD-2025-001',
      'Type': 'Ad Spend',
      'Order Created Time': '01/09/25',
      'Order Settled Time': '03/09/25',
      'Settlement Amount': 500000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'TikTok Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'FB-AD-2025-002',
      'Type': 'Tax Fee',
      'Order Created Time': '02/09/25',
      'Order Settled Time': '04/09/25',
      'Settlement Amount': 55000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Facebook Ads',
      'Currency': 'IDR'
    },
    {
      'Order ID': 'GOOGLE-AD-2025-003',
      'Type': 'Service Fee',
      'Order Created Time': '03/09/25',
      'Order Settled Time': '05/09/25',
      'Settlement Amount': 25000,
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Google Ads',
      'Currency': 'IDR'
    }
  ];

  try {
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Advertising Settlement');

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Order ID
      { wch: 15 }, // Type
      { wch: 18 }, // Order Created Time
      { wch: 18 }, // Order Settled Time
      { wch: 16 }, // Settlement Amount
      { wch: 25 }, // Account Name
      { wch: 15 }, // Marketplace
      { wch: 10 }  // Currency
    ];
    worksheet['!cols'] = colWidths;

    const filePath = path.join(__dirname, 'advertising_settlement_template.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Clean advertising settlement template created at:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Error generating advertising settlement template:', error);
    throw error;
  }
}

// Generate all templates
async function generateAllTemplates() {
  console.log('🚀 Starting template generation process...');
  
  try {
    const salesPath = generateSalesTemplate();
    const productsPath = generateProductsTemplate();
    const stockPath = generateStockTemplate();
    const advertisingPath = generateAdvertisingTemplate();
    const advertisingSettlementPath = generateAdvertisingSettlementTemplate();
    
    console.log('🎉 All templates generated successfully:');
    console.log('- Sales:', salesPath);
    console.log('- Products:', productsPath);
    console.log('- Stock:', stockPath);
    console.log('- Advertising:', advertisingPath);
    console.log('- Advertising Settlement:', advertisingSettlementPath);
    
    // Replace the corrupt template
    const corruptPath = path.join(__dirname, 'sales_template.xlsx');
    const fixedPath = path.join(__dirname, 'sales_template_fixed.xlsx');
    
    // Remove old corrupt file if it exists
    if (fs.existsSync(corruptPath)) {
      fs.unlinkSync(corruptPath);
      console.log('🗑️ Removed old template file');
    }
    
    // Copy the newly generated template
    if (fs.existsSync(fixedPath)) {
      fs.copyFileSync(fixedPath, corruptPath);
      console.log('✅ New template installed successfully');
    }
    
    return {
      success: true,
      paths: {
        sales: salesPath,
        products: productsPath,
        stock: stockPath,
        advertising: advertisingPath,
        advertisingSettlement: advertisingSettlementPath
      }
    };
  } catch (error) {
    console.error('❌ Template generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  generateAllTemplates()
    .then(result => {
      if (result.success) {
        console.log('🎉 Template generation completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Template generation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = {
  generateSalesTemplate,
  generateProductsTemplate,
  generateStockTemplate,
  generateAdvertisingTemplate,
  generateAdvertisingSettlementTemplate,
  generateAllTemplates
};