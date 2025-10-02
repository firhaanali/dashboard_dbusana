#!/usr/bin/env node

const http = require('http');
const moment = require('moment');

console.log('🧪 Testing Dashboard API Endpoints');
console.log('='.repeat(45));

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, error: 'Invalid JSON' });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testAPI() {
  const BASE_URL = 'localhost:3001';
  
  try {
    console.log('🔍 Step 1: Testing basic dashboard metrics...');
    
    const basicOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/dashboard/metrics',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const basicResponse = await makeRequest(basicOptions);
    console.log(`✅ Basic metrics status: ${basicResponse.status}`);
    
    if (basicResponse.status === 200 && basicResponse.data.success) {
      const metrics = basicResponse.data.data;
      console.log('📊 Metrics received:');
      console.log(`   Total Sales: ${metrics.totalSales || 0}`);
      console.log(`   Total Revenue: Rp ${(metrics.totalRevenue || 0).toLocaleString('id-ID')}`);
      console.log(`   Total Advertising Settlement: Rp ${(metrics.totalAdvertisingSettlement || 0).toLocaleString('id-ID')}`);
      console.log(`   Net Profit: Rp ${(metrics.netProfit || 0).toLocaleString('id-ID')}`);
      
      if (metrics.totalAdvertisingSettlement === 0) {
        console.log('⚠️  Advertising settlement is 0 - this is the issue!');
      } else {
        console.log('✅ Advertising settlement has data');
      }
    } else {
      console.log('❌ Basic metrics failed:', basicResponse.data);
    }

    console.log('\n🔍 Step 2: Testing with date range (current month)...');
    
    const currentMonthStart = moment().startOf('month').format('YYYY-MM-DD');
    const currentMonthEnd = moment().endOf('month').format('YYYY-MM-DD');
    
    const monthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/dashboard/metrics?start_date=${currentMonthStart}&end_date=${currentMonthEnd}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const monthResponse = await makeRequest(monthOptions);
    console.log(`✅ Month metrics status: ${monthResponse.status}`);
    console.log(`📅 Date range: ${currentMonthStart} to ${currentMonthEnd}`);
    
    if (monthResponse.status === 200 && monthResponse.data.success) {
      const metrics = monthResponse.data.data;
      console.log('📊 Current Month Metrics:');
      console.log(`   Total Advertising Settlement: Rp ${(metrics.totalAdvertisingSettlement || 0).toLocaleString('id-ID')}`);
      console.log(`   Records found: ${metrics.totalSales || 0}`);
      
      if (metrics.totalAdvertisingSettlement === 0) {
        console.log('⚠️  Current month advertising settlement is 0');
        console.log('💡 Possible causes:');
        console.log('   • No advertising data for current month');
        console.log('   • Date filtering excludes current data');
        console.log('   • Data is in different month/year');
      } else {
        console.log('✅ Current month has advertising data');
      }
    } else {
      console.log('❌ Month metrics failed:', monthResponse.data);
    }

    console.log('\n🔍 Step 3: Testing with last 30 days...');
    
    const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');
    
    const last30Options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/dashboard/metrics?start_date=${thirtyDaysAgo}&end_date=${today}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const last30Response = await makeRequest(last30Options);
    console.log(`✅ Last 30 days status: ${last30Response.status}`);
    console.log(`📅 Date range: ${thirtyDaysAgo} to ${today}`);
    
    if (last30Response.status === 200 && last30Response.data.success) {
      const metrics = last30Response.data.data;
      console.log('📊 Last 30 Days Metrics:');
      console.log(`   Total Advertising Settlement: Rp ${(metrics.totalAdvertisingSettlement || 0).toLocaleString('id-ID')}`);
      
      if (metrics.totalAdvertisingSettlement === 0) {
        console.log('⚠️  Last 30 days advertising settlement is 0');
      } else {
        console.log('✅ Last 30 days has advertising data');
      }
    } else {
      console.log('❌ Last 30 days metrics failed:', last30Response.data);
    }

    console.log('\n🔍 Step 4: Testing advertising endpoint directly...');
    
    const advertisingOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/advertising/settlement',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const advertisingResponse = await makeRequest(advertisingOptions);
    console.log(`✅ Advertising settlement status: ${advertisingResponse.status}`);
    
    if (advertisingResponse.status === 200) {
      console.log('✅ Advertising settlement endpoint is accessible');
      if (advertisingResponse.data.success) {
        console.log('📊 Advertising Settlement Data Available');
      }
    } else {
      console.log('❌ Advertising settlement endpoint failed:', advertisingResponse.data);
    }

    console.log('\n' + '='.repeat(45));
    console.log('🎉 Dashboard API Test Complete!');
    console.log('='.repeat(45));
    
    console.log('\n📝 Summary:');
    console.log('   • Basic API: ' + (basicResponse.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('   • Month Filter: ' + (monthResponse.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('   • Date Range: ' + (last30Response.status === 200 ? '✅ Working' : '❌ Failed'));
    console.log('   • Advertising Endpoint: ' + (advertisingResponse.status === 200 ? '✅ Working' : '❌ Failed'));
    
  } catch (error) {
    console.error('\n💥 API Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure backend is running on port 3001');
    console.log('   • Check: npm run dev in backend directory');
    console.log('   • Verify database connection');
    console.log('   • Check firewall/network settings');
  }
}

async function main() {
  console.log('🚀 Starting API tests...');
  console.log('⏱️  Make sure backend server is running!');
  console.log('💡 Run: cd backend && npm run dev\n');
  
  // Wait a moment for user to see the message
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testAPI();
}

main();