const { PrismaClient } = require('@prisma/client');

let prisma;

// Initialize Prisma Client with error handling
const getPrismaClient = async () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        log: ['warn', 'error'],
      });
      await prisma.$connect();
      console.log('✅ Affiliate Samples Controller: Database connected');
    } catch (error) {
      console.error('❌ Affiliate Samples Controller: Database connection failed:', error);
      throw error;
    }
  }
  return prisma;
};

// Get all affiliate samples with filtering
const getAffiliateSamples = async (req, res) => {
  try {
    console.log('🎁 Fetching affiliate samples data...');
    
    const {
      affiliate_name,
      affiliate_platform,
      status,
      content_delivered,
      campaign_name,
      date_start,
      date_end,
      page = 1,
      limit = 50
    } = req.query;

    const currentPrisma = await getPrismaClient();

    // Build filter conditions
    const where = {};
    
    if (affiliate_name && affiliate_name !== 'all') {
      where.affiliate_name = {
        contains: affiliate_name,
        mode: 'insensitive'
      };
    }
    
    if (affiliate_platform && affiliate_platform !== 'all') {
      where.affiliate_platform = affiliate_platform;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (content_delivered !== undefined) {
      where.content_delivered = content_delivered === 'true';
    }
    
    if (campaign_name && campaign_name !== 'all') {
      where.campaign_name = {
        contains: campaign_name,
        mode: 'insensitive'
      };
    }
    
    if (date_start && date_end) {
      where.given_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    }

    // Get paginated data
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      currentPrisma.affiliateSamples.findMany({
        where,
        orderBy: {
          given_date: 'desc'
        },
        skip: offset,
        take: parseInt(limit),
        include: {
          import_batch: {
            select: {
              id: true,
              batch_name: true,
              created_at: true
            }
          }
        }
      }),
      currentPrisma.affiliateSamples.count({ where })
    ]);

    console.log(`✅ Found ${data.length} affiliate sample records (total: ${total})`);

    res.json({
      success: true,
      data,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching affiliate samples:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate samples data',
      details: error.message
    });
  }
};

