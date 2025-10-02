const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * QUIET VERSION - Generate clean template Excel files for D'Busana import system
 * Minimal logging untuk clean backend startup
 */

function generateSalesTemplate() {
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
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    const colWidths = [
      { wch: 15 }, { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 8 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
      { wch: 18 }, { wch: 25 }
    ];
    worksheet['!cols'] = colWidths;

    const filePath = path.join(__dirname, 'sales_template_fixed.xlsx');
    const originalPath = path.join(__dirname, 'sales_template.xlsx');
    
    XLSX.writeFile(workbook, filePath);
    XLSX.writeFile(workbook, originalPath);
    
    return filePath;
  } catch (error) {
    throw error;
  }
}

function generateProductsTemplate() {
  const headers = [
    'product_code', 'product_name', 'category', 'brand', 'size',
    'color', 'price', 'cost', 'stock_quantity', 'min_stock'
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

    const colWidths = [
      { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 8 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
    ];
    worksheet['!cols'] = colWidths;

    const filePath = path.join(__dirname, 'products_template_fixed.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    return filePath;
  } catch (error) {
    throw error;
  }
}

function generateStockTemplate() {
  const headers = [
    'product_code', 'movement_type', 'quantity', 'reference_number', 'notes', 'movement_date'
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

    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    const filePath = path.join(__dirname, 'stock_template_fixed.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    return filePath;
  } catch (error) {
    throw error;
  }
}

function generateAdvertisingTemplate() {
  const headers = [
    'Campaign Name', 'Campaign Type', 'Platform', 'Ad Group Name',
    'Keyword', 'Ad Creative', 'Date Range Start', 'Date Range End',
    'Impressions', 'Clicks', 'Conversions', 'Cost', 'Revenue', 'Marketplace'
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

    const colWidths = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    const filePath = path.join(__dirname, 'advertising_template.xlsx');
    XLSX.writeFile(workbook, filePath);
    
    return filePath;
  } catch (error) {
    throw error;
  }
}

// QUIET VERSION - Minimal logging
async function generateAllTemplatesQuiet() {
  try {
    const salesPath = generateSalesTemplate();
    const productsPath = generateProductsTemplate();
    const stockPath = generateStockTemplate();
    const advertisingPath = generateAdvertisingTemplate();
    
    // Replace the corrupt template silently
    const corruptPath = path.join(__dirname, 'sales_template.xlsx');
    const fixedPath = path.join(__dirname, 'sales_template_fixed.xlsx');
    
    if (fs.existsSync(corruptPath)) {
      fs.unlinkSync(corruptPath);
    }
    
    if (fs.existsSync(fixedPath)) {
      fs.copyFileSync(fixedPath, corruptPath);
    }
    
    return {
      success: true,
      paths: {
        sales: salesPath,
        products: productsPath,
        stock: stockPath,
        advertising: advertisingPath
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateSalesTemplate,
  generateProductsTemplate,
  generateStockTemplate,
  generateAdvertisingTemplate,
  generateAllTemplatesQuiet
};