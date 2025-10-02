/**
 * Customer Matching Routes
 * Handles customer name similarity matching for censored names from TikTok Shop
 */

const express = require('express');
const router = express.Router();
const {
  getExistingCustomers,
  findMatches,
  processImport,
  getStats,
  testMatching
} = require('../controllers/customerMatchingController');

/**
 * GET /api/customer-matching/existing
 * Get all existing customer names for matching
 */
router.get('/existing', getExistingCustomers);

/**
 * POST /api/customer-matching/find-matches
 * Find matching customers for a censored name
 * 
 * Body:
 * {
 *   "censoredName": "f***iaawindy",
 *   "minSimilarity": 70,
 *   "maxResults": 10
 * }
 */
router.post('/find-matches', findMatches);

/**
 * POST /api/customer-matching/process-import
 * Process customer list for import with similarity matching
 * 
 * Body:
 * {
 *   "newCustomers": ["f***iaawindy", "j***doe123"],
 *   "minConfidence": 75,
 *   "autoMerge": true,
 *   "logMatches": true
 * }
 */
router.post('/process-import', processImport);

/**
 * GET /api/customer-matching/stats
 * Get customer matching statistics
 */
router.get('/stats', getStats);

/**
 * POST /api/customer-matching/test
 * Test customer matching algorithms
 */
router.post('/test', testMatching);

module.exports = router;