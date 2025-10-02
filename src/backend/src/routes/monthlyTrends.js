const express = require('express');
const { devOnlyAuth } = require('../middleware/auth');
const {
  getMonthlyTrends,
  getMonthlyTrendSummary
} = require('../controllers/monthlyTrendController');

const router = express.Router();

/**
 * @route   GET /api/monthly-trends
 * @desc    Get complete month-over-month KPI comparison data
 * @access  Development only
 */
router.get('/', devOnlyAuth, getMonthlyTrends);

/**
 * @route   GET /api/monthly-trends/summary
 * @desc    Get lightweight monthly trend summary for quick display
 * @access  Development only
 */
router.get('/summary', devOnlyAuth, getMonthlyTrendSummary);

module.exports = router;