const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { devOnlyAuth } = require('../middleware/auth');

// ✅ Import all functions from unified controller 
const {
  importSalesData,
  importProductData,
  importStockData,
  importAdvertisingData,
  importAdvertisingSettlementData,
  importReturnsAndCancellationsData,
  importMarketplaceReimbursementsData,
  importCommissionAdjustmentsData,
  importAffiliateSamplesData,
  getImportStatus,
  getImportHistory,
  downloadTemplate
} = require('../controllers/importControllerUnified');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `import-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept Excel and CSV files
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv'
  ];
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Import routes matching frontend expectations

/**
 * @route   POST /api/import/sales
 * @desc    Import sales data from Excel/CSV file
 * @access  Development only
 */
router.post('/sales', devOnlyAuth, upload.single('file'), importSalesData);

/**
 * @route   POST /api/import/products
 * @desc    Import product data from Excel/CSV file
 * @access  Development only
 */
router.post('/products', devOnlyAuth, upload.single('file'), importProductData);

/**
 * @route   POST /api/import/stock
 * @desc    Import stock data from Excel/CSV file
 * @access  Development only
 */
router.post('/stock', devOnlyAuth, upload.single('file'), importStockData);

/**
 * @route   POST /api/import/advertising
 * @desc    Import advertising/marketing data from Excel/CSV file
 * @access  Development only
 */
router.post('/advertising', devOnlyAuth, upload.single('file'), importAdvertisingData);

/**
 * @route   POST /api/import/advertising-settlement
 * @desc    Import advertising settlement/billing data from Excel/CSV file
 * @access  Development only
 */
router.post('/advertising-settlement', devOnlyAuth, upload.single('file'), importAdvertisingSettlementData);

/**
 * @route   POST /api/import/returns-and-cancellations
 * @desc    Import returns and cancellations data from Excel/CSV file
 * @access  Development only
 */
router.post('/returns-and-cancellations', devOnlyAuth, upload.single('file'), importReturnsAndCancellationsData);

/**
 * @route   POST /api/import/marketplace-reimbursements
 * @desc    Import marketplace reimbursement data from Excel/CSV file
 * @access  Development only
 */
router.post('/marketplace-reimbursements', devOnlyAuth, upload.single('file'), importMarketplaceReimbursementsData);

/**
 * @route   POST /api/import/commission-adjustments
 * @desc    Import commission adjustments data from Excel/CSV file
 * @access  Development only
 */
router.post('/commission-adjustments', devOnlyAuth, upload.single('file'), importCommissionAdjustmentsData);

/**
 * @route   POST /api/import/affiliate-samples
 * @desc    Import affiliate samples data from Excel/CSV file
 * @access  Development only
 */
router.post('/affiliate-samples', devOnlyAuth, upload.single('file'), importAffiliateSamplesData);

/**
 * @route   GET /api/import/status/:batchId
 * @desc    Get import batch status and details
 * @access  Development only
 */
router.get('/status/:batchId', devOnlyAuth, getImportStatus);

/**
 * @route   GET /api/import/history
 * @desc    Get import history with pagination
 * @access  Development only
 * @query   page, limit, type
 */
router.get('/history', devOnlyAuth, getImportHistory);

/**
 * @route   GET /api/import/templates/:type
 * @desc    Download clean Excel template files for import (fixes corrupt template issue)
 * @access  Development only
 */
router.get('/templates/:type', devOnlyAuth, downloadTemplate);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        message: 'File size exceeds 10MB limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Only one file is allowed per upload'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Invalid file field',
        message: 'Unexpected field name for file upload'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;