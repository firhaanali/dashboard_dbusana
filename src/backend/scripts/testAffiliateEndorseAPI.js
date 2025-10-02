const fetch = require('node-fetch');

const testAffiliateEndorseAPI = async () => {
  console.log('🧪 Testing Affiliate Endorse API...');
  
  try {
    // Test GET endpoint first
    console.log('📡 Testing GET /api/affiliate-endorse...');
    const getResponse = await fetch('http://localhost:3001/api/affiliate-endorse');
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ GET request successful:', {
        success: getResult.success,
        count: getResult.data?.endorsements?.length || 0
      });
    } else {
      console.log('❌ GET request failed:', getResponse.status);
    }

    // Test POST endpoint with sample data
    console.log('📡 Testing POST /api/affiliate-endorse...');
    
    const testData = {
      campaign_name: 'Test Campaign API',
      affiliate_name: 'Test Influencer',
      affiliate_type: 'Micro Influencer (1K-100K)',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      endorse_fee: 500000,
      target_sales: 1000000,
      actual_sales: 1200000,
      payment_method: 'Bank Transfer',
      platform: ['TikTok Shop', 'Shopee'],
      content_type: 'Product Review',
      followers: 50000,
      engagement: 3.5,
      reference: 'Test Reference',
      notes: 'Test Notes',
      status: 'active',
      product_sales: [
        {
          productName: 'Test Product 1',
          quantity: 10,
          unitPrice: 50000,
          totalSales: 500000,
          commission: 50000,
          commissionAmount: 50000
        },
        {
          productName: 'Test Product 2',
          quantity: 5,
          unitPrice: 100000,
          totalSales: 500000,
          commission: 75000,
          commissionAmount: 75000
        }
      ],
      total_commission: 125000,
      roi: 140,
      created_by: 'test-script'
    };

    console.log('📤 Sending test data:', {
      campaign_name: testData.campaign_name,
      affiliate_name: testData.affiliate_name,
      product_sales_count: testData.product_sales.length
    });

    const postResponse = await fetch('http://localhost:3001/api/affiliate-endorse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 POST Response status:', postResponse.status);

    if (postResponse.ok) {
      const postResult = await postResponse.json();
      console.log('✅ POST request successful:', {
        success: postResult.success,
        id: postResult.data?.id,
        message: postResult.message
      });
    } else {
      const errorResult = await postResponse.json();
      console.log('❌ POST request failed:', {
        status: postResponse.status,
        error: errorResult.error,
        details: errorResult.details
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run test
testAffiliateEndorseAPI();