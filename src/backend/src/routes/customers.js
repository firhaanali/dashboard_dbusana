const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Development middleware for CORS
router.use((req, res, next) => {
  if (req.headers['x-development-only'] === 'true') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-development-only');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  next();
});

// GET /api/customers - Get customers from sales_data
router.get('/', async (req, res) => {
  try {
    console.log('📊 Getting customers from sales_data...');
    
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'order_amount',
      sortOrder = 'desc'
    } = req.query;
    
    // Debug: Check total sales records
    const totalSalesCount = await prisma.salesData.count();
    console.log(`🔍 Total sales records in database: ${totalSalesCount}`);

    // Query sales data and group by customer - prioritize delivered_time
    // Don't filter out customers yet - let's see all data first
    const salesData = await prisma.salesData.findMany({
      select: {
        customer: true,
        province: true,
        regency_city: true,
        quantity: true,
        order_amount: true,
        total_revenue: true,
        settlement_amount: true,
        delivered_time: true,
        created_time: true
      },
      orderBy: {
        delivered_time: 'desc'
      }
    });

    // Group by customer and calculate totals
    const customerGroups = {};
    
    salesData.forEach(sale => {
      const customer = sale.customer;
      // Skip only truly empty/null customers, but include "Unknown" type customers
      if (!customer || customer === null || customer === '') return;
      
      // Get the best available date - prioritize delivered_time
      const saleDate = sale.delivered_time || sale.created_time;
      
      if (!customerGroups[customer]) {
        customerGroups[customer] = {
          customer: customer,
          province: sale.province || '-',
          regency_city: sale.regency_city || '-',
          total_quantity: 0,
          order_amount: 0,
          total_orders: 0,
          last_order_date: saleDate
        };
      }
      
      // Update totals - use order_amount directly for consistency
      customerGroups[customer].total_quantity += sale.quantity || 0;
      customerGroups[customer].order_amount += sale.order_amount || 0;
      customerGroups[customer].total_orders += 1;
      
      // Update last order date if more recent
      if (saleDate && customerGroups[customer].last_order_date) {
        if (new Date(saleDate) > new Date(customerGroups[customer].last_order_date)) {
          customerGroups[customer].last_order_date = saleDate;
        }
      } else if (saleDate) {
        customerGroups[customer].last_order_date = saleDate;
      }
    });

    // Convert to array
    let customers = Object.values(customerGroups);
    
    console.log(`✅ Processed ${salesData.length} sales records into ${customers.length} unique customers`);
    
    // Debug: Show date range and month distribution
    if (salesData.length > 0) {
      const dates = salesData
        .map(sale => sale.delivered_time || sale.created_time)
        .filter(date => date)
        .map(date => new Date(date))
        .sort((a, b) => a.getTime() - b.getTime());
      
      if (dates.length > 0) {
        console.log(`📅 Data range: ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length - 1].toISOString().split('T')[0]}`);
        
        // Month distribution
        const monthDistribution = {};
        dates.forEach(date => {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthDistribution[monthKey] = (monthDistribution[monthKey] || 0) + 1;
        });
        console.log('📊 Month distribution:', monthDistribution);
      }
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(customer =>
        customer.customer.toLowerCase().includes(searchLower) ||
        (customer.province && customer.province.toLowerCase().includes(searchLower)) ||
        (customer.regency_city && customer.regency_city.toLowerCase().includes(searchLower))
      );
    }

    // Sort based on sortBy parameter with sortOrder support
    console.log(`🔄 Sorting customers by ${sortBy} ${sortOrder}...`);
    
    customers.sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'customer':
          result = a.customer.localeCompare(b.customer);
          break;
        case 'order_amount':
          result = a.order_amount - b.order_amount;
          break;
        case 'total_orders':
          result = a.total_orders - b.total_orders;
          break;
        case 'total_quantity':
          result = a.total_quantity - b.total_quantity;
          break;
        case 'last_order_date':
          const dateA = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
          const dateB = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
          result = dateA - dateB;
          break;
        default:
          result = a.order_amount - b.order_amount;
      }
      
      // Apply sort order - if desc, reverse the result
      if (sortOrder === 'desc') {
        result = -result;
      }
      
      return result;
    });

    // Debug: Show first 5 customers after sorting
    const sortedPreview = customers.slice(0, 5).map((customer, idx) => ({
      rank: idx + 1,
      customer: customer.customer,
      sortValue: sortBy === 'order_amount' ? customer.order_amount :
                 sortBy === 'total_orders' ? customer.total_orders :
                 sortBy === 'total_quantity' ? customer.total_quantity :
                 sortBy === 'last_order_date' ? customer.last_order_date :
                 customer.customer
    }));
    
    console.log(`✅ Sorted ${customers.length} customers by ${sortBy} ${sortOrder}:`, sortedPreview);

    // Pagination
    const total = customers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    const response = {
      customers: paginatedCustomers,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };

    console.log(`📤 Sending ${paginatedCustomers.length} customers (page ${page}/${Math.ceil(total / limit)})`);
    
    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error getting customers from sales data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customers',
      details: error.message
    });
  }
});

// GET /api/customers/stats - Get customer statistics from sales data
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting customer statistics from sales_data...');
    // Get all sales data for stats - include all customers for accurate stats
    const salesData = await prisma.salesData.findMany({
      select: {
        customer: true,
        order_amount: true,
        total_revenue: true,
        settlement_amount: true,
        quantity: true,
        delivered_time: true,
        created_time: true
      }
    });

    // Calculate unique customers
    const uniqueCustomers = new Set();
    let totalOrderAmount = 0;
    let totalQuantity = 0;
    let totalOrders = salesData.length;
    
    // Get customers from last month for new customer calculation
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const newCustomersThisMonth = new Set();

    salesData.forEach(sale => {
      if (sale.customer && sale.customer !== null && sale.customer !== '') {
        uniqueCustomers.add(sale.customer);
        // Use order_amount directly for consistency
        totalOrderAmount += sale.order_amount || 0;
        totalQuantity += sale.quantity || 0;
        
        // Check if this is a new customer this month - prioritize delivered_time
        const saleDate = sale.delivered_time || sale.created_time;
        if (saleDate && new Date(saleDate) > monthAgo) {
          newCustomersThisMonth.add(sale.customer);
        }
      }
    });

    const totalCustomers = uniqueCustomers.size;
    const avgOrderValue = totalOrders > 0 ? totalOrderAmount / totalOrders : 0;

    const stats = {
      totalCustomers,
      activeCustomers: totalCustomers, // All customers from sales data are considered active
      totalOrders,
      totalQuantity,
      totalOrderAmount,
      averageOrderValue: Math.round(avgOrderValue),
      newCustomersThisMonth: newCustomersThisMonth.size
    };
    
    console.log('✅ Customer stats calculated:', {
      totalCustomers: stats.totalCustomers,
      totalOrders: stats.totalOrders,
      totalOrderAmount: stats.totalOrderAmount,
      totalSalesRecords: salesData.length
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error getting customer stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer statistics',
      details: error.message
    });
  }
});



module.exports = router;