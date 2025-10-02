const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  checkImportDuplicates,
  getImportHistory
} = require('../controllers/duplicateCheckController');

// Configure multer for file upload (memory storage for duplicate check)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow Excel and CSV files for duplicate checking
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(null, true); // Allow all files for now, but log the type
      console.log('📄 Duplicate check - File type:', file.mimetype, file.originalname);
    }
  }
});

/**
 * @route POST /api/import/check-duplicates
 * @desc Check for potential duplicate imports
 * @access Private
 */
router.post('/check-duplicates', upload.single('file'), checkImportDuplicates);

/**
 * @route GET /api/import/history
 * @desc Get import history with metadata
 * @access Private
 */
router.get('/history', getImportHistory);

module.exports = router;