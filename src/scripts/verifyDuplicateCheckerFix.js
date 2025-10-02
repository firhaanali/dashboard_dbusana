#!/usr/bin/env node

/**
 * Comprehensive Verification Script for Duplicate Checker Fix
 * Verifies both backend API and frontend integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 D\'Busana Duplicate Checker Fix Verification');
console.log('==============================================\n');

// Check if required files exist
const checkRequiredFiles = () => {
  console.log('1️⃣ Checking required files...');
  
  const requiredFiles = [
    'backend/src/routes/duplicateCheck.js',
    'backend/src/controllers/duplicateCheckController.js',
    'backend/src/routes/index.js',
    'components/ImportDuplicateChecker.tsx'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${filePath}`);
    } else {
      console.log(`   ❌ ${filePath} (MISSING)`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
};

// Check route registration
const checkRouteRegistration = () => {
  console.log('\n2️⃣ Checking route registration in backend...');
  
  try {
    const indexRoutes = fs.readFileSync('backend/src/routes/index.js', 'utf8');
    
    if (indexRoutes.includes('duplicateCheckRoutes')) {
      console.log('   ✅ duplicateCheckRoutes imported');
    } else {
      console.log('   ❌ duplicateCheckRoutes not imported');
      return false;
    }
    
    if (indexRoutes.includes("router.use('/import', duplicateCheckRoutes)")) {
      console.log('   ✅ duplicateCheck routes mounted on /import');
    } else {
      console.log('   ❌ duplicateCheck routes not mounted');
      return false;
    }
    
    if (indexRoutes.includes("duplicateCheck: '/api/import/check-duplicates'")) {
      console.log('   ✅ duplicateCheck endpoint listed in API info');
    } else {
      console.log('   ❌ duplicateCheck endpoint not listed in API info');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Error reading routes/index.js:', error.message);
    return false;
  }
};

// Check controller implementation
const checkControllerImplementation = () => {
  console.log('\n3️⃣ Checking controller implementation...');
  
  try {
    const controller = fs.readFileSync('backend/src/controllers/duplicateCheckController.js', 'utf8');
    
    if (controller.includes('calculateStringSimilarity')) {
      console.log('   ✅ calculateStringSimilarity function exists');
    } else {
      console.log('   ❌ calculateStringSimilarity function missing');
      return false;
    }
    
    if (controller.includes('checkImportDuplicates')) {
      console.log('   ✅ checkImportDuplicates function exists');
    } else {
      console.log('   ❌ checkImportDuplicates function missing');
      return false;
    }
    
    if (controller.includes('PrismaClient')) {
      console.log('   ✅ PrismaClient imported');
    } else {
      console.log('   ❌ PrismaClient not imported');
      return false;
    }
    
    if (controller.includes('res.json({')) {
      console.log('   ✅ Proper JSON response structure');
    } else {
      console.log('   ❌ Response structure may be incorrect');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Error reading controller file:', error.message);
    return false;
  }
};

// Check frontend implementation
const checkFrontendImplementation = () => {
  console.log('\n4️⃣ Checking frontend implementation...');
  
  try {
    const component = fs.readFileSync('components/ImportDuplicateChecker.tsx', 'utf8');
    
    if (component.includes('aria-describedby')) {
      console.log('   ✅ DialogContent has aria-describedby attribute');
    } else {
      console.log('   ❌ DialogContent missing aria-describedby attribute');
      return false;
    }
    
    if (component.includes('id="duplicate-check-description"')) {
      console.log('   ✅ Description element has proper ID');
    } else {
      console.log('   ❌ Description element missing proper ID');
      return false;
    }
    
    if (component.includes('AbortController')) {
      console.log('   ✅ Request timeout handling implemented');
    } else {
      console.log('   ❌ Request timeout handling missing');
      return false;
    }
    
    if (component.includes('/api/import/check-duplicates')) {
      console.log('   ✅ Correct API endpoint URL');
    } else {
      console.log('   ❌ API endpoint URL incorrect');
      return false;
    }
    
    if (component.includes('error.name === \'AbortError\'')) {
      console.log('   ✅ Abort error handling implemented');
    } else {
      console.log('   ❌ Abort error handling missing');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Error reading frontend component:', error.message);
    return false;
  }
};

// Test local API connection (if backend is running)
const testLocalAPIConnection = async () => {
  console.log('\n5️⃣ Testing local API connection...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      console.log('   ✅ Backend server is responding');
      
      // Test the duplicate check endpoint specifically
      try {
        const testResponse = await fetch('http://localhost:3001/api/', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        const apiInfo = await testResponse.json();
        if (apiInfo.endpoints && apiInfo.endpoints.duplicateCheck) {
          console.log('   ✅ Duplicate check endpoint is registered and accessible');
          return true;
        } else {
          console.log('   ⚠️  Duplicate check endpoint not found in API info');
          return false;
        }
      } catch (endpointError) {
        console.log('   ⚠️  Could not verify endpoint registration');
        return false;
      }
    } else {
      console.log('   ⚠️  Backend server returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('   ⚠️  Backend server is not running or not accessible');
    console.log('   💡 Start with: cd backend && npm run dev');
    return false;
  }
};

// Generate fix recommendations
const generateRecommendations = (results) => {
  console.log('\n📋 Fix Recommendations:');
  console.log('========================');
  
  if (!results.files) {
    console.log('❌ Missing Files: Some required files are missing. Check the file structure.');
  }
  
  if (!results.routes) {
    console.log('❌ Route Registration: Fix route registration in backend/src/routes/index.js');
  }
  
  if (!results.controller) {
    console.log('❌ Controller Issues: Fix controller implementation issues');
    console.log('   - Ensure calculateStringSimilarity function is implemented');
    console.log('   - Verify PrismaClient is properly imported');
    console.log('   - Check response structure');
  }
  
  if (!results.frontend) {
    console.log('❌ Frontend Issues: Fix frontend implementation issues');
    console.log('   - Add aria-describedby to DialogContent');
    console.log('   - Implement proper timeout handling');
    console.log('   - Verify API endpoint URL');
  }
  
  if (!results.api) {
    console.log('⚠️  API Connection: Backend server needs to be running for full testing');
    console.log('   - Start backend: cd backend && npm run dev');
    console.log('   - Test endpoint: npm run test-api in scripts directory');
  }
  
  if (results.files && results.routes && results.controller && results.frontend) {
    console.log('✅ All static checks passed! ');
    console.log('💡 Next steps:');
    console.log('   1. Start backend server: cd backend && npm run dev');
    console.log('   2. Test the duplicate checker in the frontend');
    console.log('   3. Monitor browser console for any remaining issues');
  }
};

// Main verification function
const runVerification = async () => {
  console.log('🚀 Starting comprehensive verification...\n');
  
  const results = {
    files: checkRequiredFiles(),
    routes: checkRouteRegistration(),
    controller: checkControllerImplementation(),
    frontend: checkFrontendImplementation(),
    api: await testLocalAPIConnection()
  };
  
  console.log('\n📊 Verification Results:');
  console.log('========================');
  console.log(`Required Files: ${results.files ? '✅' : '❌'}`);
  console.log(`Route Registration: ${results.routes ? '✅' : '❌'}`);
  console.log(`Controller Implementation: ${results.controller ? '✅' : '❌'}`);
  console.log(`Frontend Implementation: ${results.frontend ? '✅' : '❌'}`);
  console.log(`API Connection: ${results.api ? '✅' : '⚠️'}`);
  
  const staticChecksPass = results.files && results.routes && results.controller && results.frontend;
  
  if (staticChecksPass && results.api) {
    console.log('\n🎉 All verifications passed! Duplicate checker should be working correctly.');
  } else if (staticChecksPass) {
    console.log('\n✅ Static checks passed! Start the backend server to complete verification.');
  } else {
    console.log('\n⚠️  Some verifications failed. See recommendations below.');
  }
  
  generateRecommendations(results);
  
  return staticChecksPass;
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runVerification };
}

// Run if called directly
if (require.main === module) {
  runVerification().catch(console.error);
}