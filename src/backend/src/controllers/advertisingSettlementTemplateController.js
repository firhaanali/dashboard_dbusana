const { generateAllRobustTemplates } = require('../templates/advertisingSettlementTemplateGenerator');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 🔧 ROBUST ADVERTISING SETTLEMENT TEMPLATE CONTROLLER
// Mengatasi template corruption dan Excel compatibility issues

// Generate dan download basic template
const downloadBasicTemplate = async (req, res) => {
  try {
    console.log('📁 Download Basic Advertising Settlement Template...');
    
    const templatePath = path.join(__dirname, '../templates/advertising_settlement_template_robust.xlsx');
    
    // Check if template exists, if not generate it
    if (!fs.existsSync(templatePath)) {
      console.log('🔧 Template not found, generating...');
      
      try {
        const result = generateAllRobustTemplates();
        
        if (!result.success) {
          console.error('❌ Template generation failed:', result.error);
          return res.status(500).json({
            success: false,
            error: 'Template generation failed',
            message: result.error || 'Failed to generate advertising settlement template'
          });
        }
        
        console.log('✅ Template generated successfully');
      } catch (generateError) {
        console.error('❌ Template generation error:', generateError);
        return res.status(500).json({
          success: false,
          error: 'Template generation failed',
          message: generateError.message
        });
      }
    }
    
    // Double verify template before sending
    try {
      const workbook = XLSX.readFile(templatePath);
      const worksheet = workbook.Sheets['Advertising Settlement'];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        throw new Error('Template is empty');
      }
      
      console.log('✅ Template verified successfully');
      console.log('📊 Template has', data.length, 'sample rows');
      console.log('📋 Columns:', Object.keys(data[0]));
      
    } catch (verifyError) {
      console.error('❌ Template verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Template file is corrupted',
        message: 'Template verification failed: ' + verifyError.message
      });
    }
    
    // Set proper headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="advertising_settlement_template.xlsx"');
    res.setHeader('Content-Length', fs.statSync(templatePath).size);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream file to response
    const fileStream = fs.createReadStream(templatePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      console.log('✅ Basic template downloaded successfully');
    });
    
    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'File download failed',
          message: error.message
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Download basic template error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Template download failed',
        message: error.message
      });
    }
  }
};

// Generate dan download guided template
const downloadGuidedTemplate = async (req, res) => {
  try {
    console.log('📋 Download Guided Advertising Settlement Template...');
    
    const templatePath = path.join(__dirname, '../templates/advertising_settlement_template_guided_robust.xlsx');
    
    // Check if template exists, if not generate it
    if (!fs.existsSync(templatePath)) {
      console.log('🔧 Guided template not found, generating...');
      const result = generateAllRobustTemplates();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Template generation failed',
          message: result.error
        });
      }
    }
    
    // Verify guided template
    try {
      const workbook = XLSX.readFile(templatePath);
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.length < 3) {
        throw new Error('Guided template missing required sheets');
      }
      
      console.log('✅ Guided template verified successfully');
      console.log('📊 Template sheets:', sheetNames);
      
    } catch (verifyError) {
      console.error('❌ Guided template verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Guided template file is corrupted',
        message: 'Guided template verification failed: ' + verifyError.message
      });
    }
    
    // Set proper headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="advertising_settlement_template_with_guide.xlsx"');
    res.setHeader('Content-Length', fs.statSync(templatePath).size);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Stream file to response
    const fileStream = fs.createReadStream(templatePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      console.log('✅ Guided template downloaded successfully');
    });
    
    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'File download failed',
          message: error.message
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Download guided template error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Template download failed',
        message: error.message
      });
    }
  }
};

// Force regenerate all templates
const regenerateTemplates = async (req, res) => {
  try {
    console.log('🔄 Force regenerating all advertising settlement templates...');
    
    // Delete existing templates first
    const basicPath = path.join(__dirname, '../templates/advertising_settlement_template_robust.xlsx');
    const guidedPath = path.join(__dirname, '../templates/advertising_settlement_template_guided_robust.xlsx');
    
    if (fs.existsSync(basicPath)) {
      fs.unlinkSync(basicPath);
      console.log('🗑️ Deleted existing basic template');
    }
    
    if (fs.existsSync(guidedPath)) {
      fs.unlinkSync(guidedPath);
      console.log('🗑️ Deleted existing guided template');
    }
    
    // Generate new templates
    const result = generateAllRobustTemplates();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          basicTemplate: result.basicTemplate,
          guidedTemplate: result.guidedTemplate,
          basicData: result.basicData,
          guidedSheets: result.guidedSheets,
          message: result.message
        },
        message: 'All advertising settlement templates regenerated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Template regeneration failed',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Template regeneration error:', error);
    res.status(500).json({
      success: false,
      error: 'Template regeneration failed',
      message: error.message
    });
  }
};

// Check template status
const checkTemplateStatus = async (req, res) => {
  try {
    console.log('🔍 Checking advertising settlement template status...');
    
    const basicPath = path.join(__dirname, '../templates/advertising_settlement_template_robust.xlsx');
    const guidedPath = path.join(__dirname, '../templates/advertising_settlement_template_guided_robust.xlsx');
    
    const status = {
      basicTemplate: {
        exists: fs.existsSync(basicPath),
        path: basicPath,
        size: fs.existsSync(basicPath) ? fs.statSync(basicPath).size : 0,
        valid: false
      },
      guidedTemplate: {
        exists: fs.existsSync(guidedPath),
        path: guidedPath,
        size: fs.existsSync(guidedPath) ? fs.statSync(guidedPath).size : 0,
        valid: false
      }
    };
    
    // Validate basic template
    if (status.basicTemplate.exists) {
      try {
        const workbook = XLSX.readFile(basicPath);
        const worksheet = workbook.Sheets['Advertising Settlement'];
        const data = XLSX.utils.sheet_to_json(worksheet);
        status.basicTemplate.valid = data.length > 0;
        status.basicTemplate.rows = data.length;
        status.basicTemplate.columns = data.length > 0 ? Object.keys(data[0]) : [];
      } catch (error) {
        status.basicTemplate.error = error.message;
      }
    }
    
    // Validate guided template
    if (status.guidedTemplate.exists) {
      try {
        const workbook = XLSX.readFile(guidedPath);
        const sheetNames = workbook.SheetNames;
        status.guidedTemplate.valid = sheetNames.length >= 3;
        status.guidedTemplate.sheets = sheetNames;
      } catch (error) {
        status.guidedTemplate.error = error.message;
      }
    }
    
    res.status(200).json({
      success: true,
      data: status,
      message: 'Template status checked successfully'
    });
    
  } catch (error) {
    console.error('❌ Template status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Template status check failed',
      message: error.message
    });
  }
};

module.exports = {
  downloadBasicTemplate,
  downloadGuidedTemplate,
  regenerateTemplates,
  checkTemplateStatus
};