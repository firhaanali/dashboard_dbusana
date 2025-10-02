const express = require('express');
const { devOnlyAuth } = require('../middleware/auth');
const {
  getDashboardMetrics,
  getChartData,
  getCategorySales,
  getBrandPerformance,
  getTopProducts,
  getRecentActivities,
  getKPISummary,
  getRevenueByCreated,
  getRevenueByDelivered,
  getMarketplaceAnalytics,
  getMainAnalytics
} = require('../controllers/dashboardController');

// Import monthly trends functionality
const {
  getMonthlyTrends,
  getMonthlyTrendSummary
} = require('../controllers/monthlyTrendController');

const router = express.Router();

/**
 * Dashboard routes matching frontend ImportDataContext methods
 */

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get comprehensive dashboard metrics (matches getDashboardMetrics)
 * @access  Development only
 */
router.get('/metrics', devOnlyAuth, getDashboardMetrics);

/**
 * @route   GET /api/dashboard/charts
 * @desc    Get chart data for analytics dashboard (matches getChartData)
 * @access  Development only
 * @query   period (7d, 30d, 90d)
 */
router.get('/charts', devOnlyAuth, getChartData);

/**
 * @route   GET /api/dashboard/category-sales
 * @desc    Get sales data grouped by category (matches getCategorySales)
 * @access  Development only
 */
router.get('/category-sales', devOnlyAuth, getCategorySales);

/**
 * @route   GET /api/dashboard/brand-performance
 * @desc    Get performance data grouped by brand (matches getBrandPerformance)
 * @access  Development only
 */
router.get('/brand-performance', devOnlyAuth, getBrandPerformance);

/**
 * @route   GET /api/dashboard/top-products
 * @desc    Get top selling products (matches getTopProducts)
 * @access  Development only
 * @query   limit (default: 10)
 */
router.get('/top-products', devOnlyAuth, getTopProducts);

/**
 * @route   GET /api/dashboard/recent-activities
 * @desc    Get recent sales and stock activities (matches getRecentActivities)
 * @access  Development only
 * @query   limit (default: 10)
 */
router.get('/recent-activities', devOnlyAuth, getRecentActivities);

/**
 * @route   GET /api/dashboard/kpi-summary
 * @desc    Get simplified KPI metrics (matches getKPISummary)
 * @access  Development only
 */
router.get('/kpi-summary', devOnlyAuth, getKPISummary);

/**
 * @route   GET /api/dashboard/revenue-by-created
 * @desc    Get revenue data based on created_time
 * @access  Development only
 * @query   period (7d, 30d, 90d)
 */
router.get('/revenue-by-created', devOnlyAuth, getRevenueByCreated);

/**
 * @route   GET /api/dashboard/revenue-by-delivered
 * @desc    Get revenue data based on delivered_time
 * @access  Development only
 * @query   period (7d, 30d, 90d)
 */
router.get('/revenue-by-delivered', devOnlyAuth, getRevenueByDelivered);

/**
 * @route   GET /api/dashboard/marketplace-analytics
 * @desc    Get marketplace specific analytics and breakdown
 * @access  Development only
 */
router.get('/marketplace-analytics', devOnlyAuth, getMarketplaceAnalytics);

/**
 * @route   GET /api/dashboard/main-analytics
 * @desc    Get main dashboard analytics for simplified dashboard
 * @access  Development only
 * @query   from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
router.get('/main-analytics', devOnlyAuth, getMainAnalytics);

/**
 * @route   GET /api/dashboard/monthly-trends
 * @desc    Get month-over-month KPI comparison data (alias for /api/monthly-trends)
 * @access  Development only
 */
router.get('/monthly-trends', devOnlyAuth, getMonthlyTrends);

/**
 * @route   GET /api/dashboard/monthly-trends/summary
 * @desc    Get lightweight monthly trend summary (alias for /api/monthly-trends/summary)
 * @access  Development only
 */
router.get('/monthly-trends/summary', devOnlyAuth, getMonthlyTrendSummary);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get complete dashboard overview (all data in one call)
 * @access  Development only
 */
router.get('/overview', devOnlyAuth, async (req, res) => {
  try {
    console.log('📊 Fetching complete dashboard overview...');
    
    // Import all controller functions
    const dashboardController = require('../controllers/dashboardController');
    
    // Create mock req/res objects for internal calls
    const mockReq = { query: req.query };
    const results = {};
    
    // Helper to capture controller responses
    const createMockRes = (key) => ({
      json: (data) => { results[key] = data; },
      status: (code) => ({ json: (data) => { results[key] = { ...data, statusCode: code }; } })
    });
    
    // Call all dashboard methods
    await Promise.all([
      new Promise(resolve => {
        dashboardController.getDashboardMetrics(mockReq, createMockRes('metrics'));
        resolve();
      }),
      new Promise(resolve => {
        dashboardController.getChartData(mockReq, createMockRes('charts'));
        resolve();
      }),
      new Promise(resolve => {
        dashboardController.getCategorySales(mockReq, createMockRes('categorySales'));
        resolve();
      }),
      new Promise(resolve => {
        dashboardController.getBrandPerformance(mockReq, createMockRes('brandPerformance'));
        resolve();
      }),
      new Promise(resolve => {
        dashboardController.getTopProducts(mockReq, createMockRes('topProducts'));
        resolve();
      }),
      new Promise(resolve => {
        dashboardController.getRecentActivities(mockReq, createMockRes('recentActivities'));
        resolve();
      }),
      new Promise(resolve => {
        dashboardController.getKPISummary(mockReq, createMockRes('kpiSummary'));
        resolve();
      })
    ]);
    
    console.log('✅ Dashboard overview compiled successfully');
    
    res.json({
      success: true,
      data: {
        metrics: results.metrics?.data,
        charts: results.charts?.data,
        categorySales: results.categorySales?.data,
        brandPerformance: results.brandPerformance?.data,
        topProducts: results.topProducts?.data,
        recentActivities: results.recentActivities?.data,
        kpiSummary: results.kpiSummary?.data
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard overview',
      message: error.message
    });
  }
});

module.exports = router;