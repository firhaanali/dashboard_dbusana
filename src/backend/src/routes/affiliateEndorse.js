const express = require('express');
const router = express.Router();
const {
  getAllEndorsements,
  createEndorsement,
  getEndorsementById,
  updateEndorsement,
  deleteEndorsement,
  getEndorsementAnalytics,
  checkExistingAffiliate,
  mergeEndorsementData
} = require('../controllers/affiliateEndorseController');

// @route   GET /api/affiliate-endorse
// @desc    Get all affiliate endorsements
// @access  Public
router.get('/', getAllEndorsements);

// @route   POST /api/affiliate-endorse
// @desc    Create new affiliate endorsement
// @access  Public
router.post('/', createEndorsement);

// @route   GET /api/affiliate-endorse/analytics
// @desc    Get affiliate endorsement analytics
// @access  Public
router.get('/analytics', getEndorsementAnalytics);

// @route   GET /api/affiliate-endorse/check-existing
// @desc    Check for existing affiliate endorsements
// @access  Public
router.get('/check-existing', checkExistingAffiliate);

// @route   POST /api/affiliate-endorse/merge
// @desc    Merge affiliate endorsement data with existing record
// @access  Public
router.post('/merge', mergeEndorsementData);

// @route   GET /api/affiliate-endorse/:id
// @desc    Get single affiliate endorsement
// @access  Public
router.get('/:id', getEndorsementById);

// @route   PUT /api/affiliate-endorse/:id
// @desc    Update affiliate endorsement
// @access  Public
router.put('/:id', updateEndorsement);

// @route   DELETE /api/affiliate-endorse/:id
// @desc    Delete affiliate endorsement
// @access  Public
router.delete('/:id', deleteEndorsement);

module.exports = router;