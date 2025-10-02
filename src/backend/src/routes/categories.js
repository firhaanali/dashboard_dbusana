const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
  getCategoryStats
} = require('../controllers/categoriesController');

// Routes
router.get('/stats', getCategoryStats);      // GET /api/categories/stats
router.get('/search', searchCategories);    // GET /api/categories/search?q=searchterm
router.get('/', getAllCategories);          // GET /api/categories
router.get('/:id', getCategoryById);        // GET /api/categories/:id
router.post('/', createCategory);           // POST /api/categories
router.put('/:id', updateCategory);         // PUT /api/categories/:id
router.delete('/:id', deleteCategory);      // DELETE /api/categories/:id

module.exports = router;