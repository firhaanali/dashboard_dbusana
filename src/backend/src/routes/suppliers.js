const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierAnalytics,
  updateSupplierRating
} = require('../controllers/supplierController');

// GET /api/suppliers - Get all suppliers with optional filters
router.get('/', getSuppliers);

// GET /api/suppliers/analytics - Get supplier analytics
router.get('/analytics', getSupplierAnalytics);

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', getSupplierById);

// POST /api/suppliers - Create new supplier
router.post('/', createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', updateSupplier);

// PATCH /api/suppliers/:id/rating - Update supplier rating
router.patch('/:id/rating', updateSupplierRating);

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', deleteSupplier);

module.exports = router;