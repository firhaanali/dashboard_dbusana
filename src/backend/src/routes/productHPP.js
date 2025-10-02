const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  deleteAllProducts,
  getStatistics,
  searchProducts
} = require('../controllers/productHPPController');

// GET /api/product-hpp - Get all products with pagination and search
router.get('/', getAllProducts);

// GET /api/product-hpp/statistics - Get product statistics
router.get('/statistics', getStatistics);

// GET /api/product-hpp/search - Search products
router.get('/search', searchProducts);

// GET /api/product-hpp/:id - Get product by ID
router.get('/:id', getProductById);

// POST /api/product-hpp - Create new product
router.post('/', createProduct);

// POST /api/product-hpp/bulk-import - Bulk import products
router.post('/bulk-import', bulkImportProducts);

// PUT /api/product-hpp/:id - Update product
router.put('/:id', updateProduct);

// DELETE /api/product-hpp/:id - Delete product
router.delete('/:id', deleteProduct);

// DELETE /api/product-hpp - Delete all products
router.delete('/', deleteAllProducts);

module.exports = router;