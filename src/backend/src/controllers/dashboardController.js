const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

// Get dashboard metrics with optimized Prisma queries
const getDashboardMetrics = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard metrics with optimized queries...');
    
    // Date range filtering support
    const { start_date, end_date } = req.query;
    let whereCondition = {};
    
    if (start_date && end_date) {
      const startDate = moment(start_date).startOf('day');
      const endDate = moment(end_date).endOf('day');
      
      whereCondition = {
        created_time: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      };
      
      console.log('📅 Using date range filter:', {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      });
    } else {
      console.log('📅 No date filtering - showing all data');
    }
    
    const today = moment().startOf('day');
    const currentMonth = moment().startOf('month');
    
    // ✅ OPTIMIZED: Use Prisma aggregate instead of findMany + reduce
    const [
      salesAggregates,
      todaySalesAggregates,
      monthSalesAggregates,
      distinctOrdersCount,
      todayDistinctOrdersCount,
      monthDistinctOrdersCount,
      allProducts,
      productCategoryAggregates,
      productBrandAggregates,
      advertisingSettlementAggregates,
      affiliateEndorseAggregates,
      returnsAndCancellationsAggregates,
      marketplaceReimbursementsAggregates,
      commissionAdjustmentsAggregates,
      affiliateSamplesAggregates
    ] = await Promise.all([
      // Total aggregates (with date filtering if applied)
      prisma.salesData.aggregate({
        where: whereCondition,
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
      // Today aggregates
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: today.toDate()
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
      // Month aggregates
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: currentMonth.toDate()
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
      // Distinct orders count - total (with date filtering if applied)
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: whereCondition,
        _count: {
          order_id: true
        }
      }),
      // Distinct orders count - today
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: {
          created_time: {
            gte: today.toDate()
          }
        },
        _count: {
          order_id: true
        }
      }),
      // Distinct orders count - month
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: {
          created_time: {
            gte: currentMonth.toDate()
          }
        },
        _count: {
          order_id: true
        }
      }),
      // Product data for stock analysis
      prisma.productData.findMany(),
      // ✅ FIXED: Category mapping from productData
      prisma.productData.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      }),
      // ✅ FIXED: Brand mapping from productData
      prisma.productData.groupBy({
        by: ['brand'],
        _count: {
          brand: true
        }
      }),
      // ✅ NEW: Advertising Settlement aggregates (with date filtering)
      (async () => {
        try {
          const result = await prisma.advertisingSettlement.aggregate({
            where: start_date && end_date ? {
              order_settled_time: {
                gte: moment(start_date).startOf('day').toDate(),
                lte: moment(end_date).endOf('day').toDate()
              }
            } : {},
            _sum: {
              settlement_amount: true
            },
            _count: {
              _all: true
            }
          });
          console.log('📊 Advertising Settlement aggregation result:', {
            amount: result._sum.settlement_amount || 0,
            count: result._count._all || 0,
            dateFilter: start_date && end_date ? `${start_date} to ${end_date}` : 'No filter'
          });
          return result;
        } catch (error) {
          console.error('❌ Advertising Settlement aggregation failed:', error);
          return { _sum: { settlement_amount: 0 }, _count: { _all: 0 } };
        }
      })(),
      // ✅ NEW: Affiliate Endorse aggregates (with date filtering)
      prisma.affiliateEndorsement.aggregate({
        where: start_date && end_date ? {
          start_date: {
            gte: moment(start_date).startOf('day').toDate(),
            lte: moment(end_date).endOf('day').toDate()
          }
        } : {},
        _sum: {
          endorse_fee: true,
          actual_sales: true,
          total_commission: true
        },
        _count: {
          _all: true
        }
      }).catch(() => ({ _sum: { endorse_fee: 0, actual_sales: 0, total_commission: 0 }, _count: { _all: 0 } })),
      
      // 🔄 NEW: Returns & Cancellations aggregates (with date filtering)
      prisma.returnsAndCancellations.aggregate({
        where: start_date && end_date ? {
          return_date: {
            gte: moment(start_date).startOf('day').toDate(),
            lte: moment(end_date).endOf('day').toDate()
          }
        } : {},
        _sum: {
          returned_amount: true,
          refund_amount: true,
          restocking_fee: true
        },
        _count: {
          _all: true
        }
      }).catch(() => ({ _sum: { returned_amount: 0, refund_amount: 0, restocking_fee: 0 }, _count: { _all: 0 } })),
      
      // 💰 NEW: Marketplace Reimbursements aggregates (with date filtering)
      prisma.marketplaceReimbursement.aggregate({
        where: start_date && end_date ? {
          received_date: {
            gte: moment(start_date).startOf('day').toDate(),
            lte: moment(end_date).endOf('day').toDate()
          }
        } : {},
        _sum: {
          received_amount: true,
          processing_fee: true
        },
        _count: {
          _all: true
        }
      }).catch(() => ({ _sum: { received_amount: 0, processing_fee: 0 }, _count: { _all: 0 } })),
      
      // 📉 NEW: Commission Adjustments aggregates (with date filtering)
      prisma.commissionAdjustments.aggregate({
        where: start_date && end_date ? {
          adjustment_date: {
            gte: moment(start_date).startOf('day').toDate(),
            lte: moment(end_date).endOf('day').toDate()
          }
        } : {},
        _sum: {
          adjustment_amount: true,
          original_commission: true
        },
        _count: {
          _all: true
        }
      }).catch(() => ({ _sum: { adjustment_amount: 0, original_commission: 0 }, _count: { _all: 0 } })),
      
      // 🎁 NEW: Affiliate Samples aggregates (with date filtering)
      prisma.affiliateSamples.aggregate({
        where: start_date && end_date ? {
          given_date: {
            gte: moment(start_date).startOf('day').toDate(),
            lte: moment(end_date).endOf('day').toDate()
          }
        } : {},
        _sum: {
          total_cost: true,
          shipping_cost: true,
          packaging_cost: true
        },
        _count: {
          _all: true
        }
      }).catch(() => ({ _sum: { total_cost: 0, shipping_cost: 0, packaging_cost: 0 }, _count: { _all: 0 } }))
    ]);
    
    console.log('📈 Optimized aggregates loaded successfully');
    
    // ✅ Core KPI Calculations using aggregated data:
    
    // 1. Jumlah pesanan = distinct order_id count
    const distinctOrders = distinctOrdersCount.length;
    const todayDistinctOrders = todayDistinctOrdersCount.length;
    const monthDistinctOrders = monthDistinctOrdersCount.length;
    
    // 2. Produk terjual = sum quantity
    const totalQuantitySold = salesAggregates._sum.quantity || 0;
    
    // 3. ✅ GMV = sum order_amount (Gross Merchandise Value)
    const totalGMV = salesAggregates._sum.order_amount || 0;
    const todayGMV = todaySalesAggregates._sum.order_amount || 0;
    const monthGMV = monthSalesAggregates._sum.order_amount || 0;
    
    // 4. ✅ FIXED: Revenue = sum total_revenue ONLY (no fallback)
    const totalRevenue = salesAggregates._sum.total_revenue || 0;
    const todayRevenue = todaySalesAggregates._sum.total_revenue || 0;
    const monthRevenue = monthSalesAggregates._sum.total_revenue || 0;
    
    // 5. ✅ UPDATED: Profit = sum(settlement_amount - hpp) instead of (total_revenue - hpp)
    const totalHPP = salesAggregates._sum.hpp || 0;
    const totalSettlementAmount = salesAggregates._sum.settlement_amount || 0;
    const totalProfit = totalSettlementAmount - totalHPP;
    const profitMargin = totalSettlementAmount > 0 ? (totalProfit / totalSettlementAmount) * 100 : 0;
    
    // Average Order Value based on distinct orders
    const averageOrderValue = distinctOrders > 0 ? totalRevenue / distinctOrders : 0;
    
    // Product metrics
    const lowStockProducts = allProducts.filter(product => 
      product.stock_quantity <= product.min_stock && product.stock_quantity > 0
    ).length;
    const outOfStockProducts = allProducts.filter(product => 
      product.stock_quantity === 0
    ).length;
    
    // ✅ NEW: Calculate total stock value and metrics
    let totalStockQuantity = 0;
    let totalStockValue = 0;
    let totalStockCost = 0;
    
    allProducts.forEach(product => {
      const quantity = product.stock_quantity || 0;
      const sellingPrice = product.price || 0;
      const costPrice = product.cost || 0;
      
      totalStockQuantity += quantity;
      totalStockValue += quantity * sellingPrice; // Stock value at selling price
      totalStockCost += quantity * costPrice; // Stock value at cost price
    });
    
    const averageStockPerProduct = allProducts.length > 0 ? totalStockQuantity / allProducts.length : 0;
    
    // ✅ NEW: Advertising Settlement calculations
    const totalAdvertisingSettlement = advertisingSettlementAggregates._sum.settlement_amount || 0;
    
    // ✅ NEW: Affiliate Endorse calculations
    const totalAffiliateEndorseFee = affiliateEndorseAggregates._sum.endorse_fee || 0;
    const totalAffiliateActualSales = affiliateEndorseAggregates._sum.actual_sales || 0;
    const totalAffiliateCommission = affiliateEndorseAggregates._sum.total_commission || 0;
    
    // ⭐ NEW: Returns & Cancellations calculations
    const totalReturnsAmount = returnsAndCancellationsAggregates._sum.returned_amount || 0;
    const totalRefundAmount = returnsAndCancellationsAggregates._sum.refund_amount || 0;
    const totalRestockingFee = returnsAndCancellationsAggregates._sum.restocking_fee || 0;
    const totalReturnsCount = returnsAndCancellationsAggregates._count._all || 0;
    
    // ⭐ NEW: Marketplace Reimbursement calculations
    const totalReimbursementReceived = marketplaceReimbursementsAggregates._sum.received_amount || 0;
    const totalReimbursementFees = marketplaceReimbursementsAggregates._sum.processing_fee || 0;
    const totalReimbursementCount = marketplaceReimbursementsAggregates._count._all || 0;
    
    // ⭐ NEW: Commission Adjustments calculations
    const totalCommissionAdjustment = commissionAdjustmentsAggregates._sum.adjustment_amount || 0;
    const totalOriginalCommission = commissionAdjustmentsAggregates._sum.original_commission || 0;
    const totalCommissionAdjustmentCount = commissionAdjustmentsAggregates._count._all || 0;
    
    // ⭐ NEW: Affiliate Samples calculations
    const totalAffiliateSampleCost = affiliateSamplesAggregates._sum.total_cost || 0;
    const totalAffiliateSampleShipping = affiliateSamplesAggregates._sum.shipping_cost || 0;
    const totalAffiliateSamplePackaging = affiliateSamplesAggregates._sum.packaging_cost || 0;
    const totalAffiliateSampleCount = affiliateSamplesAggregates._count._all || 0;
    const totalAffiliateSampleInvestment = totalAffiliateSampleCost + totalAffiliateSampleShipping + totalAffiliateSamplePackaging;
    
    // ✅ NEW: Cash Flow Expenses - Salaries & Benefits calculation
    let totalSalariesBenefits = 0;
    try {
      const salariesAggregates = await prisma.cashFlowEntry.aggregate({
        where: {
          entry_type: 'expense',
          category: 'Salaries & Benefits'
        },
        _sum: {
          amount: true
        }
      });
      totalSalariesBenefits = salariesAggregates._sum.amount || 0;
    } catch (salariesError) {
      console.warn('⚠️ Could not fetch salaries data:', salariesError.message);
      totalSalariesBenefits = 0;
    }
    
    // ⭐ COMPREHENSIVE NET PROFIT FORMULA: 
    // Total Profit - Advertising Settlement - Affiliate Endorse Fee - Salaries & Benefits 
    // - Returns Loss + Reimbursement Received - Commission Adjustments - Affiliate Sample Investment
    const netProfit = totalProfit 
      - totalAdvertisingSettlement 
      - totalAffiliateEndorseFee 
      - totalSalariesBenefits
      - (totalReturnsAmount - totalRefundAmount) // Net return loss
      + totalReimbursementReceived // Recovery from marketplace
      - Math.abs(totalCommissionAdjustment) // Commission losses (usually negative)
      - totalAffiliateSampleInvestment; // Sample investment cost
    
    // ✅ FIXED: Use productData for categories and brands
    const totalCategories = productCategoryAggregates.filter(cat => cat.category).length;
    const totalBrands = productBrandAggregates.filter(brand => brand.brand).length;
    
    // Color and size data from products
    const allColors = new Set(allProducts.map(p => p.color).filter(Boolean));
    const allSizes = new Set(allProducts.map(p => p.size).filter(Boolean));
    
    const metrics = {
      // Core KPI metrics
      distinctOrders,
      totalQuantitySold,
      totalGMV,
      totalRevenue,
      totalSettlementAmount,
      totalProfit,
      totalHPP,
      profitMargin,
      
      // Secondary metrics
      totalSales: salesAggregates._count._all,
      todayGMV,
      todayRevenue,
      todaySales: todaySalesAggregates._count._all,
      todayOrders: todayDistinctOrders,
      monthGMV,
      monthRevenue,
      monthSales: monthSalesAggregates._count._all,
      monthOrders: monthDistinctOrders,
      averageOrderValue,
      totalProducts: allProducts.length,
      lowStockProducts,
      outOfStockProducts,
      totalCategories,
      totalBrands,
      totalColors: allColors.size,
      totalSizes: allSizes.size,
      
      // ✅ NEW: Stock metrics
      totalStockQuantity,
      totalStockValue,
      totalStockCost,
      averageStockPerProduct,
      
      // ✅ NEW: Advertising Settlement metrics
      totalAdvertisingSettlement,
      
      // ✅ NEW: Affiliate Endorse metrics
      totalAffiliateEndorseFee,
      totalAffiliateActualSales,
      totalAffiliateCommission,
      
      // ✅ NEW: Cash Flow - Salaries & Benefits
      totalSalariesBenefits,
      
      // ⭐ NEW: Returns & Cancellations metrics
      totalReturnsAmount,
      totalRefundAmount,
      totalRestockingFee,
      totalReturnsCount,
      
      // ⭐ NEW: Marketplace Reimbursement metrics
      totalReimbursementReceived,
      totalReimbursementFees,
      totalReimbursementCount,
      
      // ⭐ NEW: Commission Adjustments metrics
      totalCommissionAdjustment,
      totalOriginalCommission,
      totalCommissionAdjustmentCount,
      
      // ⭐ NEW: Affiliate Samples metrics
      totalAffiliateSampleCost,
      totalAffiliateSampleShipping,
      totalAffiliateSamplePackaging,
      totalAffiliateSampleInvestment,
      totalAffiliateSampleCount,
      
      // ⭐ COMPREHENSIVE: Net Profit dengan semua faktor bisnis
      netProfit
    };
    
    console.log('✅ Dashboard metrics calculated with optimized queries:', {
      distinctOrders: metrics.distinctOrders,
      totalQuantitySold: metrics.totalQuantitySold,
      totalGMV: metrics.totalGMV,
      totalRevenue: metrics.totalRevenue,
      totalSettlementAmount: metrics.totalSettlementAmount,
      totalProfit: metrics.totalProfit,
      totalHPP: metrics.totalHPP,
      profitFormula: 'settlement_amount - hpp',
      totalAdvertisingSettlement: metrics.totalAdvertisingSettlement,
      totalAffiliateEndorseFee: metrics.totalAffiliateEndorseFee,
      totalAffiliateActualSales: metrics.totalAffiliateActualSales,
      totalAffiliateCommission: metrics.totalAffiliateCommission,
      totalSalariesBenefits: metrics.totalSalariesBenefits,
      netProfit: metrics.netProfit,
      netProfitFormula: 'total_profit - advertising_settlement - affiliate_endorse_fee - salaries_benefits',
      totalStockQuantity: metrics.totalStockQuantity,
      totalStockValue: metrics.totalStockValue,
      totalProducts: metrics.totalProducts
    });
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
      message: error.message
    });
  }
};

