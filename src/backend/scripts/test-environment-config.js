/**
 * Test Environment Configuration Setup
 * Validates all environment variables and configuration
 */

async function testEnvironmentConfiguration() {
  console.log('🧪 TESTING D\'BUSANA ENVIRONMENT CONFIGURATION...\n');

  try {
    // Install dotenv if needed
    const { installDotenv } = require('../src/config/install-dotenv');
    await installDotenv();

    // Load configuration
    const { config, environment, validate } = require('../src/config/environment');

    console.log('📋 CONFIGURATION VALIDATION:');
    console.log('============================');

    // Run validation
    const validationResults = validate();
    validationResults.forEach(result => console.log(result));

    console.log('\n🔍 DETAILED CONFIGURATION:');
    console.log('===========================');

    // Database Configuration
    console.log('🗄️  DATABASE:');
    console.log(`   URL: ${config.database.url}`);
    console.log(`   Host: ${config.database.host}:${config.database.port}`);
    console.log(`   Database: ${config.database.name}`);
    console.log(`   Pool Size: ${config.database.poolSize}`);
    console.log(`   Timeout: ${config.database.timeout}ms`);
    console.log(`   Valid: ${config.database.isValid() ? '✅' : '❌'}`);

    // Server Configuration
    console.log('\n🚀 SERVER:');
    console.log(`   Port: ${config.server.port}`);
    console.log(`   Environment: ${config.server.environment}`);
    console.log(`   Frontend URL: ${config.server.frontendUrl}`);
    console.log(`   API Docs: ${config.server.apiDocsUrl}`);

    // Security Configuration
    console.log('\n🔒 SECURITY:');
    console.log(`   JWT Secret: ${config.security.jwtSecret.length} characters`);
    console.log(`   API Key: ${config.security.apiKey}`);
    console.log(`   JWT Valid: ${config.security.validateJwtSecret() ? '✅' : '❌'}`);

    // File Upload Configuration
    console.log('\n📁 FILE UPLOAD:');
    console.log(`   Max Size: ${config.fileUpload.getMaxFileSizeMB()}MB (${config.fileUpload.maxFileSize} bytes)`);
    console.log(`   Upload Path: ${config.fileUpload.uploadPath}`);
    console.log(`   Allowed Types: ${config.fileUpload.allowedFileTypes.join(', ')}`);

    // Rate Limiting Configuration
    console.log('\n🛡️  RATE LIMITING:');
    console.log(`   Window: ${config.rateLimiting.getWindowMinutes()} minutes`);
    console.log(`   General Limit: ${config.rateLimiting.maxRequests} requests`);
    console.log(`   Import Limit: ${config.rateLimiting.importMaxRequests} requests`);

    // Data Processing Configuration
    console.log('\n⚡ DATA PROCESSING:');
    console.log(`   Max Rows Per Import: ${config.dataProcessing.maxRowsPerImport}`);
    console.log(`   Batch Size: ${config.dataProcessing.batchSize}`);

    // Cache Configuration
    console.log('\n📊 CACHE:');
    console.log(`   Redis URL: ${config.cache.redisUrl}`);
    console.log(`   TTL: ${config.cache.ttl} seconds`);
    console.log(`   Redis Configured: ${config.cache.isRedisConfigured() ? '✅' : '❌'}`);

    // CORS Configuration
    console.log('\n🌐 CORS:');
    console.log(`   Origin: ${config.cors.origin}`);
    console.log(`   Credentials: ${config.cors.credentials ? '✅' : '❌'}`);

    // Test some utility methods
    console.log('\n🧪 UTILITY METHODS TEST:');
    console.log('========================');

    // Test file type validation
    const testExtensions = ['.xlsx', '.csv', '.txt', '.pdf'];
    console.log('\n📄 File Type Validation:');
    testExtensions.forEach(ext => {
      const allowed = config.fileUpload.isFileTypeAllowed(ext);
      console.log(`   ${ext}: ${allowed ? '✅ Allowed' : '❌ Rejected'}`);
    });

    // Test data processing validation
    console.log('\n⚡ Data Processing Test:');
    const testRowCounts = [500, 5000, 15000];
    testRowCounts.forEach(count => {
      const valid = config.dataProcessing.validateImportSize(count);
      const batches = config.dataProcessing.calculateBatches(count);
      console.log(`   ${count} rows: ${valid ? '✅' : '❌'} Valid, ${batches} batches`);
    });

    // Environment check
    console.log('\n🏗️  ENVIRONMENT METHODS:');
    console.log(`   Is Development: ${config.server.isDevelopment() ? '✅' : '❌'}`);
    console.log(`   Is Production: ${config.server.isProduction() ? '✅' : '❌'}`);
    console.log(`   Is Test: ${config.server.isTest() ? '✅' : '❌'}`);

    console.log('\n🎉 ENVIRONMENT CONFIGURATION TEST COMPLETED!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Configuration loaded successfully');
    console.log('✅ All validation checks completed');
    console.log('✅ Environment configuration is ready');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Run advertising settlement fix: node scripts/complete-advertising-settlement-fix.js');
    console.log('2. Start server: npm start');
    console.log('3. Test advertising settlement import');

    return true;

  } catch (error) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION TEST FAILED:');
    console.error(error.message);
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Ensure .env file exists in backend directory');
    console.log('2. Check all required environment variables are set');
    console.log('3. Verify DATABASE_URL format is correct');
    console.log('4. Make sure dotenv package is installed');
    
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  testEnvironmentConfiguration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnvironmentConfiguration };