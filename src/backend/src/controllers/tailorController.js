const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all tailors with optional filters
const getTailors = async (req, res) => {
  try {
    const { status, specialization, search } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (specialization && specialization !== 'all') {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contact_person: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tailors = await prisma.tailor.findMany({
      where,
      include: {
        productions: {
          select: {
            id: true,
            product_name: true,
            finished_stock: true,
            cost_per_piece: true,
            delivery_date: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate aggregated data for each tailor
    const tailorsWithStats = tailors.map(tailor => {
      const productions = tailor.productions || [];
      const totalOrders = productions.length;
      const totalPiecesProduced = productions.reduce((sum, prod) => sum + prod.finished_stock, 0);
      const averageCostPerPiece = productions.length > 0 ? 
        productions.reduce((sum, prod) => sum + prod.cost_per_piece, 0) / productions.length : 0;
      const lastOrderDate = productions.length > 0 ? 
        productions.sort((a, b) => new Date(b.delivery_date) - new Date(a.delivery_date))[0].delivery_date : null;

      return {
        ...tailor,
        total_orders: totalOrders,
        total_pieces_produced: totalPiecesProduced,
        average_cost_per_piece: averageCostPerPiece,
        quality_rating: tailor.rating,
        last_order_date: lastOrderDate,
        productions: undefined // Remove detailed productions from response
      };
    });

    res.json({
      success: true,
      data: tailorsWithStats
    });
  } catch (error) {
    console.error('Error fetching tailors:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tailors' 
    });
  }
};

// Get tailor by ID
const getTailorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tailor = await prisma.tailor.findUnique({
      where: { id },
      include: {
        productions: {
          orderBy: { delivery_date: 'desc' },
          take: 10 // Get last 10 production records
        }
      }
    });

    if (!tailor) {
      return res.status(404).json({ 
        success: false,
        error: 'Tailor not found' 
      });
    }

    res.json({
      success: true,
      data: tailor
    });
  } catch (error) {
    console.error('Error fetching tailor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tailor' 
    });
  }
};

// Create new tailor
const createTailor = async (req, res) => {
  try {
    const {
      code,
      name,
      contact_person,
      phone,
      email,
      address,
      specialization,
      payment_terms,
      rating = 0,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!code || !name || !contact_person || !phone || !email || !address || !specialization) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Check if tailor code already exists
    const existingTailor = await prisma.tailor.findUnique({
      where: { code }
    });

    if (existingTailor) {
      return res.status(400).json({ 
        success: false,
        error: 'Tailor code already exists' 
      });
    }

    const tailor = await prisma.tailor.create({
      data: {
        code,
        name,
        contact_person,
        phone,
        email,
        address,
        specialization,
        payment_terms: payment_terms || 'COD',
        rating: parseFloat(rating) || 0,
        status
      }
    });

    res.status(201).json({
      success: true,
      data: tailor
    });
  } catch (error) {
    console.error('Error creating tailor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create tailor' 
    });
  }
};

// Update tailor
const updateTailor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      contact_person,
      phone,
      email,
      address,
      specialization,
      payment_terms,
      rating,
      status
    } = req.body;

    // Check if tailor exists
    const existingTailor = await prisma.tailor.findUnique({
      where: { id }
    });

    if (!existingTailor) {
      return res.status(404).json({ 
        success: false,
        error: 'Tailor not found' 
      });
    }

    // Check if new code conflicts with another tailor
    if (code && code !== existingTailor.code) {
      const codeConflict = await prisma.tailor.findUnique({
        where: { code }
      });

      if (codeConflict) {
        return res.status(400).json({ 
          success: false,
          error: 'Tailor code already exists' 
        });
      }
    }

    const updateData = {};
    if (code) updateData.code = code;
    if (name) updateData.name = name;
    if (contact_person) updateData.contact_person = contact_person;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (specialization) updateData.specialization = specialization;
    if (payment_terms) updateData.payment_terms = payment_terms;
    if (rating !== undefined) updateData.rating = parseFloat(rating);
    if (status) updateData.status = status;

    const tailor = await prisma.tailor.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: tailor
    });
  } catch (error) {
    console.error('Error updating tailor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update tailor' 
    });
  }
};

// Delete tailor
const deleteTailor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tailor exists
    const existingTailor = await prisma.tailor.findUnique({
      where: { id },
      include: {
        productions: true
      }
    });

    if (!existingTailor) {
      return res.status(404).json({ 
        success: false,
        error: 'Tailor not found' 
      });
    }

    // Check if tailor has active productions
    const activeProductions = existingTailor.productions.filter(prod => 
      prod.status !== 'completed'
    );

    if (activeProductions.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete tailor with active productions' 
      });
    }

    await prisma.tailor.delete({
      where: { id }
    });

    res.json({ 
      success: true,
      message: 'Tailor deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tailor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete tailor' 
    });
  }
};

