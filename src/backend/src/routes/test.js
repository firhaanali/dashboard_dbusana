const express = require('express');
const router = express.Router();

/**
 * Test routes for debugging CORS and API issues
 */

// Simple test endpoint
router.get('/ping', (req, res) => {
  console.log('🏓 Ping test endpoint hit');
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   Method: ${req.method}`);
  
  // Set CORS headers explicitly
  if (process.env.NODE_ENV === 'development') {
    const origin = req.headers.origin || 'http://localhost:3000';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(200).json({
    success: true,
    message: 'Pong! API is working',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    path: req.originalUrl,
    cors: 'enabled'
  });
});

// Test suppliers endpoint
router.get('/suppliers', (req, res) => {
  console.log('🧪 Test suppliers endpoint hit');
  
  // Set CORS headers explicitly
  if (process.env.NODE_ENV === 'development') {
    const origin = req.headers.origin || 'http://localhost:3000';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  const sampleSuppliers = [
    {
      id: 'test-supplier-1',
      code: 'SUP001',
      name: 'PT Tekstil Nusantara',
      contact_person: 'John Doe',
      phone: '+62 21 1234567',
      email: 'john@tekstilnusantara.com',
      address: 'Jl. Industri No. 123, Jakarta',
      category: 'fabric',
      rating: 4.5,
      status: 'active',
      payment_terms: 'NET 30',
      total_orders: 15,
      total_amount: 50000000,
      last_order_date: '2024-12-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-supplier-2',
      code: 'SUP002',
      name: 'CV Bordir Indah',
      contact_person: 'Jane Smith',
      phone: '+62 22 7654321',
      email: 'jane@bordirindah.com',
      address: 'Jl. Kerajinan No. 456, Bandung',
      category: 'accessories',
      rating: 4.2,
      status: 'active',
      payment_terms: 'NET 14',
      total_orders: 8,
      total_amount: 25000000,
      last_order_date: '2024-12-10',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  res.status(200).json({
    success: true,
    data: sampleSuppliers,
    count: sampleSuppliers.length,
    test: true,
    message: 'This is test supplier data for API debugging'
  });
});

// Test suppliers analytics endpoint
router.get('/suppliers/analytics', (req, res) => {
  console.log('🧪 Test suppliers analytics endpoint hit');
  
  // Set CORS headers explicitly
  if (process.env.NODE_ENV === 'development') {
    const origin = req.headers.origin || 'http://localhost:3000';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  const sampleAnalytics = {
    totalSuppliers: 25,
    activeSuppliers: 23,
    totalPurchases: 125000000,
    averageRating: 4.3,
    categoryDistribution: [
      { name: 'Fabric', value: 40, count: 10 },
      { name: 'Accessories', value: 30, count: 8 },
      { name: 'Trims', value: 20, count: 5 },
      { name: 'Packaging', value: 10, count: 2 }
    ],
    performanceMetrics: [
      { month: 'Oct', orders: 45, amount: 35000000 },
      { month: 'Nov', orders: 52, amount: 42000000 },
      { month: 'Dec', orders: 38, amount: 48000000 }
    ],
    recentActivity: [
      { supplier: 'PT Tekstil Nusantara', action: 'New Order', amount: 15000000, date: '2024-12-18' },
      { supplier: 'CV Bordir Indah', action: 'Payment Received', amount: 8500000, date: '2024-12-17' },
      { supplier: 'PT Aksesoris Cantik', action: 'Order Delivered', amount: 12000000, date: '2024-12-16' }
    ]
  };
  
  res.status(200).json({
    success: true,
    data: sampleAnalytics,
    test: true,
    message: 'This is test supplier analytics data for API debugging'
  });
});

// Test endpoint that returns sample sales data
router.get('/sales', (req, res) => {
  console.log('🧪 Test sales endpoint hit');
  
  // Set CORS headers explicitly
  if (process.env.NODE_ENV === 'development') {
    const origin = req.headers.origin || 'http://localhost:3000';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  const sampleSalesData = [
    {
      id: 'test-1',
      order_id: 'TEST001',
      seller_sku: 'SKU001',
      product_name: 'Test Product 1',
      color: 'Red',
      size: 'M',
      quantity: 2,
      order_amount: 150000,
      total_revenue: 150000,
      hpp: 100000,
      marketplace: 'TikTok Shop',
      created_time: new Date().toISOString(),
      delivered_time: new Date().toISOString()
    },
    {
      id: 'test-2',
      order_id: 'TEST002',
      seller_sku: 'SKU002',
      product_name: 'Test Product 2',
      color: 'Blue',
      size: 'L',
      quantity: 1,
      order_amount: 200000,
      total_revenue: 200000,
      hpp: 120000,
      marketplace: 'Shopee',
      created_time: new Date().toISOString(),
      delivered_time: new Date().toISOString()
    }
  ];
  
  res.status(200).json({
    success: true,
    data: sampleSalesData,
    count: sampleSalesData.length,
    test: true,
    message: 'This is test data for CORS debugging'
  });
});

// Test OPTIONS endpoint
router.options('*', (req, res) => {
  console.log('🔄 OPTIONS request to test route');
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   Path: ${req.originalUrl}`);
  
  // Set all necessary CORS headers
  const origin = req.headers.origin || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Development-Only, x-development-only, Accept, Origin, X-Requested-With, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  
  res.status(200).end();
});

module.exports = router;