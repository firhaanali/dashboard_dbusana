/**
 * Backend Startup Check Utility
 * Ensures all configurations are properly set before starting the server
 */

const path = require('path');
const fs = require('fs');

class StartupChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addCheck(name, passed, message, type = 'error') {
    this.checks.push({ name, passed, message, type });
    
    if (!passed) {
      if (type === 'error') {
        this.errors.push(`${name}: ${message}`);
      } else {
        this.warnings.push(`${name}: ${message}`);
      }
    }
  }

  checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'NODE_ENV'
    ];
    
    const optionalEnvVars = [
      'PORT',
      'FRONTEND_URL',
      'JWT_SECRET'
    ];

    // Check required variables
    for (const envVar of requiredEnvVars) {
      const exists = process.env[envVar] !== undefined;
      this.addCheck(
        `ENV_${envVar}`,
        exists,
        exists ? `${envVar} is set` : `${envVar} is required but not set`,
        'error'
      );
    }

    // Check optional variables with defaults
    for (const envVar of optionalEnvVars) {
      const exists = process.env[envVar] !== undefined;
      if (!exists) {
        const defaults = {
          PORT: '3001',
          FRONTEND_URL: 'http://localhost:3000',
          JWT_SECRET: 'development-secret'
        };
        
        this.addCheck(
          `ENV_${envVar}`,
          true,
          `${envVar} not set, using default: ${defaults[envVar] || 'none'}`,
          'warning'
        );
      } else {
        this.addCheck(
          `ENV_${envVar}`,
          true,
          `${envVar} is configured`
        );
      }
    }
  }

  checkFileSystem() {
    this.log('Checking file system...');
    
    const criticalFiles = [
      'package.json',
      'src/server.js',
      'src/routes/index.js',
      'prisma/schema.prisma'
    ];

    const criticalDirs = [
      'src/controllers',
      'src/routes',
      'src/middleware'
    ];

    // Check files
    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      
      this.addCheck(
        `FILE_${file}`,
        exists,
        exists ? `${file} exists` : `${file} is missing`,
        'error'
      );
    }

    // Check directories
    for (const dir of criticalDirs) {
      const dirPath = path.join(process.cwd(), dir);
      const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
      
      this.addCheck(
        `DIR_${dir}`,
        exists,
        exists ? `${dir}/ directory exists` : `${dir}/ directory is missing`,
        'error'
      );
    }
  }

  checkDependencies() {
    this.log('Checking dependencies...');
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredDeps = [
        'express',
        'cors',
        'helmet',
        'morgan',
        'compression',
        'express-rate-limit',
        '@prisma/client',
        'prisma'
      ];

      const allDeps = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };

      for (const dep of requiredDeps) {
        const exists = dep in allDeps;
        this.addCheck(
          `DEP_${dep}`,
          exists,
          exists ? `${dep} is installed` : `${dep} is required but not installed`,
          'error'
        );
      }

      this.addCheck(
        'PACKAGE_JSON',
        true,
        'package.json is valid and readable'
      );
      
    } catch (error) {
      this.addCheck(
        'PACKAGE_JSON',
        false,
        `Failed to read package.json: ${error.message}`,
        'error'
      );
    }
  }

  checkPortAvailability() {
    this.log('Checking port availability...');
    
    const port = process.env.PORT || 3001;
    
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          this.addCheck(
            'PORT_AVAILABLE',
            true,
            `Port ${port} is available`
          );
          resolve();
        });
        server.close();
      });
      
      server.on('error', (err) => {
        this.addCheck(
          'PORT_AVAILABLE',
          false,
          `Port ${port} is already in use: ${err.message}`,
          'error'
        );
        resolve();
      });
    });
  }

  async checkDatabase() {
    this.log('Checking database connection...');
    
    try {
      // Try to import and initialize Prisma
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Test connection
      await prisma.$connect();
      
      this.addCheck(
        'DATABASE_CONNECTION',
        true,
        'Database connection successful'
      );
      
      // Test basic query
      try {
        await prisma.$queryRaw`SELECT 1`;
        this.addCheck(
          'DATABASE_QUERY',
          true,
          'Database queries working'
        );
      } catch (queryError) {
        this.addCheck(
          'DATABASE_QUERY',
          false,
          `Database query failed: ${queryError.message}`,
          'warning'
        );
      }
      
      await prisma.$disconnect();
      
    } catch (error) {
      this.addCheck(
        'DATABASE_CONNECTION',
        false,
        `Database connection failed: ${error.message}`,
        'error'
      );
    }
  }

  checkCorsConfiguration() {
    this.log('Checking CORS configuration...');
    
    try {
      const serverJsPath = path.join(process.cwd(), 'src/server.js');
      const serverJs = fs.readFileSync(serverJsPath, 'utf8');
      
      // Check for CORS setup
      const hasCorsImport = serverJs.includes("require('cors')") || serverJs.includes("from 'cors'");
      const hasCorsUse = serverJs.includes('app.use(cors');
      
      this.addCheck(
        'CORS_IMPORT',
        hasCorsImport,
        hasCorsImport ? 'CORS module is imported' : 'CORS module is not imported',
        'error'
      );
      
      this.addCheck(
        'CORS_SETUP',
        hasCorsUse,
        hasCorsUse ? 'CORS middleware is configured' : 'CORS middleware is not configured',
        'error'
      );
      
      // Check for development headers
      const hasDevHeaders = serverJs.includes('x-development-only') || serverJs.includes('X-Development-Only');
      
      this.addCheck(
        'CORS_DEV_HEADERS',
        hasDevHeaders,
        hasDevHeaders ? 'Development headers are allowed in CORS' : 'Development headers may not be allowed',
        'warning'
      );
      
    } catch (error) {
      this.addCheck(
        'CORS_CONFIG_CHECK',
        false,
        `Failed to check CORS configuration: ${error.message}`,
        'warning'
      );
    }
  }

  async runAllChecks() {
    this.log('🚀 Starting D\'Busana Backend Startup Check...', 'info');
    this.log('═══════════════════════════════════════════════', 'info');
    
    // Run all checks
    this.checkEnvironmentVariables();
    this.checkFileSystem();
    this.checkDependencies();
    this.checkCorsConfiguration();
    
    // Async checks
    await this.checkPortAvailability();
    await this.checkDatabase();
    
    // Generate report
    this.generateReport();
    
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      checks: this.checks
    };
  }

  generateReport() {
    this.log('═══════════════════════════════════════════════', 'info');
    this.log('📊 STARTUP CHECK REPORT', 'info');
    this.log('═══════════════════════════════════════════════', 'info');
    
    const passed = this.checks.filter(c => c.passed).length;
    const total = this.checks.length;
    
    this.log(`✅ Passed: ${passed}/${total} checks`, 'success');
    
    if (this.errors.length > 0) {
      this.log(`❌ Errors: ${this.errors.length}`, 'error');
      this.errors.forEach(error => this.log(`   • ${error}`, 'error'));
    }
    
    if (this.warnings.length > 0) {
      this.log(`⚠️  Warnings: ${this.warnings.length}`, 'warning');
      this.warnings.forEach(warning => this.log(`   • ${warning}`, 'warning'));
    }
    
    this.log('═══════════════════════════════════════════════', 'info');
    
    if (this.errors.length === 0) {
      this.log('🎉 Backend is ready to start!', 'success');
    } else {
      this.log('💥 Backend has critical issues that need to be fixed before starting', 'error');
      this.log('', 'info');
      this.log('🔧 Quick Fix Commands:', 'info');
      this.log('   npm install                    # Install missing dependencies', 'info');
      this.log('   npx prisma generate            # Generate Prisma client', 'info');
      this.log('   npx prisma db push             # Sync database schema', 'info');
      this.log('   npm run dev                    # Start development server', 'info');
    }
  }
}

// Export for use in other files
module.exports = { StartupChecker };

// Run check if this file is executed directly
if (require.main === module) {
  const checker = new StartupChecker();
  checker.runAllChecks().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Startup check failed:', error);
    process.exit(1);
  });
}