#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

console.log('🔍 Debugging Advertising KPI Issue');
console.log('='.repeat(50));

async function debugAdvertisingKPI() {
  try {
    console.log('Step 1: Check if advertising_settlement table exists and has data...');
    
    // Check table structure and data
    const tableExists = await prisma.advertisingSettlement.findFirst().catch(() => null);
    
    if (!tableExists) {
      console.log('❌ advertising_settlement table is empty or does not exist');
      console.log('💡 Solution: Import advertising settlement data first');
      return;
    }
    
    console.log('✅ advertising_settlement table exists and has data');
    
    // Count total records
    const totalRecords = await prisma.advertisingSettlement.count();
    console.log(`📊 Total advertising settlement records: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('❌ No advertising settlement data found');
      console.log('💡 Solution: Import advertising settlement data using the import feature');
      return;
    }
    
    // Check sample data
    const sampleRecords = await prisma.advertisingSettlement.findMany({
      take: 3,
      orderBy: { order_settled_time: 'desc' },
      select: {
        order_id: true,
        settlement_amount: true,
        order_settled_time: true,
        marketplace: true,
        account_name: true
      }
    });
    
    console.log('📋 Sample records:');
    sampleRecords.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.order_id}: Rp ${(record.settlement_amount || 0).toLocaleString('id-ID')}`);
      console.log(`      Date: ${record.order_settled_time.toISOString().split('T')[0]}`);
      console.log(`      Marketplace: ${record.marketplace || 'N/A'}`);
      console.log(`      Account: ${record.account_name || 'N/A'}`);
    });
    
    console.log('\nStep 2: Test aggregation without date filter...');
    
    const totalAggregation = await prisma.advertisingSettlement.aggregate({
      _sum: { settlement_amount: true },
      _count: { _all: true }
    });
    
    const totalAmount = totalAggregation._sum.settlement_amount || 0;
    console.log(`✅ Total settlement amount (all data): Rp ${totalAmount.toLocaleString('id-ID')}`);
    console.log(`✅ Total records: ${totalAggregation._count._all}`);
    
    if (totalAmount === 0) {
      console.log('❌ All settlement amounts are 0 or null');
      
      // Check for null/zero values
      const nullCount = await prisma.advertisingSettlement.count({
        where: { settlement_amount: null }
      });
      const zeroCount = await prisma.advertisingSettlement.count({
        where: { settlement_amount: 0 }
      });
      
      console.log(`   Null amounts: ${nullCount}`);
      console.log(`   Zero amounts: ${zeroCount}`);
      console.log('💡 Solution: Check import data and ensure settlement_amount has valid values');
      return;
    }
    
    console.log('\nStep 3: Test with current month filter (like KPI dashboard)...');
    
    const currentMonthStart = moment().startOf('month').toDate();
    const currentMonthEnd = moment().endOf('month').toDate();
    
    console.log(`📅 Current month: ${moment().format('MMMM YYYY')}`);
    console.log(`📅 Date range: ${currentMonthStart.toISOString().split('T')[0]} to ${currentMonthEnd.toISOString().split('T')[0]}`);
    
    const currentMonthAggregation = await prisma.advertisingSettlement.aggregate({
      where: {
        order_settled_time: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: { settlement_amount: true },
      _count: { _all: true }
    });
    
    const currentMonthAmount = currentMonthAggregation._sum.settlement_amount || 0;
    console.log(`✅ Current month amount: Rp ${currentMonthAmount.toLocaleString('id-ID')}`);
    console.log(`✅ Current month records: ${currentMonthAggregation._count._all}`);
    
    if (currentMonthAmount === 0) {
      console.log('⚠️ No advertising data for current month');
      
      // Check data distribution by month
      const monthlyData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', order_settled_time) as month,
          COUNT(*) as count,
          SUM(settlement_amount) as total_amount
        FROM advertising_settlement 
        GROUP BY DATE_TRUNC('month', order_settled_time)
        ORDER BY month DESC
        LIMIT 6
      `;
      
      console.log('📊 Data by month:');
      monthlyData.forEach(row => {
        const month = moment(row.month).format('MMMM YYYY');
        const amount = Number(row.total_amount) || 0;
        console.log(`   ${month}: Rp ${amount.toLocaleString('id-ID')} (${row.count} records)`);
      });
    }
    
    console.log('\nStep 4: Test dashboard controller logic exactly...');
    
    // Simulate the exact same call as dashboard controller
    const start_date = null; // No date filter (All Data)
    const end_date = null;
    
    const dashboardAggregation = await prisma.advertisingSettlement.aggregate({
      where: start_date && end_date ? {
        order_settled_time: {
          gte: moment(start_date).startOf('day').toDate(),
          lte: moment(end_date).endOf('day').toDate()
        }
      } : {},
      _sum: { settlement_amount: true },
      _count: { _all: true }
    });
    
    const dashboardAmount = dashboardAggregation._sum.settlement_amount || 0;
    console.log(`✅ Dashboard controller result (All Data): Rp ${dashboardAmount.toLocaleString('id-ID')}`);
    
    console.log('\nStep 5: Test API endpoint directly...');
    
    // Test the API endpoint that KPI uses
    const http = require('http');
    
    const testAPI = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: '/api/dashboard/metrics',
          method: 'GET'
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve({ status: res.statusCode, data: result });
            } catch (error) {
              resolve({ status: res.statusCode, error: 'Invalid JSON' });
            }
          });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
      });
    };
    
    try {
      const apiResult = await testAPI();
      console.log(`✅ API Status: ${apiResult.status}`);
      
      if (apiResult.status === 200 && apiResult.data.success) {
        const metrics = apiResult.data.data;
        console.log(`✅ API totalAdvertisingSettlement: Rp ${(metrics.totalAdvertisingSettlement || 0).toLocaleString('id-ID')}`);
        
        if (metrics.totalAdvertisingSettlement === 0) {
          console.log('❌ API returns 0 for advertising settlement');
          console.log('💡 Check if dashboard controller is working correctly');
        } else {
          console.log('✅ API returns correct advertising settlement amount');
          console.log('💡 Issue might be in frontend KPI component');
        }
      } else {
        console.log('❌ API call failed:', apiResult.data || apiResult.error);
      }
    } catch (apiError) {
      console.log('❌ Cannot connect to API:', apiError.message);
      console.log('💡 Make sure backend server is running on port 3001');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 DIAGNOSIS COMPLETE');
    console.log('='.repeat(50));
    
    if (dashboardAmount > 0) {
      console.log('✅ Backend data and logic are correct');
      console.log('🔧 Next steps:');
      console.log('   1. Check frontend KPI component mapping');
      console.log('   2. Clear browser cache');
      console.log('   3. Check browser console for errors');
      console.log('   4. Verify API call in network tab');
    } else {
      console.log('❌ Backend has issues');
      console.log('🔧 Solutions:');
      console.log('   1. Import advertising settlement data');
      console.log('   2. Check data import format');
      console.log('   3. Verify database schema');
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
    console.log('🔧 Troubleshooting:');
    console.log('   • Check database connection');
    console.log('   • Run: npx prisma db push');
    console.log('   • Verify advertising_settlement table exists');
  } finally {
    await prisma.$disconnect();
  }
}

debugAdvertisingKPI();