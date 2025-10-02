// Monthly Trend Controller for D'Busana Fashion Dashboard
// Provides month-over-month comparison data for KPI metrics

const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

/**
 * Get month-over-month KPI comparison data
 */
const getMonthlyTrends = async (req, res) => {
  try {
    console.log('📈 Fetching monthly trends for KPI comparison based on latest available data...');
    
    // First, find the latest month with data
    const latestSale = await prisma.salesData.findFirst({
      orderBy: {
        created_time: 'desc'
      },
      select: {
        created_time: true
      }
    });

    if (!latestSale) {
      console.log('❌ No sales data found');
      return res.json({
        success: true,
        data: {
          currentPeriod: { label: 'No Data', metrics: {} },
          previousPeriod: { label: 'No Data', metrics: {} },
          trends: {},
          summary: { totalKPIs: 0, improvingKPIs: 0, decliningKPIs: 0, neutralKPIs: 0 }
        }
      });
    }

    // Get the month of the latest data
    const latestDataMonth = moment(latestSale.created_time).startOf('month');
    const previousDataMonth = moment(latestDataMonth).subtract(1, 'month').startOf('month');
    
    const latestDataMonthEnd = moment(latestDataMonth).endOf('month');
    const previousDataMonthEnd = moment(previousDataMonth).endOf('month');
    
    console.log('📅 Date ranges for comparison (based on latest data):', {
      latestDataMonth: {
        start: latestDataMonth.format('YYYY-MM-DD'),
        end: latestDataMonthEnd.format('YYYY-MM-DD')
      },
      previousDataMonth: {
        start: previousDataMonth.format('YYYY-MM-DD'),
        end: previousDataMonthEnd.format('YYYY-MM-DD')
      }
    });

    // Get current month and previous month data in parallel
    const [
      currentMonthSales,
      previousMonthSales,
      currentMonthDistinctOrders,
      previousMonthDistinctOrders,
      allProducts,
      currentMonthAdvertising,
      previousMonthAdvertising,
      currentMonthAffiliate,
      previousMonthAffiliate,
      currentMonthSalaries,
      previousMonthSalaries
    ] = await Promise.all([
      // Latest month sales aggregates
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: latestDataMonth.toDate(),
            lte: latestDataMonthEnd.toDate()
          }
        },
        _sum: {
          quantity: true,
          order_amount: true,
          total_revenue: true,
          settlement_amount: true,
          hpp: true
        },
        _count: {
          _all: true
        }
      }),
      
      // Previous month sales aggregates
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: previousDataMonth.toDate(),
            lte: previousDataMonthEnd.toDate()
          }
        },
        _sum: {
          quantity: true,
          order_amount: true,
          total_revenue: true,
          settlement_amount: true,
          hpp: true
        },
        _count: {
          _all: true
        }
      }),
      
      // Latest month distinct orders
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: {
          created_time: {
            gte: latestDataMonth.toDate(),
            lte: latestDataMonthEnd.toDate()
          }
        },
        _count: {
          order_id: true
        }
      }),
      
      // Previous month distinct orders
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: {
          created_time: {
            gte: previousDataMonth.toDate(),
            lte: previousDataMonthEnd.toDate()
          }
        },
        _count: {
          order_id: true
        }
      }),
      
      // Product data for stock calculations (static data)
      prisma.productData.findMany(),
      
      // Latest month advertising settlement
      prisma.advertisingSettlement.aggregate({
        where: {
          order_settled_time: {
            gte: latestDataMonth.toDate(),
            lte: latestDataMonthEnd.toDate()
          }
        },
        _sum: {
          settlement_amount: true
        }
      }).catch(() => ({ _sum: { settlement_amount: 0 } })),
      
      // Previous month advertising settlement
      prisma.advertisingSettlement.aggregate({
        where: {
          order_settled_time: {
            gte: previousDataMonth.toDate(),
            lte: previousDataMonthEnd.toDate()
          }
        },
        _sum: {
          settlement_amount: true
        }
      }).catch(() => ({ _sum: { settlement_amount: 0 } })),
      
      // Latest month affiliate endorse
      prisma.affiliateEndorsement.aggregate({
        where: {
          created_at: {
            gte: latestDataMonth.toDate(),
            lte: latestDataMonthEnd.toDate()
          }
        },
        _sum: {
          endorse_fee: true,
          actual_sales: true,
          total_commission: true
        }
      }).catch(() => ({ _sum: { endorse_fee: 0, actual_sales: 0, total_commission: 0 } })),
      
      // Previous month affiliate endorse
      prisma.affiliateEndorsement.aggregate({
        where: {
          created_at: {
            gte: previousDataMonth.toDate(),
            lte: previousDataMonthEnd.toDate()
          }
        },
        _sum: {
          endorse_fee: true,
          actual_sales: true,
          total_commission: true
        }
      }).catch(() => ({ _sum: { endorse_fee: 0, actual_sales: 0, total_commission: 0 } })),
      
      // Latest month salaries & benefits
      prisma.cashFlowEntry.aggregate({
        where: {
          entry_type: 'expense',
          category: 'Salaries & Benefits',
          date: {
            gte: latestDataMonth.toDate(),
            lte: latestDataMonthEnd.toDate()
          }
        },
        _sum: {
          amount: true
        }
      }).catch(() => ({ _sum: { amount: 0 } })),
      
      // Previous month salaries & benefits
      prisma.cashFlowEntry.aggregate({
        where: {
          entry_type: 'expense',
          category: 'Salaries & Benefits',
          date: {
            gte: previousDataMonth.toDate(),
            lte: previousDataMonthEnd.toDate()
          }
        },
        _sum: {
          amount: true
        }
      }).catch(() => ({ _sum: { amount: 0 } }))
    ]);

    // Calculate current month metrics
    const currentMetrics = {
      distinctOrders: currentMonthDistinctOrders.length,
      totalQuantitySold: currentMonthSales._sum.quantity || 0,
      totalGMV: currentMonthSales._sum.order_amount || 0,
      totalRevenue: currentMonthSales._sum.total_revenue || 0,
      totalSettlementAmount: currentMonthSales._sum.settlement_amount || 0,
      totalHPP: currentMonthSales._sum.hpp || 0,
      totalProfit: (currentMonthSales._sum.settlement_amount || 0) - (currentMonthSales._sum.hpp || 0),
      totalAdvertisingSettlement: currentMonthAdvertising._sum.settlement_amount || 0,
      totalAffiliateEndorseFee: currentMonthAffiliate._sum.endorse_fee || 0,
      totalAffiliateActualSales: currentMonthAffiliate._sum.actual_sales || 0,
      totalAffiliateCommission: currentMonthAffiliate._sum.total_commission || 0,
      totalSalariesBenefits: currentMonthSalaries._sum.amount || 0,
      averageOrderValue: currentMonthDistinctOrders.length > 0 ? 
        (currentMonthSales._sum.total_revenue || 0) / currentMonthDistinctOrders.length : 0
    };

    // Calculate previous month metrics
    const previousMetrics = {
      distinctOrders: previousMonthDistinctOrders.length,
      totalQuantitySold: previousMonthSales._sum.quantity || 0,
      totalGMV: previousMonthSales._sum.order_amount || 0,
      totalRevenue: previousMonthSales._sum.total_revenue || 0,
      totalSettlementAmount: previousMonthSales._sum.settlement_amount || 0,
      totalHPP: previousMonthSales._sum.hpp || 0,
      totalProfit: (previousMonthSales._sum.settlement_amount || 0) - (previousMonthSales._sum.hpp || 0),
      totalAdvertisingSettlement: previousMonthAdvertising._sum.settlement_amount || 0,
      totalAffiliateEndorseFee: previousMonthAffiliate._sum.endorse_fee || 0,
      totalAffiliateActualSales: previousMonthAffiliate._sum.actual_sales || 0,
      totalAffiliateCommission: previousMonthAffiliate._sum.total_commission || 0,
      totalSalariesBenefits: previousMonthSalaries._sum.amount || 0,
      averageOrderValue: previousMonthDistinctOrders.length > 0 ? 
        (previousMonthSales._sum.total_revenue || 0) / previousMonthDistinctOrders.length : 0
    };

    // Calculate net profit for both months
    currentMetrics.netProfit = currentMetrics.totalProfit - 
                               currentMetrics.totalAdvertisingSettlement - 
                               currentMetrics.totalAffiliateEndorseFee - 
                               currentMetrics.totalSalariesBenefits;

    previousMetrics.netProfit = previousMetrics.totalProfit - 
                                previousMetrics.totalAdvertisingSettlement - 
                                previousMetrics.totalAffiliateEndorseFee - 
                                previousMetrics.totalSalariesBenefits;

    // Stock metrics (current snapshot - not time-specific)
    const stockMetrics = {
      totalProducts: allProducts.length,
      lowStockProducts: allProducts.filter(product => 
        product.stock_quantity <= product.min_stock && product.stock_quantity > 0
      ).length,
      outOfStockProducts: allProducts.filter(product => 
        product.stock_quantity === 0
      ).length,
      totalStockQuantity: allProducts.reduce((sum, product) => sum + (product.stock_quantity || 0), 0),
      totalStockValue: allProducts.reduce((sum, product) => 
        sum + ((product.stock_quantity || 0) * (product.price || 0)), 0),
      averageStockPerProduct: allProducts.length > 0 ? 
        allProducts.reduce((sum, product) => sum + (product.stock_quantity || 0), 0) / allProducts.length : 0
    };

    // Helper function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };

    // Helper function to determine trend direction and color
    const getTrendInfo = (current, previous, isNegativeBetter = false) => {
      const change = calculatePercentageChange(current, previous);
      const isPositive = change > 0;
      const isImprovement = isNegativeBetter ? !isPositive : isPositive;
      
      return {
        percentageChange: change,
        direction: isPositive ? 'up' : change < 0 ? 'down' : 'neutral',
        color: change === 0 ? 'text-gray-600' : 
               isImprovement ? 'text-green-600' : 'text-red-600',
        isImprovement,
        absoluteChange: current - previous
      };
    };

    // Calculate trends for all KPIs
    const kpiTrends = {
      distinctOrders: getTrendInfo(currentMetrics.distinctOrders, previousMetrics.distinctOrders),
      totalQuantitySold: getTrendInfo(currentMetrics.totalQuantitySold, previousMetrics.totalQuantitySold),
      totalGMV: getTrendInfo(currentMetrics.totalGMV, previousMetrics.totalGMV),
      totalRevenue: getTrendInfo(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
      totalSettlementAmount: getTrendInfo(currentMetrics.totalSettlementAmount, previousMetrics.totalSettlementAmount),
      totalProfit: getTrendInfo(currentMetrics.totalProfit, previousMetrics.totalProfit),
      totalAdvertisingSettlement: getTrendInfo(currentMetrics.totalAdvertisingSettlement, previousMetrics.totalAdvertisingSettlement, true), // Lower is better
      totalAffiliateEndorseFee: getTrendInfo(currentMetrics.totalAffiliateEndorseFee, previousMetrics.totalAffiliateEndorseFee, true), // Lower is better
      netProfit: getTrendInfo(currentMetrics.netProfit, previousMetrics.netProfit),
      averageOrderValue: getTrendInfo(currentMetrics.averageOrderValue, previousMetrics.averageOrderValue)
    };

    const result = {
      currentPeriod: {
        label: latestDataMonth.format('MMMM YYYY'),
        startDate: latestDataMonth.format('YYYY-MM-DD'),
        endDate: latestDataMonthEnd.format('YYYY-MM-DD'),
        metrics: currentMetrics
      },
      previousPeriod: {
        label: previousDataMonth.format('MMMM YYYY'),
        startDate: previousDataMonth.format('YYYY-MM-DD'),
        endDate: previousDataMonthEnd.format('YYYY-MM-DD'),
        metrics: previousMetrics
      },
      stockMetrics,
      trends: kpiTrends,
      summary: {
        totalKPIs: Object.keys(kpiTrends).length,
        improvingKPIs: Object.values(kpiTrends).filter(trend => trend.isImprovement).length,
        decliningKPIs: Object.values(kpiTrends).filter(trend => !trend.isImprovement && trend.direction !== 'neutral').length,
        neutralKPIs: Object.values(kpiTrends).filter(trend => trend.direction === 'neutral').length
      }
    };

    console.log('✅ Monthly trends calculated successfully:', {
      currentMonth: result.currentPeriod.label,
      previousMonth: result.previousPeriod.label,
      currentOrders: currentMetrics.distinctOrders,
      previousOrders: previousMetrics.distinctOrders,
      ordersTrend: kpiTrends.distinctOrders.percentageChange.toFixed(1) + '%',
      currentRevenue: currentMetrics.totalRevenue,
      previousRevenue: previousMetrics.totalRevenue,
      revenueTrend: kpiTrends.totalRevenue.percentageChange.toFixed(1) + '%',
      improvingKPIs: result.summary.improvingKPIs,
      decliningKPIs: result.summary.decliningKPIs
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching monthly trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly trends',
      details: error.message
    });
  }
};

