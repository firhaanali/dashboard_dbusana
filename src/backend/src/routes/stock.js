const express = require('express');
const router = express.Router();
const { devOnlyAuth } = require('../middleware/auth');
const {
  getStock,
  getStockMovements,
  createStockMovement,
  updateProductStock,
  getStockHistory,
  getStockStats,
  getForecastData
} = require('../controllers/stockController');

// Main stock endpoint for dashboard
router.get('/', devOnlyAuth, getStock);

// Get all stock movements
router.get('/movements', devOnlyAuth, getStockMovements);

// Get stock movements for specific product
router.get('/movements/:productCode', devOnlyAuth, getStockHistory);

// Create stock movement and update product stock
router.post('/movements', devOnlyAuth, createStockMovement);

// Update product stock directly
router.put('/products/:id/stock', devOnlyAuth, updateProductStock);

// Get stock statistics
router.get('/stats', devOnlyAuth, getStockStats);

// Get stock forecast data for forecasting dashboard
router.get('/forecast-data', devOnlyAuth, getForecastData);

module.exports = router;