const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Initialize Prisma with better error handling and connection management
let prisma;
try {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal'
  });
  console.log('✅ Prisma client initialized for reports controller');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  prisma = null;
}

// Utility functions for report generation
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID');
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Group data by granularity
const groupDataByGranularity = (data, granularity, dateField = 'created_time') => {
  const grouped = new Map();

  data.forEach(item => {
    const itemDate = new Date(item[dateField]);
    let dateKey = '';

    switch (granularity) {
      case 'daily':
        dateKey = itemDate.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(itemDate);
        weekStart.setDate(itemDate.getDate() - itemDate.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        dateKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        dateKey = itemDate.getFullYear().toString();
        break;
      default:
        dateKey = itemDate.toISOString().split('T')[0];
    }

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey).push(item);
  });

  return grouped;
};

// Controllers

// Get comprehensive reports data
const getReportsData = async (req, res) => {
  try {
    const {
      date_start,
      date_end,
      granularity = 'daily',
      marketplace,
      category,
      brand,
      product
    } = req.query;

    console.log('📊 Generating reports data with parameters:', {
      date_start,
      date_end,
      granularity,
      marketplace,
      category,
      brand
    });

    // Initialize or reinitialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for reports');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Parse date range
    const startDate = date_start ? new Date(date_start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = date_end ? new Date(date_end) : new Date();

    // Build where clause
    const whereClause = {
      created_time: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
      }
    };

    // Add filters
    if (marketplace && marketplace !== 'all') {
      const marketplaces = marketplace.split(',');
      whereClause.marketplace = { in: marketplaces };
    }

    if (category && category !== 'all') {
      const categories = category.split(',');
      whereClause.product_name = { contains: categories[0] }; // Simplified category filtering
    }

    // Fetch sales data with error handling
    let salesData;
    try {
      salesData = await prisma.sales.findMany({
        where: whereClause,
        orderBy: { created_time: 'asc' },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          quantity: true,
          product_name: true,
          marketplace: true,
          hpp: true
        }
      });
      console.log(`📈 Found ${salesData.length} sales records for reports`);
    } catch (queryError) {
      console.error('❌ Reports database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    console.log(`📈 Found ${salesData.length} sales records for reports`);

    // Generate sales report
    const salesReport = generateSalesReport(salesData, granularity);
    
    // Generate financial summary
    const financialSummary = generateFinancialSummary(salesData, granularity);
    
    // Generate product performance
    const productPerformance = generateProductPerformance(salesData);
    
    // Generate inventory report (mock data for now)
    const inventoryReport = generateInventoryReport(salesData);
    
    // Generate marketplace report
    const marketplaceReport = generateMarketplaceReport(salesData);

    // Get available reports
    const availableReports = [
      {
        id: 'sales_report',
        name: 'Sales Report',
        type: 'sales',
        description: 'Comprehensive sales analysis',
        last_generated: new Date().toISOString(),
        status: 'ready',
        size: '2.3 MB',
        rows: salesReport.length
      },
      {
        id: 'financial_report',
        name: 'Financial Report',
        type: 'financial',
        description: 'Revenue and profit analysis',
        last_generated: new Date().toISOString(),
        status: 'ready',
        size: '1.8 MB',
        rows: financialSummary.length
      },
      {
        id: 'product_report',
        name: 'Product Performance',
        type: 'product',
        description: 'Individual product analysis',
        last_generated: new Date().toISOString(),
        status: 'ready',
        size: '3.1 MB',
        rows: productPerformance.length
      }
    ];

    // Get filter options
    const filterOptions = await getFilterOptions();

    res.json({
      success: true,
      data: {
        available_reports: availableReports,
        sales_report: salesReport,
        financial_summary: financialSummary,
        product_performance: productPerformance,
        inventory_report: inventoryReport,
        marketplace_report: marketplaceReport,
        filter_options: filterOptions,
        parameters: {
          date_start: startDate.toISOString(),
          date_end: endDate.toISOString(),
          granularity,
          total_records: salesData.length
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating reports data:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Database constraint error',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate reports data',
      details: error.message
    });
  }
};

// Generate individual report
const generateReport = async (req, res) => {
  try {
    const { type, format = 'pdf', date_start, date_end } = req.query;

    console.log(`📄 Generating ${format.toUpperCase()} report for type: ${type}`);

    // Initialize or reinitialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for individual report');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Parse date range
    const startDate = date_start ? new Date(date_start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = date_end ? new Date(date_end) : new Date();

    // Fetch data based on type with error handling
    let salesData;
    try {
      salesData = await prisma.sales.findMany({
        where: {
          created_time: {
            gte: startDate.toISOString(),
            lte: endDate.toISOString()
          }
        },
        orderBy: { created_time: 'asc' },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          quantity: true,
          product_name: true,
          marketplace: true,
          hpp: true
        }
      });
      console.log(`📊 Found ${salesData.length} records for ${type} report`);
    } catch (queryError) {
      console.error('❌ Individual report database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    let reportData;
    let fileName;

    switch (type) {
      case 'sales':
        reportData = generateSalesReport(salesData, 'daily');
        fileName = `sales_report_${formatDateForFile(startDate)}_${formatDateForFile(endDate)}.${format}`;
        break;
      case 'financial':
        reportData = generateFinancialSummary(salesData, 'monthly');
        fileName = `financial_report_${formatDateForFile(startDate)}_${formatDateForFile(endDate)}.${format}`;
        break;
      case 'product':
        reportData = generateProductPerformance(salesData);
        fileName = `product_report_${formatDateForFile(startDate)}_${formatDateForFile(endDate)}.${format}`;
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Generate file based on format
    let downloadUrl;
    let fileSize;

    switch (format) {
      case 'pdf':
        downloadUrl = await generatePDFReport(reportData, type, fileName);
        fileSize = 1024 * 1024 * 2; // Mock size
        break;
      case 'excel':
        downloadUrl = await generateExcelReport(reportData, type, fileName);
        fileSize = 1024 * 1024 * 1.5; // Mock size
        break;
      case 'csv':
        downloadUrl = await generateCSVReport(reportData, type, fileName);
        fileSize = 1024 * 512; // Mock size
        break;
      default:
        throw new Error('Invalid format');
    }

    res.json({
      success: true,
      data: {
        download_url: downloadUrl,
        filename: fileName,
        size: fileSize,
        type: type,
        format: format,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating report:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      details: error.message
    });
  }
};

// Bulk export reports
const bulkExportReports = async (req, res) => {
  try {
    const { report_types, filters, format = 'zip' } = req.body;

    console.log('📦 Bulk exporting reports:', report_types);

    if (!report_types || report_types.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No report types specified'
      });
    }

    // Initialize or reinitialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for bulk export');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Fetch data based on filters with error handling
    let salesData;
    try {
      salesData = await prisma.sales.findMany({
        where: {
          created_time: {
            gte: new Date(filters.date_start).toISOString(),
            lte: new Date(filters.date_end).toISOString()
          }
        },
        orderBy: { created_time: 'asc' },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          quantity: true,
          product_name: true,
          marketplace: true,
          hpp: true
        }
      });
      console.log(`📦 Found ${salesData.length} records for bulk export`);
    } catch (queryError) {
      console.error('❌ Bulk export database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    const exportFiles = [];

    // Generate each requested report
    for (const reportType of report_types) {
      let reportData;
      let fileName;

      switch (reportType) {
        case 'sales':
          reportData = generateSalesReport(salesData, filters.granularity);
          fileName = `sales_report_${Date.now()}.csv`;
          break;
        case 'financial':
          reportData = generateFinancialSummary(salesData, filters.granularity);
          fileName = `financial_report_${Date.now()}.csv`;
          break;
        case 'product':
          reportData = generateProductPerformance(salesData);
          fileName = `product_report_${Date.now()}.csv`;
          break;
        case 'inventory':
          reportData = generateInventoryReport(salesData);
          fileName = `inventory_report_${Date.now()}.csv`;
          break;
        case 'marketing':
          reportData = generateMarketingReport(salesData);
          fileName = `marketing_report_${Date.now()}.csv`;
          break;
      }

      if (reportData) {
        const fileUrl = await generateCSVReport(reportData, reportType, fileName);
        exportFiles.push({ type: reportType, url: fileUrl, filename: fileName });
      }
    }

    // Create ZIP file (mock implementation)
    const zipFileName = `bulk_reports_${Date.now()}.zip`;
    const zipUrl = `/downloads/${zipFileName}`;

    res.json({
      success: true,
      data: {
        download_url: zipUrl,
        filename: zipFileName,
        files: exportFiles,
        total_files: exportFiles.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk export:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to bulk export reports',
      details: error.message
    });
  }
};

// Get scheduled reports
const getScheduledReports = async (req, res) => {
  try {
    // Mock scheduled reports data
    const scheduledReports = [
      {
        id: 'schedule_1',
        name: 'Daily Sales Summary',
        type: 'sales',
        schedule: 'daily',
        time: '08:00',
        recipients: ['admin@dbusana.com'],
        format: 'pdf',
        status: 'active',
        last_sent: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'schedule_2',
        name: 'Weekly Financial Report',
        type: 'financial',
        schedule: 'weekly',
        time: '09:00',
        recipients: ['finance@dbusana.com'],
        format: 'excel',
        status: 'active',
        last_sent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: scheduledReports
    });

  } catch (error) {
    console.error('❌ Error fetching scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled reports',
      details: error.message
    });
  }
};

// Helper functions

function generateSalesReport(salesData, granularity) {
  const grouped = groupDataByGranularity(salesData, granularity);
  const report = [];

  for (const [date, sales] of grouped) {
    const revenue = sales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
    const orders = sales.length;
    const quantity = sales.reduce((sum, sale) => sum + (sale.quantity || 1), 0);
    const profit = sales.reduce((sum, sale) => sum + ((sale.total_revenue || 0) - (sale.hpp || 0)), 0);

    report.push({
      date,
      revenue,
      orders,
      quantity,
      profit
    });
  }

  return report.sort((a, b) => a.date.localeCompare(b.date));
}

function generateFinancialSummary(salesData, granularity) {
  const grouped = groupDataByGranularity(salesData, granularity);
  const summary = [];

  const groupedArray = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  groupedArray.forEach(([period, sales], index) => {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
    const totalCosts = sales.reduce((sum, sale) => sum + (sale.hpp || 0), 0);
    const totalProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate growth rate compared to previous period
    let growthRate = 0;
    if (index > 0) {
      const previousRevenue = summary[index - 1].total_revenue;
      growthRate = calculateGrowthRate(totalRevenue, previousRevenue);
    }

    summary.push({
      period,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_costs: totalCosts,
      profit_margin: profitMargin,
      growth_rate: growthRate
    });
  });

  return summary;
}

function generateProductPerformance(salesData) {
  const productMap = new Map();

  // Group by product
  salesData.forEach(sale => {
    const productName = sale.product_name || 'Unknown Product';
    if (!productMap.has(productName)) {
      productMap.set(productName, {
        product_name: productName,
        category: extractCategory(productName),
        brand: extractBrand(productName),
        total_revenue: 0,
        total_quantity: 0,
        total_orders: 0,
        total_costs: 0
      });
    }

    const product = productMap.get(productName);
    product.total_revenue += sale.total_revenue || 0;
    product.total_quantity += sale.quantity || 1;
    product.total_orders += 1;
    product.total_costs += sale.hpp || 0;
  });

  // Calculate metrics and sort
  const performance = Array.from(productMap.values())
    .map((product, index) => ({
      ...product,
      avg_price: product.total_quantity > 0 ? product.total_revenue / product.total_quantity : 0,
      profit_margin: product.total_revenue > 0 ? ((product.total_revenue - product.total_costs) / product.total_revenue) * 100 : 0,
      growth_rate: Math.random() * 20 - 10, // Mock growth rate
      rank: index + 1
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .map((product, index) => ({
      ...product,
      rank: index + 1
    }));

  return performance.slice(0, 50); // Top 50 products
}

function generateInventoryReport(salesData) {
  const productMap = new Map();

  // Group by product
  salesData.forEach(sale => {
    const productName = sale.product_name || 'Unknown Product';
    if (!productMap.has(productName)) {
      productMap.set(productName, {
        product_name: productName,
        category: extractCategory(productName),
        sold_quantity: 0,
        revenue: 0
      });
    }

    const product = productMap.get(productName);
    product.sold_quantity += sale.quantity || 1;
    product.revenue += sale.total_revenue || 0;
  });

  // Generate inventory report with mock stock data
  const inventory = Array.from(productMap.values())
    .map(product => {
      const avgDailySales = product.sold_quantity / 30; // Assuming 30 days
      const currentStock = Math.floor(Math.random() * 200) + 10; // Mock stock
      const stockTurnover = avgDailySales > 0 ? product.sold_quantity / (currentStock + product.sold_quantity) : 0;
      const daysOfInventory = avgDailySales > 0 ? currentStock / avgDailySales : 999;
      const reorderPoint = Math.floor(avgDailySales * 7); // 7 days safety stock

      let status = 'healthy';
      if (daysOfInventory < 7) status = 'critical';
      else if (daysOfInventory < 14) status = 'low';
      else if (daysOfInventory > 60) status = 'overstock';

      return {
        product_name: product.product_name,
        category: product.category,
        current_stock: currentStock,
        sold_quantity: product.sold_quantity,
        stock_turnover: stockTurnover,
        days_of_inventory: daysOfInventory,
        reorder_point: reorderPoint,
        status
      };
    })
    .sort((a, b) => b.sold_quantity - a.sold_quantity);

  return inventory.slice(0, 30); // Top 30 products
}

function generateMarketplaceReport(salesData) {
  const marketplaceMap = new Map();

  // Group by marketplace
  salesData.forEach(sale => {
    const marketplace = sale.marketplace || 'Unknown';
    if (!marketplaceMap.has(marketplace)) {
      marketplaceMap.set(marketplace, {
        marketplace,
        revenue: 0,
        orders: 0,
        quantity: 0,
        costs: 0
      });
    }

    const mp = marketplaceMap.get(marketplace);
    mp.revenue += sale.total_revenue || 0;
    mp.orders += 1;
    mp.quantity += sale.quantity || 1;
    mp.costs += sale.hpp || 0;
  });

  // Calculate metrics
  const marketplaces = Array.from(marketplaceMap.values())
    .map(mp => ({
      marketplace: mp.marketplace,
      revenue: mp.revenue,
      orders: mp.orders,
      profit: mp.revenue - mp.costs,
      avg_order_value: mp.orders > 0 ? mp.revenue / mp.orders : 0,
      conversion_rate: Math.random() * 5 + 1, // Mock conversion rate
      growth_rate: Math.random() * 30 - 10 // Mock growth rate
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return marketplaces;
}

function generateMarketingReport(salesData) {
  // Mock marketing report data
  return [
    {
      campaign: 'Summer Sale 2024',
      spend: 5000000,
      revenue: 25000000,
      roi: 400,
      impressions: 150000,
      clicks: 7500,
      conversions: 450
    },
    {
      campaign: 'New Collection Launch',
      spend: 3000000,
      revenue: 18000000,
      roi: 500,
      impressions: 100000,
      clicks: 5000,
      conversions: 320
    }
  ];
}

async function getFilterOptions() {
  try {
    // Initialize or reinitialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for filter options');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma for filter options:', initError);
        // Return fallback options
        return {
          marketplaces: ['Shopee', 'Tokopedia', 'Lazada', 'Blibli', 'TikTok Shop'],
          categories: ['Fashion', 'Electronics', 'Beauty', 'Home & Living'],
          brands: ['Brand A', 'Brand B', 'Brand C'],
          products: []
        };
      }
    }

    // Get unique marketplaces with error handling
    let marketplaces = [];
    let products = [];
    
    try {
      marketplaces = await prisma.sales.findMany({
        select: { marketplace: true },
        distinct: ['marketplace'],
        where: { marketplace: { not: null } }
      });

      // Get unique product names for categories/brands extraction  
      products = await prisma.sales.findMany({
        select: { product_name: true },
        distinct: ['product_name'],
        where: { product_name: { not: null } },
        take: 100
      });
    } catch (queryError) {
      console.error('❌ Filter options database query failed:', queryError);
      // Return fallback options
      return {
        marketplaces: ['Shopee', 'Tokopedia', 'Lazada', 'Blibli', 'TikTok Shop'],
        categories: ['Fashion', 'Electronics', 'Beauty', 'Home & Living'],
        brands: ['Brand A', 'Brand B', 'Brand C'],
        products: []
      };
    }

    const categories = [...new Set(products.map(p => extractCategory(p.product_name)))];
    const brands = [...new Set(products.map(p => extractBrand(p.product_name)))];

    return {
      marketplaces: marketplaces.map(m => m.marketplace).filter(Boolean),
      categories: categories.filter(Boolean),
      brands: brands.filter(Boolean),
      products: products.map(p => p.product_name).filter(Boolean).slice(0, 50)
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      marketplaces: ['Shopee', 'Tokopedia', 'Lazada', 'Blibli', 'TikTok Shop'],
      categories: ['Fashion', 'Electronics', 'Beauty', 'Home & Living'],
      brands: ['Brand A', 'Brand B', 'Brand C'],
      products: []
    };
  }
}

// Utility functions
function extractCategory(productName) {
  if (!productName) return 'Uncategorized';
  
  // Simple category extraction logic
  const lower = productName.toLowerCase();
  if (lower.includes('dress') || lower.includes('baju')) return 'Fashion';
  if (lower.includes('sepatu') || lower.includes('shoes')) return 'Footwear';
  if (lower.includes('tas') || lower.includes('bag')) return 'Accessories';
  if (lower.includes('celana')) return 'Bottoms';
  
  return 'General';
}

function extractBrand(productName) {
  if (!productName) return 'No Brand';
  
  // Simple brand extraction logic
  const words = productName.split(' ');
  return words[0] || 'No Brand';
}

function formatDateForFile(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// Mock file generation functions
async function generatePDFReport(data, type, fileName) {
  // Mock PDF generation
  console.log(`📄 Generating PDF: ${fileName}`);
  return `/downloads/pdf/${fileName}`;
}

async function generateExcelReport(data, type, fileName) {
  // Mock Excel generation
  console.log(`📊 Generating Excel: ${fileName}`);
  return `/downloads/excel/${fileName}`;
}

async function generateCSVReport(data, type, fileName) {
  // Mock CSV generation
  console.log(`📋 Generating CSV: ${fileName}`);
  
  if (data.length === 0) {
    return `/downloads/csv/empty_${fileName}`;
  }

  // Simple CSV generation
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n');

  // In a real implementation, save to file system
  // For now, return mock URL
  return `/downloads/csv/${fileName}`;
}

module.exports = {
  getReportsData,
  generateReport,
  bulkExportReports,
  getScheduledReports
};