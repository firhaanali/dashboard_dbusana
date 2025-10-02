const express = require('express');
const router = express.Router();

const {
  getReturnsTemplateEnhanced,
  getReimbursementsTemplateEnhanced,
  getCommissionAdjustmentsTemplateEnhanced,
  getAffiliateSamplesTemplateEnhanced,
  getAllTemplatesEnhanced,
  getTemplateHealthCheck
} = require('../controllers/enhancedRobustTemplatesController');

// GET /api/templates-enhanced - Get all Transaction Management templates list (enhanced version)
router.get('/', getAllTemplatesEnhanced);

// GET /api/templates-enhanced/health - Template generation health check
router.get('/health', getTemplateHealthCheck);

// GET /api/templates-enhanced/returns-cancellations-template.xlsx - Download Returns & Cancellations template (enhanced)
router.get('/returns-cancellations-template.xlsx', getReturnsTemplateEnhanced);

// GET /api/templates-enhanced/marketplace-reimbursements-template.xlsx - Download Marketplace Reimbursements template (enhanced)
router.get('/marketplace-reimbursements-template.xlsx', getReimbursementsTemplateEnhanced);

// GET /api/templates-enhanced/commission-adjustments-template.xlsx - Download Commission Adjustments template (enhanced)
router.get('/commission-adjustments-template.xlsx', getCommissionAdjustmentsTemplateEnhanced);

// GET /api/templates-enhanced/affiliate-samples-template.xlsx - Download Affiliate Samples template (enhanced)
router.get('/affiliate-samples-template.xlsx', getAffiliateSamplesTemplateEnhanced);

module.exports = router;