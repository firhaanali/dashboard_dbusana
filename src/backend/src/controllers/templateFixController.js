const { fixAdvertisingSettlementTemplates } = require('../templates/fix_advertising_settlement_template');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Template fix controller untuk memperbaiki semua template
const fixAdvertisingSettlementTemplate = async (req, res) => {
  try {
    console.log('🔧 Template Fix Controller - Fixing Advertising Settlement Template...');
    
    // Run template fix
    const result = fixAdvertisingSettlementTemplates();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          basicTemplate: result.basicTemplate,
          guidedTemplate: result.guidedTemplate,
          message: result.message
        },
        message: 'Advertising settlement templates fixed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Template fix failed',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Template fix controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Template fix failed',
      message: error.message
    });
  }
};

// Download template yang sudah diperbaiki
const downloadAdvertisingSettlementTemplate = async (req, res) => {
  try {
    const { type } = req.params; // 'basic' or 'guided'
    
    let templatePath;
    let fileName;
    
    if (type === 'guided') {
      templatePath = path.join(__dirname, '../templates/advertising_settlement_template_with_guide_fixed.xlsx');
      fileName = 'advertising_settlement_template_with_guide.xlsx';
    } else {
      templatePath = path.join(__dirname, '../templates/advertising_settlement_template_fixed.xlsx');
      fileName = 'advertising_settlement_template.xlsx';
    }
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.log('📁 Template not found, generating...');
      const result = fixAdvertisingSettlementTemplates();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Template generation failed',
          message: result.error
        });
      }
    }
    
    // Verify template file is readable
    try {
      const workbook = XLSX.readFile(templatePath);
      const sheetNames = workbook.SheetNames;
      console.log('✅ Template verified, sheets:', sheetNames);
    } catch (verifyError) {
      console.error('❌ Template verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Template file is corrupted',
        message: 'Please regenerate the template'
      });
    }
    
    // Set appropriate headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send file
    res.sendFile(templatePath, (err) => {
      if (err) {
        console.error('❌ Template download error:', err);
        res.status(500).json({
          success: false,
          error: 'Template download failed',
          message: err.message
        });
      } else {
        console.log('✅ Template downloaded successfully:', fileName);
      }
    });
    
  } catch (error) {
    console.error('❌ Template download controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Template download failed',
      message: error.message
    });
  }
};

// Generate semua template yang diperlukan
const generateAllTemplates = async (req, res) => {
  try {
    console.log('🔧 Generating all templates...');
    
    const results = {};
    
    // Fix advertising settlement templates
    const adSettlementResult = fixAdvertisingSettlementTemplates();
    results.advertisingSettlement = adSettlementResult;
    
    // Add other template generations here if needed
    
    const allSuccessful = Object.values(results).every(result => result.success);
    
    if (allSuccessful) {
      res.status(200).json({
        success: true,
        data: results,
        message: 'All templates generated successfully'
      });
    } else {
      res.status(207).json({
        success: false,
        data: results,
        message: 'Some templates failed to generate'
      });
    }
    
  } catch (error) {
    console.error('❌ Generate all templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Template generation failed',
      message: error.message
    });
  }
};

module.exports = {
  fixAdvertisingSettlementTemplate,
  downloadAdvertisingSettlementTemplate,
  generateAllTemplates
};