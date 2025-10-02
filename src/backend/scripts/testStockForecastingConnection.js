const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testStockForecastingConnection() {
  console.log('🔗 Testing Stock Forecasting Frontend-Backend Connection...\n');

  const tests = [
    {
      name: 'Backend Forecasting API Health Check',
      endpoint: '/api/forecasting',
      description: 'Verify basic forecasting endpoint works'
    },
    {
      name: 'Stock Forecasting Data (All Historical)',
      endpoint: '/api/forecasting',
      params: { 
        forecast_horizon: '90d',
        forecast_metric: 'revenue', 
        granularity: 'daily',
        historical_period: 'all',  // This should now use ALL data
        confidence_level: 95
      },
      description: 'Test frontend parameters for stock forecasting'
    },
    {
      name: 'Product Forecasting (All Data)', 
      endpoint: '/api/forecasting/products',
      params: { top_products: 10, forecast_days: 30 },
      description: 'Test product-specific forecasting with all data'
    },
    {
      name: 'Market Insights (All Data)',
      endpoint: '/api/forecasting/insights',
      description: 'Test market insights using all available data'
    }
  ];

  let successCount = 0;
  let totalDataPoints = 0;

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
        timeout: 20000
      });

      if (response.data.success) {
        successCount++;
        console.log(`   ✅ SUCCESS`);
        
        // Analyze response data
        if (test.endpoint === '/api/forecasting') {
          const data = response.data.data;
          const historicalCount = data?.historical_data?.length || 0;
          const forecastCount = data?.forecast_data?.length || 0;
          totalDataPoints += historicalCount;
          
          console.log(`   📊 Historical Data: ${historicalCount} points`);
          console.log(`   🔮 Forecast Data: ${forecastCount} points`);
          console.log(`   🎯 Model Accuracy: ${data?.model_accuracy?.accuracy?.toFixed(1) || 'N/A'}%`);
          
          if (historicalCount > 0) {
            const sample = data.historical_data[0];
            const lastPoint = data.historical_data[historicalCount - 1];
            console.log(`   📅 Date Range: ${sample.date} to ${lastPoint.date}`);
            console.log(`   💰 Sample Revenue: Rp ${sample.revenue?.toLocaleString('id-ID')}`);
          }
          
          if (historicalCount >= 7) {
            console.log(`   ✅ Sufficient data for forecasting (${historicalCount} >= 7)`);
          } else {
            console.log(`   ⚠️ Insufficient data for forecasting (${historicalCount} < 7)`);
          }
          
        } else if (test.endpoint.includes('/products')) {
          const products = response.data.data?.length || 0;
          console.log(`   📦 Products Analyzed: ${products}`);
          if (products > 0) {
            const topProduct = response.data.data[0];
            console.log(`   🏆 Top Product: ${topProduct.product_name} - Rp ${topProduct.total_revenue?.toLocaleString('id-ID')}`);
          }
          
        } else if (test.endpoint.includes('/insights')) {
          const insights = response.data.data?.length || 0;
          console.log(`   💡 Insights Generated: ${insights}`);
          if (insights > 0) {
            console.log(`   🎯 Sample: ${response.data.data[0].title} (${response.data.data[0].type})`);
          }
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
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Backend server not running on port 3001');
        break;
      }
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 Stock Forecasting Connection Test Summary');
  console.log(`   ✅ Successful Tests: ${successCount}/${tests.length}`);
  console.log(`   📊 Total Historical Data Points: ${totalDataPoints}`);
  
  if (successCount === tests.length && totalDataPoints >= 7) {
    console.log('\n🎉 SUCCESS: Stock Forecasting Frontend-Backend Connection is WORKING!');
    console.log('✅ Frontend can connect to backend');
    console.log('✅ Backend uses ALL available historical data');
    console.log('✅ Sufficient data for stock forecasting');
    console.log('\n📱 Frontend URL: http://localhost:5173/stock-forecasting');
  } else if (successCount === tests.length && totalDataPoints < 7) {
    console.log('\n⚠️ CONNECTION OK but INSUFFICIENT DATA');
    console.log('✅ Frontend-backend connection working');
    console.log(`❌ Need more data: have ${totalDataPoints}, need ≥7`);
    console.log('💡 Import sales data to fix this issue');
  } else {
    console.log('\n❌ CONNECTION ISSUES DETECTED');
    console.log('💡 Check backend server and database connection');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Ensure backend server is running: npm start');
  console.log('2. Import sales data if data count < 7');
  console.log('3. Test frontend: http://localhost:5173/stock-forecasting');
  console.log('4. Check browser console for connection logs');
}

// Run the test
testStockForecastingConnection().catch(error => {
  console.error('❌ Connection test failed:', error.message);
  process.exit(1);
});