// Get chart data for analytics dashboard
const getChartData = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    console.log(`📊 Generating chart data for ${period} (${days} days)`);
    
    const allSales = await prisma.salesData.findMany({
      where: {
        created_time: {
          gte: moment().subtract(days, 'days').toDate()
        }
      },
      orderBy: { created_time: 'asc' }
    });
    
    const data = [];
    const today = moment();
    
    // Generate time-series data for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      
      // Filter sales by created_time for this specific day
      const daySales = allSales.filter(sale => {
        const saleDate = moment(sale.created_time);
        return saleDate.format('YYYY-MM-DD') === dateStr;
      });
      
      // ✅ FIXED: Calculate revenue using ONLY total_revenue per day
      const dayRevenue = daySales.reduce((sum, sale) => {
        return sum + (sale.total_revenue || 0);
      }, 0);
      
      // Calculate distinct orders per day
      const dayOrders = new Set(daySales.map(sale => sale.order_id)).size;
      
      // Calculate quantity sold per day
      const dayQuantity = daySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      
      // Smart target calculation
      let target = 0;
      if (dayRevenue > 0) {
        target = dayRevenue * 1.2;
      } else {
        // Average from recent sales for realistic target
        const recentRevenue = allSales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0);
        const recentDays = Math.min(days, 7);
        target = recentRevenue > 0 ? (recentRevenue / recentDays) * 0.8 : 500000;
      }
      
      data.push({
        name: `Hari ${days - i}`,
        penjualan: dayRevenue,
        target: target,
        date: dateStr,
        orders: dayOrders,
        quantity: dayQuantity,
        salesCount: daySales.length
      });
    }
    
    console.log(`✅ Chart data generated: ${data.length} data points`);
    
    res.json({
      success: true,
      data: data,
      period: period,
      totalDataPoints: data.length
    });
    
  } catch (error) {
    console.error('❌ Chart data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data',
      message: error.message
    });
  }
};

// ✅ FIXED: Get category sales data using productData.category
const getCategorySales = async (req, res) => {
  try {
    console.log('📊 Fetching category sales data with proper category mapping...');
    
    // ✅ OPTIMIZED: Use groupBy with join to productData
    const categorySalesData = await prisma.salesData.groupBy({
      by: ['product_name', 'color', 'size'],
      _sum: {
        quantity: true,
        total_revenue: true
      },
      _count: {
        _all: true
      }
    });
    
    // Get product data for category mapping
    const productData = await prisma.productData.findMany({
      select: {
        product_name: true,
        color: true,
        size: true,
        category: true
      }
    });
    
    // Create product lookup map
    const productLookup = new Map();
    productData.forEach(product => {
      const key = `${product.product_name}-${product.color}-${product.size}`;
      productLookup.set(key, product.category);
    });
    
    const categoryMap = new Map();
    
    categorySalesData.forEach(sale => {
      // ✅ FIXED: Use productData.category instead of parsing product_name
      const productKey = `${sale.product_name}-${sale.color}-${sale.size}`;
      const category = productLookup.get(productKey) || 'Uncategorized';
      
      const existing = categoryMap.get(category) || { sales: 0, revenue: 0 };
      categoryMap.set(category, {
        sales: existing.sales + (sale._sum.quantity || 0),
        revenue: existing.revenue + (sale._sum.total_revenue || 0)
      });
    });
    
    const categorySales = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
    
    console.log(`✅ Category sales calculated with proper mapping: ${categorySales.length} categories`);
    
    res.json({
      success: true,
      data: categorySales
    });
    
  } catch (error) {
    console.error('❌ Category sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category sales',
      message: error.message
    });
  }
};

// ✅ FIXED: Get brand performance data using productData.brand
const getBrandPerformance = async (req, res) => {
  try {
    console.log('📊 Fetching brand performance data with proper brand mapping...');
    
    // ✅ OPTIMIZED: Use groupBy with join to productData
    const brandSalesData = await prisma.salesData.groupBy({
      by: ['product_name', 'color', 'size'],
      _sum: {
        quantity: true,
        total_revenue: true
      },
      _count: {
        _all: true
      }
    });
    
    // Get product data for brand mapping
    const productData = await prisma.productData.findMany({
      select: {
        product_name: true,
        color: true,
        size: true,
        brand: true
      }
    });
    
    // Create product lookup map
    const productLookup = new Map();
    productData.forEach(product => {
      const key = `${product.product_name}-${product.color}-${product.size}`;
      productLookup.set(key, product.brand);
    });
    
    const brandMap = new Map();
    
    brandSalesData.forEach(sale => {
      // ✅ FIXED: Use productData.brand instead of parsing seller_sku
      const productKey = `${sale.product_name}-${sale.color}-${sale.size}`;
      const brand = productLookup.get(productKey) || 'D\'Busana';
      
      const existing = brandMap.get(brand) || { sales: 0, revenue: 0 };
      brandMap.set(brand, {
        sales: existing.sales + (sale._sum.quantity || 0),
        revenue: existing.revenue + (sale._sum.total_revenue || 0)
      });
    });
    
    const brandPerformance = Array.from(brandMap.entries())
      .map(([brand, data]) => ({ brand, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
    
    console.log(`✅ Brand performance calculated with proper mapping: ${brandPerformance.length} brands`);
    
    res.json({
      success: true,
      data: brandPerformance
    });
    
  } catch (error) {
    console.error('❌ Brand performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand performance',
      message: error.message
    });
  }
};

// ✅ OPTIMIZED: Get top products with groupBy
const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log(`📊 Fetching top ${limit} products with optimized query...`);
    
    // ✅ OPTIMIZED: Use groupBy instead of findMany + reduce
    const topProductsData = await prisma.salesData.groupBy({
      by: ['product_name', 'color', 'size'],
      _sum: {
        quantity: true,
        total_revenue: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: parseInt(limit)
    });
    
    const topProducts = topProductsData.map(item => ({
      product: `${item.product_name} - ${item.color} - ${item.size}`,
      sales: item._sum.quantity || 0,
      revenue: item._sum.total_revenue || 0,
      orders: item._count._all || 0
    }));
    
    console.log(`✅ Top products calculated with optimized query: ${topProducts.length} products`);
    
    res.json({
      success: true,
      data: topProducts
    });
    
  } catch (error) {
    console.error('❌ Top products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top products',
      message: error.message
    });
  }
};

