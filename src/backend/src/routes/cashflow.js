const express = require('express');
const router = express.Router();
const {
  createCashFlowEntry,
  getCashFlowEntries,
  updateCashFlowEntry,
  deleteCashFlowEntry,
  getCashFlowData,
  exportCashFlowReport,
  getCashFlowSummary
} = require('../controllers/cashFlowController_Fixed');

// Development middleware for CORS
router.use((req, res, next) => {
  if (req.headers['x-development-only'] === 'true') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-development-only');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  next();
});

/**
 * @route GET /api/cash-flow/test
 * @desc Test endpoint for cash flow API
 * @access Public (development)
 */
router.get('/test', (req, res) => {
  try {
    console.log('🧪 Cash flow test endpoint hit');
    res.json({
      success: true,
      message: 'Cash flow API test endpoint working',
      timestamp: new Date().toISOString(),
      query_params: req.query,
      headers: {
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('❌ Cash flow test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      details: error.message
    });
  }
});

/**
 * @route GET /api/cash-flow
 * @desc Get comprehensive cash flow data with income and expense analysis
 * @query {string} date_start - Start date (YYYY-MM-DD)
 * @query {string} date_end - End date (YYYY-MM-DD)
 * @query {string} granularity - Data granularity (daily, weekly, monthly, yearly)
 * @query {string} category - Comma-separated categories
 * @query {string} type - Transaction types (income, expense)
 * @query {string} source - Income/expense sources
 * @query {string} marketplace - Comma-separated marketplaces
 * @access Public (development)
 */
router.get('/', getCashFlowData);

/**
 * @route GET /api/cash-flow/entries
 * @desc Get cash flow entries with filtering and pagination
 * @query {string} entry_type - Filter by type (income, expense)
 * @query {string} category - Filter by category
 * @query {string} source - Filter by source
 * @query {string} date_start - Start date (YYYY-MM-DD)
 * @query {string} date_end - End date (YYYY-MM-DD)
 * @query {number} limit - Number of entries per page (default: 50)
 * @query {number} offset - Pagination offset (default: 0)
 * @access Public (development)
 */
router.get('/entries', getCashFlowEntries);

/**
 * @route POST /api/cash-flow/entries
 * @desc Create new cash flow entry (income or expense)
 * @body {string} entry_date - Entry date (YYYY-MM-DD)
 * @body {string} description - Entry description
 * @body {string} category - Entry category
 * @body {string} entry_type - Entry type (income or expense)
 * @body {number} amount - Entry amount
 * @body {string} source - Entry source
 * @body {string} marketplace - Optional marketplace
 * @body {string} reference - Optional reference number
 * @body {string} notes - Optional notes
 * @access Public (development)
 */
router.post('/entries', createCashFlowEntry);

/**
 * @route PUT /api/cash-flow/entries/:id
 * @desc Update existing cash flow entry
 * @param {string} id - Entry ID
 * @body Updated entry fields
 * @access Public (development)
 */
router.put('/entries/:id', updateCashFlowEntry);

/**
 * @route DELETE /api/cash-flow/entries/:id
 * @desc Delete cash flow entry
 * @param {string} id - Entry ID
 * @access Public (development)
 */
router.delete('/entries/:id', deleteCashFlowEntry);

/**
 * @route GET /api/cash-flow/summary
 * @desc Get cash flow summary statistics for specific period
 * @query {string} period - Time period (7d, 30d, 90d, 1y)
 * @access Public (development)
 */
router.get('/summary', getCashFlowSummary);

/**
 * @route GET /api/cash-flow/export
 * @desc Export cash flow report in various formats
 * @query {string} format - Export format (pdf, excel)
 * @query {string} date_start - Start date (YYYY-MM-DD)
 * @query {string} date_end - End date (YYYY-MM-DD)
 * @query {string} granularity - Data granularity
 * @access Public (development)
 */
router.get('/export', exportCashFlowReport);



/**
 * @route GET /api/cash-flow/categories
 * @desc Get available cash flow categories and sources
 * @access Public (development)
 */
router.get('/categories', (req, res) => {
  try {
    const categories = {
      income_categories: [
        { id: 'sales', name: 'Sales Revenue', description: 'Revenue from product sales' },
        { id: 'other_income', name: 'Other Income', description: 'Additional income sources' },
        { id: 'investment', name: 'Investment Income', description: 'Returns from investments' },
        { id: 'loan', name: 'Loan/Financing', description: 'Borrowed funds' }
      ],
      expense_categories: [
        { id: 'cogs', name: 'Cost of Goods Sold', description: 'Direct product costs' },
        { id: 'marketing', name: 'Marketing & Advertising', description: 'Promotional expenses' },
        { id: 'operating', name: 'Operating Expenses', description: 'Day-to-day operational costs' },
        { id: 'fixed', name: 'Fixed Costs', description: 'Rent, utilities, salaries' },
        { id: 'other', name: 'Other Expenses', description: 'Miscellaneous expenses' }
      ],
      income_sources: [
        'Shopee', 'Tokopedia', 'Lazada', 'Blibli', 'TikTok Shop', 
        'Direct Sales', 'Wholesale', 'Other'
      ],
      expense_sources: [
        'Suppliers', 'Marketing Platforms', 'Logistics', 'Utilities', 
        'Banking', 'Government', 'Other'
      ]
    };

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ Error fetching cash flow categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

/**
 * @route GET /api/cash-flow/metrics
 * @desc Get advanced cash flow metrics and KPIs
 * @query {string} period - Analysis period (30d, 90d, 1y)
 * @access Public (development)
 */
router.get('/metrics', (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Mock advanced metrics calculation
    const metrics = {
      period: period,
      cash_flow_metrics: {
        cash_conversion_cycle: {
          value: 45,
          unit: 'days',
          description: 'Time to convert investment to cash',
          trend: 'improving'
        },
        operating_cash_flow_ratio: {
          value: 0.85,
          unit: 'ratio',
          description: 'Operating cash flow / Net income',
          trend: 'stable'
        },
        free_cash_flow_margin: {
          value: 0.12,
          unit: 'percentage',
          description: 'Free cash flow / Revenue',
          trend: 'improving'
        },
        cash_flow_stability: {
          value: 0.78,
          unit: 'index',
          description: 'Consistency of cash flows',
          trend: 'stable'
        }
      },
      liquidity_metrics: {
        current_ratio: {
          value: 2.1,
          unit: 'ratio',
          description: 'Current assets / Current liabilities',
          benchmark: 'healthy'
        },
        quick_ratio: {
          value: 1.8,
          unit: 'ratio',
          description: 'Quick assets / Current liabilities',
          benchmark: 'healthy'
        },
        cash_ratio: {
          value: 0.5,
          unit: 'ratio',
          description: 'Cash / Current liabilities',
          benchmark: 'adequate'
        }
      },
      efficiency_metrics: {
        inventory_turnover: {
          value: 8.5,
          unit: 'times per year',
          description: 'Cost of goods sold / Average inventory',
          trend: 'improving'
        },
        receivables_turnover: {
          value: 12.3,
          unit: 'times per year',
          description: 'Credit sales / Average receivables',
          trend: 'stable'
        },
        payables_turnover: {
          value: 6.8,
          unit: 'times per year',
          description: 'Cost of goods sold / Average payables',
          trend: 'stable'
        }
      }
    };

    res.json({
      success: true,
      data: metrics,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error calculating cash flow metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate metrics',
      details: error.message
    });
  }
});

/**
 * @route POST /api/cash-flow/forecast
 * @desc Generate cash flow forecast using various models
 * @body {string} method - Forecasting method (linear, seasonal, ml)
 * @body {number} periods - Number of periods to forecast
 * @body {string} granularity - Forecast granularity (daily, weekly, monthly)
 * @access Public (development)
 */
router.post('/forecast', (req, res) => {
  try {
    const { method = 'linear', periods = 6, granularity = 'monthly' } = req.body;
    
    console.log('🔮 Generating cash flow forecast:', { method, periods, granularity });

    // Mock forecast generation
    const forecast = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= periods; i++) {
      const forecastDate = new Date(baseDate);
      
      if (granularity === 'monthly') {
        forecastDate.setMonth(forecastDate.getMonth() + i);
      } else if (granularity === 'weekly') {
        forecastDate.setDate(forecastDate.getDate() + (i * 7));
      } else {
        forecastDate.setDate(forecastDate.getDate() + i);
      }

      const randomVariation = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
      const baseIncome = 50000000; // Base 50M IDR
      const baseExpenses = 35000000; // Base 35M IDR
      
      const predictedIncome = baseIncome * randomVariation * (1 + i * 0.05);
      const predictedExpenses = baseExpenses * randomVariation * (1 + i * 0.03);
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
        scenario: predictedNetFlow > 0 ? 'realistic' : 'conservative',
        method_used: method
      });
    }

    res.json({
      success: true,
      data: {
        forecast: forecast,
        method: method,
        periods: periods,
        granularity: granularity,
        confidence_level: 0.85,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating cash flow forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      details: error.message
    });
  }
});

/**
 * @route POST /api/cash-flow/profit-reinvestment
 * @desc Record profit reinvestment transaction
 * @body {string} source_profit_period - Source profit period (YYYY-MM)
 * @body {number} profit_amount - Available profit amount
 * @body {string} reinvestment_type - Type of reinvestment
 * @body {number} reinvestment_amount - Amount being reinvested
 * @body {string} description - Description of reinvestment
 * @body {string} supplier_name - Supplier/vendor name (optional)
 * @body {string} payment_method - Payment method used
 * @body {string} date - Transaction date
 * @body {string} status - Transaction status (planned/executed/cancelled)
 * @body {string} notes - Additional notes (optional)
 * @access Public (development)
 */
router.post('/profit-reinvestment', (req, res) => {
  try {
    const {
      source_profit_period,
      profit_amount,
      reinvestment_type,
      reinvestment_amount,
      description,
      supplier_name,
      payment_method,
      date,
      status,
      notes
    } = req.body;

    console.log('💰 Recording profit reinvestment:', {
      source_profit_period,
      reinvestment_type,
      reinvestment_amount,
      status
    });

    // Validate required fields
    if (!source_profit_period || !reinvestment_amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['source_profit_period', 'reinvestment_amount', 'description']
      });
    }

    // Mock successful creation
    const newReinvestment = {
      id: Date.now().toString(),
      source_profit_period,
      profit_amount: parseFloat(profit_amount) || 0,
      reinvestment_type: reinvestment_type || 'other',
      reinvestment_amount: parseFloat(reinvestment_amount),
      description,
      supplier_name: supplier_name || null,
      payment_method: payment_method || 'Transfer Bank',
      date: date || new Date().toISOString().split('T')[0],
      status: status || 'planned',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In real implementation, save to database here
    // await saveReinvestmentToDatabase(newReinvestment);

    res.status(201).json({
      success: true,
      message: 'Profit reinvestment recorded successfully',
      data: newReinvestment
    });

  } catch (error) {
    console.error('❌ Error recording profit reinvestment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record profit reinvestment',
      details: error.message
    });
  }
});

