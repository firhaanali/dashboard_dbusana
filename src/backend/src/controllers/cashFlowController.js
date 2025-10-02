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
  console.log('✅ Prisma client initialized for cash flow controller');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  prisma = null;
}

// Utility functions for cash flow calculations
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

const formatDateForFile = (date) => {
  return new Date(date).toISOString().split('T')[0].replace(/-/g, '_');
};

const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Group cash flow data by granularity
const groupCashFlowByGranularity = (data, granularity, dateField = 'created_time') => {
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
      grouped.set(dateKey, {
        period: dateKey,
        income: [],
        expenses: []
      });
    }
    
    const group = grouped.get(dateKey);
    if (item.type === 'income') {
      group.income.push(item);
    } else {
      group.expenses.push(item);
    }
  });

  return grouped;
};

// Helper function to get category for income source
const getCategoryForSource = (source) => {
  const sourceCategories = {
    'Shopee': 'sales',
    'Tokopedia': 'sales',
    'Lazada': 'sales',
    'Blibli': 'sales',
    'TikTok Shop': 'sales',
    'Direct Sales': 'sales',
    'Other': 'other_income'
  };
  return sourceCategories[source] || 'other_income';
};

// Helper function to generate mock expenses
const generateMockExpenses = (startDate, endDate, salesData) => {
  const expenseTransactions = [];
  const totalIncome = salesData.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
  
  // Generate mock expenses based on income (COGS, Marketing, Operating)
  const expenseCategories = [
    { category: 'COGS', type: 'operating', ratio: 0.4, source: 'Suppliers' },
    { category: 'Marketing', type: 'marketing', ratio: 0.15, source: 'Marketing Platforms' },
    { category: 'Operating', type: 'operating', ratio: 0.1, source: 'Operating Costs' },
    { category: 'Logistics', type: 'operating', ratio: 0.05, source: 'Logistics' }
  ];

  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  expenseCategories.forEach((expenseCategory, index) => {
    const totalCategoryAmount = totalIncome * expenseCategory.ratio;
    const dailyAmount = totalCategoryAmount / daysDiff;
    
    for (let day = 0; day < daysDiff; day++) {
      const expenseDate = new Date(startDate);
      expenseDate.setDate(startDate.getDate() + day);
      
      // Add some randomization
      const variation = 0.8 + (Math.random() * 0.4); // 80% to 120% of daily amount
      const amount = dailyAmount * variation;
      
      if (amount > 0) {
        expenseTransactions.push({
          id: `expense_${index}_${day}`,
          date: expenseDate.toISOString(),
          description: `${expenseCategory.category} - ${expenseDate.toLocaleDateString('id-ID')}`,
          category: expenseCategory.category,
          type: 'expense',
          amount: amount,
          source: expenseCategory.source,
          marketplace: null,
          reference: `EXP-${index}-${day}`
        });
      }
    }
  });

  return expenseTransactions;
};

// Helper function to generate cash flow forecast
const generateCashFlowForecast = (cashFlowSummary) => {
  if (!cashFlowSummary || cashFlowSummary.length === 0) {
    return [];
  }

  const forecast = [];
  const lastPeriods = cashFlowSummary.slice(-5); // Use last 5 periods for trend
  
  if (lastPeriods.length === 0) return [];
  
  // Calculate average growth rates
  const avgIncomeGrowth = lastPeriods.length > 1 ? 
    lastPeriods.reduce((sum, period, index) => {
      if (index === 0) return 0;
      const prev = lastPeriods[index - 1];
      const growth = prev.total_income > 0 ? 
        ((period.total_income - prev.total_income) / prev.total_income) * 100 : 0;
      return sum + growth;
    }, 0) / (lastPeriods.length - 1) : 0;

  const avgExpenseGrowth = lastPeriods.length > 1 ? 
    lastPeriods.reduce((sum, period, index) => {
      if (index === 0) return 0;
      const prev = lastPeriods[index - 1];
      const growth = prev.total_expenses > 0 ? 
        ((period.total_expenses - prev.total_expenses) / prev.total_expenses) * 100 : 0;
      return sum + growth;
    }, 0) / (lastPeriods.length - 1) : 0;

  // Generate 6 periods of forecast
  const lastPeriod = lastPeriods[lastPeriods.length - 1];
  
  for (let i = 1; i <= 6; i++) {
    const forecastDate = new Date(lastPeriod.period);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    const incomeGrowthFactor = 1 + (avgIncomeGrowth / 100) * i;
    const expenseGrowthFactor = 1 + (avgExpenseGrowth / 100) * i;
    
    const predictedIncome = lastPeriod.total_income * incomeGrowthFactor;
    const predictedExpenses = lastPeriod.total_expenses * expenseGrowthFactor;
    const predictedNetFlow = predictedIncome - predictedExpenses;
    
    forecast.push({
      period: forecastDate.toISOString().split('T')[0],
      predicted_income: predictedIncome,
      predicted_expenses: predictedExpenses,
      predicted_net_flow: predictedNetFlow,
      confidence_interval: {
        lower: predictedNetFlow * 0.8,
        upper: predictedNetFlow * 1.2
      },
      scenario: predictedNetFlow > 0 ? 'realistic' : 'conservative'
    });
  }

  return forecast;
};

// Controllers

// Create new cash flow entry (income or expense)
const createCashFlowEntry = async (req, res) => {
  try {
    const {
      entry_date,
      description,
      category,
      entry_type,
      amount,
      source,
      marketplace,
      reference,
      notes,
      created_by
    } = req.body;

    console.log('💰 Creating new cash flow entry:', {
      entry_type,
      amount,
      category,
      source
    });

    // Validate required fields
    if (!entry_date || !description || !category || !entry_type || !amount || !source) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entry_date, description, category, entry_type, amount, source'
      });
    }

    // Validate entry_type
    if (!['income', 'expense'].includes(entry_type)) {
      return res.status(400).json({
        success: false,
        error: 'entry_type must be either "income" or "expense"'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }

    // Initialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for cash flow entry creation');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Create the cash flow entry
    const cashFlowEntry = await prisma.cashFlowEntry.create({
      data: {
        entry_date: new Date(entry_date),
        description,
        category,
        entry_type,
        amount: parseFloat(amount),
        source,
        marketplace: marketplace || null,
        reference: reference || null,
        notes: notes || null,
        created_by: created_by || null
      }
    });

    console.log(`✅ Cash flow entry created successfully: ${cashFlowEntry.id}`);

    res.status(201).json({
      success: true,
      data: cashFlowEntry,
      message: `${entry_type.charAt(0).toUpperCase() + entry_type.slice(1)} entry created successfully`
    });

  } catch (error) {
    console.error('❌ Error creating cash flow entry:', error);
    
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
      error: 'Failed to create cash flow entry',
      details: error.message
    });
  }
};

// Get cash flow entries with filtering
const getCashFlowEntries = async (req, res) => {
  try {
    const {
      entry_type,
      category,
      source,
      date_start,
      date_end,
      limit = 50,
      offset = 0
    } = req.query;

    console.log('💰 Fetching cash flow entries with filters:', {
      entry_type,
      category,
      source,
      date_start,
      date_end
    });

    // Initialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for cash flow entries fetch');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Build where clause
    const where = {};

    if (entry_type && ['income', 'expense'].includes(entry_type)) {
      where.entry_type = entry_type;
    }

    if (category) {
      where.category = category;
    }

    if (source) {
      where.source = source;
    }

    if (date_start || date_end) {
      where.entry_date = {};
      if (date_start) {
        where.entry_date.gte = new Date(date_start);
      }
      if (date_end) {
        where.entry_date.lte = new Date(date_end);
      }
    }

    // Fetch entries with pagination
    const entries = await prisma.cashFlowEntry.findMany({
      where,
      orderBy: { entry_date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Get total count for pagination
    const totalCount = await prisma.cashFlowEntry.count({ where });

    // Calculate summary statistics
    const totalIncome = await prisma.cashFlowEntry.aggregate({
      where: { ...where, entry_type: 'income' },
      _sum: { amount: true }
    });

    const totalExpenses = await prisma.cashFlowEntry.aggregate({
      where: { ...where, entry_type: 'expense' },
      _sum: { amount: true }
    });

    console.log(`✅ Fetched ${entries.length} cash flow entries out of ${totalCount} total`);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + entries.length < totalCount
        },
        summary: {
          total_income: totalIncome._sum.amount || 0,
          total_expenses: totalExpenses._sum.amount || 0,
          net_cash_flow: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching cash flow entries:', error);
    
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch cash flow entries',
      details: error.message
    });
  }
};

// Update cash flow entry
const updateCashFlowEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`💰 Updating cash flow entry ${id}:`, updateData);

    // Initialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for cash flow entry update');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Check if entry exists
    const existingEntry = await prisma.cashFlowEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Cash flow entry not found'
      });
    }

    // Prepare update data
    const dataToUpdate = {};
    if (updateData.entry_date) dataToUpdate.entry_date = new Date(updateData.entry_date);
    if (updateData.description) dataToUpdate.description = updateData.description;
    if (updateData.category) dataToUpdate.category = updateData.category;
    if (updateData.entry_type && ['income', 'expense'].includes(updateData.entry_type)) {
      dataToUpdate.entry_type = updateData.entry_type;
    }
    if (updateData.amount && typeof updateData.amount === 'number' && updateData.amount > 0) {
      dataToUpdate.amount = parseFloat(updateData.amount);
    }
    if (updateData.source) dataToUpdate.source = updateData.source;
    if (updateData.marketplace !== undefined) dataToUpdate.marketplace = updateData.marketplace;
    if (updateData.reference !== undefined) dataToUpdate.reference = updateData.reference;
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;

    // Update the entry
    const updatedEntry = await prisma.cashFlowEntry.update({
      where: { id },
      data: dataToUpdate
    });

    console.log(`✅ Cash flow entry updated successfully: ${updatedEntry.id}`);

    res.json({
      success: true,
      data: updatedEntry,
      message: 'Cash flow entry updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating cash flow entry:', error);
    
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Cash flow entry not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update cash flow entry',
      details: error.message
    });
  }
};

// Delete cash flow entry
const deleteCashFlowEntry = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`💰 Deleting cash flow entry: ${id}`);

    // Initialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for cash flow entry deletion');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Check if entry exists
    const existingEntry = await prisma.cashFlowEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Cash flow entry not found'
      });
    }

    // Delete the entry
    await prisma.cashFlowEntry.delete({
      where: { id }
    });

    console.log(`✅ Cash flow entry deleted successfully: ${id}`);

    res.json({
      success: true,
      message: 'Cash flow entry deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting cash flow entry:', error);
    
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Cash flow entry not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete cash flow entry',
      details: error.message
    });
  }
};

