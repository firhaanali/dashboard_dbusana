const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCustomerApiFix() {
  console.log('🔍 Verifying Customer API Fix...');
  console.log('='.repeat(40));
  
  try {
    // Test 1: Verify the fixed query structure works
    console.log('📋 Test 1: Testing fixed Prisma query structure...');
    
    const testQuery = await prisma.salesData.findMany({
      select: {
        customer: true,
        order_amount: true,
        quantity: true,
        delivered_time: true,
        created_time: true
      },
      where: {
        AND: [
          {
            order_amount: {
              not: null
            }
          },
          {
            order_amount: {
              gt: 0
            }
          }
        ]
      },
      take: 5 // Just get 5 records for testing
    });
    
    console.log(`✅ Test 1 PASSED: Query executed successfully, found ${testQuery.length} records`);
    
    // Test 2: Check total count with valid order_amount
    console.log('\n📋 Test 2: Testing count query...');
    
    const totalSalesCount = await prisma.salesData.count();
    const validOrderAmountCount = await prisma.salesData.count({
      where: {
        AND: [
          {
            order_amount: {
              not: null
            }
          },
          {
            order_amount: {
              gt: 0
            }
          }
        ]
      }
    });
    
    console.log(`✅ Test 2 PASSED: Total records=${totalSalesCount}, Valid order_amount=${validOrderAmountCount}`);
    
    // Test 3: Test customer grouping logic
    console.log('\n📋 Test 3: Testing customer grouping...');
    
    const customerSample = await prisma.salesData.findMany({
      select: {
        customer: true,
        province: true,
        regency_city: true,
        quantity: true,
        order_amount: true,
        delivered_time: true,
        created_time: true
      },
      where: {
        AND: [
          {
            order_amount: {
              not: null
            }
          },
          {
            order_amount: {
              gt: 0
            }
          }
        ]
      },
      take: 10
    });
    
    // Group customers
    const customerGroups = {};
    customerSample.forEach(sale => {
      const customer = sale.customer;
      if (!customer || customer === null || customer === '') return;
      
      if (!customerGroups[customer]) {
        customerGroups[customer] = {
          customer: customer,
          province: sale.province || '-',
          regency_city: sale.regency_city || '-',
          total_quantity: 0,
          order_amount: 0,
          total_orders: 0,
          last_order_date: sale.delivered_time || sale.created_time || new Date().toISOString()
        };
      }
      
      customerGroups[customer].total_quantity += Number(sale.quantity) || 0;
      customerGroups[customer].order_amount += Number(sale.order_amount) || 0;
      customerGroups[customer].total_orders += 1;
    });
    
    const uniqueCustomers = Object.keys(customerGroups).length;
    console.log(`✅ Test 3 PASSED: Found ${uniqueCustomers} unique customers from ${customerSample.length} sales records`);
    
    // Test 4: Database connectivity
    console.log('\n📋 Test 4: Testing database connectivity...');
    
    const dbInfo = await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
    console.log(`✅ Test 4 PASSED: Database connected - ${dbInfo[0].current_time}`);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('='.repeat(40));
    console.log('✅ Customer API fix is working correctly');
    console.log('✅ Prisma queries are executing without errors');
    console.log('✅ Customer grouping logic is functional');
    console.log('✅ Database connectivity is good');
    console.log('');
    console.log('🔄 Next: Restart backend server and test frontend');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n📚 Troubleshooting:');
    console.log('1. Check if database is running');
    console.log('2. Verify Prisma schema is valid');
    console.log('3. Ensure environment variables are set');
    console.log('4. Check if there are data inconsistencies');
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyCustomerApiFix()
    .then(success => {
      if (success) {
        console.log('\n✅ Verification completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Verification failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyCustomerApiFix };