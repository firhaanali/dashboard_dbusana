/**
 * ⚠️ DEPRECATED: BOM Routes - FEATURE DISCONTINUED
 * 
 * All BOM (Bill of Materials) routes have been deprecated as the feature
 * has been removed from D'Busana Dashboard.
 * 
 * Date Deprecated: 2024-12-20
 * Reason: BOM functionality no longer needed for fashion business requirements
 */

const express = require('express');
const router = express.Router();
const {
  getAllBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getBOMCostAnalysis,
  getMaterials,
  getBOMAnalytics
} = require('../controllers/bomController');

// All routes now return deprecation responses
router.get('/', getAllBOMs);
router.get('/analytics', getBOMAnalytics);
router.get('/materials', getMaterials);
router.get('/:id', getBOMById);
router.get('/:id/cost-analysis', getBOMCostAnalysis);
router.post('/', createBOM);
router.put('/:id', updateBOM);
router.delete('/:id', deleteBOM);

module.exports = router;