// Get tailor analytics
const getTailorAnalytics = async (req, res) => {
  try {
    // Get basic counts
    const totalTailors = await prisma.tailor.count();
    const activeTailors = await prisma.tailor.count({
      where: { status: 'active' }
    });

    // Get total productions
    const totalProductions = await prisma.tailorProduction.count();
    const totalPiecesProduced = await prisma.tailorProduction.aggregate({
      _sum: { finished_stock: true }
    });

    // Calculate average rating
    const avgRating = await prisma.tailor.aggregate({
      _avg: { rating: true }
    });

    // Get specialization distribution
    const specializationStats = await prisma.tailor.groupBy({
      by: ['specialization'],
      _count: { specialization: true }
    });

    const specializationDistribution = specializationStats.map(stat => ({
      name: stat.specialization.substring(0, 20) + (stat.specialization.length > 20 ? '...' : ''),
      value: (stat._count.specialization / totalTailors) * 100,
      count: stat._count.specialization
    }));

    // Get tailor performance (production count)
    const tailorPerformance = await prisma.tailor.findMany({
      include: {
        productions: {
          select: {
            finished_stock: true,
            status: true,
            delivery_date: true
          }
        }
      },
      take: 10,
      orderBy: {
        productions: {
          _count: 'desc'
        }
      }
    });

    const performanceMetrics = tailorPerformance.map(tailor => {
      const productions = tailor.productions;
      const totalProduced = productions.reduce((sum, prod) => sum + prod.finished_stock, 0);
      const completedOrders = productions.filter(prod => prod.status === 'completed').length;

      return {
        tailor: tailor.name.substring(0, 15) + (tailor.name.length > 15 ? '...' : ''),
        productions: productions.length,
        pieces: totalProduced,
        completed: completedOrders,
        rating: tailor.rating
      };
    });

    // Get monthly trends (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const monthlyProductions = await prisma.tailorProduction.findMany({
      where: {
        created_at: { gte: threeMonthsAgo }
      },
      select: {
        created_at: true,
        finished_stock: true
      }
    });

    // Group by month
    const monthlyTrends = [];
    const months = ['Oct', 'Nov', 'Dec']; // Simplified for demo
    
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - (2 - i));
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthProductions = monthlyProductions.filter(prod => {
        const prodDate = new Date(prod.created_at);
        return prodDate >= monthStart && prodDate < monthEnd;
      });
      
      monthlyTrends.push({
        month: months[i],
        productions: monthProductions.length,
        pieces: monthProductions.reduce((sum, prod) => sum + prod.finished_stock, 0)
      });
    }

    res.json({
      success: true,
      data: {
        totalTailors,
        activeTailors,
        totalProductions,
        totalPiecesProduced: totalPiecesProduced._sum.finished_stock || 0,
        averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
        specializationDistribution,
        performanceMetrics: monthlyTrends,
        recentActivity: [
          { tailor: 'Konveksi Eva Indah', action: 'Completed Order', pieces: 50, date: '2024-12-18' },
          { tailor: 'Bordir Cantik Jaya', action: 'New Production', pieces: 25, date: '2024-12-17' }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching tailor analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tailor analytics' 
    });
  }
};

// Update tailor rating
const updateTailorRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be between 0 and 5' 
      });
    }

    const tailor = await prisma.tailor.update({
      where: { id },
      data: { rating: parseFloat(rating) }
    });

    res.json({
      success: true,
      data: tailor
    });
  } catch (error) {
    console.error('Error updating tailor rating:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update tailor rating' 
    });
  }
};

// TAILOR PRODUCTION MANAGEMENT

// Get all tailor productions
const getTailorProductions = async (req, res) => {
  try {
    const { status, tailor_id, product, search } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (tailor_id) {
      where.tailor_id = tailor_id;
    }
    if (product) {
      where.product_name = { contains: product, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { product_name: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } }
      ];
    }

    const productions = await prisma.tailorProduction.findMany({
      where,
      include: {
        tailor: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: productions
    });
  } catch (error) {
    console.error('Error fetching tailor productions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tailor productions' 
    });
  }
};

// Create new tailor production
const createTailorProduction = async (req, res) => {
  try {
    const {
      tailor_id,
      product_name,
      color,
      size,
      finished_stock,
      meters_needed,
      cost_per_piece,
      defective_stock,
      additional_costs,
      additional_cost_description,
      delivery_date,
      notes,
      status = 'completed'
    } = req.body;

    // Validate required fields
    if (!tailor_id || !product_name || !color || !size || !finished_stock || !meters_needed || !cost_per_piece) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Check if tailor exists
    const tailor = await prisma.tailor.findUnique({
      where: { id: tailor_id }
    });

    if (!tailor) {
      return res.status(404).json({ 
        success: false,
        error: 'Tailor not found' 
      });
    }

    const production = await prisma.tailorProduction.create({
      data: {
        tailor_id,
        product_name,
        color,
        size,
        finished_stock: parseInt(finished_stock),
        meters_needed: parseFloat(meters_needed),
        cost_per_piece: parseFloat(cost_per_piece),
        defective_stock: defective_stock ? parseInt(defective_stock) : 0,
        additional_costs: additional_costs ? parseFloat(additional_costs) : 0,
        additional_cost_description,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        notes,
        status
      },
      include: {
        tailor: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: production
    });
  } catch (error) {
    console.error('Error creating tailor production:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create tailor production' 
    });
  }
};

module.exports = {
  getTailors,
  getTailorById,
  createTailor,
  updateTailor,
  deleteTailor,
  getTailorAnalytics,
  updateTailorRating,
  getTailorProductions,
  createTailorProduction
};