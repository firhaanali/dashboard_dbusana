const RobustTransactionTemplateGenerator = require('../templates/robustTransactionTemplateGenerator');

/**
 * Enhanced Robust Templates Controller
 * 
 * Provides better error handling and validation for template downloads
 * to prevent corrupt file issues
 */

// Enhanced template response handler
const handleTemplateResponse = async (templateGenerator, templateName, filename, res) => {
  try {
    console.log(`📋 [ENHANCED] Generating ${templateName} template...`);
    
    // Generate workbook
    const workbook = await templateGenerator();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook - returned null');
    }
    
    // Validate workbook before sending
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Generated workbook failed validation');
    }
    
    console.log(`✅ [ENHANCED] ${templateName} template validated successfully (${validation.size} bytes)`);
    
    // Set comprehensive headers to prevent corruption
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Length', validation.size.toString());
    
    // Write workbook to response stream
    await workbook.xlsx.write(res);
    
    console.log(`✅ [ENHANCED] ${templateName} template sent successfully`);
    
  } catch (error) {
    console.error(`❌ [ENHANCED] Error generating ${templateName} template:`, error);
    
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Failed to generate ${templateName} template`,
        details: error.message,
        timestamp: new Date().toISOString(),
        templateType: templateName.toLowerCase().replace(/\s+/g, '-'),
        troubleshooting: {
          suggestion: 'Please try again in a few moments',
          fallback: 'If issue persists, contact system administrator',
          backend_status: 'Template generation service may be unavailable'
        }
      });
    }
  }
};

// Enhanced Returns & Cancellations template
const getReturnsTemplateEnhanced = async (req, res) => {
  await handleTemplateResponse(
    () => RobustTransactionTemplateGenerator.generateReturnsTemplate(),
    'Returns & Cancellations',
    'returns-cancellations-template.xlsx',
    res
  );
};

// Enhanced Marketplace Reimbursements template
const getReimbursementsTemplateEnhanced = async (req, res) => {
  await handleTemplateResponse(
    () => RobustTransactionTemplateGenerator.generateReimbursementsTemplate(),
    'Marketplace Reimbursements',
    'marketplace-reimbursements-template.xlsx',
    res
  );
};

// Enhanced Commission Adjustments template
const getCommissionAdjustmentsTemplateEnhanced = async (req, res) => {
  await handleTemplateResponse(
    () => RobustTransactionTemplateGenerator.generateCommissionAdjustmentsTemplate(),
    'Commission Adjustments',
    'commission-adjustments-template.xlsx',
    res
  );
};

// Enhanced Affiliate Samples template
const getAffiliateSamplesTemplateEnhanced = async (req, res) => {
  await handleTemplateResponse(
    () => RobustTransactionTemplateGenerator.generateAffiliateSamplesTemplate(),
    'Affiliate Samples',
    'affiliate-samples-template.xlsx',
    res
  );
};

// Enhanced template list with health check
const getAllTemplatesEnhanced = async (req, res) => {
  try {
    console.log('📋 [ENHANCED] Getting enhanced templates list with health check...');
    
    // Test template generation capability
    let generationHealth = 'healthy';
    try {
      const testWorkbook = await RobustTransactionTemplateGenerator.generateReturnsTemplate();
      const validation = await RobustTransactionTemplateGenerator.validateWorkbook(testWorkbook, 2);
      if (!validation.valid) {
        generationHealth = 'degraded';
      }
    } catch (error) {
      console.warn('⚠️ Template generation health check failed:', error.message);
      generationHealth = 'unhealthy';
    }
    
    const templates = [
      {
        name: 'Returns & Cancellations',
        filename: 'returns-cancellations-template.xlsx',
        description: 'Template untuk tracking penjualan yang dikembalikan atau dibatalkan',
        endpoint: '/api/templates/returns-cancellations-template.xlsx',
        status: 'active',
        generator: 'enhanced-robust',
        health: generationHealth,
        fields: [
          'Type (return/cancel)',
          'Original Order ID', 
          'Reason',
          'Return Date',
          'Returned Amount',
          'Refund Amount',
          'Restocking Fee',
          'Shipping Cost Loss',
          'Product Name',
          'Quantity Returned',
          'Original Price',
          'Marketplace',
          'Product Condition',
          'Resellable',
          'Notes'
        ],
        validations: [
          'Type: return atau cancel (required)',
          'Return Date: YYYY-MM-DD format (required)',
          'Returned Amount: numeric, tanpa koma/titik (required)',
          'Refund Amount: numeric, tanpa koma/titik (required)',
          'Product Name: text (required)',
          'Quantity Returned: numeric (required)',
          'Original Price: numeric, tanpa koma/titik (required)',
          'Resellable: TRUE atau FALSE'
        ]
      },
      {
        name: 'Marketplace Reimbursements',
        filename: 'marketplace-reimbursements-template.xlsx',
        description: 'Template untuk dana kompensasi dari marketplace',
        endpoint: '/api/templates/marketplace-reimbursements-template.xlsx',
        status: 'active',
        generator: 'enhanced-robust',
        health: generationHealth,
        fields: [
          'Claim ID',
          'Reimbursement Type',
          'Claim Amount',
          'Approved Amount',
          'Received Amount',
          'Processing Fee',
          'Incident Date',
          'Claim Date',
          'Approval Date',
          'Received Date',
          'Affected Order ID',
          'Product Name',
          'Marketplace',
          'Status',
          'Notes',
          'Evidence Provided'
        ],
        validations: [
          'Reimbursement Type: lost_package, fake_checkout, platform_error, damage_in_transit (required)',
          'Claim Amount: numeric, tanpa koma/titik (required)',
          'Incident Date: YYYY-MM-DD format (required)',
          'Claim Date: YYYY-MM-DD format (required)',
          'Marketplace: nama platform (required)',
          'Status: pending, approved, rejected, received (required)'
        ]
      },
      {
        name: 'Commission Adjustments',
        filename: 'commission-adjustments-template.xlsx',
        description: 'Template untuk penyesuaian komisi (retur TikTok dll)',
        endpoint: '/api/templates/commission-adjustments-template.xlsx',
        status: 'active',
        generator: 'enhanced-robust',
        health: generationHealth,
        fields: [
          'Original Order ID',
          'Adjustment Type',
          'Reason',
          'Original Commission',
          'Adjustment Amount',
          'Final Commission',
          'Marketplace',
          'Commission Rate',
          'Dynamic Rate Applied',
          'Transaction Date',
          'Adjustment Date',
          'Product Name',
          'Quantity',
          'Product Price'
        ],
        validations: [
          'Adjustment Type: return_commission_loss, dynamic_commission, platform_penalty (required)',
          'Original Commission: numeric, tanpa koma/titik (required)',
          'Adjustment Amount: numeric, bisa negatif untuk pengurangan (required)',
          'Marketplace: nama platform (required)',
          'Transaction Date: YYYY-MM-DD format (required)',
          'Adjustment Date: YYYY-MM-DD format (required)',
          'Dynamic Rate Applied: TRUE atau FALSE'
        ]
      },
      {
        name: 'Affiliate Samples',
        filename: 'affiliate-samples-template.xlsx',
        description: 'Template untuk produk yang diberikan ke affiliate untuk promosi',
        endpoint: '/api/templates/affiliate-samples-template.xlsx',
        status: 'active',
        generator: 'enhanced-robust',
        health: generationHealth,
        fields: [
          'Affiliate Name',
          'Affiliate Platform',
          'Affiliate Contact',
          'Product Name',
          'Product SKU',
          'Quantity Given',
          'Product Cost',
          'Total Cost',
          'Shipping Cost',
          'Packaging Cost',
          'Campaign Name',
          'Expected Reach',
          'Content Type',
          'Given Date',
          'Expected Content Date',
          'Actual Content Date',
          'Content Delivered',
          'Performance Notes',
          'ROI Estimate',
          'Status'
        ],
        validations: [
          'Affiliate Name: nama affiliate/influencer (required)',
          'Product Name: nama produk sample (required)',
          'Quantity Given: numeric (required)', 
          'Product Cost: HPP per produk, numeric tanpa koma/titik (required)',
          'Given Date: YYYY-MM-DD format (required)',
          'Content Type: post, story, video, review',
          'Content Delivered: TRUE atau FALSE',
          'Status: planned, sent, delivered, content_created, completed'
        ]
      }
    ];

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
        category: 'Transaction Management',
        generator: 'enhanced-robust',
        version: '2.1',
        health: {
          status: generationHealth,
          message: generationHealth === 'healthy' 
            ? 'All template generation services are operational'
            : generationHealth === 'degraded'
            ? 'Template generation may be slower than usual'
            : 'Template generation services are experiencing issues',
          lastChecked: new Date().toISOString()
        },
        usage_notes: [
          'Download template yang sesuai dengan jenis data yang ingin diimport',
          'Isi data sesuai dengan format dan validasi yang tertera',
          'Pastikan format tanggal menggunakan YYYY-MM-DD',
          'Angka tidak boleh menggunakan koma atau titik sebagai pemisah ribuan',
          'Field yang wajib diisi (required) harus ada nilainya',
          'Gunakan tab "Instructions" dalam template untuk panduan detail'
        ]
      },
      message: 'Enhanced transaction management templates retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ENHANCED] Error getting templates list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhanced templates list',
      details: error.message,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        suggestion: 'Template service may be temporarily unavailable',
        retry_after: '60 seconds',
        contact: 'system administrator if issue persists'
      }
    });
  }
};

// Template health check endpoint
const getTemplateHealthCheck = async (req, res) => {
  try {
    console.log('🏥 [ENHANCED] Running template health check...');
    
    const healthChecks = [];
    
    // Test each template generator
    const templates = [
      { name: 'Returns & Cancellations', generator: () => RobustTransactionTemplateGenerator.generateReturnsTemplate() },
      { name: 'Marketplace Reimbursements', generator: () => RobustTransactionTemplateGenerator.generateReimbursementsTemplate() },
      { name: 'Commission Adjustments', generator: () => RobustTransactionTemplateGenerator.generateCommissionAdjustmentsTemplate() },
      { name: 'Affiliate Samples', generator: () => RobustTransactionTemplateGenerator.generateAffiliateSamplesTemplate() }
    ];
    
    for (const template of templates) {
      try {
        const startTime = Date.now();
        const workbook = await template.generator();
        const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
        const endTime = Date.now();
        
        healthChecks.push({
          template: template.name,
          status: validation.valid ? 'healthy' : 'degraded',
          response_time: `${endTime - startTime}ms`,
          size: validation.size,
          details: validation.valid ? 'Template generated successfully' : 'Template failed validation'
        });
      } catch (error) {
        healthChecks.push({
          template: template.name,
          status: 'unhealthy',
          error: error.message,
          details: 'Template generation failed'
        });
      }
    }
    
    const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
    const overallStatus = healthyCount === templates.length ? 'healthy' : 
                         healthyCount > 0 ? 'degraded' : 'unhealthy';
    
    res.json({
      success: true,
      data: {
        overall_status: overallStatus,
        healthy_templates: healthyCount,
        total_templates: templates.length,
        checks: healthChecks,
        timestamp: new Date().toISOString()
      },
      message: `Template health check completed - ${healthyCount}/${templates.length} templates healthy`
    });
    
  } catch (error) {
    console.error('❌ [ENHANCED] Template health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Template health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getReturnsTemplateEnhanced,
  getReimbursementsTemplateEnhanced,
  getCommissionAdjustmentsTemplateEnhanced,
  getAffiliateSamplesTemplateEnhanced,
  getAllTemplatesEnhanced,
  getTemplateHealthCheck
};