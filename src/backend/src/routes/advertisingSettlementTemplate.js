const express = require('express');
const router = express.Router();
const {
  downloadBasicTemplate,
  downloadGuidedTemplate,
  regenerateTemplates,
  checkTemplateStatus
} = require('../controllers/advertisingSettlementTemplateController');

/**
 * 🔧 ROBUST ADVERTISING SETTLEMENT TEMPLATE ROUTES
 * Mengatasi template corruption dan Excel compatibility issues
 */

// GET /api/advertising-settlement-template/download/basic - Download basic template
router.get('/download/basic', downloadBasicTemplate);

// GET /api/advertising-settlement-template/download/guided - Download guided template with instructions
router.get('/download/guided', downloadGuidedTemplate);

// POST /api/advertising-settlement-template/regenerate - Force regenerate all templates
router.post('/regenerate', regenerateTemplates);

// GET /api/advertising-settlement-template/status - Check template status
router.get('/status', checkTemplateStatus);

module.exports = router;