// Get recent activities - Enhanced with optimized fallback
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 15 } = req.query;
    
    console.log(`📊 Fetching recent ${limit} activities with optimized fallback...`);
    
    const activities = [];
    let hasMainData = false;
    
    try {
      // 1. Recent sales activities (most important) - optimized query
      const recentSales = await prisma.salesData.findMany({
        orderBy: { delivered_time: 'desc' }, // Prioritize delivered_time
        take: Math.min(parseInt(limit), 10), // Get enough for fallback
        select: {
          order_id: true,
          product_name: true,
          color: true,
          size: true,
          marketplace: true,
          total_revenue: true,
          settlement_amount: true,
          quantity: true,
          delivered_time: true,
          created_time: true
        }
      });
      
      if (recentSales.length > 0) {
        hasMainData = true;
        recentSales.forEach((sale, index) => {
          activities.push({
            id: `sale-${sale.order_id}-${index}`,
            type: 'sale',
            title: 'Transaksi Penjualan',
            description: `${sale.product_name} ${sale.color}/${sale.size} - ${sale.marketplace}`,
            timestamp: sale.delivered_time || sale.created_time,
            value: sale.total_revenue || sale.settlement_amount || 0,
            status: 'success',
            created_at: sale.delivered_time || sale.created_time,
            metadata: {
              product_name: sale.product_name,
              marketplace: sale.marketplace,
              amount: sale.total_revenue || sale.settlement_amount || 0
            }
          });
        });
        
        console.log(`✅ Added ${recentSales.length} sales activities`);
      } else {
        console.warn('⚠️ No sales activities found');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch sales activities:', err.message);
    }

    try {
      // 2. Recent stock movements
      const recentStock = await prisma.stockData.findMany({
        orderBy: { movement_date: 'desc' },
        take: Math.min(parseInt(limit) * 0.3, 4), // 30% from stock
        select: {
          product_code: true,
          movement_type: true,
          quantity: true,
          reference_number: true,
          notes: true,
          movement_date: true
        }
      });
      
      recentStock.forEach((stock, index) => {
        const actionText = stock.movement_type === 'in' ? 'Masuk' : 
                          stock.movement_type === 'out' ? 'Keluar' : 'Penyesuaian';
        
        activities.push({
          id: `stock-${stock.product_code}-${index}`,
          type: 'stock',
          title: `Stok ${actionText}`,
          description: `${stock.product_code} - ${Math.abs(stock.quantity)} unit`,
          timestamp: stock.movement_date,
          value: stock.quantity,
          status: stock.movement_type === 'out' ? 'warning' : 'info',
          created_at: stock.movement_date
        });
      });
      
      console.log(`✅ Added ${recentStock.length} stock activities`);
    } catch (err) {
      console.warn('⚠️ Could not fetch stock activities:', err.message);
    }

    try {
      // 3. Recent advertising activities (if available)
      const recentAds = await prisma.advertisingSettlement.findMany({
        orderBy: { order_settled_time: 'desc' },
        take: Math.min(parseInt(limit) * 0.2, 3), // 20% from advertising
        select: {
          order_id: true,
          type: true,
          settlement_amount: true,
          order_settled_time: true,
          account_name: true,
          marketplace: true
        }
      });
      
      recentAds.forEach((ad, index) => {
        activities.push({
          id: `ad-${ad.order_id}-${index}`,
          type: 'advertising',
          title: 'Advertising Settlement',
          description: `${ad.type || 'Settlement'} - ${ad.account_name || ad.marketplace || 'Unknown'}`,
          timestamp: ad.order_settled_time,
          value: ad.settlement_amount || 0,
          status: 'info',
          created_at: ad.order_settled_time
        });
      });
      
      console.log(`✅ Added ${recentAds.length} advertising activities`);
    } catch (err) {
      console.warn('⚠️ Could not fetch advertising activities:', err.message);
    }

    try {
      // 4. Recent product additions/updates (if available)
      const recentProducts = await prisma.productData.findMany({
        orderBy: { created_at: 'desc' },
        take: Math.min(parseInt(limit) * 0.1, 2), // 10% from products
        select: {
          product_name: true,
          category: true,
          brand: true,
          created_at: true,
          updated_at: true
        }
      });
      
      recentProducts.forEach((product, index) => {
        const isNew = !product.updated_at || product.created_at === product.updated_at;
        
        activities.push({
          id: `product-${product.product_name}-${index}`,
          type: 'product',
          title: isNew ? 'Produk Baru' : 'Update Produk',
          description: `${product.product_name} - ${product.category}`,
          timestamp: product.updated_at || product.created_at,
          status: isNew ? 'success' : 'info',
          created_at: product.updated_at || product.created_at
        });
      });
      
      console.log(`✅ Added ${recentProducts.length} product activities`);
    } catch (err) {
      console.warn('⚠️ Could not fetch product activities:', err.message);
    }

    // Check if we have enough data or need to return fallback immediately
    if (!hasMainData || activities.length === 0) {
      console.log('📊 No main activities found, returning fallback immediately...');
      
      // Direct fallback based on available sales data
      try {
        const fallbackSales = await prisma.salesData.findMany({
          orderBy: { delivered_time: 'desc' },
          take: Math.min(parseInt(limit), 8),
          select: {
            order_id: true,
            product_name: true,
            marketplace: true,
            total_revenue: true,
            settlement_amount: true,
            delivered_time: true,
            created_time: true
          }
        });
        
        const fallbackActivities = fallbackSales.map((sale, index) => ({
          id: `fallback-sale-${index}`,
          type: 'sale',
          title: 'Transaksi Penjualan',
          description: `${sale.product_name} - ${sale.marketplace}`,
          timestamp: new Date(sale.delivered_time || sale.created_time).toISOString(),
          value: sale.total_revenue || sale.settlement_amount || 0,
          status: 'success',
          created_at: new Date(sale.delivered_time || sale.created_time).toISOString(),
          metadata: {
            product_name: sale.product_name,
            marketplace: sale.marketplace,
            amount: sale.total_revenue || sale.settlement_amount || 0
          }
        }));
        
        console.log(`⚡ Direct fallback provided: ${fallbackActivities.length} activities`);
        
        return res.json({
          success: true,
          data: fallbackActivities,
          fallback: true,
          summary: {
            total: fallbackActivities.length,
            types: ['sale'],
            latest: fallbackActivities[0]?.timestamp || null
          }
        });
        
      } catch (fallbackError) {
        console.error('❌ Direct fallback also failed:', fallbackError);
        return res.json({
          success: true,
          data: [],
          fallback: true,
          summary: { total: 0, types: [], latest: null }
        });
      }
    }

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .filter(activity => activity.timestamp) // Only activities with valid timestamps
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit))
      .map(activity => ({
        ...activity,
        // Ensure consistent timestamp format
        timestamp: new Date(activity.timestamp).toISOString(),
        created_at: new Date(activity.created_at || activity.timestamp).toISOString()
      }));
    
    console.log(`✅ Recent activities compiled: ${sortedActivities.length} activities from multiple sources`, {
      totalActivities: activities.length,
      finalCount: sortedActivities.length,
      types: [...new Set(sortedActivities.map(a => a.type))]
    });
    
    res.json({
      success: true,
      data: sortedActivities,
      summary: {
        total: sortedActivities.length,
        types: [...new Set(sortedActivities.map(a => a.type))],
        latest: sortedActivities[0]?.timestamp || null
      }
    });
    
  } catch (error) {
    console.error('❌ Recent activities error:', error);
    
    // Final fallback: empty data with success status
    res.json({
      success: true,
      data: [],
      fallback: true,
      error: 'No activities available',
      summary: { total: 0, types: [], latest: null }
    });
  }
};

