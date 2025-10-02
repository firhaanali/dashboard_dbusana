const express = require('express');
const router = express.Router();

const {
  getAffiliateSamples,
  getAffiliateSamplesAnalytics,
  createAffiliateSample,
  updateAffiliateSample,
  deleteAffiliateSample
} = require('../controllers/affiliateSamplesController');

// GET /api/affiliate-samples - Get all affiliate samples with filtering
router.get('/', getAffiliateSamples);

// GET /api/affiliate-samples/analytics - Get affiliate samples analytics
router.get('/analytics', getAffiliateSamplesAnalytics);

// POST /api/affiliate-samples - Create new affiliate sample record
router.post('/', createAffiliateSample);

// PUT /api/affiliate-samples/:id - Update affiliate sample record
router.put('/:id', updateAffiliateSample);

// DELETE /api/affiliate-samples/:id - Delete affiliate sample record
router.delete('/:id', deleteAffiliateSample);

module.exports = router;