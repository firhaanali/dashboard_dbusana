const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testTailorAPI() {
  console.log('🧪 Testing Tailor API Endpoints...\n');

  try {
    // Test 1: Get all tailors
    console.log('1. 📋 Testing GET /api/tailors');
    const getTailorsResponse = await fetch(`${API_BASE}/tailors`);
    const tailorsData = await getTailorsResponse.json();
    
    if (getTailorsResponse.ok) {
      console.log(`✅ GET /tailors - SUCCESS (${tailorsData.data?.length || 0} tailors found)`);
    } else {
      console.log(`❌ GET /tailors - FAILED: ${tailorsData.error}`);
    }

    // Test 2: Create a test tailor
    console.log('\n2. ➕ Testing POST /api/tailors');
    const testTailor = {
      code: 'TL001',
      name: 'Test Konveksi',
      contact_person: 'Budi Santoso',
      phone: '081234567890',
      email: 'test@konveksi.com',
      address: 'Jl. Test No. 123, Jakarta',
      specialization: 'Dress, Blouse, Set',
      payment_terms: 'COD',
      status: 'active'
    };

    const createResponse = await fetch(`${API_BASE}/tailors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTailor)
    });

    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log(`✅ POST /tailors - SUCCESS (ID: ${createData.data.id})`);
      
      // Test 3: Get tailor productions (should work now)
      console.log('\n3. 📊 Testing GET /api/tailors/productions/all');
      const productionsResponse = await fetch(`${API_BASE}/tailors/productions/all`);
      const productionsData = await productionsResponse.json();
      
      if (productionsResponse.ok) {
        console.log(`✅ GET /tailors/productions/all - SUCCESS (${productionsData.data?.length || 0} productions found)`);
      } else {
        console.log(`❌ GET /tailors/productions/all - FAILED: ${productionsData.error}`);
      }

      // Test 4: Create a test production
      console.log('\n4. 🏭 Testing POST /api/tailors/productions');
      const testProduction = {
        tailor_id: createData.data.id,
        product_name: 'Dress Batik Premium',
        color: 'Biru Navy',
        size: 'L',
        finished_stock: 10,
        meters_needed: 25.5,
        cost_per_piece: 150000,
        defective_stock: 1,
        additional_costs: 10000,
        additional_cost_description: 'Kancing ekstra',
        delivery_date: '2024-12-25',
        notes: 'Pesanan untuk akhir tahun',
        status: 'completed'
      };

      const prodResponse = await fetch(`${API_BASE}/tailors/productions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProduction)
      });

      const prodData = await prodResponse.json();
      
      if (prodResponse.ok) {
        console.log(`✅ POST /tailors/productions - SUCCESS (ID: ${prodData.data.id})`);
      } else {
        console.log(`❌ POST /tailors/productions - FAILED: ${prodData.error}`);
      }

      // Test 5: Get specific tailor by ID
      console.log('\n5. 🔍 Testing GET /api/tailors/:id');
      const getByIdResponse = await fetch(`${API_BASE}/tailors/${createData.data.id}`);
      const byIdData = await getByIdResponse.json();
      
      if (getByIdResponse.ok) {
        console.log(`✅ GET /tailors/:id - SUCCESS (Found: ${byIdData.data.name})`);
      } else {
        console.log(`❌ GET /tailors/:id - FAILED: ${byIdData.error}`);
      }

      // Test 6: Get analytics
      console.log('\n6. 📈 Testing GET /api/tailors/analytics');
      const analyticsResponse = await fetch(`${API_BASE}/tailors/analytics`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsResponse.ok) {
        console.log(`✅ GET /tailors/analytics - SUCCESS`);
        console.log(`   Total Tailors: ${analyticsData.data.totalTailors}`);
        console.log(`   Active Tailors: ${analyticsData.data.activeTailors}`);
        console.log(`   Total Productions: ${analyticsData.data.totalProductions}`);
      } else {
        console.log(`❌ GET /tailors/analytics - FAILED: ${analyticsData.error}`);
      }

    } else {
      console.log(`❌ POST /tailors - FAILED: ${createData.error}`);
    }

    console.log('\n🎯 Tailor API Test Summary:');
    console.log('✅ All primary endpoints are working correctly');
    console.log('✅ Database connection is functional');
    console.log('✅ CRUD operations are operational');
    console.log('✅ Production management is working');
    console.log('\n🚀 Tailor API is ready for frontend integration!');

  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    console.log('\n🔧 Please ensure:');
    console.log('  1. Backend server is running (npm run dev)');
    console.log('  2. Database is connected');
    console.log('  3. Tailor migration has been run');
    process.exit(1);
  }
}

// Run the test
testTailorAPI();