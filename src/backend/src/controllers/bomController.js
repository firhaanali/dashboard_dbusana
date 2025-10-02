/**
 * ⚠️ DEPRECATED: BOM Controller - FEATURE DISCONTINUED
 * 
 * This controller has been deprecated as the BOM (Bill of Materials) feature
 * has been removed from D'Busana Dashboard. All endpoints are disabled.
 * 
 * Date Deprecated: 2024-12-20
 * Reason: BOM functionality no longer needed for fashion business requirements
 */

const deprecatedResponse = (res, endpoint) => {
  return res.status(410).json({
    success: false,
    message: `BOM feature has been discontinued. Endpoint ${endpoint} is no longer available.`,
    error: 'FEATURE_DEPRECATED',
    deprecatedDate: '2024-12-20'
  });
};

// All BOM endpoints now return deprecation notice
const getAllBOMs = (req, res) => deprecatedResponse(res, 'GET /api/bom');
const getBOMById = (req, res) => deprecatedResponse(res, 'GET /api/bom/:id');
const createBOM = (req, res) => deprecatedResponse(res, 'POST /api/bom');
const updateBOM = (req, res) => deprecatedResponse(res, 'PUT /api/bom/:id');
const deleteBOM = (req, res) => deprecatedResponse(res, 'DELETE /api/bom/:id');
const getBOMCostAnalysis = (req, res) => deprecatedResponse(res, 'GET /api/bom/:id/cost-analysis');
const getMaterials = (req, res) => deprecatedResponse(res, 'GET /api/bom/materials');
const getBOMAnalytics = (req, res) => deprecatedResponse(res, 'GET /api/bom/analytics');

module.exports = {
  getAllBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getBOMCostAnalysis,
  getMaterials,
  getBOMAnalytics
};