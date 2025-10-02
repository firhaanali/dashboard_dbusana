#!/usr/bin/env node

const http = require('http');

console.log('🧪 Verifying Marketplace Reimbursement Endpoint...\n');

async function testEndpoint(path, expectedContentType = 'application/json') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      timeout: 10000,
      headers: {
        'Accept': expectedContentType === 'application/json' ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'User-Agent': 'DBusana-Test-Client/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        const result = {
          status: res.statusCode,
          headers: res.headers,
          size: data.length,
          contentType: res.headers['content-type'],
          data: data
        };
        
        resolve(result);
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
        timeout: err.code === 'ECONNREFUSED'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'Request timeout',
        timeout: true
      });
    });

    req.end();
  });
}

async function verifyMarketplaceReimbursementEndpoints() {
  console.log('🔍 Testing marketplace reimbursement endpoints...\n');
  
  const endpoints = [
    {
      path: '/api/templates',
      name: 'Templates List',
      expectedContentType: 'application/json',
      description: 'Get all available templates'
    },
    {
      path: '/api/templates/marketplace-reimbursements-template.xlsx',
      name: 'Marketplace Reimbursements Template',
      expectedContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      description: 'Download marketplace reimbursements template'
    },
    {
      path: '/api/marketplace-reimbursements',
      name: 'Marketplace Reimbursements Data',
      expectedContentType: 'application/json',
      description: 'Get marketplace reimbursements data'
    },
    {
      path: '/api/marketplace-reimbursements/analytics',
      name: 'Marketplace Reimbursements Analytics',
      expectedContentType: 'application/json',
      description: 'Get marketplace reimbursements analytics'
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Testing: ${endpoint.name}`);
    console.log(`   📡 ${endpoint.path}`);
    
    const result = await testEndpoint(endpoint.path, endpoint.expectedContentType);
    
    if (result.timeout) {
      console.log('❌ TIMEOUT - Backend server not responding');
      console.log('   💡 Make sure backend server is running: npm start\n');
      results.push({ ...endpoint, status: 'timeout', success: false });
      continue;
    }
    
    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      console.log('   💡 Check if backend server is running on port 5000\n');
      results.push({ ...endpoint, status: 'error', error: result.error, success: false });
      continue;
    }
    
    console.log(`   📊 Status: ${result.status}`);
    console.log(`   📋 Content-Type: ${result.contentType || 'Not set'}`);
    console.log(`   📦 Size: ${result.size} bytes`);
    
    const success = result.status >= 200 && result.status < 300;
    
    if (success) {
      console.log('✅ SUCCESS\n');
      
      // Additional validation for template download
      if (endpoint.path.includes('.xlsx')) {
        if (result.size > 10000) {
          console.log('   ✅ Template size looks good (>10KB)');
        } else {
          console.log(`   ⚠️  Template size suspicious: ${result.size} bytes`);
        }
        
        // Check Excel signature
        if (result.data && result.data.length >= 4) {
          const signature = result.data.toString('hex', 0, 4);
          if (signature === '504b0304') {
            console.log('   ✅ Valid Excel signature detected');
          } else {
            console.log(`   ❌ Invalid Excel signature: ${signature}`);
          }
        }
        console.log('');
      }
      
      results.push({ ...endpoint, status: result.status, size: result.size, success: true });
      
    } else {
      console.log(`❌ FAILED (Status: ${result.status})\n`);
      results.push({ ...endpoint, status: result.status, success: false });
    }
  }
  
  return results;
}

async function runVerification() {
  try {
    console.log('🚀 Starting Marketplace Reimbursement Endpoint Verification...\n');
    
    const results = await verifyMarketplaceReimbursementEndpoints();
    
    console.log('📊 Verification Summary:');
    console.log('========================');
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const statusInfo = result.status === 'timeout' ? 'TIMEOUT' : 
                        result.status === 'error' ? 'ERROR' : 
                        `${result.status}`;
      
      console.log(`${status} ${result.name}: ${statusInfo}`);
      
      if (result.size) {
        console.log(`   📦 Size: ${result.size} bytes`);
      }
    });
    
    console.log(`\n📈 Success Rate: ${successful}/${total} (${Math.round((successful/total)*100)}%)`);
    
    if (successful === total) {
      console.log('\n🎉 All marketplace reimbursement endpoints are working!');
      console.log('\n📋 Ready for use:');
      console.log('   • Templates can be downloaded');
      console.log('   • Data endpoints are accessible');
      console.log('   • Analytics are available');
      
    } else {
      console.log('\n⚠️  Some endpoints have issues:');
      
      const failed = results.filter(r => !r.success);
      failed.forEach(f => {
        console.log(`   ❌ ${f.name}: ${f.status}`);
      });
      
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Make sure backend server is running: npm start');
      console.log('2. Check if port 5000 is available');
      console.log('3. Verify database connection');
      console.log('4. Run template fix: node scripts/quickFixRobustTemplates.js');
    }
    
    return successful === total;
    
  } catch (error) {
    console.error('\n💥 Verification failed:', error);
    return false;
  }
}

runVerification()
  .then((success) => {
    if (success) {
      console.log('\n✅ Verification completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Verification had issues - check troubleshooting steps above');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });