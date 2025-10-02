const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client (same pattern as salesController.js)
const prisma = new PrismaClient();

// Helper function to format date for SQL queries
const formatDateForSQL = (date) => {
  try {
    return date.toISOString();
  } catch (error) {
    console.error('❌ Error formatting date:', error);
    return new Date().toISOString();
  }
};

// Helper function to safely parse numbers
const safeNumber = (value, defaultValue = 0) => {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to safely parse dates
const safeDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch (error) {
    return new Date();
  }
};

// Get comprehensive analytics data
const getAnalyticsData = async (req, res) => {
  try {

    const { 
      period = '30d',
      start_date,
      end_date,
      marketplace,
      include_products = 'true'
    } = req.query;

    console.log('📊 Generating analytics data with parameters:', {
      period,
      start_date,
      end_date,
      marketplace,
      include_products
    });

    // Calculate date range
    let startDate, endDate;
    let isAllTime = false;
    
    if (start_date && end_date) {
      // Custom date range provided
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      
      // Ensure end date includes the full day
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'all') {
      // All time - no date filtering
      isAllTime = true;
      startDate = new Date('2020-01-01'); // Far back start date
      endDate = new Date();
    } else {
      // Predefined periods
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
    }

    // Build where condition for sales
    const whereCondition = {};
    
    // Only add date filtering if not all time
    if (!isAllTime) {
      whereCondition.created_time = {
        gte: formatDateForSQL(startDate),
        lte: formatDateForSQL(endDate)
      };
    }

    if (marketplace) {
      whereCondition.marketplace = marketplace;
    }



    console.log('📊 Analytics query parameters:', {
      whereCondition,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    });

    // Fetch sales data with error handling
    let salesData;
    try {
      salesData = await prisma.salesData.findMany({
        where: whereCondition,
        orderBy: {
          created_time: 'desc'
        },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          quantity: true,
          product_name: true,
          marketplace: true,
          order_id: true,
          hpp: true
        }
      });
      console.log(`📈 Found ${salesData.length} sales records for analytics`);
    } catch (queryError) {
      console.error('❌ Analytics database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    if (salesData.length === 0) {
      console.log('⚠️ No sales data found for the specified period');
      return res.json({
        success: true,
        data: {
          metrics: {
            total_revenue: 0,
            total_orders: 0,
            total_quantity: 0,
            unique_orders: 0,
            average_order_value: 0,
            total_profit: 0,
            profit_margin: 0
          },
          marketplace_analytics: [],
          daily_trends: [],
          product_analytics: [],
          recent_activities: [],
          growth_analysis: {
            growth_rate: 0,
            trend: 'insufficient_data'
          },
          period: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            period: period,
            days: isAllTime ? 'all_time' : Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
            is_all_time: isAllTime
          },
          data_source: {
            total_records: 0,
            unique_orders: 0,
            unique_products: 0,
            unique_marketplaces: 0
          }
        },
        generated_at: new Date().toISOString(),
        message: 'No sales data found for the specified period'
      });
    }

    // Calculate key metrics
    const metrics = calculateMetrics(salesData);
    console.log('📊 Calculated metrics:', metrics);

    // Group by marketplace
    const marketplaceAnalytics = calculateMarketplaceAnalytics(salesData);
    console.log('🏪 Marketplace analytics:', marketplaceAnalytics.map(m => ({
      name: m.name,
      revenue: m.revenue,
      orders: m.orders
    })));

    // Daily trend data
    const dailyTrends = calculateDailyTrends(salesData, startDate, endDate, isAllTime);
    console.log('📈 Daily trends calculated:', dailyTrends.length, isAllTime ? 'monthly data points' : 'daily data points');

    // Product performance (if requested)
    let productAnalytics = [];
    if (include_products === 'true') {
      productAnalytics = calculateProductAnalytics(salesData);
      console.log('📦 Product analytics calculated:', productAnalytics.length, 'products');
    }

    // Recent activities
    const recentActivities = salesData.slice(0, 10).map(sale => ({
      type: 'sale',
      description: `Sale of ${sale.product_name || 'Product'} (${sale.quantity || 1} units)`,
      marketplace: sale.marketplace || 'Unknown',
      timestamp: sale.created_time,
      value: sale.total_revenue || 0,
      order_id: sale.order_id
    }));

    // Growth analysis
    const growthAnalysis = calculateGrowthAnalysis(dailyTrends);

    const response = {
      success: true,
      data: {
        metrics,
        marketplace_analytics: marketplaceAnalytics,
        daily_trends: dailyTrends,
        product_analytics: productAnalytics,
        recent_activities: recentActivities,
        growth_analysis: growthAnalysis,
        raw_sales: salesData, // Include raw sales data for frontend
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          period: period,
          days: isAllTime ? 'all_time' : Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          is_all_time: isAllTime,
          custom_range: !!(start_date && end_date)
        },
        data_source: {
          total_records: salesData.length,
          unique_orders: new Set(salesData.map(s => s.order_id)).size,
          unique_products: new Set(salesData.map(s => s.product_name)).size,
          unique_marketplaces: new Set(salesData.map(s => s.marketplace)).size
        }
      },
      generated_at: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error generating analytics data:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Database constraint error',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics data',
      details: error.message
    });
  }
};

// Get marketplace-specific analytics
const getMarketplaceAnalytics = async (req, res) => {
  try {

    const { period = '30d', start_date, end_date } = req.query;

    // Calculate date range
    let startDate, endDate;
    let isAllTime = false;
    
    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'all') {
      isAllTime = true;
      startDate = new Date('2020-01-01');
      endDate = new Date();
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
    }

    const whereCondition = {};
    if (!isAllTime) {
      whereCondition.created_time = {
        gte: formatDateForSQL(startDate),
        lte: formatDateForSQL(endDate)
      };
    }

    let salesData;
    try {
      salesData = await prisma.salesData.findMany({
        where: whereCondition,
        orderBy: {
          created_time: 'desc'
        },
        select: {
          id: true,
          created_time: true,
          total_revenue: true,
          quantity: true,
          product_name: true,
          marketplace: true,
          order_id: true,
          hpp: true
        }
      });
      console.log(`🏪 Found ${salesData.length} sales records for marketplace analytics`);
    } catch (queryError) {
      console.error('❌ Marketplace analytics database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    const marketplaceAnalytics = calculateMarketplaceAnalytics(salesData);
    const days = isAllTime ? 'all' : Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const marketplaceTrends = calculateMarketplaceTrends(salesData, startDate, endDate, days);

    res.json({
      success: true,
      data: {
        marketplace_analytics: marketplaceAnalytics,
        marketplace_trends: marketplaceTrends,
        period: { 
          start_date: startDate.toISOString(), 
          end_date: endDate.toISOString(),
          is_all_time: isAllTime,
          custom_range: !!(start_date && end_date)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating marketplace analytics:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: 'Cannot reach database server'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate marketplace analytics',
      details: error.message
    });
  }
};

// Helper functions

function calculateMetrics(salesData) {
  try {
    if (!salesData || salesData.length === 0) {
      return {
        total_revenue: 0,
        total_orders: 0,
        total_quantity: 0,
        unique_orders: 0,
        average_order_value: 0,
        total_profit: 0,
        profit_margin: 0
      };
    }

    const totalRevenue = salesData.reduce((sum, sale) => {
      const revenue = Number(sale.total_revenue) || 0;
      return sum + revenue;
    }, 0);
    
    const totalQuantity = salesData.reduce((sum, sale) => {
      const quantity = Number(sale.quantity) || 0;
      return sum + quantity;
    }, 0);
    
    const uniqueOrderIds = salesData.map(sale => sale.order_id).filter(id => id);
    const uniqueOrders = new Set(uniqueOrderIds).size;
    
    const totalProfit = salesData.reduce((sum, sale) => {
      const revenue = Number(sale.total_revenue) || 0;
      const hpp = Number(sale.hpp) || 0;
      return sum + (revenue - hpp);
    }, 0);

    return {
      total_revenue: totalRevenue,
      total_orders: salesData.length,
      total_quantity: totalQuantity,
      unique_orders: Math.max(uniqueOrders, salesData.length), // Fallback to total sales if no order_ids
      average_order_value: uniqueOrders > 0 ? totalRevenue / uniqueOrders : (salesData.length > 0 ? totalRevenue / salesData.length : 0),
      total_profit: totalProfit,
      profit_margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  } catch (error) {
    console.error('❌ Error calculating metrics:', error);
    return {
      total_revenue: 0,
      total_orders: 0,
      total_quantity: 0,
      unique_orders: 0,
      average_order_value: 0,
      total_profit: 0,
      profit_margin: 0
    };
  }
}

function calculateMarketplaceAnalytics(salesData) {
  try {
    const marketplaceMap = new Map();

    salesData.forEach(sale => {
      try {
        const marketplace = sale.marketplace || 'Unknown';
        const revenue = Number(sale.total_revenue) || 0;
        const quantity = Number(sale.quantity) || 0;
        const hpp = Number(sale.hpp) || 0;
        const profit = revenue - hpp;
        const orderId = sale.order_id || `sale_${sale.id || Math.random()}`;

        if (marketplaceMap.has(marketplace)) {
          const existing = marketplaceMap.get(marketplace);
          marketplaceMap.set(marketplace, {
            name: marketplace,
            revenue: existing.revenue + revenue,
            orders: existing.orders + 1,
            quantity: existing.quantity + quantity,
            profit: existing.profit + profit,
            unique_orders: existing.unique_orders.add(orderId)
          });
        } else {
          marketplaceMap.set(marketplace, {
            name: marketplace,
            revenue: revenue,
            orders: 1,
            quantity: quantity,
            profit: profit,
            unique_orders: new Set([orderId])
          });
        }
      } catch (saleError) {
        console.warn('⚠️ Error processing sale for marketplace analytics:', saleError);
      }
    });

    const totalRevenue = Array.from(marketplaceMap.values()).reduce((sum, mp) => sum + mp.revenue, 0);

    return Array.from(marketplaceMap.values()).map(marketplace => ({
      name: marketplace.name,
      revenue: marketplace.revenue,
      orders: marketplace.orders,
      quantity: marketplace.quantity,
      profit: marketplace.profit,
      unique_orders: marketplace.unique_orders.size,
      average_order_value: marketplace.unique_orders.size > 0 ? marketplace.revenue / marketplace.unique_orders.size : 0,
      profit_margin: marketplace.revenue > 0 ? (marketplace.profit / marketplace.revenue) * 100 : 0,
      market_share: totalRevenue > 0 ? (marketplace.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('❌ Error calculating marketplace analytics:', error);
    return [];
  }
}

function calculateDailyTrends(salesData, startDate, endDate, isAllTime = false) {
  const trends = [];
  
  if (isAllTime && salesData.length > 0) {
    // For all time, we'll show monthly aggregations instead of daily
    // Group by month-year
    const monthlyData = new Map();
    
    salesData.forEach(sale => {
      try {
        const saleDate = new Date(sale.created_time);
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            date: monthKey,
            revenue: 0,
            orders: 0,
            quantity: 0,
            unique_orders: new Set(),
            sales: []
          });
        }
        
        const monthData = monthlyData.get(monthKey);
        monthData.revenue += safeNumber(sale.total_revenue);
        monthData.orders += 1;
        monthData.quantity += safeNumber(sale.quantity);
        monthData.unique_orders.add(sale.order_id);
        monthData.sales.push(sale);
      } catch (error) {
        console.warn('Error processing sale for monthly trends:', error);
      }
    });
    
    // Convert to array and calculate final metrics
    return Array.from(monthlyData.values())
      .map(month => ({
        date: month.date,
        revenue: month.revenue,
        orders: month.orders,
        quantity: month.quantity,
        unique_orders: month.unique_orders.size,
        average_order_value: month.unique_orders.size > 0 ? month.revenue / month.unique_orders.size : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // Regular daily trends for specific periods
  const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const maxDays = 365; // Limit to prevent performance issues
  
  const actualDayCount = Math.min(dayCount, maxDays);

  for (let i = 0; i < actualDayCount; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const daySales = salesData.filter(sale => {
      try {
        const saleDate = new Date(sale.created_time).toISOString().split('T')[0];
        return saleDate === dateStr;
      } catch (error) {
        return false;
      }
    });

    const dayRevenue = daySales.reduce((sum, sale) => sum + safeNumber(sale.total_revenue), 0);
    const dayQuantity = daySales.reduce((sum, sale) => sum + safeNumber(sale.quantity), 0);
    const uniqueOrderIds = daySales.map(sale => sale.order_id).filter(id => id);
    const uniqueOrders = new Set(uniqueOrderIds).size;

    trends.push({
      date: dateStr,
      revenue: dayRevenue,
      orders: daySales.length,
      quantity: dayQuantity,
      unique_orders: Math.max(uniqueOrders, daySales.length > 0 ? 1 : 0),
      average_order_value: uniqueOrders > 0 ? dayRevenue / uniqueOrders : (daySales.length > 0 ? dayRevenue / daySales.length : 0)
    });
  }

  return trends;
}

function calculateProductAnalytics(salesData) {
  const productMap = new Map();

  salesData.forEach(sale => {
    const productName = sale.product_name || 'Unknown Product';
    const revenue = sale.total_revenue || 0;
    const quantity = sale.quantity || 0;
    const hpp = sale.hpp || 0;
    const profit = revenue - hpp;

    if (productMap.has(productName)) {
      const existing = productMap.get(productName);
      productMap.set(productName, {
        product_name: productName,
        revenue: existing.revenue + revenue,
        quantity: existing.quantity + quantity,
        orders: existing.orders + 1,
        profit: existing.profit + profit
      });
    } else {
      productMap.set(productName, {
        product_name: productName,
        revenue: revenue,
        quantity: quantity,
        orders: 1,
        profit: profit
      });
    }
  });

  return Array.from(productMap.values())
    .map(product => ({
      ...product,
      average_selling_price: product.quantity > 0 ? product.revenue / product.quantity : 0,
      profit_margin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20); // Top 20 products
}

function calculateMarketplaceTrends(salesData, startDate, endDate, days) {
  const marketplaces = Array.from(new Set(salesData.map(sale => sale.marketplace || 'Unknown')));
  const trends = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const daySales = salesData.filter(sale => {
      const saleDate = new Date(sale.created_time).toISOString().split('T')[0];
      return saleDate === dateStr;
    });

    const trendData = { date: dateStr };

    marketplaces.forEach(marketplace => {
      const marketplaceSales = daySales.filter(sale => (sale.marketplace || 'Unknown') === marketplace);
      const revenue = marketplaceSales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
      trendData[marketplace] = revenue;
    });

    trends.push(trendData);
  }

  return trends;
}

function calculateGrowthAnalysis(dailyTrends) {
  if (dailyTrends.length < 14) {
    return {
      growth_rate: 0,
      trend: 'insufficient_data',
      comparison_period: 'N/A'
    };
  }

  const midPoint = Math.floor(dailyTrends.length / 2);
  const firstHalf = dailyTrends.slice(0, midPoint);
  const secondHalf = dailyTrends.slice(midPoint);

  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.revenue, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.revenue, 0) / secondHalf.length;

  const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  let trend = 'stable';
  if (growthRate > 5) trend = 'growing';
  else if (growthRate < -5) trend = 'declining';

  return {
    growth_rate: growthRate,
    trend: trend,
    first_half_average: firstHalfAvg,
    second_half_average: secondHalfAvg,
    comparison_period: `${firstHalf.length} days vs ${secondHalf.length} days`
  };
}

module.exports = {
  getAnalyticsData,
  getMarketplaceAnalytics
};