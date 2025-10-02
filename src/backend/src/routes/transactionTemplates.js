const express = require('express');
const router = express.Router();

const {
  getReturnsTemplate,
  getReimbursementsTemplate,
  getCommissionAdjustmentsTemplate,
  getAffiliateSamplesTemplate,
  getAllTemplates
} = require('../controllers/robustTransactionTemplatesController');

// GET /api/templates - Get all Transaction Management templates list
router.get('/', getAllTemplates);

// GET /api/templates/returns-cancellations-template.xlsx - Download Returns & Cancellations template
router.get('/returns-cancellations-template.xlsx', getReturnsTemplate);

// GET /api/templates/marketplace-reimbursements-template.xlsx - Download Marketplace Reimbursements template
router.get('/marketplace-reimbursements-template.xlsx', getReimbursementsTemplate);

// GET /api/templates/commission-adjustments-template.xlsx - Download Commission Adjustments template
router.get('/commission-adjustments-template.xlsx', getCommissionAdjustmentsTemplate);

// GET /api/templates/affiliate-samples-template.xlsx - Download Affiliate Samples template
router.get('/affiliate-samples-template.xlsx', getAffiliateSamplesTemplate);

module.exports = router;