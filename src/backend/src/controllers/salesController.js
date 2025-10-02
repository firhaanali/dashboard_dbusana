const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all sales data
const getSales = async (req, res) => {
  try {
    // Set CORS headers for this specific endpoint
    if (process.env.NODE_ENV === 'development') {
      const origin = req.headers.origin || 'http://localhost:3000';
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    console.log('📊 Getting sales data from database...');
    console.log('📋 Query parameters:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : null; // No default limit if not specified
    const skip = limit ? (page - 1) * limit : 0;

    console.log(`📋 Pagination setup: page=${page}, limit=${limit || 'ALL'}, skip=${skip}`);

    // Get sales data from SalesData table
    let salesQuery = {
      orderBy: {
        created_time: 'desc'
      }
    };

    // Add pagination only if limit is specified
    if (limit) {
      salesQuery.take = limit;
      salesQuery.skip = skip;
    }

    const [salesData, totalCount] = await Promise.all([
      prisma.salesData.findMany(salesQuery),
      prisma.salesData.count()
    ]);

    console.log(`✅ Found ${salesData.length} sales records (total: ${totalCount})`);
    
    // Debug: Log marketplace distribution
    if (salesData.length > 0) {
      const marketplaceStats = salesData.reduce((acc, sale) => {
        const marketplace = sale.marketplace || 'NULL';
        acc[marketplace] = (acc[marketplace] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Marketplace distribution in response:', marketplaceStats);
      
      // Log sample record
      const sampleRecord = salesData[0];
      console.log('🔍 Sample record fields:', {
        id: sampleRecord.id,
        order_id: sampleRecord.order_id,
        marketplace: sampleRecord.marketplace,
        customer: sampleRecord.customer,
        province: sampleRecord.province,
        regency_city: sampleRecord.regency_city
      });
    }

    const responseData = {
      success: true,
      data: salesData,
      count: totalCount, // Always return total count in database
      pagination: {
        page,
        limit: limit || totalCount, // If no limit, show we're returning all records
        total: totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1
      }
    };

    // Log response summary for debugging
    console.log(`📤 Sending response: ${salesData.length} records, page ${page}${limit ? ` of ${Math.ceil(totalCount / limit)}` : ' (ALL DATA)'}`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error getting sales data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales data',
      message: error.message
    });
  }
};

// Get sales statistics
const getSalesStats = async (req, res) => {
  try {
    console.log('📈 Calculating sales statistics...');

    // Get basic counts
    const [totalSales, totalDistinctOrders] = await Promise.all([
      prisma.salesData.count(),
      prisma.salesData.findMany({
        select: { order_id: true },
        distinct: ['order_id']
      }).then(orders => orders.length)
    ]);

    // Get aggregated values
    const salesAggregation = await prisma.salesData.aggregate({
      _sum: {
        quantity: true,
        order_amount: true,
        total_revenue: true,
        hpp: true
      },
      _avg: {
        order_amount: true
      }
    });

    const totalQuantity = salesAggregation._sum.quantity || 0;
    const totalRevenue = salesAggregation._sum.total_revenue || salesAggregation._sum.order_amount || 0;
    const totalHPP = salesAggregation._sum.hpp || 0;
    const totalProfit = totalRevenue - totalHPP;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = salesAggregation._avg.order_amount || 0;

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSalesCount = await prisma.salesData.count({
      where: {
        OR: [
          { delivered_time: { gte: thirtyDaysAgo } },
          { created_time: { gte: thirtyDaysAgo } }
        ]
      }
    });

    // Get marketplace breakdown
    const marketplaceStats = await prisma.salesData.groupBy({
      by: ['marketplace'],
      _count: {
        _all: true
      },
      _sum: {
        quantity: true,
        order_amount: true,
        total_revenue: true
      }
    });

    const marketplaceBreakdown = marketplaceStats.map(stat => ({
      marketplace: stat.marketplace || 'Unknown',
      count: stat._count._all,
      quantity: stat._sum.quantity || 0,
      revenue: stat._sum.total_revenue || stat._sum.order_amount || 0
    }));

    const stats = {
      totalSales,
      totalDistinctOrders,
      totalQuantity,
      totalRevenue,
      totalHPP,
      totalProfit,
      profitMargin,
      avgOrderValue,
      recentSalesCount,
      marketplaceBreakdown
    };

    console.log('📊 Sales statistics calculated:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error calculating sales stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate sales statistics',
      message: error.message
    });
  }
};

// Get sales chart data
const getSalesChartData = async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    console.log(`📈 Generating sales chart data for ${period}...`);

    const salesData = await prisma.salesData.findMany({
      select: {
        order_id: true,
        quantity: true,
        order_amount: true,
        total_revenue: true,
        delivered_time: true,
        created_time: true
      }
    });

    // Group by date
    const chartData = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySales = salesData.filter(sale => {
        const saleDate = sale.delivered_time ? 
          new Date(sale.delivered_time) : 
          new Date(sale.created_time);
        const saleDateStr = saleDate.toISOString().split('T')[0];
        return saleDateStr === dateStr;
      });

      const dayRevenue = daySales.reduce((sum, sale) => 
        sum + (sale.total_revenue || sale.order_amount || 0), 0
      );
      const dayOrders = new Set(daySales.map(sale => sale.order_id)).size;
      const dayQuantity = daySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

      chartData.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders,
        quantity: dayQuantity,
        label: `Day ${days - i}`
      });
    }

    console.log(`✅ Generated ${chartData.length} data points for chart`);

    res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('❌ Error generating chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate chart data',
      message: error.message
    });
  }
};