// ✅ OPTIMIZED: Get KPI summary with aggregates
const getKPISummary = async (req, res) => {
  try {
    console.log('📊 Fetching KPI summary with optimized queries...');
    
    // ✅ OPTIMIZED: Use aggregates and groupBy
    const [salesAggregates, distinctOrdersCount] = await Promise.all([
      prisma.salesData.aggregate({
        _sum: {
          quantity: true,
          total_revenue: true,
          settlement_amount: true,
          hpp: true
        }
      }),
      prisma.salesData.groupBy({
        by: ['order_id'],
        _count: {
          order_id: true
        }
      })
    ]);
    
    // Core KPI calculations using aggregated data
    const distinctOrders = distinctOrdersCount.length;
    const totalQuantitySold = salesAggregates._sum.quantity || 0;
    const totalRevenue = salesAggregates._sum.total_revenue || 0;
    const totalSettlementAmount = salesAggregates._sum.settlement_amount || 0;
    const totalHPP = salesAggregates._sum.hpp || 0;
    // ✅ UPDATED: Use settlement_amount instead of total_revenue for profit calculation
    const totalProfit = totalSettlementAmount - totalHPP;
    
    const kpiSummary = {
      orders: distinctOrders,
      productsSold: totalQuantitySold,
      revenue: totalRevenue,
      profit: totalProfit
    };
    
    console.log('✅ KPI summary calculated with optimized queries:', kpiSummary);
    
    res.json({
      success: true,
      data: kpiSummary
    });
    
  } catch (error) {
    console.error('❌ KPI summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KPI summary',
      message: error.message
    });
  }
};