// Get affiliate samples analytics
const getAffiliateSamplesAnalytics = async (req, res) => {
  try {
    console.log('📊 Generating affiliate samples analytics...');
    
    const {
      affiliate_platform,
      campaign_name,
      date_start,
      date_end,
      period = '30d'
    } = req.query;

    const currentPrisma = await getPrismaClient();

    // Build base filter
    const where = {};
    
    if (affiliate_platform && affiliate_platform !== 'all') {
      where.affiliate_platform = affiliate_platform;
    }
    
    if (campaign_name && campaign_name !== 'all') {
      where.campaign_name = {
        contains: campaign_name,
        mode: 'insensitive'
      };
    }
    
    if (date_start && date_end) {
      where.given_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    } else {
      // Default to specified period
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      where.given_date = {
        gte: startDate.toISOString()
      };
    }

    // Get comprehensive analytics
    const [
      totalStats,
      statusBreakdown,
      platformBreakdown,
      affiliateBreakdown,
      productBreakdown,
      campaignBreakdown,
      timeSeries
    ] = await Promise.all([
      // Overall statistics
      currentPrisma.affiliateSamples.aggregate({
        where,
        _sum: {
          quantity_given: true,
          total_cost: true,
          shipping_cost: true,
          packaging_cost: true,
          expected_reach: true
        },
        _count: {
          id: true
        },
        _avg: {
          total_cost: true,
          roi_estimate: true
        }
      }),
      
      // Breakdown by status
      currentPrisma.affiliateSamples.groupBy({
        by: ['status'],
        where,
        _sum: {
          total_cost: true,
          quantity_given: true
        },
        _count: {
          id: true
        }
      }),
      
      // Breakdown by platform
      currentPrisma.affiliateSamples.groupBy({
        by: ['affiliate_platform'],
        where,
        _sum: {
          total_cost: true,
          quantity_given: true,
          expected_reach: true
        },
        _count: {
          id: true
        },
        _avg: {
          roi_estimate: true
        },
        orderBy: {
          _sum: {
            total_cost: 'desc'
          }
        }
      }),
      
      // Top affiliates by investment
      currentPrisma.affiliateSamples.groupBy({
        by: ['affiliate_name'],
        where,
        _sum: {
          total_cost: true,
          quantity_given: true
        },
        _count: {
          id: true
        },
        _avg: {
          roi_estimate: true
        },
        orderBy: {
          _sum: {
            total_cost: 'desc'
          }
        },
        take: 10
      }),
      
      // Top products given as samples
      currentPrisma.affiliateSamples.groupBy({
        by: ['product_name'],
        where,
        _sum: {
          quantity_given: true,
          total_cost: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),
      
      // Campaign performance
      currentPrisma.affiliateSamples.groupBy({
        by: ['campaign_name'],
        where: {
          ...where,
          campaign_name: { not: null }
        },
        _sum: {
          total_cost: true,
          quantity_given: true,
          expected_reach: true
        },
        _count: {
          id: true
        },
        _avg: {
          roi_estimate: true
        },
        orderBy: {
          _avg: {
            roi_estimate: 'desc'
          }
        },
        take: 10
      }),
      
      // Time series data using Prisma queries instead of raw SQL
      currentPrisma.affiliateSamples.findMany({
        where,
        select: {
          given_date: true,
          total_cost: true,
          quantity_given: true
        },
        orderBy: {
          given_date: 'desc'
        },
        take: 360 // Last 12 months worth of data
      })
    ]);

    // Calculate derived metrics
    const totalSamples = totalStats._count.id || 0;
    const contentDeliveredCount = await currentPrisma.affiliateSamples.count({
      where: { ...where, content_delivered: true }
    });
    const contentDeliveryRate = totalSamples > 0 ? (contentDeliveredCount / totalSamples) * 100 : 0;
    
    const totalInvestment = (totalStats._sum.total_cost || 0) + 
                           (totalStats._sum.shipping_cost || 0) + 
                           (totalStats._sum.packaging_cost || 0);
    
    const averageROI = totalStats._avg.roi_estimate || 0;
    const averageCostPerSample = totalSamples > 0 ? totalInvestment / totalSamples : 0;

    console.log('✅ Affiliate samples analytics generated successfully');

    res.json({
      success: true,
      data: {
        overview: {
          totalSamples: totalSamples,
          totalQuantityGiven: totalStats._sum.quantity_given || 0,
          totalProductCost: totalStats._sum.total_cost || 0,
          totalShippingCost: totalStats._sum.shipping_cost || 0,
          totalPackagingCost: totalStats._sum.packaging_cost || 0,
          totalInvestment: totalInvestment,
          contentDelivered: contentDeliveredCount,
          contentDeliveryRate: contentDeliveryRate,
          averageCostPerSample: averageCostPerSample,
          averageROI: averageROI,
          totalExpectedReach: totalStats._sum.expected_reach || 0
        },
        breakdowns: {
          byStatus: statusBreakdown,
          byPlatform: platformBreakdown,
          byAffiliate: affiliateBreakdown,
          byProduct: productBreakdown,
          byCampaign: campaignBreakdown
        },
        timeSeries: timeSeries.reduce((acc, item) => {
          const month = new Date(item.given_date).toISOString().slice(0, 7);
          const existing = acc.find(a => a.month === month);
          
          if (existing) {
            existing.count += 1;
            existing.totalInvestment += item.total_cost || 0;
            existing.totalQuantity += item.quantity_given || 0;
          } else {
            acc.push({
              month,
              count: 1,
              totalInvestment: item.total_cost || 0,
              totalQuantity: item.quantity_given || 0
            });
          }
          
          return acc;
        }, []).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12),
        insights: [
          {
            type: contentDeliveryRate > 80 ? 'success' : contentDeliveryRate > 60 ? 'warning' : 'error',
            title: 'Content Delivery Rate',
            description: `${contentDeliveryRate.toFixed(1)}% affiliate telah deliver konten`,
            priority: contentDeliveryRate < 70 ? 'high' : 'medium'
          },
          {
            type: averageROI > 200 ? 'success' : averageROI > 100 ? 'info' : 'warning',
            title: 'Average ROI',
            description: `ROI rata-rata ${averageROI.toFixed(1)}% dari investment sample`,
            priority: averageROI < 150 ? 'medium' : 'low'
          },
          {
            type: 'info',
            title: 'Investment Efficiency',
            description: `Rata-rata Rp ${averageCostPerSample.toLocaleString('id-ID')} per sample`,
            priority: 'low'
          }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error generating affiliate samples analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate affiliate samples analytics',
      details: error.message
    });
  }
};

// Create new affiliate sample record
const createAffiliateSample = async (req, res) => {
  try {
    console.log('📝 Creating new affiliate sample record...');
    
    const currentPrisma = await getPrismaClient();
    
    // Calculate total_cost if not provided
    const data = { ...req.body };
    if (!data.total_cost && data.product_cost && data.quantity_given) {
      data.total_cost = data.product_cost * data.quantity_given;
    }
    
    const record = await currentPrisma.affiliateSamples.create({
      data,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Affiliate sample record created successfully');

    res.json({
      success: true,
      data: record,
      message: 'Affiliate sample record created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating affiliate sample record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create affiliate sample record',
      details: error.message
    });
  }
};

// Update affiliate sample record
const updateAffiliateSample = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Updating affiliate sample record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    const record = await currentPrisma.affiliateSamples.update({
      where: { id },
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Affiliate sample record updated successfully');

    res.json({
      success: true,
      data: record,
      message: 'Affiliate sample record updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating affiliate sample record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Affiliate sample record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update affiliate sample record',
      details: error.message
    });
  }
};

// Delete affiliate sample record
const deleteAffiliateSample = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting affiliate sample record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    await currentPrisma.affiliateSamples.delete({
      where: { id }
    });

    console.log('✅ Affiliate sample record deleted successfully');

    res.json({
      success: true,
      message: 'Affiliate sample record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting affiliate sample record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Affiliate sample record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete affiliate sample record',
      details: error.message
    });
  }
};

module.exports = {
  getAffiliateSamples,
  getAffiliateSamplesAnalytics,
  createAffiliateSample,
  updateAffiliateSample,
  deleteAffiliateSample
};