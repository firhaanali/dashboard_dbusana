// Load D'Busana Environment Configuration
const { config, environment, initialize, PORT, IS_DEVELOPMENT } = require('./config/environment');

// Initialize configuration and print summary
const appConfig = initialize();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes and middleware
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLoggerMinimal');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration from environment
const corsOptions = {
  origin: [
    config.cors.origin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    `http://localhost:${PORT}`,
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-api-key',
    'x-development-only',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Cache-Control'
  ],
  optionsSuccessStatus: config.cors.optionsSuccessStatus
};

app.use(cors(corsOptions));

// Rate limiting from environment configuration
const limiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Import rate limiting (more restrictive for file uploads)
const importLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.importMaxRequests,
  message: `Too many import requests from this IP. Limit: ${config.rateLimiting.importMaxRequests} per ${config.rateLimiting.getWindowMinutes()} minutes.`,
});
app.use('/api/import/', importLimiter);

// Compression
app.use(compression());

// Logging based on environment configuration
if (IS_DEVELOPMENT) {
  // Use our custom request logger in development for better debugging
  app.use(requestLogger);
} else {
  // Use morgan in production for standard logging
  app.use(morgan('combined'));
}

// Body parsing middleware with configurable limits
const maxBodySize = `${Math.round(config.fileUpload.maxFileSize / 1024 / 1024 * 5)}mb`; // 5x file size for safety
app.use(express.json({ limit: maxBodySize }));
app.use(express.urlencoded({ extended: true, limit: maxBodySize }));

// Serve uploaded files from configured path
const uploadsPath = path.resolve(__dirname, '..', config.fileUpload.uploadPath.replace('./', ''));
app.use('/uploads', express.static(uploadsPath));

// Enhanced health check endpoints with configuration info
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.environment,
    corsEnabled: true,
    port: PORT,
    database: config.database.isValid() ? 'Connected' : 'Configuration Error',
    fileUpload: {
      maxSize: config.fileUpload.getMaxFileSizeMB() + 'MB',
      allowedTypes: config.fileUpload.allowedFileTypes.length
    },
    rateLimiting: {
      general: config.rateLimiting.maxRequests + '/' + config.rateLimiting.getWindowMinutes() + 'min',
      import: config.rateLimiting.importMaxRequests + '/' + config.rateLimiting.getWindowMinutes() + 'min'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.environment,
    corsEnabled: true,
    port: PORT,
    configVersion: '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// Catch 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server with enhanced configuration info
app.listen(PORT, async () => {
  console.log('\n🎯 D\'BUSANA DASHBOARD API SERVER STARTED');
  console.log('=========================================');
  console.log(`🚀 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.server.environment}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend: ${config.cors.origin}`);
  console.log(`🗄️ Database: ${config.database.isValid() ? '✅ Ready' : '❌ Check config'}`);
  console.log(`📁 Uploads: ${config.fileUpload.getMaxFileSizeMB()}MB max, ${config.fileUpload.allowedFileTypes.length} types`);
  console.log(`⚡ Processing: ${config.dataProcessing.maxRowsPerImport} max rows`);
  console.log(`🛡️ Rate Limit: ${config.rateLimiting.maxRequests}/${config.rateLimiting.getWindowMinutes()}min`);
  
  // Generate templates quietly on startup
  try {
    const { generateAllTemplatesQuiet } = require('./templates/generate_templates_quiet');
    const result = await generateAllTemplatesQuiet();
    if (result.success) {
      console.log('✅ Templates ready');
    }
  } catch (error) {
    // Silent template generation - only log if critical error
    if (IS_DEVELOPMENT) {
      console.log('⚠️ Template generation issue:', error.message);
    }
  }
  
  console.log('\n🎉 Ready to handle requests!\n');
});

module.exports = app;