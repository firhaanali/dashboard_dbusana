const fs = require('fs');
const path = require('path');

function quickCheck() {
  console.log('🔍 D\'Busana Dashboard - Quick Environment Check');
  console.log('════════════════════════════════════════════════════════');

  const backendDir = path.join(__dirname, '../..');
  let recommendations = [];
  let hasIssues = false;

  try {
    // Check if we're in backend directory
    console.log('📁 Directory Check:');
    if (!process.cwd().includes('backend')) {
      console.log('   ⚠️ You might not be in the backend directory');
      console.log('   💡 Run: cd backend');
      hasIssues = true;
    } else {
      console.log('   ✅ In backend directory');
    }

    // Check package.json
    console.log('\n📦 Package Configuration:');
    const packageJsonPath = path.join(backendDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('   ❌ package.json not found');
      hasIssues = true;
    } else {
      console.log('   ✅ package.json found');
    }

    // Check .env file
    console.log('\n🔧 Environment Configuration:');
    const envPath = path.join(backendDir, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('   ❌ .env file not found');
      console.log('   💡 Create .env with DATABASE_URL');
      hasIssues = true;
      recommendations.push('Create .env file with DATABASE_URL');
    } else {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('DATABASE_URL')) {
        console.log('   ❌ DATABASE_URL not found in .env');
        hasIssues = true;
        recommendations.push('Add DATABASE_URL to .env file');
      } else {
        console.log('   ✅ .env file with DATABASE_URL found');
      }
    }

    // Check node_modules
    console.log('\n📚 Dependencies:');
    const nodeModulesPath = path.join(backendDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('   ❌ node_modules not found');
      hasIssues = true;
      recommendations.push('Install dependencies');
    } else {
      console.log('   ✅ node_modules found');
      
      // Check @prisma/client specifically
      const prismaClientPath = path.join(nodeModulesPath, '@prisma', 'client');
      if (!fs.existsSync(prismaClientPath)) {
        console.log('   ❌ @prisma/client not found');
        hasIssues = true;
        recommendations.push('Install Prisma Client');
      } else {
        console.log('   ✅ @prisma/client found');
      }
    }

    // Check Prisma schema
    console.log('\n📄 Prisma Schema:');
    const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.log('   ❌ prisma/schema.prisma not found');
      hasIssues = true;
    } else {
      console.log('   ✅ Prisma schema found');
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const hasCategory = schemaContent.includes('model Category');
      const hasBrand = schemaContent.includes('model Brand');
      
      console.log(`   📊 Category model: ${hasCategory ? '✅ Found' : '❌ Missing'}`);
      console.log(`   📊 Brand model: ${hasBrand ? '✅ Found' : '❌ Missing'}`);
      
      if (!hasCategory || !hasBrand) {
        hasIssues = true;
        recommendations.push('Update Prisma schema with Category and Brand models');
      }
    }

    // Test Prisma Client import
    console.log('\n🎯 Prisma Client Test:');
    try {
      require('@prisma/client');
      console.log('   ✅ @prisma/client can be imported');
    } catch (error) {
      console.log('   ❌ @prisma/client import failed');
      console.log(`   📝 Error: ${error.message}`);
      hasIssues = true;
      recommendations.push('Generate Prisma Client');
    }

    // Provide recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('════════════════════════════════════════════════════════');

    if (!hasIssues) {
      console.log('✅ Everything looks good! You can run:');
      console.log('');
      console.log('🚀 RECOMMENDED (simple):');
      console.log('   node src/scripts/completeMigration.js');
      console.log('');
      console.log('🔧 ALTERNATIVE (if migration fails):');
      console.log('   npx prisma db push');
    } else {
      console.log('⚠️ Issues detected. Choose the best option:');
      console.log('');
      console.log('🚀 BEST FOR YOUR SITUATION:');
      console.log('   node src/scripts/fullSetupAndMigration.js');
      console.log('   (This will fix all issues automatically)');
      console.log('');
      console.log('🔧 MANUAL STEPS (alternative):');
      console.log('   1. npm install');
      console.log('   2. npx prisma generate');
      console.log('   3. node src/scripts/completeMigration.js');
      console.log('');
      console.log('⚡ QUICK FIX (if all else fails):');
      console.log('   npx prisma db push');
    }

    console.log('\n📋 Summary of Issues Found:');
    if (recommendations.length === 0) {
      console.log('   ✅ No issues detected');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

  } catch (error) {
    console.error('❌ Quick check failed:', error.message);
    console.log('\n🚀 SAFEST OPTION:');
    console.log('   node src/scripts/fullSetupAndMigration.js');
  }

  console.log('\n🏁 Quick check completed');
}

// Run if this script is executed directly
if (require.main === module) {
  quickCheck();
}

module.exports = { quickCheck };