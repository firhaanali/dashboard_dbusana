const RobustTransactionTemplateGenerator = require('../templates/robustTransactionTemplateGenerator');

// Get Returns & Cancellations template
const getReturnsTemplate = async (req, res) => {
  try {
    console.log('📋 [ROBUST] Generating Returns & Cancellations template...');
    
    const workbook = await RobustTransactionTemplateGenerator.generateReturnsTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook - returned null');
    }
    
    // Validate the workbook before sending
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Generated workbook failed validation');
    }
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="returns-cancellations-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', validation.size.toString());
    
    // Write to response
    await workbook.xlsx.write(res);
    
    console.log(`✅ [ROBUST] Returns & Cancellations template sent successfully (${validation.size} bytes)`);

  } catch (error) {
    console.error('❌ [ROBUST] Error generating Returns & Cancellations template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Returns & Cancellations template',
        details: error.message,
        timestamp: new Date().toISOString(),
        templateType: 'returns-cancellations'
      });
    }
  }
};

// Get Marketplace Reimbursements template
const getReimbursementsTemplate = async (req, res) => {
  try {
    console.log('📋 [ROBUST] Generating Marketplace Reimbursements template...');
    
    const workbook = await RobustTransactionTemplateGenerator.generateReimbursementsTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook - returned null');
    }
    
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Generated workbook failed validation');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="marketplace-reimbursements-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', validation.size.toString());
    
    await workbook.xlsx.write(res);
    
    console.log(`✅ [ROBUST] Marketplace Reimbursements template sent successfully (${validation.size} bytes)`);

  } catch (error) {
    console.error('❌ [ROBUST] Error generating Marketplace Reimbursements template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Marketplace Reimbursements template',
        details: error.message,
        timestamp: new Date().toISOString(),
        templateType: 'marketplace-reimbursements'
      });
    }
  }
};

// Get Commission Adjustments template
const getCommissionAdjustmentsTemplate = async (req, res) => {
  try {
    console.log('📋 [ROBUST] Generating Commission Adjustments template...');
    
    const workbook = await RobustTransactionTemplateGenerator.generateCommissionAdjustmentsTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook - returned null');
    }
    
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Generated workbook failed validation');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="commission-adjustments-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', validation.size.toString());
    
    await workbook.xlsx.write(res);
    
    console.log(`✅ [ROBUST] Commission Adjustments template sent successfully (${validation.size} bytes)`);

  } catch (error) {
    console.error('❌ [ROBUST] Error generating Commission Adjustments template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Commission Adjustments template',
        details: error.message,
        timestamp: new Date().toISOString(),
        templateType: 'commission-adjustments'
      });
    }
  }
};

// Get Affiliate Samples template
const getAffiliateSamplesTemplate = async (req, res) => {
  try {
    console.log('📋 [ROBUST] Generating Affiliate Samples template...');
    
    const workbook = await RobustTransactionTemplateGenerator.generateAffiliateSamplesTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook - returned null');
    }
    
    const validation = await RobustTransactionTemplateGenerator.validateWorkbook(workbook, 2);
    
    if (!validation.valid) {
      throw new Error('Generated workbook failed validation');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="affiliate-samples-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', validation.size.toString());
    
    await workbook.xlsx.write(res);
    
    console.log(`✅ [ROBUST] Affiliate Samples template sent successfully (${validation.size} bytes)`);

  } catch (error) {
    console.error('❌ [ROBUST] Error generating Affiliate Samples template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Affiliate Samples template',
        details: error.message,
        timestamp: new Date().toISOString(),
        templateType: 'affiliate-samples'
      });
    }
  }
};

// Get all templates list
const getAllTemplates = async (req, res) => {
  try {
    console.log('📋 [ROBUST] Getting Transaction Management templates list...');
    
    const templates = [
      {
        name: 'Returns & Cancellations',
        filename: 'returns-cancellations-template.xlsx',
        description: 'Template untuk tracking penjualan yang dikembalikan atau dibatalkan',
        endpoint: '/api/templates/returns-cancellations-template.xlsx',
        status: 'active',
        generator: 'robust',
        fields: [
          'Type (return/cancel)',
          'Original Order ID',
          'Reason',
          'Return Date',
          'Returned Amount',
          'Refund Amount',
          'Product Name',
          'Marketplace'
        ]
      },
      {
        name: 'Marketplace Reimbursements',
        filename: 'marketplace-reimbursements-template.xlsx',
        description: 'Template untuk dana kompensasi dari marketplace',
        endpoint: '/api/templates/marketplace-reimbursements-template.xlsx',
        status: 'active',
        generator: 'robust',
        fields: [
          'Claim ID',
          'Reimbursement Type',
          'Claim Amount',
          'Approved Amount',
          'Incident Date',
          'Claim Date',
          'Marketplace',
          'Status'
        ]
      },
      {
        name: 'Commission Adjustments',
        filename: 'commission-adjustments-template.xlsx',
        description: 'Template untuk penyesuaian komisi (retur TikTok dll)',
        endpoint: '/api/templates/commission-adjustments-template.xlsx',
        status: 'active',
        generator: 'robust',
        fields: [
          'Original Order ID',
          'Adjustment Type',
          'Original Commission',
          'Adjustment Amount',
          'Final Commission',
          'Marketplace',
          'Transaction Date'
        ]
      },
      {
        name: 'Affiliate Samples',
        filename: 'affiliate-samples-template.xlsx',
        description: 'Template untuk produk yang diberikan ke affiliate untuk promosi',
        endpoint: '/api/templates/affiliate-samples-template.xlsx',
        status: 'active',
        generator: 'robust',
        fields: [
          'Affiliate Name',
          'Affiliate Platform',
          'Product Name',
          'Quantity Given',
          'Product Cost',
          'Campaign Name',
          'Given Date',
          'Status'
        ]
      }
    ];

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
        category: 'Transaction Management',
        generator: 'robust',
        version: '2.0'
      },
      message: 'Transaction Management templates retrieved successfully (robust version)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ROBUST] Error getting templates list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates list',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getReturnsTemplate,
  getReimbursementsTemplate,
  getCommissionAdjustmentsTemplate,
  getAffiliateSamplesTemplate,
  getAllTemplates
};