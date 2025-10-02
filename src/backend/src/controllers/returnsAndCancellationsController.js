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
      console.log('✅ Returns & Cancellations Controller: Database connected');
    } catch (error) {
      console.error('❌ Returns & Cancellations Controller: Database connection failed:', error);
      throw error;
    }
  }
  return prisma;
};

// Get all returns and cancellations with filtering and analytics
const getReturnsAndCancellations = async (req, res) => {
  try {
    console.log('🔄 Fetching returns and cancellations data...');
    
    const {
      type, // 'return' or 'cancel'
      marketplace,
      date_start,
      date_end,
      resellable,
      page = 1,
      limit = 50
    } = req.query;

    const currentPrisma = await getPrismaClient();

    // Build filter conditions
    const where = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (marketplace && marketplace !== 'all') {
      where.marketplace = {
        contains: marketplace,
        mode: 'insensitive'
      };
    }
    
    if (resellable !== undefined) {
      where.resellable = resellable === 'true';
    }
    
    if (date_start && date_end) {
      where.return_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    }

    // Get paginated data
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      currentPrisma.returnsAndCancellations.findMany({
        where,
        orderBy: {
          return_date: 'desc'
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
      currentPrisma.returnsAndCancellations.count({ where })
    ]);

    console.log(`✅ Found ${data.length} returns/cancellations records (total: ${total})`);

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
    console.error('❌ Error fetching returns and cancellations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch returns and cancellations data',
      details: error.message
    });
  }
};

// Get returns and cancellations analytics
const getReturnsAnalytics = async (req, res) => {
  try {
    console.log('📊 Generating returns and cancellations analytics...');
    
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
      where.return_date = {
        gte: new Date(date_start).toISOString(),
        lte: new Date(date_end).toISOString()
      };
    } else {
      // Default to specified period
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      where.return_date = {
        gte: startDate.toISOString()
      };
    }

    // Get comprehensive analytics
    const [
      totalStats,
      typeBreakdown,
      marketplaceBreakdown,
      productBreakdown,
      timeSeries
    ] = await Promise.all([
      // Overall statistics
      currentPrisma.returnsAndCancellations.aggregate({
        where,
        _sum: {
          returned_amount: true,
          refund_amount: true,
          restocking_fee: true,
          shipping_cost_loss: true,
          quantity_returned: true
        },
        _count: {
          id: true
        },
        _avg: {
          returned_amount: true,
          refund_amount: true
        }
      }),
      
      // Breakdown by type (return vs cancel)
      currentPrisma.returnsAndCancellations.groupBy({
        by: ['type'],
        where,
        _sum: {
          returned_amount: true,
          quantity_returned: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            returned_amount: 'desc'
          }
        }
      }),
      
      // Breakdown by marketplace
      currentPrisma.returnsAndCancellations.groupBy({
        by: ['marketplace'],
        where,
        _sum: {
          returned_amount: true,
          quantity_returned: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            returned_amount: 'desc'
          }
        }
      }),
      
      // Top returned products
      currentPrisma.returnsAndCancellations.groupBy({
        by: ['product_name'],
        where,
        _sum: {
          returned_amount: true,
          quantity_returned: true
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
      
      // Time series data (daily) - Use aggregate functions
      currentPrisma.returnsAndCancellations.findMany({
        where,
        orderBy: {
          return_date: 'desc'
        },
        take: 30,
        select: {
          return_date: true,
          returned_amount: true,
          quantity_returned: true
        }
      })
    ]);

    // Calculate derived metrics
    const returnRate = totalStats._count.id || 0;
    const totalRefundLoss = (totalStats._sum.returned_amount || 0) - (totalStats._sum.refund_amount || 0);
    const averageReturnValue = totalStats._avg.returned_amount || 0;
    const resellableItems = await currentPrisma.returnsAndCancellations.count({
      where: { ...where, resellable: true }
    });
    const resellableRate = returnRate > 0 ? (resellableItems / returnRate) * 100 : 0;

    console.log('✅ Returns and cancellations analytics generated successfully');

    res.json({
      success: true,
      data: {
        overview: {
          totalReturns: totalStats._count.id || 0,
          totalReturnedAmount: totalStats._sum.returned_amount || 0,
          totalRefundAmount: totalStats._sum.refund_amount || 0,
          totalRefundLoss: totalRefundLoss,
          totalRestockingFees: totalStats._sum.restocking_fee || 0,
          totalShippingLoss: totalStats._sum.shipping_cost_loss || 0,
          totalQuantityReturned: totalStats._sum.quantity_returned || 0,
          averageReturnValue: averageReturnValue,
          resellableItems: resellableItems,
          resellableRate: resellableRate
        },
        breakdowns: {
          byType: typeBreakdown,
          byMarketplace: marketplaceBreakdown,
          byProduct: productBreakdown
        },
        timeSeries: Array.isArray(timeSeries) ? timeSeries.map(item => ({
          date: item.return_date ? item.return_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          count: 1,
          amount: item.returned_amount || 0,
          quantity: item.quantity_returned || 0
        })) : [],
        insights: [
          {
            type: 'warning',
            title: 'Return Impact',
            description: `Total kehilangan dari return: Rp ${totalRefundLoss.toLocaleString('id-ID')}`,
            priority: totalRefundLoss > 1000000 ? 'high' : 'medium'
          },
          {
            type: 'info',
            title: 'Resellable Rate',
            description: `${resellableRate.toFixed(1)}% barang return masih bisa dijual kembali`,
            priority: resellableRate > 70 ? 'low' : 'medium'
          }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error generating returns analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate returns analytics',
      details: error.message
    });
  }
};

// Create new return/cancellation record
const createReturnsCancellation = async (req, res) => {
  try {
    console.log('📝 Creating new returns/cancellation record...');
    
    const currentPrisma = await getPrismaClient();
    
    // Calculate total cost if not provided
    const data = { ...req.body };
    if (!data.total_cost && data.product_cost && data.quantity_returned) {
      data.total_cost = data.product_cost * data.quantity_returned;
    }
    
    const record = await currentPrisma.returnsAndCancellations.create({
      data,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Returns/cancellation record created successfully');

    res.json({
      success: true,
      data: record,
      message: 'Returns/cancellation record created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating returns/cancellation record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create returns/cancellation record',
      details: error.message
    });
  }
};

// Update return/cancellation record
const updateReturnsCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Updating returns/cancellation record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    const record = await currentPrisma.returnsAndCancellations.update({
      where: { id },
      data: req.body,
      include: {
        import_batch: true
      }
    });

    console.log('✅ Returns/cancellation record updated successfully');

    res.json({
      success: true,
      data: record,
      message: 'Returns/cancellation record updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating returns/cancellation record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Returns/cancellation record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update returns/cancellation record',
      details: error.message
    });
  }
};

// Delete return/cancellation record
const deleteReturnsCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting returns/cancellation record with ID: ${id}`);
    
    const currentPrisma = await getPrismaClient();
    
    await currentPrisma.returnsAndCancellations.delete({
      where: { id }
    });

    console.log('✅ Returns/cancellation record deleted successfully');

    res.json({
      success: true,
      message: 'Returns/cancellation record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting returns/cancellation record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Returns/cancellation record not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete returns/cancellation record',
      details: error.message
    });
  }
};

module.exports = {
  getReturnsAndCancellations,
  getReturnsAnalytics,
  createReturnsCancellation,
  updateReturnsCancellation,
  deleteReturnsCancellation
};