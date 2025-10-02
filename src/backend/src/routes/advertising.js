// Advertising Routes for D'Busana Fashion Dashboard
// Handles routing for advertising/marketing data endpoints

const express = require('express');
const router = express.Router();
const {
  getAdvertisingData,
  getAdvertisingDataById,
  createAdvertisingData,
  updateAdvertisingData,
  deleteAdvertisingData,
  getAdvertisingAnalytics,
  getAdvertisingTimeSeries,
  getAdvertisingSettlementAnalytics
} = require('../controllers/advertisingController');

// Middleware for logging (optional)
const logRequest = (req, res, next) => {
  console.log(`📊 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

// Apply logging middleware to all routes
router.use(logRequest);

// GET /api/advertising - Get all advertising data with optional filtering
router.get('/', getAdvertisingData);

// GET /api/advertising/debug - Debug advertising data 
router.get('/debug', require('../controllers/advertisingController').debugAdvertisingData);

// GET /api/advertising/analytics - Get advertising analytics/dashboard data
router.get('/analytics', getAdvertisingAnalytics);

// GET /api/advertising/stats - Alias for analytics (frontend compatibility)
router.get('/stats', getAdvertisingAnalytics);

// GET /api/advertising/timeseries - Get advertising time series data for charts
router.get('/timeseries', getAdvertisingTimeSeries);

// GET /api/advertising/settlement - Get advertising settlement analytics
router.get('/settlement', getAdvertisingSettlementAnalytics);

// GET /api/advertising/settlement/analytics - Get advertising settlement analytics (legacy endpoint)
router.get('/settlement/analytics', getAdvertisingSettlementAnalytics);

// GET /api/advertising/:id - Get advertising data by ID
router.get('/:id', getAdvertisingDataById);

// POST /api/advertising - Create new advertising data
router.post('/', createAdvertisingData);

// PUT /api/advertising/:id - Update advertising data
router.put('/:id', updateAdvertisingData);

// DELETE /api/advertising/:id - Delete advertising data
router.delete('/:id', deleteAdvertisingData);

module.exports = router;