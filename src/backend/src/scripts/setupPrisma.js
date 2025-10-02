const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupPrisma() {
  console.log('🔧 Setting up Prisma for D\'Busana Dashboard...');
  console.log('════════════════════════════════════════════════════════');

  try {
    // Step 1: Check if we're in the right directory
    const backendDir = path.join(__dirname, '../..');
    const originalDir = process.cwd();
    
    console.log('\n📋 STEP 1: Directory Setup');
    console.log('─────────────────────────────────');
    console.log('📁 Current directory:', originalDir);
    console.log('📁 Backend directory:', backendDir);
    
    // Change to backend directory
    process.chdir(backendDir);
    console.log('📁 Switched to:', process.cwd());
    
    // Step 2: Check package.json exists
    console.log('\n📋 STEP 2: Check Package Configuration');
    console.log('─────────────────────────────────');
    
    const packageJsonPath = path.join(backendDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json not found in backend directory');
      process.exit(1);
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('✅ package.json found');
    console.log('📦 Project name:', packageJson.name || 'backend');
    
    // Step 3: Check .env file
    console.log('\n📋 STEP 3: Environment Configuration');
    console.log('─────────────────────────────────');
    
    const envPath = path.join(backendDir, '.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found in backend directory');
      console.log('💡 Create .env file with:');
      console.log('   DATABASE_URL="postgresql://username:password@localhost:5432/dbusana_db"');
      process.exit(1);
    }
    
    // Read and check DATABASE_URL
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDbUrl = envContent.includes('DATABASE_URL');
    
    if (!hasDbUrl) {
      console.error('❌ DATABASE_URL not found in .env file');
      console.log('💡 Add to .env file:');
      console.log('   DATABASE_URL="postgresql://username:password@localhost:5432/dbusana_db"');
      process.exit(1);
    }
    
    console.log('✅ .env file found with DATABASE_URL');
    
    // Step 4: Check if node_modules exists and Prisma is installed
    console.log('\n📋 STEP 4: Dependencies Check');
    console.log('─────────────────────────────────');
    
    const nodeModulesPath = path.join(backendDir, 'node_modules');
    const prismaClientPath = path.join(nodeModulesPath, '@prisma', 'client');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('⚠️ node_modules not found. Installing dependencies...');
      console.log('🔄 Running: npm install');
      
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
      } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ node_modules directory found');
    }
    
    if (!fs.existsSync(prismaClientPath)) {
      console.log('⚠️ @prisma/client not found. Installing Prisma Client...');
      console.log('🔄 Running: npm install @prisma/client');
      
      try {
        execSync('npm install @prisma/client', { stdio: 'inherit' });
        console.log('✅ Prisma Client installed successfully');
      } catch (error) {
        console.error('❌ Failed to install Prisma Client:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ @prisma/client package found');
    }
    
    // Step 5: Check Prisma CLI
    console.log('\n📋 STEP 5: Prisma CLI Setup');
    console.log('─────────────────────────────────');
    
    try {
      const prismaVersion = execSync('npx prisma --version', { encoding: 'utf8' });
      console.log('✅ Prisma CLI available');
      console.log('📋 Version info:', prismaVersion.split('\n')[0]);
    } catch (error) {
      console.log('⚠️ Prisma CLI not found. Installing...');
      try {
        execSync('npm install prisma --save-dev', { stdio: 'inherit' });
        console.log('✅ Prisma CLI installed successfully');
      } catch (installError) {
        console.error('❌ Failed to install Prisma CLI:', installError.message);
        process.exit(1);
      }
    }
    
    // Step 6: Check Prisma schema
    console.log('\n📋 STEP 6: Prisma Schema Verification');
    console.log('─────────────────────────────────');
    
    const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ prisma/schema.prisma not found');
      process.exit(1);
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const hasCategory = schemaContent.includes('model Category');
    const hasBrand = schemaContent.includes('model Brand');
    
    console.log('✅ Prisma schema found');
    console.log(`📊 Category model: ${hasCategory ? '✅ Found' : '❌ Missing'}`);
    console.log(`📊 Brand model: ${hasBrand ? '✅ Found' : '❌ Missing'}`);
    
    // Step 7: Generate Prisma Client
    console.log('\n📋 STEP 7: Generate Prisma Client');
    console.log('─────────────────────────────────');
    
    try {
      console.log('🔄 Running: npx prisma generate');
      const generateOutput = execSync('npx prisma generate', { encoding: 'utf8' });
      console.log('✅ Prisma Client generated successfully');
      
      // Check if client was actually generated
      const generatedClientPath = path.join(nodeModulesPath, '.prisma', 'client');
      if (fs.existsSync(generatedClientPath)) {
        console.log('✅ Generated client found at:', generatedClientPath);
      } else {
        console.log('⚠️ Generated client directory not found, but generation reported success');
      }
      
    } catch (error) {
      console.error('❌ Failed to generate Prisma Client:', error.message);
      process.exit(1);
    }
    
    // Step 8: Test Prisma Client import
    console.log('\n📋 STEP 8: Test Prisma Client');
    console.log('─────────────────────────────────');
    
    try {
      // Try to require the Prisma Client
      const { PrismaClient } = require('@prisma/client');
      console.log('✅ Prisma Client can be imported successfully');
      
      // Test basic instantiation
      const prisma = new PrismaClient();
      console.log('✅ Prisma Client can be instantiated');
      
      // Test connection (quick check)
      console.log('🔄 Testing database connection...');
      await prisma.$connect();
      console.log('✅ Database connection successful');
      await prisma.$disconnect();
      
    } catch (error) {
      if (error.message.includes('Cannot find module')) {
        console.error('❌ Prisma Client still cannot be imported:', error.message);
        console.log('💡 Try running:');
        console.log('   1. npm install');
        console.log('   2. npx prisma generate');
        console.log('   3. node src/scripts/setupPrisma.js');
        process.exit(1);
      } else if (error.message.includes('connect')) {
        console.log('⚠️ Database connection failed (check DATABASE_URL):');
        console.log('   Error:', error.message);
        console.log('✅ But Prisma Client is properly installed');
      } else {
        console.error('❌ Prisma Client test failed:', error.message);
        process.exit(1);
      }
    }
    
    // Success summary
    console.log('\n🎉 PRISMA SETUP COMPLETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ All components are ready:');
    console.log('   📦 Dependencies installed');
    console.log('   🔧 Prisma CLI available');
    console.log('   📄 Schema file verified');
    console.log('   🎯 Prisma Client generated');
    console.log('   🔗 Database connection tested');
    console.log('');
    console.log('🚀 Ready to run migration!');
    console.log('   Next command: node src/scripts/completeMigration.js');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 PRISMA SETUP FAILED!');
    console.error('════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Ensure you are in the backend directory');
    console.error('   2. Check that package.json exists');
    console.error('   3. Verify .env file with DATABASE_URL');
    console.error('   4. Try: npm install && npx prisma generate');
    
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  setupPrisma()
    .then(() => {
      console.log('\n🏁 Prisma setup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Prisma setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPrisma };