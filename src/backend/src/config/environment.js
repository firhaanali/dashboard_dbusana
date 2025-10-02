const path = require('path');
const fs = require('fs');

/**
 * D'Busana Dashboard Environment Configuration
 * Comprehensive environment variable management with validation and defaults
 */

class EnvironmentConfig {
  constructor() {
    this.loadEnvironmentVariables();
    this.validateRequiredVariables();
    this.processConfiguration();
  }

  loadEnvironmentVariables() {
    // Load .env file if exists
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      console.log('✅ Environment variables loaded from .env file');
    } else {
      console.log('⚠️ No .env file found, using process environment variables');
    }
  }

  validateRequiredVariables() {
    const requiredVars = [
      'DATABASE_URL',
      'PORT',
      'NODE_ENV'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('✅ All required environment variables are present');
  }

  processConfiguration() {
    // ==========================
    // DATABASE CONFIGURATION
    // ==========================
    this.database = {
      url: process.env.DATABASE_URL,
      user: process.env.DB_USER || 'firhan',
      password: process.env.DB_PASSWORD || '1234',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME || 'dbusana_db',
      schema: 'public',
      
      // Connection Pool Settings
      poolSize: parseInt(process.env.DATABASE_POOL_SIZE) || 10,
      timeout: parseInt(process.env.DATABASE_TIMEOUT) || 30000,
      
      // Connection validation
      isValid() {
        return this.url && this.url.startsWith('postgresql://');
      }
    };

    // ==========================
    // SERVER CONFIGURATION
    // ==========================
    this.server = {
      port: parseInt(process.env.PORT) || 3000,
      environment: process.env.NODE_ENV || 'development',
      apiDocsUrl: process.env.API_DOCS_URL || `http://localhost:${parseInt(process.env.PORT) || 3000}/api/docs`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      
      isDevelopment: () => this.server.environment === 'development',
      isProduction: () => this.server.environment === 'production',
      isTest: () => this.server.environment === 'test'
    };

    // ==========================
    // SECURITY CONFIGURATION
    // ==========================
    this.security = {
      jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production-min-32-chars',
      apiKey: process.env.API_KEY || 'dbusana-api-key-2024',
      
      // Security validation
      validateJwtSecret() {
        if (this.jwtSecret.length < 32) {
          console.warn('⚠️ JWT secret should be at least 32 characters long');
        }
        return this.jwtSecret.length >= 16; // Minimum acceptable
      }
    };

    // ==========================
    // FILE UPLOAD CONFIGURATION
    // ==========================
    this.fileUpload = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || '.xlsx,.xls,.csv').split(','),
      
      // Helper methods
      isFileTypeAllowed(fileExtension) {
        return this.allowedFileTypes.includes(fileExtension.toLowerCase());
      },
      
      getMaxFileSizeMB() {
        return Math.round(this.maxFileSize / 1024 / 1024);
      }
    };

    // ==========================
    // LOGGING CONFIGURATION
    // ==========================
    this.logging = {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || './logs/app.log',
      
      // Ensure logs directory exists
      ensureLogDirectory() {
        const logDir = path.dirname(this.file);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
          console.log(`📁 Created log directory: ${logDir}`);
        }
      }
    };

    // ==========================
    // RATE LIMITING CONFIGURATION
    // ==========================
    this.rateLimiting = {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
      importMaxRequests: parseInt(process.env.IMPORT_RATE_LIMIT_MAX) || 50,
      
      // Helper methods
      getWindowMinutes() {
        return this.windowMs / 60000;
      }
    };

    // ==========================
    // EXCEL / CSV PROCESSING CONFIGURATION
    // ==========================
    this.dataProcessing = {
      maxRowsPerImport: parseInt(process.env.MAX_ROWS_PER_IMPORT) || 10000,
      batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
      
      // Validation methods
      validateImportSize(rowCount) {
        return rowCount <= this.maxRowsPerImport;
      },
      
      calculateBatches(totalRows) {
        return Math.ceil(totalRows / this.batchSize);
      }
    };

    // ==========================
    // CACHE CONFIGURATION (Redis)
    // ==========================
    this.cache = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
      
      isRedisConfigured() {
        return this.redisUrl && this.redisUrl.startsWith('redis://');
      }
    };

    // ==========================
    // CORS CONFIGURATION
    // ==========================
    this.cors = {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200
    };
  }

  // ==========================
  // UTILITY METHODS
  // ==========================
  
  /**
   * Get complete configuration object
   */
  getConfig() {
    return {
      database: this.database,
      server: this.server,
      security: this.security,
      fileUpload: this.fileUpload,
      logging: this.logging,
      rateLimiting: this.rateLimiting,
      dataProcessing: this.dataProcessing,
      cache: this.cache,
      cors: this.cors
    };
  }

  /**
   * Validate all configurations
   */
  validateConfiguration() {
    const validations = [];

    // Database validation
    if (!this.database.isValid()) {
      validations.push('❌ Database URL is invalid');
    } else {
      validations.push('✅ Database configuration is valid');
    }

    // Security validation
    if (this.security.validateJwtSecret()) {
      validations.push('✅ JWT secret is acceptable');
    } else {
      validations.push('❌ JWT secret is too short');
    }

    // File upload validation
    validations.push(`✅ File upload: Max ${this.fileUpload.getMaxFileSizeMB()}MB, Types: ${this.fileUpload.allowedFileTypes.join(', ')}`);

    // Cache validation
    if (this.cache.isRedisConfigured()) {
      validations.push('✅ Redis cache configuration is valid');
    } else {
      validations.push('⚠️ Redis cache not configured (using memory cache)');
    }

    // Rate limiting validation
    validations.push(`✅ Rate limiting: ${this.rateLimiting.maxRequests} requests per ${this.rateLimiting.getWindowMinutes()} minutes`);

    // Data processing validation
    validations.push(`✅ Data processing: Max ${this.dataProcessing.maxRowsPerImport} rows, Batch size ${this.dataProcessing.batchSize}`);

    return validations;
  }

  /**
   * Print configuration summary
   */
  printConfigSummary() {
    console.log('\n🏗️  D\'BUSANA DASHBOARD CONFIGURATION');
    console.log('=====================================');
    
    console.log(`🗄️  Database: ${this.database.host}:${this.database.port}/${this.database.name}`);
    console.log(`🚀 Server: ${this.server.environment} mode on port ${this.server.port}`);
    console.log(`📁 Upload: ${this.fileUpload.getMaxFileSizeMB()}MB max, ${this.fileUpload.allowedFileTypes.length} file types`);
    console.log(`⚡ Processing: ${this.dataProcessing.maxRowsPerImport} max rows, ${this.dataProcessing.batchSize} batch size`);
    console.log(`🔒 Security: JWT configured, API key protected`);
    console.log(`📊 Cache: ${this.cache.isRedisConfigured() ? 'Redis' : 'Memory'} (${this.cache.ttl}s TTL)`);
    console.log(`🛡️  Rate Limit: ${this.rateLimiting.maxRequests}/${this.rateLimiting.getWindowMinutes()}min`);
    
    console.log('\n🔍 VALIDATION RESULTS:');
    this.validateConfiguration().forEach(result => console.log(result));
    
    console.log('\n✅ Configuration loaded successfully!\n');
  }

  /**
   * Get environment-specific database connection string
   */
  getDatabaseConnectionString() {
    return this.database.url;
  }

  /**
   * Get Prisma configuration
   */
  getPrismaConfig() {
    return {
      datasources: {
        db: {
          url: this.database.url
        }
      },
      generator: {
        client: {
          provider: 'prisma-client-js'
        }
      }
    };
  }
}

// Create and export singleton instance
const environmentConfig = new EnvironmentConfig();

// Initialize logging directory
environmentConfig.logging.ensureLogDirectory();

// Export configuration instance and utilities
module.exports = {
  config: environmentConfig.getConfig(),
  environment: environmentConfig,
  
  // Quick access to commonly used configs
  PORT: environmentConfig.server.port,
  DATABASE_URL: environmentConfig.database.url,
  NODE_ENV: environmentConfig.server.environment,
  IS_DEVELOPMENT: environmentConfig.server.isDevelopment(),
  IS_PRODUCTION: environmentConfig.server.isProduction(),
  
  // Initialization function
  initialize() {
    environmentConfig.printConfigSummary();
    return environmentConfig.getConfig();
  },
  
  // Validation function
  validate() {
    return environmentConfig.validateConfiguration();
  }
};