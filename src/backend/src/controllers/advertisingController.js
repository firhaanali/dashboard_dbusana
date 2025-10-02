// Advertising Data Controller for D'Busana Fashion Dashboard
// Handles CRUD operations for advertising/marketing data

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all advertising data with optional filtering
const getAdvertisingData = async (req, res) => {
  try {
    console.log('📊 Fetching advertising data from database...');
    
    const {
      platform,
      account_name,
      ad_creative_type,
      marketplace,
      date_start,
      date_end,
      limit,
      offset
    } = req.query;

    // Build filter conditions
    const where = {};
    
    // Handle account_name parameter (sent from frontend)
    if (account_name) {
      where.account_name = {
        contains: account_name,
        mode: 'insensitive'
      };
    }
    
    // Legacy platform support (fallback)
    if (platform) {
      where.platform = platform;
    }
    
    if (ad_creative_type) {
      where.ad_creative_type = ad_creative_type;
    }
    
    if (marketplace) {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (date_start || date_end) {
      where.date_start = {};
      if (date_start) {
        where.date_start.gte = new Date(date_start);
      }
      if (date_end) {
        where.date_start.lte = new Date(date_end);
      }
    }

    const advertisingData = await prisma.advertisingData.findMany({
      where,
      orderBy: {
        date_start: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
      include: {
        import_batch: {
          select: {
            id: true,
            batch_name: true,
            file_name: true,
            created_at: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.advertisingData.count({ where });

    console.log(`✅ Retrieved ${advertisingData.length} advertising records`);

    res.json({
      success: true,
      data: advertisingData,
      pagination: {
        total: totalCount,
        count: advertisingData.length,
        limit: limit ? parseInt(limit) : totalCount,
        offset: offset ? parseInt(offset) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching advertising data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advertising data',
      details: error.message
    });
  }
};

// TEMPORARY DEBUG: Check actual data in database
const debugAdvertisingData = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking all advertising data in database...');
    
    const allData = await prisma.advertisingData.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        campaign_name: true,
        account_name: true,
        marketplace: true,
        cost: true,
        revenue: true,
        date_start: true,
        date_end: true,
        created_at: true
      }
    });
    
    const totalCount = await prisma.advertisingData.count();
    
    console.log('🔍 DEBUG Results:', {
      totalRecords: totalCount,
      sampleRecords: allData
    });
    
    res.json({
      success: true,
      totalRecords: totalCount,
      sampleData: allData,
      message: 'Debug data retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: error.message
    });
  }
};

// Get advertising data by ID
const getAdvertisingDataById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advertisingData = await prisma.advertisingData.findUnique({
      where: { id },
      include: {
        import_batch: true
      }
    });

    if (!advertisingData) {
      return res.status(404).json({
        success: false,
        error: 'Advertising data not found'
      });
    }

    res.json({
      success: true,
      data: advertisingData
    });

  } catch (error) {
    console.error('❌ Error fetching advertising data by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advertising data',
      details: error.message
    });
  }
};

// Create new advertising data
const createAdvertisingData = async (req, res) => {
  try {
    console.log('📈 Creating new advertising data...');
    
    const advertisingData = await prisma.advertisingData.create({
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Advertising data created successfully');

    res.status(201).json({
      success: true,
      data: advertisingData,
      message: 'Advertising data created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating advertising data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create advertising data',
      details: error.message
    });
  }
};

// Update advertising data
const updateAdvertisingData = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Updating advertising data with ID: ${id}`);
    
    const advertisingData = await prisma.advertisingData.update({
      where: { id },
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Advertising data updated successfully');

    res.json({
      success: true,
      data: advertisingData,
      message: 'Advertising data updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating advertising data:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Advertising data not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update advertising data',
      details: error.message
    });
  }
};

// Delete advertising data
const deleteAdvertisingData = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting advertising data with ID: ${id}`);
    
    await prisma.advertisingData.delete({
      where: { id }
    });

    console.log('✅ Advertising data deleted successfully');

    res.json({
      success: true,
      message: 'Advertising data deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting advertising data:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Advertising data not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete advertising data',
      details: error.message
    });
  }
};

// Get advertising analytics/dashboard data
const getAdvertisingAnalytics = async (req, res) => {
  try {
    console.log('📊 Generating advertising analytics...');
    console.log('🔍 ANALYTICS QUERY PARAMS:', req.query);
    
    const { date_start, date_end, platform, account_name, marketplace } = req.query;
    
    // Build filter conditions
    const where = {};
    
    // Handle account_name parameter (sent from frontend)
    if (account_name) {
      where.account_name = {
        contains: account_name,
        mode: 'insensitive'
      };
    }
    
    // Legacy platform support (fallback)
    if (platform) {
      where.platform = platform;
    }
    
    if (marketplace) {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (date_start || date_end) {
      where.date_start = {};
      if (date_start) {
        where.date_start.gte = new Date(date_start);
      }
      if (date_end) {
        where.date_start.lte = new Date(date_end);
      }
    }

    console.log('🔍 ANALYTICS WHERE CLAUSE:', JSON.stringify(where, null, 2));
    
    // Check how many records match the filter
    const recordCount = await prisma.advertisingData.count({ where });
    console.log('🔍 ANALYTICS MATCHING RECORDS:', recordCount);
    
    // Get aggregated metrics
    const metrics = await prisma.advertisingData.aggregate({
      where,
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        cost: true,
        revenue: true
      },
      _avg: {
        cpa: true,
        ctr: true,
        conversion_rate: true,
        roi: true
      },
      _count: {
        id: true
      }
    });

    // Get campaign performance breakdown
    const campaignPerformance = await prisma.advertisingData.groupBy({
      by: ['campaign_name', 'account_name'],
      where,
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        cost: true,
        revenue: true
      },
      _avg: {
        ctr: true,
        conversion_rate: true,
        roi: true
      },
      orderBy: {
        _sum: {
          cost: 'desc'
        }
      },
      take: 10
    });

    // Get account performance breakdown
    const accountPerformance = await prisma.advertisingData.groupBy({
      by: ['account_name'],
      where,
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        cost: true,
        revenue: true
      },
      _avg: {
        ctr: true,
        conversion_rate: true,
        roi: true
      },
      orderBy: {
        _sum: {
          revenue: 'desc'
        }
      }
    });

    // Calculate additional metrics
    const totalImpressions = metrics._sum.impressions || 0;
    const totalClicks = metrics._sum.clicks || 0;
    const totalConversions = metrics._sum.conversions || 0;
    const totalCost = metrics._sum.cost || 0;
    const totalRevenue = metrics._sum.revenue || 0;
    const totalCampaigns = metrics._count.id || 0;
    
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    // 🎯 ENHANCED TRUE BUSINESS ROI CALCULATION with Product Attribution
    // ROI Implementation Options:
    // 1. Basic ROI: (Revenue - Cost) / Cost * 100 (advertising effectiveness only)
    // 2. Estimated Business ROI: (Revenue - Cost - PeriodHPP) / Cost * 100 (business estimation)
    // 3. True Attribution ROI: (Revenue - Cost - ProductSpecificHPP) / Cost * 100 (accurate business decision)
    
    let totalHPP = 0;
    let trueProfitROI = null;
    let basicROI = null;
    let attributedHPP = 0;
    let hasProductAttribution = false;
    let roiCalculationMethod = 'basic';
    let campaignsWithProducts = [];
    
    try {
      // 🎯 METHOD 1: Product-Specific Attribution (when nama_produk is available)
      campaignsWithProducts = await prisma.advertisingData.findMany({
        where: {
          ...where,
          nama_produk: {
            not: null,
            not: ''
          }
        },
        select: {
          nama_produk: true,
          revenue: true,
          cost: true,
          conversions: true
        }
      });
      
      if (campaignsWithProducts.length > 0) {
        console.log('🎯 PRODUCT ATTRIBUTION MODE: Found', campaignsWithProducts.length, 'campaigns with product data');
        
        for (const campaign of campaignsWithProducts) {
          try {
            // Try to find matching product in products table by name similarity
            const matchingProduct = await prisma.productData.findFirst({
              where: {
                OR: [
                  {
                    product_name: {
                      contains: campaign.nama_produk,
                      mode: 'insensitive'
                    }
                  },
                  {
                    product_name: {
                      equals: campaign.nama_produk,
                      mode: 'insensitive'
                    }
                  }
                ]
              },
              select: {
                cost: true, // HPP per unit
                product_name: true,
                product_code: true
              }
            });
            
            if (matchingProduct && campaign.conversions > 0) {
              // Calculate attributed HPP: HPP per unit × units sold (conversions)
              const productSpecificHPP = matchingProduct.cost * campaign.conversions;
              attributedHPP += productSpecificHPP;
              hasProductAttribution = true;
              
              console.log('✅ PRODUCT ATTRIBUTION SUCCESS:', {
                campaign_product: campaign.nama_produk,
                matched_product: matchingProduct.product_name,
                product_code: matchingProduct.product_code,
                hpp_per_unit: matchingProduct.cost.toLocaleString('id-ID'),
                units_sold: campaign.conversions,
                total_attributed_hpp: productSpecificHPP.toLocaleString('id-ID')
              });
            } else {
              console.log('⚠️ NO PRODUCT MATCH:', {
                campaign_product: campaign.nama_produk,
                conversions: campaign.conversions
              });
            }
          } catch (productError) {
            console.warn('⚠️ Product lookup error for:', campaign.nama_produk, productError.message);
          }
        }
        
        if (hasProductAttribution) {
          totalHPP = attributedHPP;
          roiCalculationMethod = 'true_attribution';
        }
      }
      
      // 🎯 METHOD 2: Period-based HPP Estimation (fallback when no product attribution)
      if (!hasProductAttribution) {
        console.log('📊 PERIOD ESTIMATION MODE: Using aggregated period HPP');
        roiCalculationMethod = 'estimated_business';
        
        const salesWhere = {};
        if (date_start || date_end) {
          salesWhere.created_time = {};
          if (date_start) {
            salesWhere.created_time.gte = new Date(date_start);
          }
          if (date_end) {
            salesWhere.created_time.lte = new Date(date_end);
          }
        }
        
        if (marketplace) {
          salesWhere.marketplace = {
            contains: marketplace,
            mode: 'insensitive'
          };
        }
        
        const relatedSales = await prisma.salesData.aggregate({
          where: salesWhere,
          _sum: {
            hpp: true,
            total_revenue: true
          }
        });
        
        totalHPP = relatedSales._sum.hpp || 0;
      
      console.log('📊 PERIOD HPP CALCULATION:', {
          totalPeriodHPP: totalHPP.toLocaleString('id-ID'),
          salesRevenue: (relatedSales._sum.total_revenue || 0).toLocaleString('id-ID'),
          advertisingRevenue: totalRevenue.toLocaleString('id-ID')
        });
      }
      
    } catch (error) {
      console.warn('⚠️ Could not fetch HPP data for True Profit ROI:', error.message);
      totalHPP = 0;
    }
    
    if (totalCost > 0) {
      // Basic ROI calculation: (Revenue - Cost) / Cost * 100
      basicROI = ((totalRevenue - totalCost) / totalCost) * 100;
      
      // True Profit ROI calculation: (Revenue - Cost - HPP) / Cost * 100
      if (totalHPP > 0) {
        const netProfit = totalRevenue - totalCost - totalHPP;
        trueProfitROI = (netProfit / totalCost) * 100;
      }
    } else if (totalCost === 0 && totalRevenue > 0) {
      // Edge case: No cost but has revenue (impossible in real advertising)
      basicROI = null;
      trueProfitROI = null;
    } else {
      // Both cost and revenue are 0, or other edge cases
      basicROI = null;
      trueProfitROI = null;
    }
    
    // Use True Profit ROI if available, fallback to Basic ROI
    const overallROI = trueProfitROI !== null ? trueProfitROI : basicROI;
    
    const grossProfit = totalRevenue - totalCost;
    const netProfit = totalRevenue - totalCost - totalHPP;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const trueProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Enhanced debug logging with True Business ROI calculation
    console.log('🎯 TRUE BUSINESS ROI CALCULATION RESULT:', {
      calculationMethod: roiCalculationMethod,
      hasProductAttribution,
      attributedCampaigns: hasProductAttribution ? campaignsWithProducts.length : 0,
      totalRevenue: totalRevenue.toLocaleString('id-ID'),
      totalCost: totalCost.toLocaleString('id-ID'),
      totalHPP: totalHPP.toLocaleString('id-ID'),
      grossProfit: grossProfit.toLocaleString('id-ID'),
      netProfit: netProfit.toLocaleString('id-ID'),
      basicROI: basicROI !== null ? `${basicROI.toFixed(2)}%` : 'N/A',
      trueProfitROI: trueProfitROI !== null ? `${trueProfitROI.toFixed(2)}%` : 'N/A',
      finalROI: overallROI !== null ? `${overallROI.toFixed(2)}%` : 'N/A',
      grossProfitMargin: `${profitMargin.toFixed(2)}%`,
      trueProfitMargin: `${trueProfitMargin.toFixed(2)}%`,
      roiAccuracy: hasProductAttribution ? 'HIGH (Product Attribution)' : totalHPP > 0 ? 'MEDIUM (Period Estimation)' : 'LOW (Basic Only)',
      isRealisticROI: overallROI !== null && Math.abs(overallROI) < 1000 ? 'YES' : 'NO - Check data'
    });

    console.log('✅ Advertising analytics generated successfully');

    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          totalImpressions,
          totalClicks,
          totalConversions,
          totalCost,
          totalRevenue,
          totalHPP,
          grossProfit,
          netProfit,
          overallCTR: parseFloat(overallCTR.toFixed(2)),
          overallConversionRate: parseFloat(overallConversionRate.toFixed(2)),
          overallROI: overallROI !== null ? parseFloat(overallROI.toFixed(2)) : null,
          basicROI: basicROI !== null ? parseFloat(basicROI.toFixed(2)) : null,
          trueProfitROI: trueProfitROI !== null ? parseFloat(trueProfitROI.toFixed(2)) : null,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          trueProfitMargin: parseFloat(trueProfitMargin.toFixed(2)),
          roiCalculationType: trueProfitROI !== null ? 'TRUE_BUSINESS_ROI' : 'BASIC_ROI',
          roiCalculationMethod: roiCalculationMethod,
          hasProductAttribution,
          roiAccuracy: hasProductAttribution ? 'HIGH' : totalHPP > 0 ? 'MEDIUM' : 'LOW',
          averageCPA: metrics._avg.cpa || 0
        },
        campaignPerformance,
        accountPerformance
      }
    });

  } catch (error) {
    console.error('❌ Error generating advertising analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate advertising analytics',
      details: error.message
    });
  }
};

