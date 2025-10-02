#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

console.log('📊 Creating Sample Advertising Settlement Data');
console.log('='.repeat(50));

async function createSampleData() {
  try {
    // Check if data already exists
    const existingCount = await prisma.advertisingSettlement.count();
    
    if (existingCount > 0) {
      console.log(`✅ Found ${existingCount} existing advertising settlement records`);
      console.log('ℹ️ Skipping sample data creation');
      return;
    }
    
    console.log('📝 Creating sample advertising settlement data...');
    
    // Create sample data for the last 3 months
    const sampleData = [];
    const today = moment();
    
    // Generate data for last 3 months
    for (let month = 0; month < 3; month++) {
      const monthStart = today.clone().subtract(month, 'months').startOf('month');
      const monthEnd = monthStart.clone().endOf('month');
      
      // Generate 5-10 records per month
      const recordsThisMonth = 5 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < recordsThisMonth; i++) {
        const randomDay = monthStart.clone().add(Math.floor(Math.random() * monthStart.daysInMonth()), 'days');
        
        sampleData.push({
          order_id: `ADV-${monthStart.format('YYYYMM')}-${String(i + 1).padStart(3, '0')}`,
          type: Math.random() > 0.8 ? 'Tax' : 'Ad Spend',
          order_created_time: randomDay.clone().subtract(1, 'day').toDate(),
          order_settled_time: randomDay.toDate(),
          settlement_amount: Math.floor(Math.random() * 2000000) + 100000, // 100k - 2.1M IDR
          account_name: ['TikTok Ads', 'Facebook Ads', 'Google Ads', 'Instagram Ads'][Math.floor(Math.random() * 4)],
          marketplace: ['TikTok Shop', 'Instagram', 'Facebook', 'Google'][Math.floor(Math.random() * 4)],
          currency: 'IDR'
        });
      }
    }
    
    console.log(`📊 Generated ${sampleData.length} sample records`);
    
    // Insert data in batches
    const batchSize = 10;
    let inserted = 0;
    
    for (let i = 0; i < sampleData.length; i += batchSize) {
      const batch = sampleData.slice(i, i + batchSize);
      
      try {
        await prisma.advertisingSettlement.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += batch.length;
        console.log(`✅ Inserted batch ${Math.ceil((i + 1) / batchSize)} (${inserted}/${sampleData.length} records)`);
      } catch (batchError) {
        console.error(`❌ Error inserting batch:`, batchError.message);
      }
    }
    
    console.log(`\n✅ Sample data creation complete!`);
    console.log(`📊 Total records inserted: ${inserted}`);
    
    // Verify the data
    const verification = await prisma.advertisingSettlement.aggregate({
      _sum: { settlement_amount: true },
      _count: { _all: true }
    });
    
    const totalAmount = verification._sum.settlement_amount || 0;
    console.log(`💰 Total settlement amount: Rp ${totalAmount.toLocaleString('id-ID')}`);
    console.log(`📈 Total records: ${verification._count._all}`);
    
    // Show monthly breakdown
    const monthlyBreakdown = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', order_settled_time) as month,
        COUNT(*) as count,
        SUM(settlement_amount) as total_amount
      FROM advertising_settlement 
      GROUP BY DATE_TRUNC('month', order_settled_time)
      ORDER BY month DESC
    `;
    
    console.log('\n📊 Monthly breakdown:');
    monthlyBreakdown.forEach(row => {
      const month = moment(row.month).format('MMMM YYYY');
      const amount = Number(row.total_amount) || 0;
      console.log(`   ${month}: Rp ${amount.toLocaleString('id-ID')} (${row.count} records)`);
    });
    
    console.log('\n🎉 Ready to test KPI dashboard!');
    console.log('📝 Next steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Refresh frontend dashboard');
    console.log('   3. Check "Total Biaya Iklan" KPI');
    
  } catch (error) {
    console.error('💥 Error creating sample data:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check database connection');
    console.log('   • Run: npx prisma db push');
    console.log('   • Verify advertising_settlement table exists');
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();