const express = require('express');
const { getSales, getSalesStats, getSalesChartData, getMarketplaceStats, updateMarketplaceData } = require('../controllers/salesController');

const router = express.Router();

/**
 * @route   GET /api/sales
 * @desc    Get all sales data with pagination
 * @access  Public (for development)
 */
router.get('/', getSales);

/**
 * @route   GET /api/sales/stats
 * @desc    Get sales statistics
 * @access  Public (for development)
 */
router.get('/stats', getSalesStats);

/**
 * @route   GET /api/sales/chart-data
 * @desc    Get sales chart data for different periods
 * @access  Public (for development)
 */
router.get('/chart-data', getSalesChartData);

/**
 * @route   GET /api/sales/marketplace-stats
 * @desc    Get marketplace specific statistics
 * @access  Public (for development)
 */
router.get('/marketplace-stats', getMarketplaceStats);

/**
 * @route   POST /api/sales/update-marketplace
 * @desc    Update marketplace field for existing sales data
 * @access  Public (for development)
 */
router.post('/update-marketplace', updateMarketplaceData);

module.exports = router;