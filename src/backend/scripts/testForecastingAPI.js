const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testForecastingAPI() {
  console.log('🧪 Testing Forecasting API...\n');

  const forecastingTests = [
    {
      name: 'Basic Forecasting Data',
      endpoint: '/api/forecasting',
      params: {}
    },
    {
      name: 'Stock Levels Forecast (90 days)',
      endpoint: '/api/forecasting',
      params: { 
        forecast_horizon: '90d',
        forecast_metric: 'revenue',
        granularity: 'daily',
        historical_period: '365d',
        confidence_level: 95
      }
    },
    {
      name: 'Product-Specific Forecasting',
      endpoint: '/api/forecasting/products',
      params: { top_products: 10, forecast_days: 30 }
    },
    {
      name: 'Market Insights',
      endpoint: '/api/forecasting/insights',
      params: {}
    }
  ];

  for (const test of forecastingTests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`   Endpoint: ${test.endpoint}`);
      console.log(`   Params:`, test.params);
      
      const queryParams = new URLSearchParams(test.params).toString();
      const url = `${BACKEND_URL}${test.endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await axios.get(url, {
        headers: {
          'x-development-only': 'true'
        },
        timeout: 15000
      });

      if (response.data.success) {
        console.log(`   ✅ SUCCESS`);
        
        // Log specific data structure based on endpoint
        if (test.endpoint.includes('/products')) {
          console.log(`   📦 Products: ${response.data.data?.length || 0}`);
          if (response.data.data?.[0]) {
            const sample = response.data.data[0];
            console.log(`   📊 Sample: ${sample.product_name} - Rp ${sample.total_revenue?.toLocaleString('id-ID')}`);
          }
        } else if (test.endpoint.includes('/insights')) {
          console.log(`   💡 Insights: ${response.data.data?.length || 0}`);
          if (response.data.data?.[0]) {
            console.log(`   🎯 Sample: ${response.data.data[0].title} (${response.data.data[0].type})`);
          }
        } else {
          // Main forecasting endpoint
          const data = response.data.data;
          console.log(`   📈 Historical: ${data?.historical_data?.length || 0} points`);
          console.log(`   🔮 Forecast: ${data?.forecast_data?.length || 0} points`);
          console.log(`   🎯 Accuracy: ${data?.model_accuracy?.accuracy?.toFixed(1) || 'N/A'}%`);
          console.log(`   🏆 Best Model: ${data?.models?.[0]?.name || 'N/A'}`);
          
          if (data?.historical_data?.length > 0) {
            const sample = data.historical_data[0];
            console.log(`   📊 Sample Data: ${sample.date} - Revenue: Rp ${sample.revenue?.toLocaleString('id-ID')} - Orders: ${sample.orders}`);
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
        console.log(`   📄 Response:`, error.response.data);
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Make sure backend server is running on port 3001');
        break;
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 Forecasting API Test Complete');
  console.log('\n💡 If you see "Insufficient data for forecasting. Need at least 7 data points":');
  console.log('   1. Make sure you have imported sales data');
  console.log('   2. Check if sales data spans at least 7 different days');
  console.log('   3. Verify created_time field is properly set in sales_data table');
}

// Run the test
testForecastingAPI().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});