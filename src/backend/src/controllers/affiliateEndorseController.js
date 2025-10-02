const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all affiliate endorsements with product sales
const getAllEndorsements = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      status, 
      affiliate_name, 
      start_date, 
      end_date,
      sortBy = 'created_at',
      sortOrder = 'desc' 
    } = req.query;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (affiliate_name) {
      where.affiliate_name = {
        contains: affiliate_name,
        mode: 'insensitive'
      };
    }
    if (start_date || end_date) {
      where.start_date = {};
      if (start_date) where.start_date.gte = new Date(start_date);
      if (end_date) where.start_date.lte = new Date(end_date);
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const endorsements = await prisma.affiliateEndorsement.findMany({
      where,
      include: {
        product_sales: {
          orderBy: {
            created_at: 'asc'
          }
        }
      },
      orderBy,
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.affiliateEndorsement.count({ where });

    res.json({
      success: true,
      data: {
        endorsements,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching affiliate endorsements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate endorsements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check for existing affiliate endorsements
const checkExistingAffiliate = async (req, res) => {
  try {
    const { affiliate_name } = req.query;
    
    if (!affiliate_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing affiliate_name parameter'
      });
    }

    const existingEndorsements = await prisma.affiliateEndorsement.findMany({
      where: {
        affiliate_name: {
          equals: affiliate_name.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        product_sales: true
      },
      orderBy: {
        end_date: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        exists: existingEndorsements.length > 0,
        endorsements: existingEndorsements,
        count: existingEndorsements.length,
        latestEndDate: existingEndorsements.length > 0 ? existingEndorsements[0].end_date : null
      }
    });

  } catch (error) {
    console.error('❌ Error checking existing affiliate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check existing affiliate',
      details: error.message
    });
  }
};

// Merge affiliate endorsement data with existing record
const mergeEndorsementData = async (req, res) => {
  try {
    const { 
      existing_id,
      new_end_date,
      additional_endorse_fee = 0,
      additional_target_sales = 0,
      new_product_sales = [],
      notes_to_append = '',
      merge_type = 'extend' // 'extend' or 'replace'
    } = req.body;

    if (!existing_id || !new_end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: existing_id, new_end_date'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get existing endorsement
      const existingEndorsement = await tx.affiliateEndorsement.findUnique({
        where: { id: existing_id },
        include: { product_sales: true }
      });

      if (!existingEndorsement) {
        throw new Error('Existing endorsement not found');
      }

      // Calculate new totals from additional product sales
      const additionalActualSales = new_product_sales.reduce((sum, product) => 
        sum + (parseFloat(product.totalSales || product.total_sales) || 0), 0);
      const additionalCommission = new_product_sales.reduce((sum, product) => 
        sum + (parseFloat(product.commission || product.commissionAmount) || 0), 0);

      // Update main endorsement record
      const updatedEndorsement = await tx.affiliateEndorsement.update({
        where: { id: existing_id },
        data: {
          end_date: new Date(new_end_date),
          endorse_fee: existingEndorsement.endorse_fee + (parseFloat(additional_endorse_fee) || 0),
          target_sales: existingEndorsement.target_sales + (parseFloat(additional_target_sales) || 0),
          actual_sales: existingEndorsement.actual_sales + additionalActualSales,
          total_commission: existingEndorsement.total_commission + additionalCommission,
          notes: notes_to_append ? 
            (existingEndorsement.notes ? `${existingEndorsement.notes}\n\n--- Data Extension ---\n${notes_to_append}` : notes_to_append) :
            existingEndorsement.notes,
          updated_at: new Date()
        }
      });

      // Add new product sales (merge or extend existing products)
      if (new_product_sales && new_product_sales.length > 0) {
        const productSalesData = new_product_sales.map((product, index) => {
          const processedProduct = {
            endorsement_id: existing_id,
            product_name: product.productName || product.product_name || '',
            quantity: parseInt(product.quantity) || 0,
            unit_price: parseFloat(product.unitPrice || product.unit_price) || 0,
            total_sales: parseFloat(product.totalSales || product.total_sales) || 0,
            commission: parseFloat(product.commission || product.commissionAmount) || 0
          };

          if (!processedProduct.product_name) {
            throw new Error(`Product #${index + 1} is missing product_name field`);
          }

          return processedProduct;
        });

        // Check for existing products to merge quantities/sales
        for (const newProduct of productSalesData) {
          const existingProduct = await tx.affiliateProductSale.findFirst({
            where: {
              endorsement_id: existing_id,
              product_name: {
                equals: newProduct.product_name,
                mode: 'insensitive'
              }
            }
          });

          if (existingProduct && merge_type === 'extend') {
            // Merge with existing product
            await tx.affiliateProductSale.update({
              where: { id: existingProduct.id },
              data: {
                quantity: existingProduct.quantity + newProduct.quantity,
                total_sales: existingProduct.total_sales + newProduct.total_sales,
                commission: existingProduct.commission + newProduct.commission,
                unit_price: newProduct.total_sales > 0 ? 
                  (existingProduct.total_sales + newProduct.total_sales) / (existingProduct.quantity + newProduct.quantity) : 
                  existingProduct.unit_price
              }
            });
          } else {
            // Create new product entry
            await tx.affiliateProductSale.create({
              data: newProduct
            });
          }
        }
      }

      // Recalculate ROI
      const finalActualSales = updatedEndorsement.actual_sales;
      const finalEndorseFee = updatedEndorsement.endorse_fee;
      const newROI = finalEndorseFee > 0 && finalActualSales > 0 ? 
        ((finalActualSales - finalEndorseFee) / finalEndorseFee) * 100 : 
        null;

      await tx.affiliateEndorsement.update({
        where: { id: existing_id },
        data: { roi: newROI }
      });

      // Return updated endorsement with all product sales
      return await tx.affiliateEndorsement.findUnique({
        where: { id: existing_id },
        include: { product_sales: true }
      });
    });

    res.json({
      success: true,
      data: result,
      message: 'Affiliate endorsement data merged successfully'
    });

  } catch (error) {
    console.error('❌ Error merging affiliate endorsement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge affiliate endorsement',
      details: error.message
    });
  }
};

// Create new affiliate endorsement
const createEndorsement = async (req, res) => {
  try {
    const {
      campaign_name,
      affiliate_name,
      affiliate_type,
      start_date,
      end_date,
      endorse_fee,
      target_sales,
      payment_method,
      platform,
      content_type,
      followers,
      engagement,
      reference,
      notes,
      status = 'active',
      product_sales = [],
      created_by
    } = req.body;

    // Validate required fields
    if (!campaign_name || !affiliate_name || !affiliate_type || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: campaign_name, affiliate_name, affiliate_type, start_date, end_date'
      });
    }

    // Calculate totals from product sales
    const actual_sales = product_sales.reduce((sum, product) => sum + (product.total_sales || 0), 0);
    const total_commission = product_sales.reduce((sum, product) => sum + (product.commission || 0), 0);
    
    // Calculate ROI
    const roi = endorse_fee > 0 && actual_sales > 0 
      ? ((actual_sales - endorse_fee) / endorse_fee) * 100 
      : null;

    // Create endorsement with product sales in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main endorsement
      const endorsement = await tx.affiliateEndorsement.create({
        data: {
          campaign_name,
          affiliate_name,
          affiliate_type,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          endorse_fee: parseFloat(endorse_fee) || 0,
          target_sales: parseFloat(target_sales) || 0,
          actual_sales,
          total_commission,
          payment_method,
          platform: Array.isArray(platform) ? platform : [platform].filter(Boolean),
          content_type,
          followers: parseInt(followers) || 0,
          engagement: parseFloat(engagement) || 0,
          reference,
          notes,
          status,
          roi,
          created_by
        }
      });

      // Create product sales if provided
      if (product_sales && product_sales.length > 0) {
        console.log('🔍 Processing product sales:', product_sales);
        
        const productSalesData = product_sales.map((product, index) => {
          const processedProduct = {
            endorsement_id: endorsement.id,
            product_name: product.productName || product.product_name || '',
            quantity: parseInt(product.quantity) || 0,
            unit_price: parseFloat(product.unitPrice || product.unit_price) || 0,
            total_sales: parseFloat(product.totalSales || product.total_sales) || 0,
            commission: parseFloat(product.commission || product.commissionAmount) || 0
          };
          
          console.log(`📦 Product ${index + 1}:`, processedProduct);
          
          // Validate required fields
          if (!processedProduct.product_name) {
            throw new Error(`Product #${index + 1} is missing product_name field`);
          }
          
          return processedProduct;
        });

        console.log('✅ Final product sales data for createMany:', productSalesData);

        await tx.affiliateProductSale.createMany({
          data: productSalesData
        });
      }

      // Return endorsement with product sales
      return await tx.affiliateEndorsement.findUnique({
        where: { id: endorsement.id },
        include: {
          product_sales: true
        }
      });
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Affiliate endorsement created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating affiliate endorsement:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Log request data for debugging
    console.error('❌ Request body data:', {
      campaign_name,
      affiliate_name,
      affiliate_type,
      product_sales_count: product_sales ? product_sales.length : 0,
      product_sales_sample: product_sales ? product_sales[0] : null
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create affiliate endorsement',
      details: error.message
    });
  }
};

