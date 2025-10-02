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

// GET /api/customers/stats - Simplified version without complex WHERE clauses
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting customer statistics...');
    
    // Get basic sales count first
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
    
    // Get ALL sales data - simplified query without complex WHERE clause
    const allSales = await prisma.salesData.findMany({
      select: {
        customer: true,
        order_amount: true,
        quantity: true,
        delivered_time: true,
        created_time: true
      }
    });
    
    console.log(`📋 Processing ${allSales.length} sales records...`);
    
    // Calculate stats using ALL data
    const uniqueCustomers = new Set();
    let totalOrderAmount = 0;
    let totalQuantity = 0;
    let totalOrders = 0;
    
    allSales.forEach(sale => {
      // Only count sales with valid customer and order_amount
      if (sale.customer && sale.customer !== null && sale.customer !== '' && 
          sale.order_amount && sale.order_amount > 0) {
        uniqueCustomers.add(sale.customer);
        totalOrderAmount += Number(sale.order_amount) || 0;
        totalQuantity += Number(sale.quantity) || 0;
        totalOrders += 1;
      }
    });
    
    const stats = {
      totalCustomers: uniqueCustomers.size,
      activeCustomers: uniqueCustomers.size,
      totalOrders: totalOrders,
      totalQuantity,
      totalOrderAmount,
      averageOrderValue: totalOrders > 0 ? Math.round(totalOrderAmount / totalOrders) : 0,
      newCustomersThisMonth: 0 // Will implement later if needed
    };
    
    console.log('✅ Customer stats calculated:', {
      totalRecords: allSales.length,
      validSales: totalOrders,
      totalOrderAmount: stats.totalOrderAmount,
      totalCustomers: stats.totalCustomers
    });
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error getting customer stats:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customer statistics',
      details: error.message
    });
  }
});

// GET /api/customers - Simplified version without complex WHERE clauses
router.get('/', async (req, res) => {
  try {
    console.log('📊 Getting customers...');
    
    const { page = 1, limit = 10, search = '' } = req.query;
    console.log('🔍 Query params:', { page, limit, search });
    
    // Get ALL sales data - simplified query without complex WHERE clause
    const salesData = await prisma.salesData.findMany({
      select: {
        customer: true,
        province: true,
        regency_city: true,
        quantity: true,
        order_amount: true,
        delivered_time: true,
        created_time: true
      }
    });
    
    console.log(`📋 Processing ${salesData.length} sales records...`);
    
    // Group customers
    const customerGroups = {};
    
    salesData.forEach(sale => {
      const customer = sale.customer;
      // Only process sales with valid customer and order_amount
      if (!customer || customer === null || customer === '' || 
          !sale.order_amount || sale.order_amount <= 0) return;
      
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
      
      // Update last order date if this one is more recent
      const currentOrderDate = new Date(sale.delivered_time || sale.created_time);
      const lastOrderDate = new Date(customerGroups[customer].last_order_date);
      if (currentOrderDate > lastOrderDate) {
        customerGroups[customer].last_order_date = sale.delivered_time || sale.created_time;
      }
    });
    
    let customers = Object.values(customerGroups);
    
    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      customers = customers.filter(customer => 
        customer.customer.toLowerCase().includes(searchTerm) ||
        customer.province.toLowerCase().includes(searchTerm) ||
        customer.regency_city.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by order amount (highest first)
    customers.sort((a, b) => b.order_amount - a.order_amount);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = customers.slice(startIndex, startIndex + parseInt(limit));
    
    const response = {
      customers: paginatedCustomers,
      total: customers.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(customers.length / limit)
    };
    
    console.log(`✅ Returning ${paginatedCustomers.length} customers from ${customers.length} total`);
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Error getting customers:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve customers',
      details: error.message
    });
  }
});

module.exports = router;