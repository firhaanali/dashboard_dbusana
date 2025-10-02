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
      console.log('✅ Marketplace Reimbursement Controller: Database connected');
    } catch (error) {
      console.error('❌ Marketplace Reimbursement Controller: Database connection failed:', error);
      throw error;
    }
  }
  return prisma;
};

// Get all marketplace reimbursements with filtering
const getMarketplaceReimbursements = async (req, res) => {
  try {
    console.log('💰 Fetching marketplace reimbursements data...');
    
    const {
      reimbursement_type,
      marketplace,
      status,
      date_start,
      date_end,
      page = 1,
      limit = 50
    } = req.query;

    const currentPrisma = await getPrismaClient();

    // Build filter conditions
    const where = {};
    
    if (reimbursement_type && reimbursement_type !== 'all') {
      where.reimbursement_type = reimbursement_type;
    }
    
    if (marketplace && marketplace !== 'all') {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (date_start && date_end) {
      where.incident_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    }

    // Get paginated data
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      currentPrisma.marketplaceReimbursement.findMany({
        where,
        orderBy: {
          incident_date: 'desc'
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
      currentPrisma.marketplaceReimbursement.count({ where })
    ]);

    console.log(`✅ Found ${data.length} reimbursement records (total: ${total})`);

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
    console.error('❌ Error fetching marketplace reimbursements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace reimbursements data',
      details: error.message
    });
  }
};

// Get marketplace reimbursement analytics
const getReimbursementAnalytics = async (req, res) => {
  try {
    console.log('📊 Generating marketplace reimbursement analytics...');
    
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
      where.incident_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    } else {
      // Default to specified period
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      where.incident_date = {
        gte: startDate.toISOString()
      };
    }

    // Get comprehensive analytics
    const [
      totalStats,
      statusBreakdown,
      typeBreakdown,
      marketplaceBreakdown,
      timeSeries
    ] = await Promise.all([
      // Overall statistics
      currentPrisma.marketplaceReimbursement.aggregate({
        where,
        _sum: {
          claim_amount: true,
          approved_amount: true,
          received_amount: true,
          processing_fee: true
        },
        _count: {
          id: true
        },
        _avg: {
          claim_amount: true,
          approved_amount: true
        }
      }),
      
      // Breakdown by status
      currentPrisma.marketplaceReimbursement.groupBy({
        by: ['status'],
        where,
        _sum: {
          claim_amount: true,
          approved_amount: true,
          received_amount: true
        },
        _count: {
          id: true
        }
      }),
      
      // Breakdown by reimbursement type
      currentPrisma.marketplaceReimbursement.groupBy({
        by: ['reimbursement_type'],
        where,
        _sum: {
          claim_amount: true,
          approved_amount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            claim_amount: 'desc'
          }
        }
      }),
      
      // Breakdown by marketplace
      currentPrisma.marketplaceReimbursement.groupBy({
        by: ['marketplace'],
        where,
        _sum: {
          claim_amount: true,
          approved_amount: true,
          received_amount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            received_amount: 'desc'
          }
        }
      }),
      
      // Time series data (monthly) - Use regular Prisma queries
      currentPrisma.marketplaceReimbursement.findMany({
        where,
        orderBy: {
          incident_date: 'desc'
        },
        take: 50,
        select: {
          incident_date: true,
          claim_amount: true,
          received_amount: true
        }
      })
    ]);

    // Calculate derived metrics
    const totalClaims = totalStats._count.id || 0;
    const approvalRate = totalClaims > 0 ? 
      ((statusBreakdown.find(s => s.status === 'approved')?._count?.id || 0) / totalClaims) * 100 : 0;
    const recoveryRate = (totalStats._sum.received_amount || 0) / (totalStats._sum.claim_amount || 1) * 100;
    const averageProcessingTime = await calculateAverageProcessingTime(currentPrisma, where);

    console.log('✅ Marketplace reimbursement analytics generated successfully');

    res.json({
      success: true,
      data: {
        overview: {
          totalClaims: totalClaims,
          totalClaimAmount: totalStats._sum.claim_amount || 0,
          totalApprovedAmount: totalStats._sum.approved_amount || 0,
          totalReceivedAmount: totalStats._sum.received_amount || 0,
          totalProcessingFees: totalStats._sum.processing_fee || 0,
          approvalRate: approvalRate,
          recoveryRate: recoveryRate,
          averageClaimAmount: totalStats._avg.claim_amount || 0,
          averageProcessingTime: averageProcessingTime
        },
        breakdowns: {
          byStatus: statusBreakdown,
          byType: typeBreakdown,
          byMarketplace: marketplaceBreakdown
        },
        timeSeries: timeSeries.map(item => ({
          month: item.month.toISOString().slice(0, 7),
          count: item.count,
          totalClaimed: item.total_claimed || 0,
          totalReceived: item.total_received || 0
        })),
        insights: [
          {
            type: approvalRate > 80 ? 'success' : 'warning',
            title: 'Approval Rate',
            description: `${approvalRate.toFixed(1)}% klaim disetujui marketplace`,
            priority: approvalRate < 70 ? 'high' : 'medium'
          },
          {
            type: recoveryRate > 90 ? 'success' : 'info',
            title: 'Recovery Rate',
            description: `${recoveryRate.toFixed(1)}% dari klaim berhasil diterima`,
            priority: recoveryRate < 80 ? 'medium' : 'low'
          }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error generating reimbursement analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reimbursement analytics',
      details: error.message
    });
  }
};

// Helper function to calculate average processing time
const calculateAverageProcessingTime = async (prisma, where) => {
  try {
    const completedClaims = await prisma.marketplaceReimbursement.findMany({
      where: {
        ...where,
        status: 'received',
        approval_date: { not: null },
        received_date: { not: null }
      },
      select: {
        claim_date: true,
        received_date: true
      }
    });

    if (completedClaims.length === 0) return 0;

    const totalDays = completedClaims.reduce((sum, claim) => {
      const diffTime = new Date(claim.received_date) - new Date(claim.claim_date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return Math.round(totalDays / completedClaims.length);
  } catch (error) {
    console.log('⚠️ Could not calculate average processing time:', error.message);
    return 0;
  }
};

// Create new reimbursement record
const createReimbursement = async (req, res) => {
  try {
    console.log('📝 Creating new reimbursement record...');
    
    const currentPrisma = await getPrismaClient();
    
    const record = await currentPrisma.marketplaceReimbursement.create({
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Reimbursement record created successfully');

    res.json({
      success: true,
      data: record,
      message: 'Reimbursement record created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating reimbursement record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reimbursement record',
      details: error.message
    });
  }
};

// Update reimbursement record
const updateReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Updating reimbursement record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    const record = await currentPrisma.marketplaceReimbursement.update({
      where: { id },
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Reimbursement record updated successfully');

    res.json({
      success: true,
      data: record,
      message: 'Reimbursement record updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating reimbursement record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Reimbursement record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update reimbursement record',
      details: error.message
    });
  }
};

// Delete reimbursement record
const deleteReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting reimbursement record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    await currentPrisma.marketplaceReimbursement.delete({
      where: { id }
    });

    console.log('✅ Reimbursement record deleted successfully');

    res.json({
      success: true,
      message: 'Reimbursement record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting reimbursement record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Reimbursement record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete reimbursement record',
      details: error.message
    });
  }
};

module.exports = {
  getMarketplaceReimbursements,
  getReimbursementAnalytics,
  createReimbursement,
  updateReimbursement,
  deleteReimbursement
};