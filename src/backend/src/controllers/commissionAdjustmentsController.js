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
      console.log('✅ Commission Adjustments Controller: Database connected');
    } catch (error) {
      console.error('❌ Commission Adjustments Controller: Database connection failed:', error);
      throw error;
    }
  }
  return prisma;
};

// Get all commission adjustments with filtering
const getCommissionAdjustments = async (req, res) => {
  try {
    console.log('📉 Fetching commission adjustments data...');
    
    const {
      adjustment_type,
      marketplace,
      dynamic_rate_applied,
      date_start,
      date_end,
      page = 1,
      limit = 50
    } = req.query;

    const currentPrisma = await getPrismaClient();

    // Build filter conditions
    const where = {};
    
    if (adjustment_type && adjustment_type !== 'all') {
      where.adjustment_type = adjustment_type;
    }
    
    if (marketplace && marketplace !== 'all') {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (dynamic_rate_applied !== undefined) {
      where.dynamic_rate_applied = dynamic_rate_applied === 'true';
    }
    
    if (date_start && date_end) {
      where.adjustment_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    }

    // Get paginated data
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      currentPrisma.commissionAdjustments.findMany({
        where,
        orderBy: {
          adjustment_date: 'desc'
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
      currentPrisma.commissionAdjustments.count({ where })
    ]);

    console.log(`✅ Found ${data.length} commission adjustment records (total: ${total})`);

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
    console.error('❌ Error fetching commission adjustments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission adjustments data',
      details: error.message
    });
  }
};

// Get commission adjustments analytics
const getCommissionAdjustmentsAnalytics = async (req, res) => {
  try {
    console.log('📊 Generating commission adjustments analytics...');
    
    const {
      marketplace,
      date_start,
      date_end,
      period = '30d'
    } = req.query;

    const currentPrisma = await getPrismaClient();

    // Build base filter
    const where = {};
    
    if (marketplace && marketplace !== 'all') {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (date_start && date_end) {
      where.adjustment_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    } else {
      // Default to specified period
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      where.adjustment_date = {
        gte: startDate.toISOString()
      };
    }

    // Get comprehensive analytics
    const [
      totalStats,
      typeBreakdown,
      marketplaceBreakdown,
      dynamicRateStats,
      timeSeries
    ] = await Promise.all([
      // Overall statistics
      currentPrisma.commissionAdjustments.aggregate({
        where,
        _sum: {
          original_commission: true,
          adjustment_amount: true,
          final_commission: true
        },
        _count: {
          id: true
        },
        _avg: {
          adjustment_amount: true,
          commission_rate: true
        }
      }),
      
      // Breakdown by adjustment type
      currentPrisma.commissionAdjustments.groupBy({
        by: ['adjustment_type'],
        where,
        _sum: {
          adjustment_amount: true,
          original_commission: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            adjustment_amount: 'asc' // Most negative first
          }
        }
      }),
      
      // Breakdown by marketplace
      currentPrisma.commissionAdjustments.groupBy({
        by: ['marketplace'],
        where,
        _sum: {
          adjustment_amount: true,
          original_commission: true
        },
        _count: {
          id: true
        },
        _avg: {
          commission_rate: true
        },
        orderBy: {
          _sum: {
            adjustment_amount: 'asc'
          }
        }
      }),
      
      // Dynamic rate analysis
      currentPrisma.commissionAdjustments.groupBy({
        by: ['dynamic_rate_applied'],
        where,
        _sum: {
          adjustment_amount: true
        },
        _count: {
          id: true
        },
        _avg: {
          adjustment_amount: true
        }
      }),
      
      // Time series data using Prisma queries instead of raw SQL
      currentPrisma.commissionAdjustments.findMany({
        where,
        select: {
          adjustment_date: true,
          adjustment_amount: true,
          original_commission: true
        },
        orderBy: {
          adjustment_date: 'desc'
        },
        take: 30
      })
    ]);

    // Calculate derived metrics
    const totalAdjustments = totalStats._count.id || 0;
    const totalLoss = Math.abs(totalStats._sum.adjustment_amount || 0);
    const impactRate = (totalStats._sum.original_commission || 0) > 0 ? 
      (totalLoss / (totalStats._sum.original_commission || 1)) * 100 : 0;
    
    const dynamicRateCount = dynamicRateStats.find(s => s.dynamic_rate_applied === true)?._count?.id || 0;
    const dynamicRatePercentage = totalAdjustments > 0 ? (dynamicRateCount / totalAdjustments) * 100 : 0;

    console.log('✅ Commission adjustments analytics generated successfully');

    res.json({
      success: true,
      data: {
        overview: {
          totalAdjustments: totalAdjustments,
          totalOriginalCommission: totalStats._sum.original_commission || 0,
          totalAdjustmentAmount: totalStats._sum.adjustment_amount || 0,
          totalFinalCommission: totalStats._sum.final_commission || 0,
          totalLoss: totalLoss,
          impactRate: impactRate,
          averageAdjustment: totalStats._avg.adjustment_amount || 0,
          averageCommissionRate: totalStats._avg.commission_rate || 0,
          dynamicRateAffected: dynamicRateCount,
          dynamicRatePercentage: dynamicRatePercentage
        },
        breakdowns: {
          byType: typeBreakdown,
          byMarketplace: marketplaceBreakdown,
          byDynamicRate: dynamicRateStats
        },
        timeSeries: timeSeries.reduce((acc, item) => {
          const date = new Date(item.adjustment_date).toISOString().split('T')[0];
          const existing = acc.find(a => a.date === date);
          
          if (existing) {
            existing.count += 1;
            existing.totalAdjustment += item.adjustment_amount || 0;
            existing.originalCommission += item.original_commission || 0;
          } else {
            acc.push({
              date,
              count: 1,
              totalAdjustment: item.adjustment_amount || 0,
              originalCommission: item.original_commission || 0
            });
          }
          
          return acc;
        }, []).sort((a, b) => new Date(b.date) - new Date(a.date)),
        insights: [
          {
            type: impactRate > 20 ? 'error' : impactRate > 10 ? 'warning' : 'info',
            title: 'Commission Impact',
            description: `${impactRate.toFixed(1)}% dari komisi asli terdampak adjustment`,
            priority: impactRate > 15 ? 'high' : 'medium'
          },
          {
            type: dynamicRatePercentage > 50 ? 'warning' : 'info',
            title: 'Dynamic Rate Impact',
            description: `${dynamicRatePercentage.toFixed(1)}% adjustment karena dynamic commission rate`,
            priority: dynamicRatePercentage > 70 ? 'high' : 'medium'
          }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error generating commission adjustments analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate commission adjustments analytics',
      details: error.message
    });
  }
};

// Create new commission adjustment record
const createCommissionAdjustment = async (req, res) => {
  try {
    console.log('📝 Creating new commission adjustment record...');
    
    const currentPrisma = await getPrismaClient();
    
    // Calculate final_commission if not provided
    const data = { ...req.body };
    if (!data.final_commission && data.original_commission && data.adjustment_amount) {
      data.final_commission = data.original_commission + data.adjustment_amount;
    }
    
    const record = await currentPrisma.commissionAdjustments.create({
      data,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Commission adjustment record created successfully');

    res.json({
      success: true,
      data: record,
      message: 'Commission adjustment record created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating commission adjustment record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create commission adjustment record',
      details: error.message
    });
  }
};

// Update commission adjustment record
const updateCommissionAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Updating commission adjustment record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    const record = await currentPrisma.commissionAdjustments.update({
      where: { id },
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Commission adjustment record updated successfully');

    res.json({
      success: true,
      data: record,
      message: 'Commission adjustment record updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating commission adjustment record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Commission adjustment record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update commission adjustment record',
      details: error.message
    });
  }
};

// Delete commission adjustment record
const deleteCommissionAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting commission adjustment record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    await currentPrisma.commissionAdjustments.delete({
      where: { id }
    });

    console.log('✅ Commission adjustment record deleted successfully');

    res.json({
      success: true,
      message: 'Commission adjustment record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting commission adjustment record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Commission adjustment record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete commission adjustment record',
      details: error.message
    });
  }
};

module.exports = {
  getCommissionAdjustments,
  getCommissionAdjustmentsAnalytics,
  createCommissionAdjustment,
  updateCommissionAdjustment,
  deleteCommissionAdjustment
};