/**
 * Get lightweight monthly trend summary for quick display
 */
const getMonthlyTrendSummary = async (req, res) => {
  try {
    console.log('📊 Fetching lightweight monthly trend summary based on latest data...');

    // Find the latest month with data
    const latestSale = await prisma.salesData.findFirst({
      orderBy: {
        created_time: 'desc'
      },
      select: {
        created_time: true
      }
    });

    if (!latestSale) {
      return res.json({
        success: true,
        data: {
          currentMonth: 'No Data',
          previousMonth: 'No Data',
          revenueChange: { percentage: 0, direction: 'neutral', color: 'text-gray-600' },
          profitChange: { percentage: 0, direction: 'neutral', color: 'text-gray-600' },
          currentMetrics: { revenue: 0, profit: 0, sales: 0 },
          previousMetrics: { revenue: 0, profit: 0, sales: 0 }
        }
      });
    }

    // Get latest month vs previous month basic metrics
    const latestDataMonth = moment(latestSale.created_time).startOf('month');
    const previousDataMonth = moment(latestDataMonth).subtract(1, 'month').startOf('month');
    const previousDataMonthEnd = moment(previousDataMonth).endOf('month');
    const latestDataMonthEnd = moment(latestDataMonth).endOf('month');

    const [
      currentMonthBasics,
      previousMonthBasics
    ] = await Promise.all([
      // Latest month basics
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: latestDataMonth.toDate(),
            lte: latestDataMonthEnd.toDate()
          }
        },
        _sum: {
          total_revenue: true,
          settlement_amount: true,
          hpp: true
        },
        _count: {
          _all: true
        }
      }),
      
      // Previous month basics
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: previousDataMonth.toDate(),
            lte: previousDataMonthEnd.toDate()
          }
        },
        _sum: {
          total_revenue: true,
          settlement_amount: true,
          hpp: true
        },
        _count: {
          _all: true
        }
      })
    ]);

    const currentRevenue = currentMonthBasics._sum.total_revenue || 0;
    const previousRevenue = previousMonthBasics._sum.total_revenue || 0;
    const currentProfit = (currentMonthBasics._sum.settlement_amount || 0) - (currentMonthBasics._sum.hpp || 0);
    const previousProfit = (previousMonthBasics._sum.settlement_amount || 0) - (previousMonthBasics._sum.hpp || 0);

    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const profitChange = previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;

    const summary = {
      currentMonth: latestDataMonth.format('MMMM YYYY'),
      previousMonth: previousDataMonth.format('MMMM YYYY'),
      revenueChange: {
        percentage: revenueChange,
        direction: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral',
        color: revenueChange === 0 ? 'text-gray-600' : 
               revenueChange > 0 ? 'text-green-600' : 'text-red-600'
      },
      profitChange: {
        percentage: profitChange,
        direction: profitChange > 0 ? 'up' : profitChange < 0 ? 'down' : 'neutral',
        color: profitChange === 0 ? 'text-gray-600' : 
               profitChange > 0 ? 'text-green-600' : 'text-red-600'
      },
      currentMetrics: {
        revenue: currentRevenue,
        profit: currentProfit,
        sales: currentMonthBasics._count._all
      },
      previousMetrics: {
        revenue: previousRevenue,
        profit: previousProfit,
        sales: previousMonthBasics._count._all
      }
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Error fetching monthly trend summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly trend summary',
      details: error.message
    });
  }
};

module.exports = {
  getMonthlyTrends,
  getMonthlyTrendSummary
};