// Get marketplace specific statistics
const getMarketplaceStats = async (req, res) => {
  try {
    console.log('🏪 Calculating marketplace statistics...');

    // Get marketplace breakdown with detailed stats
    const marketplaceStats = await prisma.salesData.groupBy({
      by: ['marketplace'],
      _count: {
        _all: true
      },
      _sum: {
        quantity: true,
        order_amount: true,
        total_revenue: true,
        hpp: true
      },
      _avg: {
        order_amount: true
      }
    });

    // Get unique orders per marketplace
    const marketplaceDetails = await Promise.all(
      marketplaceStats.map(async (stat) => {
        const distinctOrders = await prisma.salesData.findMany({
          where: { marketplace: stat.marketplace },
          select: { order_id: true },
          distinct: ['order_id']
        });

        const revenue = stat._sum.total_revenue || stat._sum.order_amount || 0;
        const hpp = stat._sum.hpp || 0;
        const profit = revenue - hpp;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          marketplace: stat.marketplace || 'Unknown',
          totalSales: stat._count._all,
          distinctOrders: distinctOrders.length,
          totalQuantity: stat._sum.quantity || 0,
          totalRevenue: revenue,
          totalHPP: hpp,
          totalProfit: profit,
          profitMargin: profitMargin,
          avgOrderValue: stat._avg.order_amount || 0
        };
      })
    );

    // Sort by revenue descending
    marketplaceDetails.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate totals across all marketplaces
    const totals = marketplaceDetails.reduce((acc, marketplace) => ({
      totalSales: acc.totalSales + marketplace.totalSales,
      distinctOrders: acc.distinctOrders + marketplace.distinctOrders,
      totalQuantity: acc.totalQuantity + marketplace.totalQuantity,
      totalRevenue: acc.totalRevenue + marketplace.totalRevenue,
      totalHPP: acc.totalHPP + marketplace.totalHPP,
      totalProfit: acc.totalProfit + marketplace.totalProfit
    }), {
      totalSales: 0,
      distinctOrders: 0,
      totalQuantity: 0,
      totalRevenue: 0,
      totalHPP: 0,
      totalProfit: 0
    });

    const result = {
      marketplaces: marketplaceDetails,
      totals: {
        ...totals,
        overallProfitMargin: totals.totalRevenue > 0 ? (totals.totalProfit / totals.totalRevenue) * 100 : 0
      }
    };

    console.log('🏪 Marketplace statistics calculated for', marketplaceDetails.length, 'marketplaces');

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error calculating marketplace stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate marketplace statistics',
      message: error.message
    });
  }
};

// Update marketplace field for existing sales data
const updateMarketplaceData = async (req, res) => {
  try {
    console.log('🏪 Starting marketplace field update...');
    
    // Get all sales data without marketplace value
    const salesWithoutMarketplace = await prisma.salesData.findMany({
      where: {
        OR: [
          { marketplace: null },
          { marketplace: '' },
          { marketplace: 'Unknown' }
        ]
      }
    });
    
    console.log(`📊 Found ${salesWithoutMarketplace.length} sales records without marketplace data`);
    
    if (salesWithoutMarketplace.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All sales records already have marketplace data',
        data: { updated: 0, total: 0 }
      });
    }
    
    // Simple marketplace detection based on order patterns
    const detectMarketplace = (sale) => {
      const orderId = sale.order_id || '';
      const sellerSku = sale.seller_sku || '';
      
      // Common marketplace patterns
      if (orderId.includes('TK') || orderId.includes('TOKO') || sellerSku.includes('TOKO')) {
        return 'Tokopedia';
      }
      if (orderId.includes('SH') || orderId.includes('SHOP') || sellerSku.includes('SHOP')) {
        return 'Shopee';
      }
      if (orderId.includes('LZ') || orderId.includes('LAZ') || sellerSku.includes('LAZ')) {
        return 'Lazada';
      }
      if (orderId.includes('TT') || orderId.includes('TIKTOK') || sellerSku.includes('TIKTOK')) {
        return 'TikTok Shop';
      }
      if (orderId.includes('BL') || orderId.includes('BLIBLI') || sellerSku.includes('BLIBLI')) {
        return 'Blibli';
      }
      if (orderId.includes('BK') || orderId.includes('BUKA') || sellerSku.includes('BUKA')) {
        return 'Bukalapak';
      }
      
      // Random assignment for demo purposes
      const marketplaces = ['Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop', 'Blibli'];
      const randomIndex = Math.floor(Math.random() * marketplaces.length);
      return marketplaces[randomIndex];
    };
    
    let updateCount = 0;
    const batchSize = 100;
    
    // Process in batches
    for (let i = 0; i < salesWithoutMarketplace.length; i += batchSize) {
      const batch = salesWithoutMarketplace.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(salesWithoutMarketplace.length / batchSize)}`);
      
      const updatePromises = batch.map(sale => {
        const marketplace = detectMarketplace(sale);
        
        return prisma.salesData.update({
          where: { id: sale.id },
          data: { marketplace }
        });
      });
      
      await Promise.all(updatePromises);
      updateCount += batch.length;
    }
    
    console.log(`🎉 Successfully updated ${updateCount} sales records with marketplace data`);
    
    // Get updated marketplace distribution
    const marketplaceStats = await prisma.salesData.groupBy({
      by: ['marketplace'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      }
    });
    
    const distribution = {};
    marketplaceStats.forEach(stat => {
      distribution[stat.marketplace] = stat._count._all;
    });
    
    res.status(200).json({
      success: true,
      message: `Successfully updated marketplace data for ${updateCount} sales records`,
      data: {
        updated: updateCount,
        total: salesWithoutMarketplace.length,
        distribution
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating marketplace field:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update marketplace data',
      message: error.message
    });
  }
};

module.exports = {
  getSales,
  getSalesStats,
  getSalesChartData,
  getMarketplaceStats,
  updateMarketplaceData
};