// Get single endorsement by ID
const getEndorsementById = async (req, res) => {
  try {
    const { id } = req.params;

    const endorsement = await prisma.affiliateEndorsement.findUnique({
      where: { id },
      include: {
        product_sales: {
          orderBy: {
            created_at: 'asc'
          }
        }
      }
    });

    if (!endorsement) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate endorsement not found'
      });
    }

    res.json({
      success: true,
      data: endorsement
    });

  } catch (error) {
    console.error('❌ Error fetching affiliate endorsement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate endorsement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update endorsement
const updateEndorsement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      campaign_name,
      affiliate_name,
      affiliate_type,
      start_date,
      end_date,
      endorse_fee,
      target_sales,
      payment_method,
      platform,
      content_type,
      followers,
      engagement,
      reference,
      notes,
      status,
      product_sales = []
    } = req.body;

    // Calculate totals from product sales
    const actual_sales = product_sales.reduce((sum, product) => sum + (product.total_sales || 0), 0);
    const total_commission = product_sales.reduce((sum, product) => sum + (product.commission || 0), 0);
    
    // Calculate ROI
    const roi = endorse_fee > 0 && actual_sales > 0 
      ? ((actual_sales - endorse_fee) / endorse_fee) * 100 
      : null;

    // Update endorsement with product sales in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update main endorsement
      const endorsement = await tx.affiliateEndorsement.update({
        where: { id },
        data: {
          ...(campaign_name && { campaign_name }),
          ...(affiliate_name && { affiliate_name }),
          ...(affiliate_type && { affiliate_type }),
          ...(start_date && { start_date: new Date(start_date) }),
          ...(end_date && { end_date: new Date(end_date) }),
          ...(endorse_fee !== undefined && { endorse_fee: parseFloat(endorse_fee) }),
          ...(target_sales !== undefined && { target_sales: parseFloat(target_sales) }),
          actual_sales,
          total_commission,
          ...(payment_method && { payment_method }),
          ...(platform && { platform: Array.isArray(platform) ? platform : [platform].filter(Boolean) }),
          ...(content_type && { content_type }),
          ...(followers !== undefined && { followers: parseInt(followers) }),
          ...(engagement !== undefined && { engagement: parseFloat(engagement) }),
          ...(reference !== undefined && { reference }),
          ...(notes !== undefined && { notes }),
          ...(status && { status }),
          roi
        }
      });

      // Delete existing product sales
      await tx.affiliateProductSale.deleteMany({
        where: { endorsement_id: id }
      });

      // Create new product sales if provided
      if (product_sales && product_sales.length > 0) {
        const productSalesData = product_sales.map(product => ({
          endorsement_id: id,
          product_name: product.productName || product.product_name || '', // Support both field names
          quantity: parseInt(product.quantity) || 0,
          unit_price: parseFloat(product.unitPrice || product.unit_price) || 0,
          total_sales: parseFloat(product.totalSales || product.total_sales) || 0,
          commission: parseFloat(product.commission || product.commissionAmount) || 0
        }));

        await tx.affiliateProductSale.createMany({
          data: productSalesData
        });
      }

      // Return updated endorsement with product sales
      return await tx.affiliateEndorsement.findUnique({
        where: { id },
        include: {
          product_sales: true
        }
      });
    });

    res.json({
      success: true,
      data: result,
      message: 'Affiliate endorsement updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating affiliate endorsement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update affiliate endorsement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete endorsement
const deleteEndorsement = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.affiliateEndorsement.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Affiliate endorsement deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting affiliate endorsement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete affiliate endorsement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get affiliate endorsement analytics
const getEndorsementAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build date filter
    const dateFilter = {};
    if (start_date || end_date) {
      if (start_date) dateFilter.gte = new Date(start_date);
      if (end_date) dateFilter.lte = new Date(end_date);
    }

    const where = dateFilter.gte || dateFilter.lte ? { start_date: dateFilter } : {};

    // Get aggregate data
    const [
      totalEndorsements,
      totalSpent,
      totalSales,
      totalCommission,
      activeEndorsements,
      completedEndorsements,
      avgROI
    ] = await Promise.all([
      prisma.affiliateEndorsement.count({ where }),
      prisma.affiliateEndorsement.aggregate({
        where,
        _sum: { endorse_fee: true }
      }),
      prisma.affiliateEndorsement.aggregate({
        where,
        _sum: { actual_sales: true }
      }),
      prisma.affiliateEndorsement.aggregate({
        where,
        _sum: { total_commission: true }
      }),
      prisma.affiliateEndorsement.count({ 
        where: { ...where, status: 'active' }
      }),
      prisma.affiliateEndorsement.count({ 
        where: { ...where, status: 'completed' }
      }),
      prisma.affiliateEndorsement.aggregate({
        where: { ...where, roi: { not: null } },
        _avg: { roi: true }
      })
    ]);

    // Get top performers
    const topAffiliateBySales = await prisma.affiliateEndorsement.findMany({
      where,
      select: {
        affiliate_name: true,
        actual_sales: true,
        endorse_fee: true,
        roi: true
      },
      orderBy: { actual_sales: 'desc' },
      take: 5
    });

    const topAffiliateByROI = await prisma.affiliateEndorsement.findMany({
      where: { ...where, roi: { not: null } },
      select: {
        affiliate_name: true,
        actual_sales: true,
        endorse_fee: true,
        roi: true
      },
      orderBy: { roi: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalEndorsements,
          totalSpent: totalSpent._sum.endorse_fee || 0,
          totalSales: totalSales._sum.actual_sales || 0,
          totalCommission: totalCommission._sum.total_commission || 0,
          activeEndorsements,
          completedEndorsements,
          averageROI: avgROI._avg.roi || 0
        },
        topPerformers: {
          bySales: topAffiliateBySales,
          byROI: topAffiliateByROI
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching affiliate endorsement analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate endorsement analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllEndorsements,
  createEndorsement,
  getEndorsementById,
  updateEndorsement,
  deleteEndorsement,
  getEndorsementAnalytics,
  checkExistingAffiliate,
  mergeEndorsementData
};