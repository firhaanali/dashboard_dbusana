#!/usr/bin/env node

/**
 * Test Script untuk Duplicate Checker API
 * Mengecek apakah endpoint /api/import/check-duplicates bekerja dengan benar
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing D\'Busana Duplicate Checker API');
console.log('==========================================\n');

// Test backend server availability
const testBackendConnection = async () => {
  console.log('1️⃣ Testing backend server connection...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      const health = await response.json();
      console.log('   ✅ Backend server is running');
      console.log('   📊 Server status:', health.status);
      console.log('   🚀 Environment:', health.environment);
      return true;
    } else {
      console.log('   ❌ Backend server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Backend server is not running or not accessible');
    console.log('   🔍 Error:', error.message);
    console.log('\n💡 Start backend server with: cd backend && npm run dev');
    return false;
  }
};

// Test duplicate checker endpoint
const testDuplicateChecker = async () => {
  console.log('\n2️⃣ Testing duplicate checker endpoint...');
  
  try {
    // Create a simple test file buffer
    const testFileContent = 'Order ID,Date,Customer,Amount\n1,2024-01-01,Test Customer,100000';
    const testFile = Buffer.from(testFileContent, 'utf-8');
    
    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', testFile, {
      filename: 'test-sales-import.csv',
      contentType: 'text/csv'
    });
    formData.append('importType', 'sales');
    
    const response = await fetch('http://localhost:3001/api/import/check-duplicates', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Duplicate checker endpoint is working');
      console.log('   📋 Response data:');
      console.log('      - Success:', result.success);
      console.log('      - Is Duplicate:', result.data?.isDuplicate || false);
      console.log('      - Risk Level:', result.data?.riskLevel || 'unknown');
      console.log('      - Previous Imports:', result.data?.previousImports?.length || 0);
      console.log('      - Warnings:', result.data?.warnings?.length || 0);
      console.log('      - Recommendations:', result.data?.recommendations?.length || 0);
      return true;
    } else {
      console.log('   ❌ Duplicate checker endpoint failed');
      console.log('   📋 Error response:', result);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error testing duplicate checker:', error.message);
    return false;
  }
};

// Test API routes registration
const testApiRoutes = async () => {
  console.log('\n3️⃣ Testing API routes registration...');
  
  try {
    const response = await fetch('http://localhost:3001/api/');
    const apiInfo = await response.json();
    
    if (apiInfo.endpoints && apiInfo.endpoints.duplicateCheck) {
      console.log('   ✅ Duplicate check endpoint is registered');
      console.log('   📍 Endpoint path:', apiInfo.endpoints.duplicateCheck);
    } else {
      console.log('   ❌ Duplicate check endpoint is not registered in API routes');
    }
    
    return response.ok;
  } catch (error) {
    console.log('   ❌ Error checking API routes:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting comprehensive test...\n');
  
  const backendOk = await testBackendConnection();
  if (!backendOk) {
    console.log('\n❌ Cannot proceed with tests - backend server is not running');
    process.exit(1);
  }
  
  const routesOk = await testApiRoutes();
  const duplicateCheckerOk = await testDuplicateChecker();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Backend Server: ${backendOk ? '✅' : '❌'}`);
  console.log(`API Routes: ${routesOk ? '✅' : '❌'}`);
  console.log(`Duplicate Checker: ${duplicateCheckerOk ? '✅' : '❌'}`);
  
  if (backendOk && routesOk && duplicateCheckerOk) {
    console.log('\n🎉 All tests passed! Duplicate checker is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    
    if (!duplicateCheckerOk) {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Make sure the backend server is running: cd backend && npm run dev');
      console.log('2. Check if duplicate check routes are properly mounted in server.js');
      console.log('3. Verify database connection and Prisma client initialization');
      console.log('4. Check for missing dependencies or controller errors');
    }
  }
};

// Run the tests
runTests().catch(console.error);