/**
 * @route GET /api/cash-flow/profit-reinvestment
 * @desc Get profit reinvestment history
 * @query {string} period - Filter by source profit period
 * @query {string} type - Filter by reinvestment type
 * @query {string} status - Filter by status
 * @query {number} limit - Number of records to return
 * @query {number} offset - Pagination offset
 * @access Public (development)
 */
router.get('/profit-reinvestment', (req, res) => {
  try {
    const {
      period,
      type,
      status,
      limit = 50,
      offset = 0
    } = req.query;

    console.log('📊 Fetching profit reinvestment history:', {
      period,
      type,
      status,
      limit,
      offset
    });

    // Real implementation - fetch from database
    // TODO: Connect to ProfitReinvestment table when database model is created
    const mockReinvestments = [];

    // Apply filters
    let filteredData = mockReinvestments;

    if (period) {
      filteredData = filteredData.filter(r => r.source_profit_period === period);
    }

    if (type) {
      filteredData = filteredData.filter(r => r.reinvestment_type === type);
    }

    if (status) {
      filteredData = filteredData.filter(r => r.status === status);
    }

    // Apply pagination
    const total = filteredData.length;
    const paginatedData = filteredData.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        reinvestments: paginatedData,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_next: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching profit reinvestment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reinvestment history',
      details: error.message
    });
  }
});

/**
 * @route GET /api/cash-flow/profit-periods
 * @desc Get available profit periods for reinvestment
 * @access Public (development)
 */
router.get('/profit-periods', (req, res) => {
  try {
    console.log('📅 Fetching available profit periods');

    // Real implementation - calculate from sales data and advertising costs
    // TODO: Calculate profit periods from actual database data
    const profitPeriods = [];

    res.json({
      success: true,
      data: {
        profit_periods: profitPeriods,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching profit periods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profit periods',
      details: error.message
    });
  }
});

/**
 * @route GET /api/cash-flow/health
 * @desc Get cash flow health assessment and recommendations
 * @access Public (development)
 */
router.get('/health', (req, res) => {
  try {
    // Real implementation - calculate from actual financial data
    // TODO: Implement real cash flow health assessment based on actual data
    
    res.json({
      success: true,
      data: {
        message: 'Health assessment will be calculated from your real financial data',
        note: 'Please add your actual cash flow data to see health metrics'
      }
    });

  } catch (error) {
    console.error('❌ Error generating health assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health assessment',
      details: error.message
    });
  }
});

module.exports = router;