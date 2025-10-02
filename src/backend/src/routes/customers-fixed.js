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

// Simple test endpoint
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Customers test endpoint hit');
    
    const salesCount = await prisma.salesData.count();
    console.log(`📊 Sales records count: ${salesCount}`);
    
    res.json({
      success: true,
      message: 'Customers API test endpoint working',
      salesCount: salesCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

// GET /api/customers - Safe and simple version
router.get('/', async (req, res) => {
  try {
    console.log('📊 Getting customers...');
    
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'order_amount', 
      sortOrder = 'desc' 
    } = req.query;
    console.log('🔍 Query params:', { page, limit, search, sortBy, sortOrder });
    
    // First, get basic count to check connection
    const totalSalesCount = await prisma.salesData.count();
    console.log(`📊 Total sales records in database: ${totalSalesCount}`);
    
    if (totalSalesCount === 0) {
      return res.json({
        success: true,
        data: {
          customers: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }
    
    // Get ALL sales data with simple query - NO WHERE CLAUSES
    const allSalesData = await prisma.salesData.findMany({
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
      }
    });
    
    console.log(`📋 Retrieved ${allSalesData.length} sales records`);
    
    // Process customers in memory to avoid complex Prisma queries
    const customerGroups = {};
    
    allSalesData.forEach(sale => {
      const customer = sale.customer;
      // Only skip completely null/empty customers
      if (!customer || customer === '' || customer === null) return;
      
      const customerKey = customer.toLowerCase().trim();
      
      if (!customerGroups[customerKey]) {
        customerGroups[customerKey] = {
          customer: customer,
          province: sale.province || 'Tidak Diketahui',
          regency_city: sale.regency_city || 'Tidak Diketahui',
          total_quantity: 0,
          order_amount: 0,
          total_orders: 0,
          last_order_date: sale.delivered_time || sale.created_time || new Date().toISOString()
        };
      }
      
      // Use the highest available revenue value
      const revenue = Math.max(
        Number(sale.settlement_amount) || 0,
        Number(sale.total_revenue) || 0,
        Number(sale.order_amount) || 0
      );
      
      customerGroups[customerKey].total_quantity += Number(sale.quantity) || 0;
      customerGroups[customerKey].order_amount += revenue;
      customerGroups[customerKey].total_orders += 1;
      
      // Update last order date if more recent
      const orderDate = sale.delivered_time || sale.created_time;
      if (orderDate && new Date(orderDate) > new Date(customerGroups[customerKey].last_order_date)) {
        customerGroups[customerKey].last_order_date = orderDate;
      }
    });
    
    let customers = Object.values(customerGroups);
    
    // Apply search filter in memory
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      customers = customers.filter(customer => 
        customer.customer.toLowerCase().includes(searchTerm) ||
        customer.province.toLowerCase().includes(searchTerm) ||
        customer.regency_city.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply dynamic sorting based on sortBy and sortOrder parameters
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
    
    // Simple pagination in memory
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedCustomers = customers.slice(startIndex, startIndex + parseInt(limit));
    
    const response = {
      customers: paginatedCustomers,
      total: customers.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(customers.length / parseInt(limit))
    };
    
    console.log(`✅ Returning ${paginatedCustomers.length} customers from ${customers.length} total unique customers`);
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Error getting customers:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customers',
      details: error.message
    });
  }
});

// GET /api/customers/stats - Safe and simple version 
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting customer statistics...');
    
    // Get basic count first
    const totalSalesCount = await prisma.salesData.count();
    console.log(`📊 Total sales records: ${totalSalesCount}`);
    
    if (totalSalesCount === 0) {
      return res.json({
        success: true,
        data: {
          totalCustomers: 0,
          activeCustomers: 0,
          totalOrders: 0,
          totalQuantity: 0,
          totalOrderAmount: 0,
          averageOrderValue: 0,
          newCustomersThisMonth: 0
        }
      });
    }
    
    // Get ALL sales data with simple query - NO WHERE CLAUSES
    const allSales = await prisma.salesData.findMany({
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
    
    console.log(`📋 Processing ${allSales.length} sales records...`);
    
    // Calculate stats in memory to avoid complex Prisma queries
    const uniqueCustomers = new Set();
    let totalOrderAmount = 0;
    let totalQuantity = 0;
    let validOrders = 0;
    
    allSales.forEach(sale => {
      // Only count sales with valid customer and revenue
      const customer = sale.customer;
      if (!customer || customer === '' || customer === null) return;
      
      const revenue = Math.max(
        Number(sale.settlement_amount) || 0,
        Number(sale.total_revenue) || 0,
        Number(sale.order_amount) || 0
      );
      
      if (revenue > 0) {
        uniqueCustomers.add(customer.toLowerCase().trim());
        totalOrderAmount += revenue;
        totalQuantity += Number(sale.quantity) || 0;
        validOrders += 1;
      }
    });
    
    const stats = {
      totalCustomers: uniqueCustomers.size,
      activeCustomers: uniqueCustomers.size,
      totalOrders: validOrders,
      totalQuantity,
      totalOrderAmount,
      averageOrderValue: validOrders > 0 ? Math.round(totalOrderAmount / validOrders) : 0,
      newCustomersThisMonth: 0 // Will calculate if needed
    };
    
    console.log('✅ Customer stats calculated:', {
      totalRecords: allSales.length,
      validOrders,
      totalCustomers: stats.totalCustomers,
      totalOrderAmount: stats.totalOrderAmount
    });
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error getting customer stats:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer statistics',
      details: error.message
    });
  }
});

module.exports = router;