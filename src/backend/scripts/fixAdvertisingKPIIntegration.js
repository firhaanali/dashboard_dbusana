#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Advertising KPI Integration');
console.log('='.repeat(50));

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📊 Step 1: Testing advertising settlement data...');
    
    // Check if we have advertising settlement data
    const totalRecords = await prisma.advertisingSettlement.count();
    const sampleData = await prisma.advertisingSettlement.findFirst({
      orderBy: {
        order_settled_time: 'desc'
      }
    });
    
    console.log(`✅ Total advertising settlement records: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('⚠️  No advertising settlement data found!');
      console.log('💡 Please import advertising settlement data first');
      
      // Show sample import structure
      console.log('\n📋 Expected import structure:');
      console.log('order_id, type, order_created_time, order_settled_time, settlement_amount, account_name, marketplace');
      console.log('ADV001, Ad Spend, 2024-01-15, 2024-01-16, 500000, TikTok Ads, TikTok Shop');
      
      return;
    }
    
    if (sampleData) {
      console.log('📋 Sample record found:');
      console.log(`   Order ID: ${sampleData.order_id}`);
      console.log(`   Settlement Amount: Rp ${(sampleData.settlement_amount || 0).toLocaleString('id-ID')}`);
      console.log(`   Settled Time: ${sampleData.order_settled_time.toISOString().split('T')[0]}`);
      console.log(`   Account: ${sampleData.account_name || 'N/A'}`);
    }

    console.log('\n📊 Step 2: Testing aggregation calculation...');
    
    // Test the exact same aggregation as dashboard controller
    const totalAggregation = await prisma.advertisingSettlement.aggregate({
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      }
    });
    
    const totalAmount = totalAggregation._sum.settlement_amount || 0;
    console.log(`✅ Total Settlement Amount: Rp ${totalAmount.toLocaleString('id-ID')}`);
    
    if (totalAmount === 0) {
      console.log('⚠️  Settlement amounts are all 0 or null!');
      
      // Check for null values
      const nullCount = await prisma.advertisingSettlement.count({
        where: {
          settlement_amount: null
        }
      });
      
      const zeroCount = await prisma.advertisingSettlement.count({
        where: {
          settlement_amount: 0
        }
      });
      
      console.log(`   Records with null amounts: ${nullCount}`);
      console.log(`   Records with zero amounts: ${zeroCount}`);
      
      if (nullCount > 0) {
        console.log('🔧 Fixing null settlement amounts...');
        // You might want to update null values or re-import data
        console.log('💡 Consider re-importing with proper settlement_amount values');
      }
      
      return;
    }

    console.log('\n📊 Step 3: Testing monthly filtering...');
    
    // Test current month filtering (like frontend would use)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const currentMonthAggregation = await prisma.advertisingSettlement.aggregate({
      where: {
        order_settled_time: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      }
    });
    
    const currentMonthAmount = currentMonthAggregation._sum.settlement_amount || 0;
    console.log(`✅ Current Month (${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}): Rp ${currentMonthAmount.toLocaleString('id-ID')}`);
    console.log(`✅ Current Month Records: ${currentMonthAggregation._count._all}`);

    console.log('\n📊 Step 4: Testing custom date range...');
    
    // Test last 30 days (common KPI selection)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const last30DaysAggregation = await prisma.advertisingSettlement.aggregate({
      where: {
        order_settled_time: {
          gte: thirtyDaysAgo,
          lte: new Date()
        }
      },
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      }
    });
    
    const last30DaysAmount = last30DaysAggregation._sum.settlement_amount || 0;
    console.log(`✅ Last 30 Days: Rp ${last30DaysAmount.toLocaleString('id-ID')}`);
    console.log(`✅ Last 30 Days Records: ${last30DaysAggregation._count._all}`);

    console.log('\n📊 Step 5: Testing dashboard controller response...');
    
    // Simulate a dashboard API call
    const dashboardPath = path.join(__dirname, '../src/controllers/dashboardController.js');
    if (fs.existsSync(dashboardPath)) {
      console.log('✅ Dashboard controller found');
      
      // Check if the advertising settlement integration exists
      const controllerContent = fs.readFileSync(dashboardPath, 'utf8');
      
      if (controllerContent.includes('advertisingSettlement.aggregate')) {
        console.log('✅ Advertising settlement aggregation found in dashboard controller');
      } else {
        console.log('❌ Advertising settlement aggregation NOT found in dashboard controller');
        console.log('🔧 Dashboard controller may need to be updated');
      }
      
      if (controllerContent.includes('totalAdvertisingSettlement')) {
        console.log('✅ totalAdvertisingSettlement variable found in dashboard controller');
      } else {
        console.log('❌ totalAdvertisingSettlement variable NOT found in dashboard controller');
      }
    }

    console.log('\n📊 Step 6: Month-by-month breakdown...');
    
    // Get last 6 months breakdown
    const monthlyBreakdown = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', order_settled_time) as month,
        SUM(settlement_amount) as total_amount,
        COUNT(*) as record_count
      FROM advertising_settlement 
      WHERE order_settled_time >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', order_settled_time)
      ORDER BY month DESC
    `;
    
    if (monthlyBreakdown.length > 0) {
      console.log('📊 Monthly Breakdown (Last 6 months):');
      monthlyBreakdown.forEach((row) => {
        const monthDate = new Date(row.month);
        const monthName = monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const amount = Number(row.total_amount) || 0;
        console.log(`   ${monthName}: Rp ${amount.toLocaleString('id-ID')} (${row.record_count} records)`);
      });
    } else {
      console.log('ℹ️ No monthly breakdown data available (data might be older than 6 months)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Advertising KPI Integration Test Complete!');
    console.log('='.repeat(50));
    
    if (totalAmount > 0) {
      console.log('\n✅ RESULT: Data is available and should appear in KPIs');
      console.log('📝 Next steps:');
      console.log('   1. Restart backend server');
      console.log('   2. Clear browser cache');
      console.log('   3. Check KPI dashboard');
      console.log('   4. Verify date range filtering works');
    } else {
      console.log('\n⚠️  RESULT: No advertising settlement amounts found');
      console.log('📝 Required actions:');
      console.log('   1. Import advertising settlement data');
      console.log('   2. Ensure settlement_amount column has valid values');
      console.log('   3. Check import template format');
    }

  } catch (error) {
    console.error('\n💥 Error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check database connection');
    console.log('   • Run: npx prisma db push');
    console.log('   • Verify advertising_settlement table exists');
  } finally {
    await prisma.$disconnect();
  }
}

main();