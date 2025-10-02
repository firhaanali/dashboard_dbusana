const express = require('express');
const router = express.Router();
const {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  searchBrands,
  getBrandStats
} = require('../controllers/brandsController');

// Routes
router.get('/stats', getBrandStats);      // GET /api/brands/stats
router.get('/search', searchBrands);     // GET /api/brands/search?q=searchterm
router.get('/', getAllBrands);           // GET /api/brands
router.get('/:id', getBrandById);        // GET /api/brands/:id
router.post('/', createBrand);           // POST /api/brands
router.put('/:id', updateBrand);         // PUT /api/brands/:id
router.delete('/:id', deleteBrand);      // DELETE /api/brands/:id

module.exports = router;