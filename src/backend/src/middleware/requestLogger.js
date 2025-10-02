/**
 * Enhanced Request Logger Middleware
 * Logs all API requests with detailed information for debugging
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl;
  const origin = req.headers.origin;
  const userAgent = req.headers['user-agent'];
  const contentType = req.headers['content-type'];

  // Log incoming request
  console.log('');
  console.log('📥 INCOMING REQUEST');
  console.log('═══════════════════════════════════════');
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Method: ${method}`);
  console.log(`   Path: ${path}`);
  console.log(`   Origin: ${origin || 'No origin'}`);
  console.log(`   Content-Type: ${contentType || 'No content-type'}`);
  console.log(`   User-Agent: ${userAgent ? userAgent.substring(0, 50) + '...' : 'No user-agent'}`);

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query: ${JSON.stringify(req.query)}`);
  }

  // Log body for POST/PUT requests (but truncate large bodies)
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length > 200) {
      console.log(`   Body: ${bodyStr.substring(0, 200)}... (truncated)`);
    } else {
      console.log(`   Body: ${bodyStr}`);
    }
  }

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('');
    console.log('📤 OUTGOING RESPONSE');
    console.log('═══════════════════════════════════════');
    console.log(`   Method: ${method}`);
    console.log(`   Path: ${path}`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Response Size: ${JSON.stringify(data).length} bytes`);
    
    // Log response data summary
    if (data && typeof data === 'object') {
      if (data.success !== undefined) {
        console.log(`   Success: ${data.success}`);
      }
      if (data.data && Array.isArray(data.data)) {
        console.log(`   Records: ${data.data.length}`);
      }
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
      if (data.count !== undefined) {
        console.log(`   Total Count: ${data.count}`);
      }
    }
    
    console.log('═══════════════════════════════════════');
    console.log('');

    return originalJson.call(this, data);
  };

  next();
};

module.exports = requestLogger;