// ✅ NEW: Revenue by Created Time endpoint
const getRevenueByCreated = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    console.log(`📊 Fetching revenue by created_time for ${period}...`);
    
    const revenueData = await prisma.salesData.groupBy({
      by: ['created_time'],
      where: {
        created_time: {
          gte: moment().subtract(days, 'days').toDate()
        }
      },
      _sum: {
        total_revenue: true,
        quantity: true
      },
      _count: {
        order_id: true
      },
      orderBy: {
        created_time: 'asc'
      }
    });
    
    const processedData = revenueData.map(item => ({
      date: moment(item.created_time).format('YYYY-MM-DD'),
      revenue: item._sum.total_revenue || 0,
      quantity: item._sum.quantity || 0,
      orders: item._count.order_id || 0
    }));
    
    console.log(`✅ Revenue by created_time calculated: ${processedData.length} data points`);
    
    res.json({
      success: true,
      data: processedData,
      period: period,
      type: 'created_time'
    });
    
  } catch (error) {
    console.error('❌ Revenue by created_time error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue by created_time',
      message: error.message
    });
  }
};

// ✅ NEW: Revenue by Delivered Time endpoint
const getRevenueByDelivered = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    console.log(`📊 Fetching revenue by delivered_time for ${period}...`);
    
    const revenueData = await prisma.salesData.groupBy({
      by: ['delivered_time'],
      where: {
        delivered_time: {
          gte: moment().subtract(days, 'days').toDate(),
          not: null
        }
      },
      _sum: {
        total_revenue: true,
        quantity: true
      },
      _count: {
        order_id: true
      },
      orderBy: {
        delivered_time: 'asc'
      }
    });
    
    const processedData = revenueData.map(item => ({
      date: moment(item.delivered_time).format('YYYY-MM-DD'),
      revenue: item._sum.total_revenue || 0,
      quantity: item._sum.quantity || 0,
      orders: item._count.order_id || 0
    }));
    
    console.log(`✅ Revenue by delivered_time calculated: ${processedData.length} data points`);
    
    res.json({
      success: true,
      data: processedData,
      period: period,
      type: 'delivered_time'
    });
    
  } catch (error) {
    console.error('❌ Revenue by delivered_time error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue by delivered_time',
      message: error.message
    });
  }
};

// ✅ NEW: Get marketplace analytics
const getMarketplaceAnalytics = async (req, res) => {
  try {
    console.log('🏪 Fetching marketplace analytics...');
    
    // Get marketplace breakdown with detailed analytics
    const marketplaceData = await prisma.salesData.groupBy({
      by: ['marketplace'],
      _count: {
        _all: true
      },
      _sum: {
        quantity: true,
        order_amount: true,
        total_revenue: true,
        settlement_amount: true,
        hpp: true
      },
      _avg: {
        order_amount: true
      },
      orderBy: {
        _sum: {
          total_revenue: 'desc'
        }
      }
    });
    
    // Get unique orders per marketplace
    const marketplaceAnalytics = await Promise.all(
      marketplaceData.map(async (marketplace) => {
        const distinctOrders = await prisma.salesData.groupBy({
          by: ['order_id'],
          where: { marketplace: marketplace.marketplace },
          _count: { order_id: true }
        });
        
        const revenue = marketplace._sum.total_revenue || marketplace._sum.order_amount || 0;
        const settlementAmount = marketplace._sum.settlement_amount || 0;
        const hpp = marketplace._sum.hpp || 0;
        // ✅ UPDATED: Use settlement_amount for profit calculation when available
        const profit = settlementAmount > 0 ? (settlementAmount - hpp) : (revenue - hpp);
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        return {
          marketplace: marketplace.marketplace || 'Unknown',
          totalSales: marketplace._count._all,
          distinctOrders: distinctOrders.length,
          totalQuantity: marketplace._sum.quantity || 0,
          totalRevenue: revenue,
          totalHPP: hpp,
          totalProfit: profit,
          profitMargin: profitMargin,
          avgOrderValue: marketplace._avg.order_amount || 0,
          percentage: 0 // Will be calculated below
        };
      })
    );
    
    // Calculate percentages
    const totalRevenue = marketplaceAnalytics.reduce((sum, mp) => sum + mp.totalRevenue, 0);
    marketplaceAnalytics.forEach(mp => {
      mp.percentage = totalRevenue > 0 ? (mp.totalRevenue / totalRevenue) * 100 : 0;
    });
    
    const result = {
      marketplaces: marketplaceAnalytics,
      summary: {
        totalMarketplaces: marketplaceAnalytics.length,
        totalRevenue: totalRevenue,
        topMarketplace: marketplaceAnalytics[0]?.marketplace || 'None',
        topMarketplaceRevenue: marketplaceAnalytics[0]?.totalRevenue || 0
      }
    };
    
    console.log(`✅ Marketplace analytics calculated for ${marketplaceAnalytics.length} marketplaces`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Marketplace analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace analytics',
      message: error.message
    });
  }
};

