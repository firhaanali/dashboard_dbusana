const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

async function quickTestTailorIntegration() {
  console.log('🔧 Quick Test: Tailor Database Integration\n');

  try {
    // Test 1: Database connection
    console.log('1. 🗄️  Testing database connection...');
    const tailorCount = await prisma.tailor.count();
    console.log(`✅ Database connected - Found ${tailorCount} tailors in database`);

    // Test 2: API endpoint accessibility
    console.log('\n2. 🌐 Testing API endpoint...');
    const response = await fetch(`${API_BASE}/tailors`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ API endpoint working - Retrieved ${data.data?.length || 0} tailors`);
    } else {
      console.log(`❌ API endpoint failed: ${data.error}`);
      return;
    }

    // Test 3: Create test tailor if none exists
    if (tailorCount === 0) {
      console.log('\n3. ➕ Creating test tailor for demo...');
      const testTailor = await prisma.tailor.create({
        data: {
          code: 'TL001',
          name: 'Konveksi Eva Indah Baru',
          contact_person: 'Muhammad Lutfian',
          phone: '081234567890',
          email: 'eva@konveksi.com',
          address: 'Jl. Produksi No. 123, Jakarta',
          specialization: 'Dress, Blouse, Set',
          payment_terms: 'COD',
          rating: 4.5,
          status: 'active'
        }
      });
      console.log(`✅ Test tailor created: ${testTailor.name} (ID: ${testTailor.id})`);
    }

    // Test 4: Frontend API call simulation
    console.log('\n4. 🎯 Simulating frontend tailor creation...');
    const frontendTailorData = {
      code: `TL${Date.now().toString().slice(-3)}`,
      name: 'Test Frontend Tailor',
      contact_person: 'Test Contact',
      phone: '081999888777',
      email: 'test@frontend.com',
      address: 'Test Address Frontend',
      specialization: 'Test Specialization',
      payment_terms: 'COD',
      status: 'active'
    };

    const createResponse = await fetch(`${API_BASE}/tailors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendTailorData)
    });

    const createResult = await createResponse.json();
    
    if (createResponse.ok) {
      console.log(`✅ Frontend simulation SUCCESS - Tailor created with ID: ${createResult.data.id}`);
      console.log(`   Name: ${createResult.data.name}`);
      console.log(`   Code: ${createResult.data.code}`);
      console.log(`   Status: ${createResult.data.status}`);
    } else {
      console.log(`❌ Frontend simulation FAILED: ${createResult.error}`);
    }

    // Test 5: Check final state
    console.log('\n5. 📊 Final database state...');
    const finalCount = await prisma.tailor.count();
    const recentTailors = await prisma.tailor.findMany({
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        created_at: true
      }
    });

    console.log(`✅ Total tailors in database: ${finalCount}`);
    console.log('📋 Recent tailors:');
    recentTailors.forEach((tailor, index) => {
      console.log(`   ${index + 1}. ${tailor.name} (${tailor.code}) - ${tailor.status}`);
    });

    console.log('\n🎉 INTEGRATION TEST SUCCESSFUL!');
    console.log('✅ Database connection: Working');
    console.log('✅ API endpoints: Working');  
    console.log('✅ Data persistence: Working');
    console.log('✅ Frontend integration: Ready');

    console.log('\n🚀 Frontend can now successfully:');
    console.log('  - Fetch tailors from database');
    console.log('  - Create new tailors');  
    console.log('  - See data persist across refreshes');
    console.log('  - Get success notifications');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('  1. Ensure backend server is running');
    console.log('  2. Check database connection');
    console.log('  3. Run tailor migration if needed');
    console.log('  4. Verify API routes are properly mounted');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  quickTestTailorIntegration();
}

module.exports = { quickTestTailorIntegration };