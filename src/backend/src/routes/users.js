const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserStats,
  getUserActivityLogs
} = require('../controllers/usersController');

// Middleware for role-based access (placeholder - will be implemented with auth)
const requireAdmin = (req, res, next) => {
  // TODO: Implement proper auth middleware
  // For now, simulate admin user
  req.user = {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    username: 'admin'
  };
  next();
};

const requireAdminOrManager = (req, res, next) => {
  // TODO: Implement proper auth middleware
  req.user = {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    username: 'admin'
  };
  next();
};

// Routes

// Get all users (admin only)
router.get('/', requireAdmin, getAllUsers);

// Get user statistics (admin only)
router.get('/stats', requireAdmin, getUserStats);

// Get user by ID (admin/manager can view, user can view own)
router.get('/:id', requireAdminOrManager, getUserById);

// Get user activity logs (admin only)
router.get('/:id/activity', requireAdmin, getUserActivityLogs);

// Create new user (admin only)
router.post('/', requireAdmin, createUser);

// Update user (admin can update all, user can update own)
router.put('/:id', requireAdminOrManager, updateUser);

// Change password (admin can change all, user can change own)
router.put('/:id/password', requireAdminOrManager, changePassword);

// Delete user (admin only)
router.delete('/:id', requireAdmin, deleteUser);

module.exports = router;