// Get advertising data for time series (for charts)
const getAdvertisingTimeSeries = async (req, res) => {
  try {
    console.log('📈 Generating advertising time series data...');
    
    const { date_start, date_end, platform, account_name, marketplace, groupBy = 'day' } = req.query;
    
    // Build filter conditions
    const where = {};
    
    // Handle account_name parameter (sent from frontend)
    if (account_name) {
      where.account_name = {
        contains: account_name,
        mode: 'insensitive'
      };
    }
    
    // Legacy platform support (fallback)
    if (platform) {
      where.platform = platform;
    }
    
    if (marketplace) {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (date_start || date_end) {
      where.date_start = {};
      if (date_start) {
        where.date_start.gte = new Date(date_start);
      }
      if (date_end) {
        where.date_start.lte = new Date(date_end);
      }
    }

    // Get raw data for time series calculation
    const rawData = await prisma.advertisingData.findMany({
      where,
      select: {
        date_start: true,
        date_end: true,
        impressions: true,
        clicks: true,
        conversions: true,
        cost: true,
        revenue: true
      },
      orderBy: {
        date_start: 'asc'
      }
    });

    // Process data for time series
    const timeSeriesData = processTimeSeriesData(rawData, groupBy);

    console.log('✅ Advertising time series data generated successfully');

    res.json({
      success: true,
      data: timeSeriesData
    });

  } catch (error) {
    console.error('❌ Error generating advertising time series:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate advertising time series',
      details: error.message
    });
  }
};

// Helper function to process time series data
const processTimeSeriesData = (rawData, groupBy) => {
  const dataMap = new Map();
  
  rawData.forEach(record => {
    const date = new Date(record.date_start);
    let key;
    
    switch (groupBy) {
      case 'hour':
        key = date.toISOString().slice(0, 13) + ':00:00.000Z';
        break;
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }
    
    if (!dataMap.has(key)) {
      dataMap.set(key, {
        date: key,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        revenue: 0,
        campaigns: 0
      });
    }
    
    const existing = dataMap.get(key);
    existing.impressions += record.impressions;
    existing.clicks += record.clicks;
    existing.conversions += record.conversions;
    existing.cost += record.cost;
    existing.revenue += record.revenue;
    existing.campaigns += 1;
  });
  
  // Convert to array and calculate additional metrics
  const result = Array.from(dataMap.values()).map(item => ({
    ...item,
    ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
    conversionRate: item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0,
    roas: item.cost > 0 ? item.revenue / item.cost : 0,
    profit: item.revenue - item.cost
  }));
  
  return result.sort((a, b) => a.date.localeCompare(b.date));
};

// Get advertising settlement analytics
const getAdvertisingSettlementAnalytics = async (req, res) => {
  try {
    console.log('💰 Fetching advertising settlement analytics...');
    
    const {
      account_name,
      marketplace,
      date_start,
      date_end
    } = req.query;

    // Build filter conditions
    const where = {};
    
    if (account_name && account_name !== 'all') {
      where.account_name = {
        contains: account_name,
        mode: 'insensitive'
      };
    }
    
    if (marketplace && marketplace !== 'all') {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (date_start || date_end) {
      where.order_settled_time = {};
      if (date_start) {
        where.order_settled_time.gte = new Date(date_start);
      }
      if (date_end) {
        where.order_settled_time.lte = new Date(date_end);
      }
    }

    // Get settlement analytics
    const settlementMetrics = await prisma.advertisingSettlement.aggregate({
      where,
      _sum: {
        settlement_amount: true
      },
      _count: {
        order_id: true
      },
      _avg: {
        settlement_amount: true
      }
    });

    // Get settlement by account performance
    const settlementByAccount = await prisma.advertisingSettlement.groupBy({
      by: ['account_name'],
      where,
      _sum: {
        settlement_amount: true
      },
      _count: {
        order_id: true
      },
      orderBy: {
        _sum: {
          settlement_amount: 'desc'
        }
      }
    });

    // Get settlement by marketplace performance  
    const settlementByMarketplace = await prisma.advertisingSettlement.groupBy({
      by: ['marketplace'],
      where,
      _sum: {
        settlement_amount: true
      },
      _count: {
        order_id: true
      },
      orderBy: {
        _sum: {
          settlement_amount: 'desc'
        }
      }
    });

    console.log('✅ Advertising settlement analytics generated successfully');

    res.json({
      success: true,
      data: {
        overview: {
          totalSettlementAmount: settlementMetrics._sum.settlement_amount || 0,
          totalSettlementOrders: settlementMetrics._count.order_id || 0,
          averageSettlementAmount: settlementMetrics._avg.settlement_amount || 0
        },
        accountPerformance: settlementByAccount,
        marketplacePerformance: settlementByMarketplace
      }
    });

  } catch (error) {
    console.error('❌ Error generating advertising settlement analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate advertising settlement analytics',
      details: error.message
    });
  }
};

module.exports = {
  getAdvertisingData,
  getAdvertisingDataById,
  createAdvertisingData,
  updateAdvertisingData,
  deleteAdvertisingData,
  getAdvertisingAnalytics,
  getAdvertisingTimeSeries,
  debugAdvertisingData,
  getAdvertisingSettlementAnalytics
};