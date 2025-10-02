const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const importRoutes = require('./import');
const productsRoutes = require('./products');
const stockRoutes = require('./stock');
const salesRoutes = require('./sales');
const categoriesRoutes = require('./categories');
const brandsRoutes = require('./brands');
const suppliersRoutes = require('./suppliers');
const tailorsRoutes = require('./tailors');
const customersRoutes = require('./customers');
const invoicesRoutes = require('./invoices');
const advertisingRoutes = require('./advertising');
const forecastingRoutes = require('./forecasting');
const reportsRoutes = require('./reports');
const cashFlowRoutes = require('./cashflow');
const bomRoutes = require('./bom');
const purchaseOrderRoutes = require('./purchaseOrders');
const analyticsRoutes = require('./analytics');
const debugRoutes = require('./debug');
const testRoutes = require('./test');
const usersRoutes = require('./users');
const importHistoryRoutes = require('./importHistory');
const templateFixRoutes = require('./templateFix');
const advertisingSettlementTemplateRoutes = require('./advertisingSettlementTemplate');
const affiliateEndorseRoutes = require('./affiliateEndorse');
const activityLogsRoutes = require('./activityLogs');
const dataRangeRoutes = require('./data-range');
const duplicateCheckRoutes = require('./duplicateCheck');
const customerAggregationRoutes = require('./customerAggregation');
const monthlyTrendsRoutes = require('./monthlyTrends');
const customerMatchingRoutes = require('./customerMatching');
const productHPPRoutes = require('./productHPP');
const returnsAndCancellationsRoutes = require('./returnsAndCancellations');
const marketplaceReimbursementsRoutes = require('./marketplaceReimbursements');
const commissionAdjustmentsRoutes = require('./commissionAdjustments');
const affiliateSamplesRoutes = require('./affiliateSamples');
const transactionTemplatesRoutes = require('./transactionTemplates');
const enhancedTemplatesRoutes = require('./enhancedTemplates');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'D\'Busana Fashion Dashboard API',
    version: '1.0.0',
    endpoints: {
      dashboard: '/api/dashboard',
      import: '/api/import',
      products: '/api/products',
      sales: '/api/sales',
      stock: '/api/stock',
      categories: '/api/categories',
      brands: '/api/brands',
      suppliers: '/api/suppliers',
      tailors: '/api/tailors',
      customers: '/api/customers',
      invoices: '/api/invoices',
      purchaseOrders: '/api/purchase-orders',
      advertising: '/api/advertising',
      forecasting: '/api/forecasting',
      reports: '/api/reports',
      cashflow: '/api/cash-flow',
      bom: '/api/bom',
      analytics: '/api/analytics',
      affiliateEndorse: '/api/affiliate-endorse',
      activityLogs: '/api/activity-logs',
      dataRange: '/api/data-range',
      duplicateCheck: '/api/import/check-duplicates',
      customerAggregation: '/api/customer-aggregation',
      monthlyTrends: '/api/monthly-trends',
      customerMatching: '/api/customer-matching',
      productHPP: '/api/product-hpp',
      returnsAndCancellations: '/api/returns-cancellations',
      marketplaceReimbursements: '/api/marketplace-reimbursements',
      commissionAdjustments: '/api/commission-adjustments',
      affiliateSamples: '/api/affiliate-samples',
      users: '/api/users',
      importHistory: '/api/import-history',
      templates: '/api/templates',
      templatesEnhanced: '/api/templates-enhanced',
      auth: '/api/auth',
      debug: '/api/debug',
      test: process.env.NODE_ENV === 'development' ? '/api/test' : undefined
    },
    features: [
      'Excel/CSV Import with Validation',
      'Real-time Dashboard Analytics',
      'KPI Metrics Calculation',
      'Sales Data Management',
      'Product & Stock Management',
      'Advertising & Marketing Analytics',
      'AI-Powered Sales Forecasting',
      'Comprehensive Business Reports',
      'Cash Flow & Financial Management',
      'Bill of Materials (BOM) Management',
      'Supplier & Purchase Order Management',
      'Customer Relationship Management',
      'Invoice & Receipt Management',
      'User Management & Role-Based Access Control',
      'Error Handling & Logging'
    ],
    documentation: process.env.API_DOCS_URL || '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/import', importRoutes);
router.use('/import', duplicateCheckRoutes);
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);
router.use('/stock', stockRoutes);
router.use('/categories', categoriesRoutes);
router.use('/brands', brandsRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/tailors', tailorsRoutes);
// router.use('/customers', customersRoutes); // Old customers route with Prisma query issues
// router.use('/customers', require('./customers-simple')); // Old customers-simple route
router.use('/customers', require('./customers-fixed')); // Use fixed customers route without complex Prisma queries
router.use('/invoices', invoicesRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/advertising', advertisingRoutes);
router.use('/forecasting', forecastingRoutes);
router.use('/reports', reportsRoutes);
router.use('/cash-flow', cashFlowRoutes);
router.use('/bom', bomRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', usersRoutes);
router.use('/import-history', importHistoryRoutes);
router.use('/template-fix', templateFixRoutes);
router.use('/advertising-settlement-template', advertisingSettlementTemplateRoutes);
router.use('/affiliate-endorse', affiliateEndorseRoutes);
router.use('/activity-logs', activityLogsRoutes);
router.use('/data-range', dataRangeRoutes);
router.use('/customer-aggregation', customerAggregationRoutes);
router.use('/monthly-trends', monthlyTrendsRoutes);
router.use('/customer-matching', customerMatchingRoutes);
router.use('/product-hpp', productHPPRoutes);
router.use('/returns-cancellations', returnsAndCancellationsRoutes);
router.use('/marketplace-reimbursements', marketplaceReimbursementsRoutes);
router.use('/commission-adjustments', commissionAdjustmentsRoutes);
router.use('/affiliate-samples', affiliateSamplesRoutes);
router.use('/templates', transactionTemplatesRoutes);
router.use('/templates-enhanced', enhancedTemplatesRoutes);
router.use('/debug', debugRoutes);

// Add test routes for CORS debugging (development only)
if (process.env.NODE_ENV === 'development') {
  router.use('/test', testRoutes);
}

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;