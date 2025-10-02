const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, devOnlyAuth } = require('../middleware/auth');

const router = express.Router();

// Temporary user storage (in production, use database)
const users = [
  {
    id: '1',
    email: 'admin@dbusana.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Admin D\'Busana',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@dbusana.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'User D\'Busana',
    role: 'user'
  }
];

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token,
        expiresIn: '24h'
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (in production, might be admin-only)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: String(users.length + 1),
      email,
      password: hashedPassword,
      name,
      role
    };
    
    users.push(newUser);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        token,
        expiresIn: '24h'
      },
      message: 'Registration successful'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Development only
 */
router.get('/profile', devOnlyAuth, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Development only
 */
router.put('/profile', devOnlyAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    // Check if email is already taken by another user
    if (email && email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email === email && u.id !== req.user.id);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already taken',
          message: 'Email is already used by another user'
        });
      }
    }
    
    // Update user data
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    
    res.json({
      success: true,
      data: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        name: users[userIndex].name,
        role: users[userIndex].role
      },
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Development only
 */
router.put('/change-password', devOnlyAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Current password and new password are required'
      });
    }
    
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[userIndex].password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].password = hashedNewPassword;
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Development only
 */
router.post('/logout', devOnlyAuth, (req, res) => {
  // In a more sophisticated implementation, you might:
  // - Add token to blacklist
  // - Store logout timestamp
  // - Invalidate refresh tokens
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Development only
 */
router.get('/verify', devOnlyAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

/**
 * @route   GET /api/auth/account
 * @desc    Get account settings data
 * @access  Development only
 */
router.get('/account', devOnlyAuth, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'Account not found'
      });
    }
    
    // Mock account settings data
    const accountData = {
      email: user.email,
      role: user.role === 'admin' ? 'Administrator' : 'User',
      last_login: new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }) + ' WIB',
      status: 'active',
      two_factor_enabled: false,
      email_notifications: true,
      security_alerts: true,
      account_verified: true
    };
    
    res.json({
      success: true,
      data: accountData,
      message: 'Account data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Account data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get account data',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/security-settings
 * @desc    Update security settings
 * @access  Development only
 */
router.put('/security-settings', devOnlyAuth, async (req, res) => {
  try {
    const { two_factor_enabled, email_notifications, security_alerts } = req.body;
    
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    // In a real application, you would save these settings to database
    // For now, we'll just simulate success
    console.log(`Security settings updated for user ${req.user.email}:`, {
      two_factor_enabled,
      email_notifications,
      security_alerts
    });
    
    res.json({
      success: true,
      message: 'Security settings updated successfully'
    });
    
  } catch (error) {
    console.error('Security settings update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update security settings',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/profile/avatar
 * @desc    Upload user avatar
 * @access  Development only
 */
router.post('/profile/avatar', devOnlyAuth, async (req, res) => {
  try {
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    // In a real application, you would:
    // 1. Validate file type and size
    // 2. Process and store the image
    // 3. Save the URL to database
    // For now, we'll simulate success
    
    const mockAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(users[userIndex].name)}&size=200&background=random`;
    
    console.log(`Avatar upload simulated for user ${req.user.email}`);
    
    res.json({
      success: true,
      data: {
        avatar_url: mockAvatarUrl
      },
      message: 'Avatar uploaded successfully'
    });
    
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
      message: error.message
    });
  }
});

module.exports = router;