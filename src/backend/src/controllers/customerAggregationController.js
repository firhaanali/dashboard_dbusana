// Customer Aggregation Controller for D'Busana Fashion Dashboard
// Handles aggregation of customers with missing names based on geographic location

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate unique location key for customer aggregation
 */
const generateLocationKey = (regencyCity, province) => {
  const cleanRegency = (regencyCity || '').toString().trim().toLowerCase();
  const cleanProvince = (province || '').toString().trim().toLowerCase();
  
  if (!cleanRegency && !cleanProvince) {
    return 'unknown-location';
  }
  
  return `${cleanProvince}-${cleanRegency}`.replace(/\s+/g, '-');
};

/**
 * Check if customer data represents an unknown/missing customer
 */
const isUnknownCustomer = (customer) => {
  if (!customer) return true;
  
  const cleanCustomer = customer.toString().trim().toLowerCase();
  
  // Check for various representations of unknown/missing customers
  const unknownPatterns = [
    '',
    '-',
    'unknown',
    'tidak diketahui',
    'customer tidak diketahui',
    'n/a',
    'na',
    'null',
    'undefined',
    'kosong',
    'belum ada',
    'no name',
    'no customer',
    '.'
  ];
  
  return unknownPatterns.includes(cleanCustomer) || 
         cleanCustomer.length === 0 ||
         /^[-_\s.]*$/.test(cleanCustomer);
};

/**
 * Generate display name for aggregated unknown customers
 */
const generateAggregatedDisplayName = (regencyCity, province, count) => {
  const cleanRegency = (regencyCity || '').toString().trim();
  const cleanProvince = (province || '').toString().trim();
  
  if (!cleanRegency && !cleanProvince) {
    return `Customer Tidak Diketahui (${count} pesanan)`;
  }
  
  if (!cleanRegency) {
    return `Customer Tidak Diketahui - ${cleanProvince} (${count} pesanan)`;
  }
  
  if (!cleanProvince) {
    return `Customer Tidak Diketahui - ${cleanRegency} (${count} pesanan)`;
  }
  
  return `Customer Tidak Diketahui - ${cleanRegency}, ${cleanProvince} (${count} pesanan)`;
};

/**
 * Get aggregated customer analytics
 */
