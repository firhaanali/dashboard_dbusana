const express = require('express');
const router = express.Router();
const {
  getForecastData,
  getProductForecasts,
  getMarketInsights
} = require('../controllers/forecastingController');

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
 * @route GET /api/forecasting
 * @desc Get sales forecasting data with multiple models
 * @query {string} forecast_horizon - Forecast period (30d, 90d, 180d, 365d)
 * @query {string} forecast_metric - Metric to forecast (revenue, orders, quantity)
 * @query {string} granularity - Data granularity (daily, weekly, monthly)
 * @query {string} historical_period - Historical data period (90d, 180d, 365d, 2y)
 * @query {number} confidence_level - Confidence level for predictions (90, 95, 99)
 * @access Public (development)
 */
router.get('/', getForecastData);

/**
 * @route GET /api/forecasting/products
 * @desc Get product-specific forecasting data
 * @query {number} top_products - Number of top products to analyze (default: 10)
 * @query {number} forecast_days - Forecast horizon in days (default: 30)
 * @access Public (development)
 */
router.get('/products', getProductForecasts);

/**
 * @route GET /api/forecasting/insights
 * @desc Get market insights and trend analysis
 * @access Public (development)
 */
router.get('/insights', getMarketInsights);

module.exports = router;