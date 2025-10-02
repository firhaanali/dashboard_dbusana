const express = require('express');
const router = express.Router();
const {
  getReportsData,
  generateReport,
  bulkExportReports,
  getScheduledReports
} = require('../controllers/reportsController');

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
 * @route GET /api/reports
 * @desc Get comprehensive reports data with multiple report types
 * @query {string} date_start - Start date (YYYY-MM-DD)
 * @query {string} date_end - End date (YYYY-MM-DD)
 * @query {string} granularity - Data granularity (daily, weekly, monthly, yearly)
 * @query {string} marketplace - Comma-separated marketplaces
 * @query {string} category - Comma-separated categories
 * @query {string} brand - Comma-separated brands
 * @query {string} product - Comma-separated products
 * @access Public (development)
 */
router.get('/', getReportsData);

/**
 * @route GET /api/reports/generate
 * @desc Generate individual report file
 * @query {string} type - Report type (sales, financial, product, inventory, marketing, customer)
 * @query {string} format - Output format (pdf, excel, csv)
 * @query {string} date_start - Start date (YYYY-MM-DD)
 * @query {string} date_end - End date (YYYY-MM-DD)
 * @access Public (development)
 */
router.get('/generate', generateReport);

/**
 * @route POST /api/reports/bulk-export
 * @desc Export multiple reports as ZIP file
 * @body {string[]} report_types - Array of report types to export
 * @body {object} filters - Filter parameters for reports
 * @body {string} format - Export format (zip, folder)
 * @access Public (development)
 */
router.post('/bulk-export', bulkExportReports);

/**
 * @route GET /api/reports/scheduled
 * @desc Get scheduled reports configuration
 * @access Public (development)
 */
router.get('/scheduled', getScheduledReports);

/**
 * @route POST /api/reports/schedule
 * @desc Create or update scheduled report
 * @body {string} name - Report name
 * @body {string} type - Report type
 * @body {string} schedule - Schedule frequency (daily, weekly, monthly)
 * @body {string} time - Time to run (HH:MM)
 * @body {string[]} recipients - Email recipients
 * @body {string} format - Report format
 * @access Public (development)
 */
router.post('/schedule', (req, res) => {
  try {
    const { name, type, schedule, time, recipients, format } = req.body;
    
    // Mock scheduled report creation
    const scheduledReport = {
      id: `schedule_${Date.now()}`,
      name,
      type,
      schedule,
      time,
      recipients,
      format,
      status: 'active',
      created_at: new Date().toISOString(),
      next_run: calculateNextRun(schedule, time)
    };

    console.log('📅 Created scheduled report:', scheduledReport);

    res.json({
      success: true,
      data: scheduledReport,
      message: 'Scheduled report created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating scheduled report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create scheduled report',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/reports/schedule/:id
 * @desc Delete scheduled report
 * @param {string} id - Scheduled report ID
 * @access Public (development)
 */
router.delete('/schedule/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting scheduled report:', id);

    res.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting scheduled report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scheduled report',
      details: error.message
    });
  }
});

/**
 * @route GET /api/reports/templates
 * @desc Get available report templates
 * @access Public (development)
 */
router.get('/templates', (req, res) => {
  try {
    const templates = [
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level business overview with key metrics',
        type: 'executive',
        sections: ['revenue', 'profit', 'growth', 'top_products'],
        format: ['pdf', 'powerpoint']
      },
      {
        id: 'detailed_sales',
        name: 'Detailed Sales Analysis',
        description: 'Comprehensive sales breakdown by product, marketplace, and time',
        type: 'sales',
        sections: ['sales_trend', 'marketplace_breakdown', 'product_performance'],
        format: ['excel', 'pdf']
      },
      {
        id: 'financial_statement',
        name: 'Financial Statement',
        description: 'Revenue, costs, and profit analysis',
        type: 'financial',
        sections: ['pnl', 'cash_flow', 'profitability'],
        format: ['excel', 'pdf']
      },
      {
        id: 'inventory_optimization',
        name: 'Inventory Optimization',
        description: 'Stock levels, turnover, and reorder recommendations',
        type: 'inventory',
        sections: ['stock_status', 'turnover_analysis', 'reorder_alerts'],
        format: ['excel', 'csv']
      }
    ];

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Error fetching report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report templates',
      details: error.message
    });
  }
});

/**
 * @route POST /api/reports/custom
 * @desc Generate custom report based on template
 * @body {string} template_id - Template ID to use
 * @body {object} parameters - Custom parameters for the template
 * @body {object} filters - Data filters
 * @access Public (development)
 */
router.post('/custom', (req, res) => {
  try {
    const { template_id, parameters, filters } = req.body;
    
    console.log('🎨 Generating custom report:', { template_id, parameters, filters });

    // Mock custom report generation
    const customReport = {
      id: `custom_${Date.now()}`,
      template_id,
      parameters,
      filters,
      status: 'generating',
      created_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };

    res.json({
      success: true,
      data: customReport,
      message: 'Custom report generation started'
    });

  } catch (error) {
    console.error('❌ Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report',
      details: error.message
    });
  }
});

// Helper function to calculate next run time
function calculateNextRun(schedule, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const nextRun = new Date();
  
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (schedule) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'weekly':
      // Next Monday
      const daysUntilNextMonday = (1 + 7 - nextRun.getDay()) % 7 || 7;
      nextRun.setDate(nextRun.getDate() + daysUntilNextMonday);
      break;
    case 'monthly':
      // First day of next month
      nextRun.setMonth(nextRun.getMonth() + 1, 1);
      break;
  }
  
  return nextRun.toISOString();
}

module.exports = router;