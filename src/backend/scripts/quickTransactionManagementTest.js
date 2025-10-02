#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

console.log('🔍 Quick Transaction Management Test');
console.log('='.repeat(50));

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function testDatabaseTables() {
  try {
    console.log('📊 Testing database tables...');
    
    // Test each table
    const tests = [
      { name: 'returns_and_cancellations', query: () => prisma.returnsAndCancellations.count() },
      { name: 'marketplace_reimbursements', query: () => prisma.marketplaceReimbursement.count() },
      { name: 'commission_adjustments', query: () => prisma.commissionAdjustments.count() },
      { name: 'affiliate_samples', query: () => prisma.affiliateSamples.count() }
    ];

    for (const test of tests) {
      try {
        const count = await test.query();
        console.log(`✅ ${test.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

async function testApiEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  
  const fs = require('fs');
  const path = require('path');
  
  const controllers = [
    { name: 'returnsAndCancellationsController.js', endpoint: '/api/returns-cancellations' },
    { name: 'marketplaceReimbursementController.js', endpoint: '/api/marketplace-reimbursements' },
    { name: 'commissionAdjustmentsController.js', endpoint: '/api/commission-adjustments' },
    { name: 'affiliateSamplesController.js', endpoint: '/api/affiliate-samples' }
  ];
  
  for (const controller of controllers) {
    const controllerPath = path.join(__dirname, '../src/controllers', controller.name);
    if (fs.existsSync(controllerPath)) {
      console.log(`✅ Controller exists: ${controller.name} → ${controller.endpoint}`);
    } else {
      console.log(`❌ Controller missing: ${controller.name}`);
    }
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    await testDatabaseTables();
    await testApiEndpoints();
    
    console.log('\n🎉 Transaction Management Test Completed!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Start backend server: cd backend && npm start');
    console.log('  2. Start frontend: npm run dev');
    console.log('  3. Navigate to Transaction Management pages');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();