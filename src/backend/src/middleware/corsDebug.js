/**
 * CORS Debug Middleware
 * Enhanced debugging for CORS issues in development
 */

const corsDebugMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }

  const origin = req.headers.origin;
  const method = req.method;
  const path = req.originalUrl;

  console.log('🔍 CORS Debug Info:');
  console.log(`   Method: ${method}`);
  console.log(`   Path: ${path}`);
  console.log(`   Origin: ${origin || 'No origin header'}`);
  console.log(`   User-Agent: ${req.headers['user-agent'] || 'No user-agent'}`);
  console.log(`   Content-Type: ${req.headers['content-type'] || 'No content-type'}`);
  
  // Log all request headers for debugging
  if (method === 'OPTIONS') {
    console.log('   All Headers:', JSON.stringify(req.headers, null, 2));
  }

  // Set permissive headers for development
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Development-Only, x-development-only, Accept, Origin, X-Requested-With, Cache-Control, Pragma');
  res.setHeader('Access-Control-Expose-Headers', 'X-Development-Only, x-development-only, X-Total-Count, X-Page-Count');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }

  console.log('✅ CORS headers set, proceeding to next middleware');
  next();
};

module.exports = corsDebugMiddleware;