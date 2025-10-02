const express = require('express');
const router = express.Router();
const {
  getTailors,
  getTailorById,
  createTailor,
  updateTailor,
  deleteTailor,
  getTailorAnalytics,
  updateTailorRating,
  getTailorProductions,
  createTailorProduction
} = require('../controllers/tailorController');

// Tailor management routes
router.get('/', getTailors);
router.post('/', createTailor);
router.get('/analytics', getTailorAnalytics);

// Tailor production routes (must be before /:id routes)
router.get('/productions/all', getTailorProductions);
router.post('/productions', createTailorProduction);

// Tailor CRUD routes with ID parameter (must be after specific routes)
router.get('/:id', getTailorById);
router.put('/:id', updateTailor);
router.delete('/:id', deleteTailor);
router.patch('/:id/rating', updateTailorRating);

module.exports = router;