const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  createActivityLog,
  getActivityStats,
  cleanupActivityLogs
} = require('../controllers/activityLogsController');

/**
 * Activity Logs Routes
 * Real-time activity logging for D'Busana Dashboard
 */

// GET /api/activity-logs - Get recent activity logs
router.get('/', getActivityLogs);

// POST /api/activity-logs - Create new activity log
router.post('/', createActivityLog);

// GET /api/activity-logs/stats - Get activity statistics
router.get('/stats', getActivityStats);

// DELETE /api/activity-logs/cleanup - Cleanup old activity logs
router.delete('/cleanup', cleanupActivityLogs);

module.exports = router;