const express = require('express');
const router = express.Router();

const {
  getMarketplaceReimbursements,
  getReimbursementAnalytics,
  createReimbursement,
  updateReimbursement,
  deleteReimbursement
} = require('../controllers/marketplaceReimbursementController');

// GET /api/marketplace-reimbursements - Get all marketplace reimbursements with filtering
router.get('/', getMarketplaceReimbursements);

// GET /api/marketplace-reimbursements/analytics - Get reimbursement analytics
router.get('/analytics', getReimbursementAnalytics);

// POST /api/marketplace-reimbursements - Create new reimbursement record
router.post('/', createReimbursement);

// PUT /api/marketplace-reimbursements/:id - Update reimbursement record
router.put('/:id', updateReimbursement);

// DELETE /api/marketplace-reimbursements/:id - Delete reimbursement record
router.delete('/:id', deleteReimbursement);

module.exports = router;