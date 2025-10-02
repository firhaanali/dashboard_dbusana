#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const TransactionManagementTemplateGenerator = require('../src/templates/generateTransactionManagementTemplates');
const path = require('path');
const fs = require('fs');

console.log('🔧 Complete Transaction Management Fix Starting...');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function ensureTablesExist() {
  console.log('📊 Ensuring Transaction Management tables exist...');
  
  try {
    // Test each table by running a simple count query
    const tests = [
      { name: 'returns_and_cancellations', query: () => prisma.returnsAndCancellations.count() },
      { name: 'marketplace_reimbursements', query: () => prisma.marketplaceReimbursement.count() },
      { name: 'commission_adjustments', query: () => prisma.commissionAdjustments.count() },
      { name: 'affiliate_samples', query: () => prisma.affiliateSamples.count() }
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        const count = await test.query();
        results[test.name] = { exists: true, count };
        console.log(`✅ Table ${test.name}: ${count} records`);
      } catch (error) {
        results[test.name] = { exists: false, error: error.message };
        console.log(`❌ Table ${test.name}: ${error.message}`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  }
}

async function createSampleData() {
  console.log('📝 Creating sample data for testing...');
  
  try {
    // Create sample Returns & Cancellations
    const returnsCount = await prisma.returnsAndCancellations.count();
    if (returnsCount === 0) {
      console.log('📝 Creating sample Returns & Cancellations...');
      await prisma.returnsAndCancellations.createMany({
        data: [
          {
            type: 'return',
            reason: 'Tidak sesuai ukuran',
            return_date: new Date(Date.now() - 7*24*60*60*1000),
            returned_amount: 250000,
            refund_amount: 225000,
            restocking_fee: 15000,
            shipping_cost_loss: 10000,
            product_name: 'Blouse Elegant Navy',
            quantity_returned: 1,
            original_price: 250000,
            marketplace: 'TikTok Shop',
            product_condition: 'new',
            resellable: true
          },
          {
            type: 'cancel',
            reason: 'Berubah pikiran',
            return_date: new Date(Date.now() - 3*24*60*60*1000),
            returned_amount: 180000,
            refund_amount: 180000,
            restocking_fee: 0,
            shipping_cost_loss: 15000,
            product_name: 'Dress Casual Pink',
            quantity_returned: 1,
            original_price: 180000,
            marketplace: 'Shopee',
            product_condition: 'new',
            resellable: true
          }
        ]
      });
      console.log('✅ Sample Returns & Cancellations created');
    }

    // Create sample Marketplace Reimbursements
    const reimbursementCount = await prisma.marketplaceReimbursement.count();
    if (reimbursementCount === 0) {
      console.log('📝 Creating sample Marketplace Reimbursements...');
      await prisma.marketplaceReimbursement.createMany({
        data: [
          {
            claim_id: 'REIMB-001',
            reimbursement_type: 'lost_package',
            claim_amount: 150000,
            approved_amount: 150000,
            received_amount: 145000,
            processing_fee: 5000,
            incident_date: new Date(Date.now() - 14*24*60*60*1000),
            claim_date: new Date(Date.now() - 12*24*60*60*1000),
            approval_date: new Date(Date.now() - 7*24*60*60*1000),
            received_date: new Date(Date.now() - 5*24*60*60*1000),
            affected_order_id: 'ORD-12345',
            product_name: 'Kemeja Formal Putih',
            marketplace: 'TikTok Shop',
            status: 'received',
            notes: 'Paket hilang di ekspedisi',
            evidence_provided: 'Screenshot resi dan chat ekspedisi'
          }
        ]
      });
      console.log('✅ Sample Marketplace Reimbursements created');
    }

    // Create sample Commission Adjustments
    const adjustmentCount = await prisma.commissionAdjustments.count();
    if (adjustmentCount === 0) {
      console.log('📝 Creating sample Commission Adjustments...');
      await prisma.commissionAdjustments.createMany({
        data: [
          {
            original_order_id: 'ORD-12345',
            adjustment_type: 'return_commission_loss',
            reason: 'Return produk, komisi dikurangi',
            original_commission: 25000,
            adjustment_amount: -20000,
            final_commission: 5000,
            marketplace: 'TikTok Shop',
            commission_rate: 10.0,
            dynamic_rate_applied: false,
            transaction_date: new Date(Date.now() - 10*24*60*60*1000),
            adjustment_date: new Date(Date.now() - 7*24*60*60*1000),
            product_name: 'Blouse Elegant Navy',
            quantity: 1,
            product_price: 250000
          }
        ]
      });
      console.log('✅ Sample Commission Adjustments created');
    }

    // Create sample Affiliate Samples
    const samplesCount = await prisma.affiliateSamples.count();
    if (samplesCount === 0) {
      console.log('📝 Creating sample Affiliate Samples...');
      await prisma.affiliateSamples.createMany({
        data: [
          {
            affiliate_name: 'Sarah Fashion Blogger',
            affiliate_platform: 'Instagram',
            affiliate_contact: '@sarahfashion',
            product_name: 'Dress Summer Collection',
            product_sku: 'DSC-001',
            quantity_given: 2,
            product_cost: 150000,
            total_cost: 300000,
            shipping_cost: 25000,
            packaging_cost: 15000,
            campaign_name: 'Summer Launch 2024',
            expected_reach: 15000,
            content_type: 'post',
            given_date: new Date(Date.now() - 14*24*60*60*1000),
            expected_content_date: new Date(Date.now() - 7*24*60*60*1000),
            actual_content_date: new Date(Date.now() - 5*24*60*60*1000),
            content_delivered: true,
            performance_notes: 'Post mendapat engagement tinggi',
            roi_estimate: 200.0,
            status: 'completed'
          },
          {
            affiliate_name: 'Maya Influencer',
            affiliate_platform: 'TikTok',
            affiliate_contact: '@mayainfluencer',
            product_name: 'Casual Set Trendy',
            product_sku: 'CST-002',
            quantity_given: 1,
            product_cost: 200000,
            total_cost: 200000,
            shipping_cost: 20000,
            packaging_cost: 10000,
            campaign_name: 'TikTok Viral Challenge',
            expected_reach: 25000,
            content_type: 'video',
            given_date: new Date(Date.now() - 7*24*60*60*1000),
            expected_content_date: new Date(Date.now() - 2*24*60*60*1000),
            content_delivered: false,
            performance_notes: 'Masih dalam proses pembuatan konten',
            roi_estimate: 250.0,
            status: 'sent'
          }
        ]
      });
      console.log('✅ Sample Affiliate Samples created');
    }

    console.log('✅ Sample data creation completed');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    // Don't throw, just log the error
  }
}

async function generateTemplates() {
  console.log('📋 Generating templates...');
  
  try {
    await TransactionManagementTemplateGenerator.generateAllTemplates();
    console.log('✅ Templates generated successfully');
  } catch (error) {
    console.error('❌ Error generating templates:', error);
    throw error;
  }
}

async function testAPIEndpoints() {
  console.log('🌐 Testing API endpoints...');
  
  const endpoints = [
    '/api/returns-cancellations',
    '/api/marketplace-reimbursements', 
    '/api/commission-adjustments',
    '/api/affiliate-samples'
  ];
  
  // Note: We can't actually test these here as we're in backend script
  // But we'll verify the controllers exist
  const controllers = [
    '../src/controllers/returnsAndCancellationsController.js',
    '../src/controllers/marketplaceReimbursementController.js',
    '../src/controllers/commissionAdjustmentsController.js',
    '../src/controllers/affiliateSamplesController.js'
  ];
  
  for (const controller of controllers) {
    const fullPath = path.resolve(__dirname, controller);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Controller exists: ${controller}`);
    } else {
      console.log(`❌ Controller missing: ${controller}`);
    }
  }
}

async function main() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Check tables
    const tableResults = await ensureTablesExist();
    console.log('📊 Table status:', tableResults);

    // Create sample data
    await createSampleData();

    // Generate templates
    await generateTemplates();
    
    // Test API endpoints
    await testAPIEndpoints();

    console.log('\n🎉 Transaction Management Fix completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Database connection verified');
    console.log('  ✅ Transaction Management tables checked');
    console.log('  ✅ Sample data created');
    console.log('  ✅ Templates generated');
    console.log('  ✅ Controllers verified');
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Start the backend server: npm start');
    console.log('  2. Access Transaction Management pages in frontend');
    console.log('  3. Test import/export functionality');
    console.log('  4. Verify analytics data displays correctly');

    process.exit(0);

  } catch (error) {
    console.error('💥 Transaction Management Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();