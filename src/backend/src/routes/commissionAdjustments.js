const express = require('express');
const router = express.Router();

const {
  getCommissionAdjustments,
  getCommissionAdjustmentsAnalytics,
  createCommissionAdjustment,
  updateCommissionAdjustment,
  deleteCommissionAdjustment
} = require('../controllers/commissionAdjustmentsController');

// GET /api/commission-adjustments - Get all commission adjustments with filtering
router.get('/', getCommissionAdjustments);

// GET /api/commission-adjustments/analytics - Get commission adjustments analytics
router.get('/analytics', getCommissionAdjustmentsAnalytics);

// POST /api/commission-adjustments - Create new commission adjustment record
router.post('/', createCommissionAdjustment);

// PUT /api/commission-adjustments/:id - Update commission adjustment record
router.put('/:id', updateCommissionAdjustment);

// DELETE /api/commission-adjustments/:id - Delete commission adjustment record
router.delete('/:id', deleteCommissionAdjustment);

module.exports = router;