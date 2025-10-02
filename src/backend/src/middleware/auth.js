const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied',
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'Token is not valid'
    });
  }
};

/**
 * API Key Authentication Middleware
 * Simple API key validation for development
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Access denied',
      message: 'No API key provided'
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'API key is not valid'
    });
  }
  
  next();
};

/**
 * Optional Authentication Middleware
 * Allows access but populates user if token is valid
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue without user
      req.user = null;
    }
  }
  
  next();
};

/**
 * Role-based Access Control Middleware
 * Requires user to have specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'User does not have required role'
      });
    }
    
    next();
  };
};

/**
 * Admin-only Access Middleware
 */
const requireAdmin = requireRole(['admin']);

/**
 * Development-only Middleware
 * Skips authentication in development mode
 */
const devOnlyAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, create a mock user
    req.user = {
      id: 'dev-user',
      email: 'dev@dbusana.com',
      role: 'admin',
      name: 'Development User'
    };
    return next();
  }
  
  // In production, require actual authentication
  return authenticateToken(req, res, next);
};

/**
 * Rate limiting by user
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userData = userRequests.get(userId);
    
    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + windowMs;
      return next();
    }
    
    if (userData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000 / 60} minutes`,
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      });
    }
    
    userData.count++;
    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateApiKey,
  optionalAuth,
  requireRole,
  requireAdmin,
  devOnlyAuth,
  userRateLimit
};