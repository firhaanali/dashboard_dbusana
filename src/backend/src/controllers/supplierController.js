const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all suppliers with optional filters
const getSuppliers = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contact_person: { contains: search, mode: 'insensitive' } }
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        purchase_orders: {
          select: {
            id: true,
            total_amount: true,
            po_date: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate aggregated data for each supplier
    const suppliersWithStats = suppliers.map(supplier => {
      const pos = supplier.purchase_orders || [];
      const totalOrders = pos.length;
      const totalAmount = pos.reduce((sum, po) => sum + po.total_amount, 0);
      const lastOrderDate = pos.length > 0 ? 
        pos.sort((a, b) => new Date(b.po_date) - new Date(a.po_date))[0].po_date : null;

      return {
        ...supplier,
        total_orders: totalOrders,
        total_amount: totalAmount,
        last_order_date: lastOrderDate,
        purchase_orders: undefined // Remove detailed purchase orders from response
      };
    });

    res.json({
      success: true,
      data: suppliersWithStats
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch suppliers' 
    });
  }
};

// Get supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchase_orders: {
          orderBy: { po_date: 'desc' },
          take: 10 // Get last 10 purchase orders
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found' 
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch supplier' 
    });
  }
};

// Create new supplier
const createSupplier = async (req, res) => {
  try {
    const {
      code,
      name,
      contact_person,
      phone,
      email,
      address,
      category,
      payment_terms,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!code || !name || !contact_person || !phone || !email || !address || !category || !payment_terms) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Check if supplier code already exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code }
    });

    if (existingSupplier) {
      return res.status(400).json({ 
        success: false,
        error: 'Supplier code already exists' 
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        contact_person,
        phone,
        email,
        address,
        category,
        payment_terms,
        status,
        rating: 0 // Default rating
      }
    });

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create supplier' 
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      contact_person,
      phone,
      email,
      address,
      category,
      payment_terms,
      status,
      rating
    } = req.body;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found' 
      });
    }

    // Check if new code conflicts with another supplier
    if (code && code !== existingSupplier.code) {
      const codeConflict = await prisma.supplier.findUnique({
        where: { code }
      });

      if (codeConflict) {
        return res.status(400).json({ 
          success: false,
          error: 'Supplier code already exists' 
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
    if (category) updateData.category = category;
    if (payment_terms) updateData.payment_terms = payment_terms;
    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update supplier' 
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchase_orders: true
      }
    });

    if (!existingSupplier) {
      return res.status(404).json({ 
        success: false,
        error: 'Supplier not found' 
      });
    }

    // Check if supplier has active purchase orders
    const activePOs = existingSupplier.purchase_orders.filter(po => 
      po.status !== 'cancelled' && po.status !== 'delivered'
    );

    if (activePOs.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete supplier with active purchase orders' 
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({ 
      success: true,
      message: 'Supplier deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete supplier' 
    });
  }
};

// Get supplier analytics
const getSupplierAnalytics = async (req, res) => {
  try {
    // Get basic counts
    const totalSuppliers = await prisma.supplier.count();
    const activeSuppliers = await prisma.supplier.count({
      where: { status: 'active' }
    });

    // Get total purchases amount
    const purchaseOrdersSum = await prisma.purchaseOrder.aggregate({
      _sum: { total_amount: true },
      where: { status: { not: 'cancelled' } }
    });

    // Calculate average rating
    const avgRating = await prisma.supplier.aggregate({
      _avg: { rating: true }
    });

    // Get category distribution
    const categoryStats = await prisma.supplier.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const categoryDistribution = categoryStats.map(stat => ({
      name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
      value: (stat._count.category / totalSuppliers) * 100,
      count: stat._count.category
    }));

    // Get supplier performance (orders count)
    const supplierPerformance = await prisma.supplier.findMany({
      include: {
        purchase_orders: {
          select: {
            status: true,
            delivery_date: true,
            expected_date: true
          }
        }
      },
      take: 10,
      orderBy: {
        purchase_orders: {
          _count: 'desc'
        }
      }
    });

    const performanceMetrics = supplierPerformance.map(supplier => {
      const orders = supplier.purchase_orders;
      const totalOrders = orders.length;
      const onTimeOrders = orders.filter(po => 
        po.delivery_date && po.expected_date &&
        new Date(po.delivery_date) <= new Date(po.expected_date)
      ).length;

      return {
        supplier: supplier.name.substring(0, 15) + (supplier.name.length > 15 ? '...' : ''),
        orders: totalOrders,
        onTime: onTimeOrders,
        rating: supplier.rating
      };
    });

    // Get monthly trends (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const monthlyPOs = await prisma.purchaseOrder.findMany({
      where: {
        po_date: { gte: threeMonthsAgo },
        status: { not: 'cancelled' }
      },
      select: {
        po_date: true,
        total_amount: true
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
      
      const monthPOs = monthlyPOs.filter(po => {
        const poDate = new Date(po.po_date);
        return poDate >= monthStart && poDate < monthEnd;
      });
      
      monthlyTrends.push({
        month: months[i],
        orders: monthPOs.length,
        amount: monthPOs.reduce((sum, po) => sum + po.total_amount, 0)
      });
    }

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        totalPurchases: purchaseOrdersSum._sum.total_amount || 0,
        averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
        categoryDistribution,
        performanceMetrics: monthlyTrends,
        recentActivity: [
          { supplier: 'PT Tekstil Nusantara', action: 'New Order', amount: 15000000, date: '2024-12-18' },
          { supplier: 'CV Bordir Indah', action: 'Payment Received', amount: 8500000, date: '2024-12-17' }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching supplier analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch supplier analytics' 
    });
  }
};

// Update supplier rating
const updateSupplierRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        error: 'Rating must be between 0 and 5' 
      });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { rating }
    });

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update supplier rating' 
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierAnalytics,
  updateSupplierRating
};