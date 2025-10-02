const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testAdvertisingSettlementFix() {
  console.log('🧪 Testing Advertising Settlement API Fix...\n');

  const tests = [
    {
      name: 'Advertising Settlement Analytics',
      endpoint: '/api/advertising/settlement',
      description: 'Test fixed Prisma aggregate query with order_id instead of id'
    },
    {
      name: 'Advertising Settlement Analytics with Filters',
      endpoint: '/api/advertising/settlement',
      params: { 
        account_name: 'all',
        marketplace: 'all'
      },
      description: 'Test with filter parameters'
    },
    {
      name: 'Advertising Settlement Legacy Endpoint',
      endpoint: '/api/advertising/settlement/analytics',
      description: 'Test legacy endpoint still works'
    }
  ];

  let successCount = 0;

  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}`);
      console.log(`   Description: ${test.description}`);
      console.log(`   Endpoint: ${test.endpoint}`);
      if (test.params) {
        console.log(`   Parameters:`, test.params);
      }
      
      const queryParams = new URLSearchParams(test.params || {}).toString();
      const url = `${BACKEND_URL}${test.endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await axios.get(url, {
        headers: {
          'x-development-only': 'true'
        },
        timeout: 10000
      });

      if (response.data.success) {
        successCount++;
        console.log(`   ✅ SUCCESS`);
        
        const data = response.data.data;
        if (data.overview) {
          console.log(`   💰 Total Settlement Amount: Rp ${data.overview.totalSettlementAmount?.toLocaleString('id-ID')}`);
          console.log(`   📊 Total Settlement Orders: ${data.overview.totalSettlementOrders}`);
          console.log(`   📈 Average Settlement Amount: Rp ${data.overview.averageSettlementAmount?.toLocaleString('id-ID')}`);
        }
        
        if (data.accountPerformance?.length > 0) {
          console.log(`   🏢 Top Account: ${data.accountPerformance[0].account_name} - Rp ${data.accountPerformance[0]._sum.settlement_amount?.toLocaleString('id-ID')}`);
        }
        
        if (data.marketplacePerformance?.length > 0) {
          console.log(`   🛒 Top Marketplace: ${data.marketplacePerformance[0].marketplace} - Rp ${data.marketplacePerformance[0]._sum.settlement_amount?.toLocaleString('id-ID')}`);
        }
        
      } else {
        console.log(`   ❌ FAILED: ${response.data.error || 'Unknown error'}`);
        if (response.data.details) {
          console.log(`   💡 Details: ${response.data.details}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      
      if (error.response?.data) {
        console.log(`   📄 Error Response:`, error.response.data);
        
        // Check if it's the specific Prisma error we're fixing
        if (error.response.data.details?.includes('advertisingSettlement.aggregate')) {
          console.log(`   🔧 This appears to be the Prisma aggregate error we're fixing`);
        }
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Backend server not running on port 3001');
        break;
      }
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 Advertising Settlement Fix Test Summary');
  console.log(`   ✅ Successful Tests: ${successCount}/${tests.length}`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 SUCCESS: Advertising Settlement API Fix is WORKING!');
    console.log('✅ Fixed: prisma.advertisingSettlement.aggregate() uses order_id instead of id');
    console.log('✅ Fixed: _count queries use correct primary key field');
    console.log('✅ Fixed: groupBy queries use correct count field');
    console.log('\n📱 Frontend should now load advertising settlement data without 500 errors');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('💡 Check backend logs for more details');
    console.log('💡 Ensure advertising_settlement table exists with order_id as primary key');
  }
  
  console.log('\n🔧 What was fixed:');
  console.log('   - Changed _count: { id: true } to _count: { order_id: true }');
  console.log('   - Updated all aggregate and groupBy queries in advertisingController.js');
  console.log('   - Maintained correct usage in dashboardController.js and monthlyTrendController.js');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Restart backend server if not already restarted');
  console.log('2. Test frontend advertising dashboard');
  console.log('3. Verify settlement analytics display properly');
  console.log('4. Check that 500 errors are resolved');
}

// Run the test
testAdvertisingSettlementFix().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});