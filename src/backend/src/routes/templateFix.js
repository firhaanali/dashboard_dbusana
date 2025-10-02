const express = require('express');
const router = express.Router();
const { 
  fixAdvertisingSettlementTemplate,
  downloadAdvertisingSettlementTemplate,
  generateAllTemplates
} = require('../controllers/templateFixController');

/**
 * Route untuk memperbaiki template Excel yang corrupt
 */

// POST /api/template-fix/advertising-settlement - Fix advertising settlement template
router.post('/advertising-settlement', fixAdvertisingSettlementTemplate);

// GET /api/template-fix/download/advertising-settlement/:type - Download advertising settlement template
router.get('/download/advertising-settlement/:type', downloadAdvertisingSettlementTemplate);

// POST /api/template-fix/generate-all - Generate all templates
router.post('/generate-all', generateAllTemplates);

module.exports = router;