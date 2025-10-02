const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testCustomerSorting() {
  console.log('🧪 Testing Customer Sorting API...\n');

  const sortingTests = [
    {
      name: 'Customer Name (A-Z)',
      params: { sortBy: 'customer', sortOrder: 'asc', limit: 5 }
    },
    {
      name: 'Customer Name (Z-A)', 
      params: { sortBy: 'customer', sortOrder: 'desc', limit: 5 }
    },
    {
      name: 'Order Amount (Tertinggi)',
      params: { sortBy: 'order_amount', sortOrder: 'desc', limit: 5 }
    },
    {
      name: 'Order Amount (Terendah)',
      params: { sortBy: 'order_amount', sortOrder: 'asc', limit: 5 }
    },
    {
      name: 'Total Orders (Terbanyak)',
      params: { sortBy: 'total_orders', sortOrder: 'desc', limit: 5 }
    },
    {
      name: 'Last Order Date (Terbaru)',
      params: { sortBy: 'last_order_date', sortOrder: 'desc', limit: 5 }
    }
  ];

  for (const test of sortingTests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`   Params: sortBy=${test.params.sortBy}, sortOrder=${test.params.sortOrder}`);
      
      const queryParams = new URLSearchParams(test.params).toString();
      const url = `${BACKEND_URL}/api/customers?${queryParams}`;
      
      const response = await axios.get(url, {
        headers: {
          'x-development-only': 'true'
        },
        timeout: 10000
      });

      if (response.data.success && response.data.data?.customers) {
        const customers = response.data.data.customers;
        console.log(`   ✅ SUCCESS: Received ${customers.length} customers`);
        
        // Show first 3 customers with their sort values
        customers.slice(0, 3).forEach((customer, idx) => {
          let sortValue;
          switch (test.params.sortBy) {
            case 'customer':
              sortValue = customer.customer;
              break;
            case 'order_amount':
              sortValue = `Rp ${customer.order_amount.toLocaleString('id-ID')}`;
              break;
            case 'total_orders':
              sortValue = `${customer.total_orders} orders`;
              break;
            case 'total_quantity':
              sortValue = `${customer.total_quantity} qty`;
              break;
            case 'last_order_date':
              sortValue = customer.last_order_date;
              break;
            default:
              sortValue = 'N/A';
          }
          
          console.log(`   ${idx + 1}. ${customer.customer} → ${sortValue}`);
        });
        
        // Verify sorting is working by checking if data is different
        const firstCustomer = customers[0]?.customer;
        console.log(`   🎯 First Customer: ${firstCustomer}`);
        
      } else {
        console.log(`   ❌ FAILED: ${response.data.error || 'No customers returned'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Make sure backend server is running on port 3001');
        break;
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🏁 Customer Sorting API Test Complete');
  console.log('\n💡 If all tests show different "First Customer" values, sorting is working correctly!');
  console.log('💡 If "First Customer" is always the same (like "devilaksmi2"), sorting is NOT working.');
}

// Run the test
testCustomerSorting().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});