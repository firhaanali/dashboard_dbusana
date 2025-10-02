#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

console.log('🔧 Setting up Transaction Management tables and data...');

async function setupTransactionManagement() {
  try {
    console.log('📊 Checking and creating Transaction Management tables...');

    // Check if tables exist
    const tablesExist = await Promise.all([
      checkTableExists('returns_and_cancellations'),
      checkTableExists('marketplace_reimbursements'),
      checkTableExists('commission_adjustments'),
      checkTableExists('affiliate_samples')
    ]);

    console.log('📋 Table existence check:', {
      returns_and_cancellations: tablesExist[0],
      marketplace_reimbursements: tablesExist[1],
      commission_adjustments: tablesExist[2],
      affiliate_samples: tablesExist[3]
    });

    // If any tables are missing, run migrations
    if (tablesExist.some(exists => !exists)) {
      console.log('⚠️ Some Transaction Management tables are missing. Running migrations...');
      
      // Run Prisma push to create missing tables
      const { spawn } = require('child_process');
      const npmCmdWin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      
      await new Promise((resolve, reject) => {
        const child = spawn(npmCmdWin, ['prisma', 'db', 'push'], {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Prisma db push completed successfully');
            resolve();
          } else {
            console.error('❌ Prisma db push failed with code:', code);
            reject(new Error(`Migration failed with code ${code}`));
          }
        });
      });
    }

    // Verify tables after migration
    console.log('🔍 Verifying Transaction Management tables...');
    
    const counts = await Promise.all([
      prisma.returnsAndCancellations.count().catch(() => 0),
      prisma.marketplaceReimbursement.count().catch(() => 0),
      prisma.commissionAdjustments.count().catch(() => 0),
      prisma.affiliateSamples.count().catch(() => 0)
    ]);

    console.log('📊 Transaction Management table record counts:', {
      returns_and_cancellations: counts[0],
      marketplace_reimbursements: counts[1],
      commission_adjustments: counts[2],
      affiliate_samples: counts[3]
    });

    // Create sample data if tables are empty
    await createSampleDataIfNeeded(counts);

    console.log('✅ Transaction Management setup completed successfully!');
    
    return true;

  } catch (error) {
    console.error('❌ Error setting up Transaction Management:', error);
    throw error;
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `;
    return result[0].exists;
  } catch (error) {
    console.log(`⚠️ Could not check if table ${tableName} exists:`, error.message);
    return false;
  }
}

async function createSampleDataIfNeeded(counts) {
  try {
    // Create sample Returns & Cancellations if table is empty
    if (counts[0] === 0) {
      console.log('📝 Creating sample Returns & Cancellations data...');
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
      console.log('✅ Sample Returns & Cancellations data created');
    }

    // Create sample Marketplace Reimbursements if table is empty
    if (counts[1] === 0) {
      console.log('📝 Creating sample Marketplace Reimbursements data...');
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
          },
          {
            claim_id: 'REIMB-002',
            reimbursement_type: 'platform_error',
            claim_amount: 75000,
            approved_amount: 75000,
            received_amount: 0,
            processing_fee: 0,
            incident_date: new Date(Date.now() - 5*24*60*60*1000),
            claim_date: new Date(Date.now() - 3*24*60*60*1000),
            affected_order_id: 'ORD-67890',
            product_name: 'Rok Midi Hitam',
            marketplace: 'Shopee',
            status: 'approved',
            notes: 'Error sistem marketplace',
            evidence_provided: 'Screenshot error page'
          }
        ]
      });
      console.log('✅ Sample Marketplace Reimbursements data created');
    }

    // Create sample Commission Adjustments if table is empty
    if (counts[2] === 0) {
      console.log('📝 Creating sample Commission Adjustments data...');
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
          },
          {
            original_order_id: 'ORD-67890',
            adjustment_type: 'dynamic_commission',
            reason: 'Dynamic commission rate applied',
            original_commission: 18000,
            adjustment_amount: -3000,
            final_commission: 15000,
            marketplace: 'Shopee',
            commission_rate: 8.5,
            dynamic_rate_applied: true,
            transaction_date: new Date(Date.now() - 5*24*60*60*1000),
            adjustment_date: new Date(Date.now() - 3*24*60*60*1000),
            product_name: 'Rok Midi Hitam',
            quantity: 1,
            product_price: 180000
          }
        ]
      });
      console.log('✅ Sample Commission Adjustments data created');
    }

    // Create sample Affiliate Samples if table is empty
    if (counts[3] === 0) {
      console.log('📝 Creating sample Affiliate Samples data...');
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
      console.log('✅ Sample Affiliate Samples data created');
    }

  } catch (error) {
    console.log('⚠️ Could not create sample data:', error.message);
    // Don't throw error here, just log it
  }
}

// Run the setup
setupTransactionManagement()
  .then(() => {
    console.log('🎉 Transaction Management setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Transaction Management setup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });