const express = require('express');
const { devOnlyAuth } = require('../middleware/auth');
const {
  getDatabaseStats,
  testDatabaseWrite,
  getPrismaConfig,
  monitorImportProcess,
  verifyProductImport,
  checkDataPersistence
} = require('../controllers/debugController');

const router = express.Router();

/**
 * @route   GET /api/debug/database-stats
 * @desc    Get database statistics and connection status
 * @access  Development only
 */
router.get('/database-stats', devOnlyAuth, getDatabaseStats);

/**
 * @route   POST /api/debug/test-write
 * @desc    Test database write operations
 * @access  Development only
 */
router.post('/test-write', devOnlyAuth, testDatabaseWrite);

/**
 * @route   GET /api/debug/prisma-config
 * @desc    Get Prisma configuration and environment
 * @access  Development only
 */
router.get('/prisma-config', devOnlyAuth, getPrismaConfig);

/**
 * @route   GET /api/debug/monitor-imports
 * @desc    Monitor import process and analyze data consistency
 * @access  Development only
 */
router.get('/monitor-imports', devOnlyAuth, monitorImportProcess);

/**
 * @route   GET /api/debug/verify-products
 * @desc    Verify product import functionality and database status
 * @access  Development only
 */
router.get('/verify-products', devOnlyAuth, verifyProductImport);

/**
 * @route   GET /api/debug/check-persistence
 * @desc    Test database persistence by creating/reading/deleting test data
 * @access  Development only
 */
router.get('/check-persistence', devOnlyAuth, checkDataPersistence);

// Additional endpoints for frontend debugger (no auth for easier access during development)
router.get('/database-status', getDatabaseStats);
router.get('/check-tables', verifyProductImport);

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 3001
  });
});

module.exports = router;