const getCustomerAggregation = async (req, res) => {
  try {
    console.log('📊 Fetching customer aggregation analytics...');
    
    const {
      province,
      regency_city,
      date_start,
      date_end,
      customer_type // 'known', 'unknown', 'all'
    } = req.query;

    // Build filter conditions
    const where = {};
    
    if (province && province !== 'all') {
      where.province = {
        contains: province,
        mode: 'insensitive'
      };
    }
    
    if (regency_city && regency_city !== 'all') {
      where.regency_city = {
        contains: regency_city,
        mode: 'insensitive'
      };
    }
    
    if (date_start || date_end) {
      where.created_time = {};
      if (date_start) {
        where.created_time.gte = new Date(date_start);
      }
      if (date_end) {
        where.created_time.lte = new Date(date_end);
      }
    }

    console.log('🔍 Customer aggregation filter:', JSON.stringify(where, null, 2));

    // Get sales data for customer analysis
    const salesData = await prisma.salesData.findMany({
      where,
      select: {
        id: true,
        customer: true,
        regency_city: true,
        province: true,
        order_amount: true,
        total_revenue: true,
        settlement_amount: true,
        quantity: true,
        created_time: true,
        order_id: true
      },
      orderBy: {
        created_time: 'desc'
      }
    });

    console.log(`📊 Retrieved ${salesData.length} sales records for aggregation`);

    // Process customer aggregation
    const locationGroups = new Map();
    const knownCustomers = [];
    
    salesData.forEach(sale => {
      const customerName = sale.customer || '';
      
      if (isUnknownCustomer(customerName)) {
        // Group unknown customers by location
        const locationKey = generateLocationKey(sale.regency_city, sale.province);
        
        if (!locationGroups.has(locationKey)) {
          locationGroups.set(locationKey, {
            location_key: locationKey,
            regency_city: sale.regency_city || '',
            province: sale.province || '',
            orders: [],
            customers: new Set()
          });
        }
        
        const group = locationGroups.get(locationKey);
        group.orders.push(sale);
        group.customers.add(sale.order_id); // Use order_id to count unique orders
      } else {
        // Keep known customers
        const existingCustomer = knownCustomers.find(c => 
          c.customer_name === customerName && 
          c.regency_city === (sale.regency_city || '') && 
          c.province === (sale.province || '')
        );
        
        if (existingCustomer) {
          existingCustomer.orders.push(sale);
          existingCustomer.total_amount += parseFloat(sale.total_revenue || sale.settlement_amount || sale.order_amount || 0);
          existingCustomer.total_quantity += parseInt(sale.quantity || 0);
        } else {
          knownCustomers.push({
            id: `known-${customerName}-${Date.now()}`,
            customer_name: customerName,
            display_name: customerName,
            regency_city: sale.regency_city || '',
            province: sale.province || '',
            location_key: generateLocationKey(sale.regency_city, sale.province),
            is_aggregated: false,
            customer_count: 1,
            orders: [sale],
            total_amount: parseFloat(sale.total_revenue || sale.settlement_amount || sale.order_amount || 0),
            total_quantity: parseInt(sale.quantity || 0),
            total_orders: 1
          });
        }
      }
    });

    // Create aggregated customers from location groups
    const aggregatedCustomers = [];
    
    locationGroups.forEach((group, locationKey) => {
      const totalAmount = group.orders.reduce((sum, order) => sum + parseFloat(order.total_revenue || order.settlement_amount || order.order_amount || 0), 0);
      const totalQuantity = group.orders.reduce((sum, order) => sum + parseInt(order.quantity || 0), 0);
      const uniqueOrders = group.customers.size;
      
      aggregatedCustomers.push({
        id: `aggregated-${locationKey}`,
        customer_name: 'Unknown Customer Group',
        display_name: generateAggregatedDisplayName(group.regency_city, group.province, group.orders.length),
        regency_city: group.regency_city,
        province: group.province,
        location_key: locationKey,
        is_aggregated: true,
        customer_count: group.orders.length,
        total_orders: group.orders.length,
        total_amount: totalAmount,
        total_quantity: totalQuantity,
        unique_orders: uniqueOrders,
        first_order_date: group.orders.length > 0 ? 
          new Date(Math.min(...group.orders.map(o => new Date(o.created_time).getTime()))) : null,
        last_order_date: group.orders.length > 0 ? 
          new Date(Math.max(...group.orders.map(o => new Date(o.created_time).getTime()))) : null
      });
    });

    // Update known customers with calculated totals
    knownCustomers.forEach(customer => {
      customer.total_orders = customer.orders.length;
      customer.first_order_date = customer.orders.length > 0 ? 
        new Date(Math.min(...customer.orders.map(o => new Date(o.created_time).getTime()))) : null;
      customer.last_order_date = customer.orders.length > 0 ? 
        new Date(Math.max(...customer.orders.map(o => new Date(o.created_time).getTime()))) : null;
    });

    // Combine all customers
    const allCustomers = [...knownCustomers, ...aggregatedCustomers];

    // Apply customer type filter
    let filteredCustomers = allCustomers;
    if (customer_type && customer_type !== 'all') {
      if (customer_type === 'known') {
        filteredCustomers = allCustomers.filter(c => !c.is_aggregated);
      } else if (customer_type === 'unknown') {
        filteredCustomers = allCustomers.filter(c => c.is_aggregated);
      }
    }

    // Calculate analytics
    const totalCustomers = allCustomers.length;
    const knownCustomersCount = knownCustomers.length;
    const unknownGroups = aggregatedCustomers.length;
    const totalUnknownOrders = aggregatedCustomers.reduce((sum, c) => sum + c.total_orders, 0);
    const totalOrders = salesData.length;
    
    // Top customers by revenue
    const topCustomers = allCustomers
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    // Province distribution
    const provinceStats = allCustomers.reduce((acc, customer) => {
      const prov = customer.province || 'Tidak Diketahui';
      if (!acc[prov]) {
        acc[prov] = {
          province: prov,
          customer_count: 0,
          total_amount: 0,
          total_orders: 0,
          known_customers: 0,
          unknown_groups: 0
        };
      }
      
      acc[prov].customer_count += customer.is_aggregated ? customer.customer_count : 1;
      acc[prov].total_amount += customer.total_amount;
      acc[prov].total_orders += customer.total_orders;
      
      if (customer.is_aggregated) {
        acc[prov].unknown_groups += 1;
      } else {
        acc[prov].known_customers += 1;
      }
      
      return acc;
    }, {});

    const analytics = {
      total_customers: totalCustomers,
      known_customers: knownCustomersCount,
      unknown_customer_groups: unknownGroups,
      total_unknown_orders: totalUnknownOrders,
      total_orders: totalOrders,
      unknown_orders_percentage: totalOrders > 0 ? (totalUnknownOrders / totalOrders) * 100 : 0,
      province_distribution: Object.values(provinceStats),
      top_customers: topCustomers
    };

    console.log('✅ Customer aggregation completed:', {
      totalSalesRecords: salesData.length,
      totalCustomers,
      knownCustomers: knownCustomersCount,
      unknownGroups,
      filteredCustomers: filteredCustomers.length
    });

    res.json({
      success: true,
      data: {
        customers: filteredCustomers,
        analytics,
        filters_applied: {
          province: province || 'all',
          regency_city: regency_city || 'all',
          customer_type: customer_type || 'all',
          date_range: {
            start: date_start || null,
            end: date_end || null
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in customer aggregation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer aggregation',
      details: error.message
    });
  }
};

/**
 * Get customer aggregation summary (for dashboard widgets)
 */
const getCustomerAggregationSummary = async (req, res) => {
  try {
    console.log('📊 Generating customer aggregation summary...');

    // Get basic customer stats from sales data
    const [totalSales, customerStats] = await Promise.all([
      prisma.salesData.count(),
      prisma.salesData.groupBy({
        by: ['customer', 'regency_city', 'province'],
        _count: {
          id: true
        },
        _sum: {
          order_amount: true,
          total_revenue: true,
          settlement_amount: true,
          quantity: true
        }
      })
    ]);

    // Analyze customer patterns
    let knownCustomers = 0;
    let unknownCustomerOrders = 0;
    const locationGroups = new Map();

    customerStats.forEach(stat => {
      if (isUnknownCustomer(stat.customer)) {
        unknownCustomerOrders += stat._count.id;
        const locationKey = generateLocationKey(stat.regency_city, stat.province);
        
        if (!locationGroups.has(locationKey)) {
          locationGroups.set(locationKey, {
            location: `${stat.regency_city || 'Unknown'}, ${stat.province || 'Unknown'}`,
            orders: 0,
            revenue: 0
          });
        }
        
        const group = locationGroups.get(locationKey);
        group.orders += stat._count.id;
        group.revenue += parseFloat(stat._sum.total_revenue || stat._sum.settlement_amount || stat._sum.order_amount || 0);
      } else {
        knownCustomers++;
      }
    });

    const unknownCustomerGroups = locationGroups.size;
    const unknownOrdersPercentage = totalSales > 0 ? (unknownCustomerOrders / totalSales) * 100 : 0;

    const summary = {
      total_sales_records: totalSales,
      total_unique_customers: customerStats.length,
      known_customers: knownCustomers,
      unknown_customer_groups: unknownCustomerGroups,
      unknown_orders_count: unknownCustomerOrders,
      unknown_orders_percentage: unknownOrdersPercentage,
      top_unknown_locations: Array.from(locationGroups.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    };

    console.log('✅ Customer aggregation summary generated:', summary);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Error generating customer aggregation summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer aggregation summary',
      details: error.message
    });
  }
};

/**
 * Get available provinces and cities for filter options
 */
const getCustomerLocations = async (req, res) => {
  try {
    console.log('📍 Fetching customer location options...');

    const locations = await prisma.salesData.groupBy({
      by: ['province', 'regency_city'],
      _count: {
        id: true
      },
      orderBy: [
        { province: 'asc' },
        { regency_city: 'asc' }
      ]
    });

    // Organize by province
    const provinces = locations.reduce((acc, location) => {
      const province = location.province || 'Tidak Diketahui';
      if (!acc[province]) {
        acc[province] = {
          province,
          cities: [],
          total_orders: 0
        };
      }
      
      acc[province].cities.push({
        regency_city: location.regency_city || 'Tidak Diketahui',
        order_count: location._count.id
      });
      
      acc[province].total_orders += location._count.id;
      
      return acc;
    }, {});

    // Sort cities by order count within each province
    Object.values(provinces).forEach(province => {
      province.cities.sort((a, b) => b.order_count - a.order_count);
    });

    res.json({
      success: true,
      data: {
        provinces: Object.values(provinces),
        total_locations: locations.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching customer locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer locations',
      details: error.message
    });
  }
};

module.exports = {
  getCustomerAggregation,
  getCustomerAggregationSummary,
  getCustomerLocations
};