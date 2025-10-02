const express = require('express');
const router = express.Router();
const { 
  getAnalyticsData,
  getMarketplaceAnalytics
} = require('../controllers/analyticsController');

// Analytics routes
router.get('/', getAnalyticsData);
router.get('/marketplace', getMarketplaceAnalytics);

module.exports = router;