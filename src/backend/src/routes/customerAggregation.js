const express = require('express');
const { devOnlyAuth } = require('../middleware/auth');
const {
  getCustomerAggregation,
  getCustomerAggregationSummary,
  getCustomerLocations
} = require('../controllers/customerAggregationController');

const router = express.Router();

/**
 * @route   GET /api/customer-aggregation
 * @desc    Get aggregated customer analytics with filtering
 * @access  Development only
 * @query   province, regency_city, date_start, date_end, customer_type
 */
router.get('/', devOnlyAuth, getCustomerAggregation);

/**
 * @route   GET /api/customer-aggregation/summary
 * @desc    Get customer aggregation summary for dashboard widgets
 * @access  Development only
 */
router.get('/summary', devOnlyAuth, getCustomerAggregationSummary);

/**
 * @route   GET /api/customer-aggregation/locations
 * @desc    Get available provinces and cities for filter options
 * @access  Development only
 */
router.get('/locations', devOnlyAuth, getCustomerLocations);

module.exports = router;