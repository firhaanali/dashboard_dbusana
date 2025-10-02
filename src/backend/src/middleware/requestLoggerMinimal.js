/**
 * Minimal Request Logger Middleware
 * Quiet logging untuk clean backend startup
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to log only essential info
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Only log errors or critical info in development
    if (res.statusCode >= 400 || (process.env.LOG_LEVEL === 'verbose' && req.originalUrl.includes('/api/'))) {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
    
    return originalJson.call(this, data);
  };

  next();
};

module.exports = requestLogger;