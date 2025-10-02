const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all purchase orders with optional filters
const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier_id, search } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (supplier_id && supplier_id !== 'all') {
      where.supplier_id = supplier_id;
    }
    if (search) {
      where.OR = [
        { po_number: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contact_person: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            material: {
              select: {
                name: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: { po_date: 'desc' }
    });

    // Format response with supplier name
    const formattedPOs = purchaseOrders.map(po => ({
      ...po,
      supplier_name: po.supplier.name,
      items: po.items.map(item => ({
        ...item,
        material_name: item.material.name,
        unit: item.material.unit
      }))
    }));

    res.json(formattedPOs);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

// Get purchase order by ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Format response
    const formattedPO = {
      ...purchaseOrder,
      supplier_name: purchaseOrder.supplier.name,
      items: purchaseOrder.items.map(item => ({
        ...item,
        material_name: item.material.name,
        unit: item.material.unit
      }))
    };

    res.json(formattedPO);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
};

// Create new purchase order
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      po_number,
      supplier_id,
      po_date,
      expected_date,
      notes,
      items = []
    } = req.body;

    // Validate required fields
    if (!po_number || !supplier_id || !po_date || !expected_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Check if PO number already exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { po_number }
    });

    if (existingPO) {
      return res.status(400).json({ error: 'PO number already exists' });
    }

    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplier_id }
    });

    if (!supplier) {
      return res.status(400).json({ error: 'Supplier not found' });
    }

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        po_number,
        supplier_id,
        po_date: new Date(po_date),
        expected_date: new Date(expected_date),
        notes,
        total_amount: totalAmount,
        items_count: items.length,
        status: 'draft',
        created_by: 'Admin', // TODO: Get from auth context
        items: {
          create: items.map(item => ({
            material_id: item.material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            unit: item.unit,
            notes: item.notes
          }))
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
};

// Update purchase order
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      po_number,
      supplier_id,
      po_date,
      expected_date,
      delivery_date,
      notes,
      items = []
    } = req.body;

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Check if PO can be updated (not delivered or cancelled)
    if (existingPO.status === 'delivered' || existingPO.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot update completed purchase order' });
    }

    // Check PO number conflict
    if (po_number && po_number !== existingPO.po_number) {
      const poConflict = await prisma.purchaseOrder.findUnique({
        where: { po_number }
      });

      if (poConflict) {
        return res.status(400).json({ error: 'PO number already exists' });
      }
    }

    // Calculate new totals
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Update purchase order
    const updateData = {
      total_amount: totalAmount,
      items_count: items.length
    };

    if (po_number) updateData.po_number = po_number;
    if (supplier_id) updateData.supplier_id = supplier_id;
    if (po_date) updateData.po_date = new Date(po_date);
    if (expected_date) updateData.expected_date = new Date(expected_date);
    if (delivery_date) updateData.delivery_date = new Date(delivery_date);
    if (notes !== undefined) updateData.notes = notes;

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.purchaseOrderItem.deleteMany({
        where: { purchase_order_id: id }
      });

      // Update purchase order
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: updateData
      });

      // Create new items
      if (items.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: items.map(item => ({
            purchase_order_id: id,
            material_id: item.material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            unit: item.unit,
            received_quantity: item.received_quantity || 0,
            notes: item.notes
          }))
        });
      }

      // Return updated PO with relations
      return await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: {
            include: {
              material: true
            }
          }
        }
      });
    });

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
};

// Update purchase order status
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['draft', 'sent', 'confirmed', 'partial', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    
    // Set delivery date if status is delivered
    if (status === 'delivered') {
      updateData.delivery_date = new Date();
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        items: {
          include: {
            material: true
          }
        }
      }
    });

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
};

// Delete purchase order
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!existingPO) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Check if PO can be deleted (only draft and cancelled)
    if (existingPO.status !== 'draft' && existingPO.status !== 'cancelled') {
      return res.status(400).json({ error: 'Can only delete draft or cancelled purchase orders' });
    }

    await prisma.purchaseOrder.delete({
      where: { id }
    });

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
};

// Get purchase order analytics
const getPurchaseOrderAnalytics = async (req, res) => {
  try {
    // Get basic counts
    const totalPOs = await prisma.purchaseOrder.count();
    const pendingPOs = await prisma.purchaseOrder.count({
      where: { 
        status: { in: ['sent', 'confirmed', 'partial'] }
      }
    });

    // Get total value
    const totalValueData = await prisma.purchaseOrder.aggregate({
      _sum: { total_amount: true },
      where: { status: { not: 'cancelled' } }
    });

    // Calculate average delivery time
    const deliveredPOs = await prisma.purchaseOrder.findMany({
      where: { 
        status: 'delivered',
        delivery_date: { not: null }
      },
      select: {
        expected_date: true,
        delivery_date: true
      }
    });

    const avgDeliveryTime = deliveredPOs.length > 0 
      ? Math.round(
          deliveredPOs.reduce((sum, po) => {
            const expected = new Date(po.expected_date);
            const delivered = new Date(po.delivery_date);
            const diffDays = Math.ceil((delivered - expected) / (1000 * 60 * 60 * 24));
            return sum + Math.max(0, diffDays);
          }, 0) / deliveredPOs.length
        )
      : 0;

    // Status distribution
    const statusStats = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statusDistribution = statusStats.map(stat => ({
      name: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
      value: (stat._count.status / totalPOs) * 100,
      count: stat._count.status
    }));

    // Supplier performance
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
      take: 10
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
    }).filter(s => s.orders > 0);

    // Monthly trends (last 3 months)
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

    // Top materials
    const materialStats = await prisma.purchaseOrderItem.groupBy({
      by: ['material_id'],
      _sum: {
        quantity: true,
        total_price: true
      },
      _count: { material_id: true },
      orderBy: {
        _sum: {
          total_price: 'desc'
        }
      },
      take: 5
    });

    const materialIds = materialStats.map(stat => stat.material_id);
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true }
    });

    const topMaterials = materialStats.map(stat => {
      const material = materials.find(m => m.id === stat.material_id);
      return {
        material: material ? material.name : 'Unknown',
        quantity: stat._sum.quantity,
        amount: stat._sum.total_price
      };
    });

    res.json({
      totalPOs,
      pendingPOs,
      totalValue: totalValueData._sum.total_amount || 0,
      avgDeliveryTime,
      statusDistribution,
      supplierPerformance: performanceMetrics,
      monthlyTrends,
      topMaterials
    });
  } catch (error) {
    console.error('Error fetching purchase order analytics:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order analytics' });
  }
};

// Receive items (partial or full)
const receiveItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { item_id, received_quantity }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Update received quantities for items
      for (const item of items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.item_id },
          data: { received_quantity: item.received_quantity }
        });
      }

      // Get updated PO with items
      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: true
        }
      });

      // Check if all items are fully received
      const allReceived = updatedPO.items.every(item => 
        item.received_quantity >= item.quantity
      );

      const someReceived = updatedPO.items.some(item => 
        item.received_quantity > 0
      );

      // Update PO status
      let newStatus = updatedPO.status;
      if (allReceived) {
        newStatus = 'delivered';
      } else if (someReceived) {
        newStatus = 'partial';
      }

      return await tx.purchaseOrder.update({
        where: { id },
        data: { 
          status: newStatus,
          delivery_date: allReceived ? new Date() : updatedPO.delivery_date
        },
        include: {
          supplier: true,
          items: {
            include: {
              material: true
            }
          }
        }
      });
    });

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error receiving items:', error);
    res.status(500).json({ error: 'Failed to receive items' });
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  getPurchaseOrderAnalytics,
  receiveItems
};