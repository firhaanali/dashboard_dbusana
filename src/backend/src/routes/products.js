const express = require('express');
const router = express.Router();
const { devOnlyAuth } = require('../middleware/auth');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  searchProducts,
  getProductStats
} = require('../controllers/productsController');

// Get all products
router.get('/', devOnlyAuth, getProducts);

// Get products statistics - MUST be before /:id route
router.get('/stats', devOnlyAuth, getProductStats);

// Search products
router.get('/search', devOnlyAuth, searchProducts);

// Get single product
router.get('/:id', devOnlyAuth, getProductById);

// Create product
router.post('/', devOnlyAuth, createProduct);

// Update product
router.put('/:id', devOnlyAuth, updateProduct);

// Delete product
router.delete('/:id', devOnlyAuth, deleteProduct);

// Additional routes can be added here if needed

module.exports = router;