// Get comprehensive cash flow data
const getCashFlowData = async (req, res) => {
  try {
    const {
      date_start,
      date_end,
      granularity = 'daily',
      category,
      type,
      source,
      marketplace
    } = req.query;

    console.log('💰 Generating cash flow data with parameters:', {
      date_start,
      date_end,
      granularity,
      category,
      type,
      source,
      marketplace
    });

    // Quick validation of required parameters
    if (!date_start || !date_end) {
      console.log('❌ Missing required date parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: date_start and date_end are required'
      });
    }

    // Initialize or reinitialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for cash flow');
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
    const startDate = date_start ? new Date(date_start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = date_end ? new Date(date_end) : new Date();

    // Build where clause for sales data (income)
    const salesWhereClause = {
      created_time: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
      }
    };

    // Add marketplace filter
    if (marketplace && marketplace !== 'all') {
      const marketplaces = marketplace.split(',');
      salesWhereClause.marketplace = { in: marketplaces };
    }

    // Fetch sales data (primary income source) with error handling
    let salesData;
    try {
      salesData = await prisma.salesData.findMany({
        where: salesWhereClause,
        orderBy: { created_time: 'asc' },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          product_name: true,
          marketplace: true,
          order_id: true
        }
      });
      console.log(`💵 Found ${salesData.length} sales records for cash flow analysis`);
    } catch (queryError) {
      console.error('❌ Cash flow database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    console.log(`💵 Found ${salesData.length} sales records for cash flow analysis`);

    // Convert sales data to cash flow format
    const incomeTransactions = salesData.map(sale => ({
      id: `income_${sale.id}`,
      date: sale.created_time,
      description: `Sales: ${sale.product_name}`,
      category: 'Sales',
      type: 'income',
      amount: sale.total_revenue || 0,
      source: sale.marketplace || 'Direct Sales',
      marketplace: sale.marketplace,
      reference: sale.order_id
    }));

    // Generate mock expense transactions (in real implementation, this would come from expense tracking)
    const expenseTransactions = generateMockExpenses(startDate, endDate, salesData);

    // Combine all transactions
    const allTransactions = [...incomeTransactions, ...expenseTransactions];

    // Generate cash flow summary
    const cashFlowSummary = generateCashFlowSummary(allTransactions, granularity);
    
    // Generate income breakdown
    const incomeBreakdown = generateIncomeBreakdown(incomeTransactions);
    
    // Generate expense breakdown
    const expenseBreakdown = generateExpenseBreakdown(expenseTransactions);

    // Generate cash flow forecast (mock implementation)
    const forecast = generateCashFlowForecast(cashFlowSummary);

    res.json({
      success: true,
      data: {
        cash_flow_summary: cashFlowSummary,
        income_breakdown: incomeBreakdown,
        expense_breakdown: expenseBreakdown,
        transactions: allTransactions.slice(0, 100), // Limit for performance
        forecast: forecast,
        filter_options: {
          categories: ['Sales', 'Marketing', 'Inventory', 'Operating', 'Other'],
          sources: ['Shopee', 'Tokopedia', 'Lazada', 'Blibli', 'TikTok Shop', 'Direct Sales', 'Other'],
          types: ['Income', 'Expense']
        },
        parameters: {
          date_start: startDate.toISOString(),
          date_end: endDate.toISOString(),
          granularity,
          total_transactions: allTransactions.length,
          total_income: incomeTransactions.reduce((sum, t) => sum + t.amount, 0),
          total_expenses: expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating cash flow data:', error);
    
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
      error: 'Failed to generate cash flow data',
      details: error.message
    });
  }
};

// Export cash flow report
const exportCashFlowReport = async (req, res) => {
  try {
    const { format = 'pdf', date_start, date_end, granularity = 'daily' } = req.query;

    console.log(`📄 Exporting cash flow report as ${format.toUpperCase()}...`);

    // Parse date range
    const startDate = date_start ? new Date(date_start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = date_end ? new Date(date_end) : new Date();

    // Generate filename
    const dateStr = `${formatDateForFile(startDate)}_${formatDateForFile(endDate)}`;
    const fileName = `cash_flow_report_${dateStr}.${format}`;

    // Mock file generation (in real implementation, generate actual files)
    let downloadUrl;
    let fileSize;

    switch (format) {
      case 'pdf':
        downloadUrl = `/downloads/cash-flow/pdf/${fileName}`;
        fileSize = 1024 * 1024 * 1.5; // Mock size
        break;
      case 'excel':
        downloadUrl = `/downloads/cash-flow/excel/${fileName}`;
        fileSize = 1024 * 1024 * 1.2; // Mock size
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
        format: format,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error exporting cash flow report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export cash flow report',
      details: error.message
    });
  }
};

// Get cash flow summary statistics
const getCashFlowSummary = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    console.log('📊 Generating cash flow summary for period:', period);

    // Calculate date range based on period
    let startDate, endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Initialize or reinitialize Prisma if needed
    if (!prisma) {
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
          errorFormat: 'minimal'
        });
        console.log('✅ Prisma client re-initialized for cash flow summary');
      } catch (initError) {
        console.error('❌ Failed to re-initialize Prisma:', initError);
        return res.status(500).json({
          success: false,
          error: 'Database initialization failed',
          details: initError.message
        });
      }
    }

    // Fetch sales data for income calculation with error handling
    let salesData;
    try {
      salesData = await prisma.salesData.findMany({
        where: {
          created_time: {
            gte: startDate.toISOString(),
            lte: endDate.toISOString()
          }
        },
        select: {
          id: true,
          created_time: true,
          total_revenue: true
        }
      });
    } catch (queryError) {
      console.error('❌ Cash flow summary database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    const totalIncome = salesData.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
    const totalExpenses = totalIncome * 0.7; // Mock: assume 70% of income as expenses
    const netCashFlow = totalIncome - totalExpenses;
    const cashFlowMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

    // Calculate growth rates (simplified) with error handling
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    let previousSalesData;
    try {
      previousSalesData = await prisma.salesData.findMany({
        where: {
          created_time: {
            gte: previousPeriodStart.toISOString(),
            lte: startDate.toISOString()
          }
        },
        select: {
          id: true,
          total_revenue: true
        }
      });
    } catch (queryError) {
      console.warn('⚠️ Could not fetch previous period data for growth calculation:', queryError);
      previousSalesData = []; // Use empty array as fallback
    }

    const previousIncome = previousSalesData.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
    const incomeGrowthRate = calculateGrowthRate(totalIncome, previousIncome);

    res.json({
      success: true,
      data: {
        period: period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_cash_flow: netCashFlow,
          cash_flow_margin: cashFlowMargin,
          income_growth_rate: incomeGrowthRate,
          transactions_count: salesData.length,
          average_transaction_value: salesData.length > 0 ? totalIncome / salesData.length : 0
        },
        metrics: {
          cash_conversion_cycle: 30, // Mock
          operating_cash_flow_ratio: 0.85, // Mock
          free_cash_flow_margin: cashFlowMargin * 0.8, // Mock
          cash_flow_stability_index: 0.75 // Mock
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating cash flow summary:', error);
    
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
      error: 'Failed to generate cash flow summary',
      details: error.message
    });
  }
};

// Helper functions

function generateCashFlowSummary(transactions, granularity) {
  const grouped = groupCashFlowByGranularity(transactions, granularity, 'date');
  const summary = [];

  for (const [period, data] of grouped) {
    const totalIncome = data.income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = data.expenses.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;
    const operatingCashFlow = netCashFlow * 0.9; // Mock calculation
    const freeCashFlow = operatingCashFlow * 0.8; // Mock calculation
    const cashFlowMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

    summary.push({
      period,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cash_flow: netCashFlow,
      operating_cash_flow: operatingCashFlow,
      free_cash_flow: freeCashFlow,
      cash_flow_margin: cashFlowMargin
    });
  }

  return summary.sort((a, b) => a.period.localeCompare(b.period));
}

function generateIncomeBreakdown(incomeTransactions) {
  const sourceMap = new Map();

  // Group by source
  incomeTransactions.forEach(transaction => {
    const source = transaction.source || 'Unknown';
    if (!sourceMap.has(source)) {
      sourceMap.set(source, {
        source,
        category: getCategoryForSource(source),
        amount: 0,
        transactions_count: 0
      });
    }

    const sourceData = sourceMap.get(source);
    sourceData.amount += transaction.amount;
    sourceData.transactions_count += 1;
  });

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate percentages and mock growth rates
  const breakdown = Array.from(sourceMap.values())
    .map(source => ({
      ...source,
      percentage: totalIncome > 0 ? (source.amount / totalIncome) * 100 : 0,
      growth_rate: Math.random() * 40 - 10 // Mock growth rate between -10% and 30%
    }))
    .sort((a, b) => b.amount - a.amount);

  return breakdown;
}

function generateExpenseBreakdown(expenseTransactions) {
  const categoryMap = new Map();

  // Group by category
  expenseTransactions.forEach(transaction => {
    const category = transaction.category || 'Other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        type: getExpenseType(category),
        amount: 0,
        transactions_count: 0
      });
    }

    const categoryData = categoryMap.get(category);
    categoryData.amount += transaction.amount;
    categoryData.transactions_count += 1;
  });

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate percentages and mock growth rates
  const breakdown = Array.from(categoryMap.values())
    .map(category => ({
      ...category,
      percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
      growth_rate: Math.random() * 30 - 5 // Mock growth rate between -5% and 25%
    }))
    .sort((a, b) => b.amount - a.amount);

  return breakdown;
}

function getExpenseType(category) {
  const categoryTypes = {
    'COGS': 'operating',
    'Marketing': 'marketing',
    'Operating': 'operating',
    'Logistics': 'operating',
    'Inventory': 'inventory',
    'Fixed': 'fixed',
    'Other': 'other'
  };
  return categoryTypes[category] || 'other';
}

module.exports = {
  createCashFlowEntry,
  getCashFlowEntries,
  updateCashFlowEntry,
  deleteCashFlowEntry,
  getCashFlowData,
  exportCashFlowReport,
  getCashFlowSummary
};