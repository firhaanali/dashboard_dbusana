#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🌐 Testing Transaction Management Template API Endpoints...\n');

const API_BASE = 'http://localhost:5000/api';

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = '';
      
      response.on('data', chunk => {
        body += chunk;
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: body,
          size: Buffer.byteLength(body)
        });
      });
      
      response.on('error', reject);
    });
    
    request.setTimeout(timeout, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.on('error', reject);
  });
}

async function testEndpoints() {
  try {
    console.log('🔍 Testing backend server availability...');
    
    // Test if server is running
    try {
      const response = await makeRequest(`${API_BASE}/templates`);
      
      if (response.statusCode === 200) {
        console.log('✅ Backend server is running and responding');
        console.log(`   📊 Response size: ${response.size} bytes`);
        
        try {
          const data = JSON.parse(response.body);
          console.log(`   📋 Found ${data.data?.total || 0} templates available`);
        } catch (parseError) {
          console.log('   ⚠️  Response is not JSON (might be HTML error page)');
        }
      } else {
        console.log(`⚠️  Server responded with status: ${response.statusCode}`);
      }
      
    } catch (error) {
      console.error('❌ Backend server is not responding:', error.message);
      console.log('   Please make sure the backend server is running: cd backend && npm start');
      return;
    }
    
    console.log('\n📥 Testing template download endpoints...\n');
    
    const templates = [
      {
        name: 'Returns & Cancellations',
        endpoint: '/templates/returns-cancellations-template.xlsx',
        expectedContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      {
        name: 'Marketplace Reimbursements', 
        endpoint: '/templates/marketplace-reimbursements-template.xlsx',
        expectedContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      {
        name: 'Commission Adjustments',
        endpoint: '/templates/commission-adjustments-template.xlsx',
        expectedContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      {
        name: 'Affiliate Samples',
        endpoint: '/templates/affiliate-samples-template.xlsx',
        expectedContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ];
    
    for (const template of templates) {
      console.log(`Testing ${template.name}...`);
      
      try {
        const response = await makeRequest(`${API_BASE}${template.endpoint}`, 15000);
        
        if (response.statusCode === 200) {
          // Check content type
          const contentType = response.headers['content-type'];
          const isExcelFile = contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          
          if (isExcelFile) {
            console.log(`✅ ${template.name} - Downloaded successfully`);
            console.log(`   📊 File size: ${response.size} bytes`);
            console.log(`   📄 Content-Type: ${contentType}`);
            
            // Check if it's a valid Excel file by looking at the first few bytes
            const isValidExcel = response.body.startsWith('PK'); // Excel files are ZIP archives
            if (isValidExcel) {
              console.log('   ✅ File appears to be a valid Excel file');
            } else {
              console.log('   ⚠️  File may be corrupted (doesn\'t start with Excel signature)');
            }
            
          } else {
            console.log(`❌ ${template.name} - Wrong content type: ${contentType}`);
            console.log(`   Expected: ${template.expectedContentType}`);
            
            // If it's JSON, it might be an error response
            try {
              const errorData = JSON.parse(response.body);
              console.log(`   Error details: ${errorData.error || 'Unknown error'}`);
            } catch (parseError) {
              console.log(`   Response body preview: ${response.body.substring(0, 200)}...`);
            }
          }
          
        } else {
          console.log(`❌ ${template.name} - HTTP ${response.statusCode}`);
          
          try {
            const errorData = JSON.parse(response.body);
            console.log(`   Error: ${errorData.error || 'Unknown error'}`);
            if (errorData.details) {
              console.log(`   Details: ${errorData.details}`);
            }
          } catch (parseError) {
            console.log(`   Response: ${response.body.substring(0, 200)}...`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${template.name} - Request failed: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('🎉 Endpoint testing completed!');
    
  } catch (error) {
    console.error('💥 Endpoint testing failed:', error);
    process.exit(1);
  }
}

// Run the test
testEndpoints()
  .then(() => {
    console.log('\n✅ All endpoint tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Endpoint testing failed:', error);
    process.exit(1);
  });