// ✅ NEW: Get main dashboard analytics for the new simplified dashboard
const getMainAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    console.log(`📊 Fetching main analytics for period: ${from} to ${to}`);
    
    // Parse date range
    const fromDate = from ? new Date(from) : moment().subtract(7, 'days').toDate();
    const toDate = to ? new Date(to) : new Date();
    
    // Get previous period for comparison
    const daysDiff = moment(toDate).diff(moment(fromDate), 'days');
    const prevFromDate = moment(fromDate).subtract(daysDiff, 'days').toDate();
    const prevToDate = moment(fromDate).subtract(1, 'day').toDate();
    
    console.log(`Current period: ${fromDate} to ${toDate}`);
    console.log(`Previous period: ${prevFromDate} to ${prevToDate}`);
    
    // Get current period data
    const [currentSales, currentOrders] = await Promise.all([
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: fromDate,
            lte: toDate
          }
        },
        _sum: {
          order_amount: true,
          total_revenue: true,
          quantity: true,
          settlement_amount: true,
          hpp: true
        },
        _count: {
          _all: true
        }
      }),
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: {
          created_time: {
            gte: fromDate,
            lte: toDate
          }
        },
        _count: {
          order_id: true
        }
      })
    ]);
    
    // Get previous period data for comparison
    const [prevSales, prevOrders] = await Promise.all([
      prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: prevFromDate,
            lte: prevToDate
          }
        },
        _sum: {
          order_amount: true,
          total_revenue: true,
          quantity: true
        },
        _count: {
          _all: true
        }
      }),
      prisma.salesData.groupBy({
        by: ['order_id'],
        where: {
          created_time: {
            gte: prevFromDate,
            lte: prevToDate
          }
        },
        _count: {
          order_id: true
        }
      })
    ]);
    
    // Calculate current metrics
    const gmv = currentSales._sum.order_amount || 0;
    const grossRevenue = currentSales._sum.total_revenue || currentSales._sum.settlement_amount || 0;
    const totalProducts = currentSales._sum.quantity || 0;
    
    // Calculate previous metrics
    const prevGMV = prevSales._sum.order_amount || 0;
    const prevGrossRevenue = prevSales._sum.total_revenue || prevSales._sum.settlement_amount || 0;
    const prevTotalProducts = prevSales._sum.quantity || 0;
    
    // Calculate growth percentages
    const gmvGrowth = prevGMV > 0 ? ((gmv - prevGMV) / prevGMV) * 100 : 0;
    const revenueGrowth = prevGrossRevenue > 0 ? ((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100 : 0;
    const productGrowth = prevTotalProducts > 0 ? ((totalProducts - prevTotalProducts) / prevTotalProducts) * 100 : 0;
    
    // Generate chart data
    const chartData = [];
    const startDate = moment(fromDate);
    const endDate = moment(toDate);
    
    for (let date = moment(startDate); date.isSameOrBefore(endDate); date.add(1, 'day')) {
      const dayStart = date.clone().startOf('day').toDate();
      const dayEnd = date.clone().endOf('day').toDate();
      
      const dayData = await prisma.salesData.aggregate({
        where: {
          created_time: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        _sum: {
          order_amount: true,
          total_revenue: true
        }
      });
      
      chartData.push({
        date: date.format('MMM DD'),
        gmv: dayData._sum.order_amount || 0,
        pendapatanBruto: dayData._sum.total_revenue || dayData._sum.order_amount || 0
      });
    }
    
    const result = {
      gmv,
      grossRevenue,
      totalProducts,
      gmvGrowth,
      revenueGrowth,
      productGrowth,
      chartData
    };
    
    console.log('✅ Main analytics calculated:', {
      gmv,
      grossRevenue,
      totalProducts,
      gmvGrowth: `${gmvGrowth.toFixed(2)}%`,
      revenueGrowth: `${revenueGrowth.toFixed(2)}%`,
      productGrowth: `${productGrowth.toFixed(2)}%`,
      chartDataPoints: chartData.length
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Main analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch main analytics',
      message: error.message
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getChartData,
  getCategorySales,
  getBrandPerformance,
  getTopProducts,
  getRecentActivities,
  getKPISummary,
  getRevenueByCreated,
  getRevenueByDelivered,
  getMarketplaceAnalytics,
  getMainAnalytics
};