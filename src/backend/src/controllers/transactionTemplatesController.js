const path = require('path');
const fs = require('fs');
const TransactionManagementTemplateGenerator = require('../templates/generateTransactionManagementTemplates');

// Get Returns & Cancellations template
const getReturnsTemplate = async (req, res) => {
  try {
    console.log('📋 Generating Returns & Cancellations template...');
    
    const workbook = await TransactionManagementTemplateGenerator.generateReturnsTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="returns-cancellations-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    
    await workbook.xlsx.write(res);
    
    console.log('✅ Returns & Cancellations template sent successfully');

  } catch (error) {
    console.error('❌ Error generating Returns & Cancellations template:', error);
    
    // Ensure headers aren't sent yet
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Returns & Cancellations template',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Get Marketplace Reimbursements template
const getReimbursementsTemplate = async (req, res) => {
  try {
    console.log('📋 Generating Marketplace Reimbursements template...');
    
    const workbook = await TransactionManagementTemplateGenerator.generateReimbursementsTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="marketplace-reimbursements-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    
    await workbook.xlsx.write(res);
    
    console.log('✅ Marketplace Reimbursements template sent successfully');

  } catch (error) {
    console.error('❌ Error generating Marketplace Reimbursements template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Marketplace Reimbursements template',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Get Commission Adjustments template
const getCommissionAdjustmentsTemplate = async (req, res) => {
  try {
    console.log('📋 Generating Commission Adjustments template...');
    
    const workbook = await TransactionManagementTemplateGenerator.generateCommissionAdjustmentsTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="commission-adjustments-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    
    await workbook.xlsx.write(res);
    
    console.log('✅ Commission Adjustments template sent successfully');

  } catch (error) {
    console.error('❌ Error generating Commission Adjustments template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Commission Adjustments template',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Get Affiliate Samples template
const getAffiliateSamplesTemplate = async (req, res) => {
  try {
    console.log('📋 Generating Affiliate Samples template...');
    
    const workbook = await TransactionManagementTemplateGenerator.generateAffiliateSamplesTemplate();
    
    if (!workbook) {
      throw new Error('Failed to generate workbook');
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="affiliate-samples-template.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    
    await workbook.xlsx.write(res);
    
    console.log('✅ Affiliate Samples template sent successfully');

  } catch (error) {
    console.error('❌ Error generating Affiliate Samples template:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Affiliate Samples template',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Get all templates list
const getAllTemplates = async (req, res) => {
  try {
    console.log('📋 Getting Transaction Management templates list...');
    
    const templates = [
      {
        name: 'Returns & Cancellations',
        filename: 'returns-cancellations-template.xlsx',
        description: 'Template untuk tracking penjualan yang dikembalikan atau dibatalkan',
        endpoint: '/api/templates/returns-cancellations-template.xlsx',
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
        category: 'Transaction Management'
      },
      message: 'Transaction Management templates retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting templates list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates list',
      details: error.message
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