const express = require('express');
const router = express.Router();

const {
  getReturnsAndCancellations,
  getReturnsAnalytics,
  createReturnsCancellation,
  updateReturnsCancellation,
  deleteReturnsCancellation
} = require('../controllers/returnsAndCancellationsController');

// GET /api/returns-cancellations - Get all returns and cancellations with filtering
router.get('/', getReturnsAndCancellations);

// GET /api/returns-cancellations/analytics - Get returns and cancellations analytics
router.get('/analytics', getReturnsAnalytics);

// POST /api/returns-cancellations - Create new return/cancellation record
router.post('/', createReturnsCancellation);

// PUT /api/returns-cancellations/:id - Update return/cancellation record
router.put('/:id', updateReturnsCancellation);

// DELETE /api/returns-cancellations/:id - Delete return/cancellation record
router.delete('/:id', deleteReturnsCancellation);

module.exports = router;