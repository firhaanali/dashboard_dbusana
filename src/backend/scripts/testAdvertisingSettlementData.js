#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

console.log('🔍 Testing Advertising Settlement Data Integration');
console.log('='.repeat(60));

async function testAdvertisingSettlementData() {
  try {
    console.log('\n📊 Step 1: Checking advertising_settlement table structure...');
    
    // Check if table exists and get sample data
    const sampleData = await prisma.advertisingSettlement.findMany({
      take: 5,
      orderBy: {
        order_settled_time: 'desc'
      }
    });
    
    console.log(`✅ Found ${sampleData.length} advertising settlement records`);
    
    if (sampleData.length > 0) {
      console.log('\n📋 Sample Data:');
      sampleData.forEach((record, index) => {
        console.log(`   ${index + 1}. Order ID: ${record.order_id}`);
        console.log(`      Settlement Amount: Rp ${record.settlement_amount?.toLocaleString('id-ID') || 0}`);
        console.log(`      Settled Time: ${record.order_settled_time.toISOString().split('T')[0]}`);
        console.log(`      Account: ${record.account_name || 'N/A'}`);
        console.log(`      Marketplace: ${record.marketplace || 'N/A'}`);
        console.log(`      Type: ${record.type || 'N/A'}\n`);
      });
    }

    console.log('\n📊 Step 2: Testing aggregate calculations...');
    
    // Test basic aggregation
    const totalAggregation = await prisma.advertisingSettlement.aggregate({
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      }
    });
    
    console.log(`✅ Total Advertising Settlement: Rp ${(totalAggregation._sum.settlement_amount || 0).toLocaleString('id-ID')}`);
    console.log(`✅ Total Records: ${totalAggregation._count._all || 0}`);

    console.log('\n📊 Step 3: Testing date filtering (Last 30 days)...');
    
    const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day').toDate();
    const today = moment().endOf('day').toDate();
    
    const last30DaysAggregation = await prisma.advertisingSettlement.aggregate({
      where: {
        order_settled_time: {
          gte: thirtyDaysAgo,
          lte: today
        }
      },
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      }
    });
    
    console.log(`✅ Last 30 Days Settlement: Rp ${(last30DaysAggregation._sum.settlement_amount || 0).toLocaleString('id-ID')}`);
    console.log(`✅ Last 30 Days Records: ${last30DaysAggregation._count._all || 0}`);

    console.log('\n📊 Step 4: Testing current month filtering...');
    
    const currentMonthStart = moment().startOf('month').toDate();
    const currentMonthEnd = moment().endOf('month').toDate();
    
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
    
    console.log(`✅ Current Month Settlement: Rp ${(currentMonthAggregation._sum.settlement_amount || 0).toLocaleString('id-ID')}`);
    console.log(`✅ Current Month Records: ${currentMonthAggregation._count._all || 0}`);

    console.log('\n📊 Step 5: Testing dashboard controller logic...');
    
    // Simulate dashboard controller request
    const start_date = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const end_date = moment().format('YYYY-MM-DD');
    
    console.log(`🔍 Testing date range: ${start_date} to ${end_date}`);
    
    const dashboardAggregation = await prisma.advertisingSettlement.aggregate({
      where: {
        order_settled_time: {
          gte: moment(start_date).startOf('day').toDate(),
          lte: moment(end_date).endOf('day').toDate()
        }
      },
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      }
    });
    
    console.log(`✅ Dashboard Logic Result: Rp ${(dashboardAggregation._sum.settlement_amount || 0).toLocaleString('id-ID')}`);
    console.log(`✅ Dashboard Records: ${dashboardAggregation._count._all || 0}`);

    console.log('\n📊 Step 6: Breakdown by marketplace...');
    
    const marketplaceBreakdown = await prisma.advertisingSettlement.groupBy({
      by: ['marketplace'],
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _sum: {
          settlement_amount: 'desc'
        }
      }
    });
    
    if (marketplaceBreakdown.length > 0) {
      console.log('📊 Breakdown by Marketplace:');
      marketplaceBreakdown.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.marketplace || 'Unknown'}: Rp ${(item._sum.settlement_amount || 0).toLocaleString('id-ID')} (${item._count._all} records)`);
      });
    } else {
      console.log('ℹ️ No marketplace breakdown available');
    }

    console.log('\n📊 Step 7: Breakdown by account...');
    
    const accountBreakdown = await prisma.advertisingSettlement.groupBy({
      by: ['account_name'],
      _sum: {
        settlement_amount: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _sum: {
          settlement_amount: 'desc'
        }
      },
      take: 5
    });
    
    if (accountBreakdown.length > 0) {
      console.log('📊 Top 5 Accounts by Settlement:');
      accountBreakdown.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.account_name || 'Unknown'}: Rp ${(item._sum.settlement_amount || 0).toLocaleString('id-ID')} (${item._count._all} records)`);
      });
    } else {
      console.log('ℹ️ No account breakdown available');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Advertising Settlement Data Test Complete!');
    console.log('='.repeat(60));
    
    if (totalAggregation._sum.settlement_amount === 0) {
      console.log('\n⚠️  ISSUE FOUND: Total settlement amount is 0');
      console.log('💡 Possible causes:');
      console.log('   • No data imported to advertising_settlement table');
      console.log('   • settlement_amount values are all 0 or null');
      console.log('   • Date filtering excludes all records');
      console.log('\n🔧 Recommended actions:');
      console.log('   1. Import advertising settlement data');
      console.log('   2. Check template format and column mapping');
      console.log('   3. Verify date ranges in KPI filtering');
    } else {
      console.log('\n✅ Data looks good! Settlement amount should appear in KPIs');
    }

  } catch (error) {
    console.error('\n💥 Error testing advertising settlement data:', error);
    console.log('\n🔧 Possible solutions:');
    console.log('   • Run Prisma migrations: npx prisma db push');
    console.log('   • Check database connection');
    console.log('   • Verify advertising_settlement table exists');
  } finally {
    await prisma.$disconnect();
  }
}

testAdvertisingSettlementData();