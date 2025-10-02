const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// GET /api/invoices - Get all invoices
router.get('/', async (req, res) => {
  try {
    console.log('📋 Getting invoices list from database');
    
    const {
      page = 1,
      limit = 50,
      search = '',
      type = '',
      status = ''
    } = req.query;

    // Build where clause for filters
    const where = {};
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { invoice_number: { contains: searchLower, mode: 'insensitive' } },
        { customer_name: { contains: searchLower, mode: 'insensitive' } },
        { customer_email: { contains: searchLower, mode: 'insensitive' } }
      ];
    }

    // Apply type filter
    if (type && type !== 'all') {
      where.type = type;
    }

    // Apply status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await prisma.invoice.count({ where });

    // Get paginated invoices with items
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Transform data to match frontend interface
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone || '',
      issueDate: invoice.issue_date.toISOString(),
      dueDate: invoice.due_date.toISOString(),
      status: invoice.status,
      type: invoice.type,
      items: invoice.items.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      })),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      notes: invoice.notes || '',
      paymentMethod: invoice.payment_method,
      paymentDate: invoice.payment_date?.toISOString(),
      createdAt: invoice.created_at.toISOString()
    }));

    const response = {
      invoices: transformedInvoices,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };

    console.log('✅ Successfully retrieved invoices from database:', {
      total: response.total,
      returned: response.invoices.length
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error getting invoices from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoices',
      details: error.message
    });
  }
});

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting invoice stats from database');

    // Get counts by type and status
    const totalInvoices = await prisma.invoice.count({ where: { type: 'invoice' } });
    const totalReceipts = await prisma.invoice.count({ where: { type: 'receipt' } });
    const paidInvoices = await prisma.invoice.count({ where: { status: 'paid' } });
    const draftInvoices = await prisma.invoice.count({ where: { status: 'draft' } });
    const sentInvoices = await prisma.invoice.count({ where: { status: 'sent' } });
    
    // Get overdue invoices (not paid and past due date)
    const overdueInvoices = await prisma.invoice.count({
      where: {
        status: { not: 'paid' },
        due_date: { lt: new Date() }
      }
    });

    // Get revenue calculations
    const paidInvoicesData = await prisma.invoice.findMany({
      where: { status: 'paid' },
      select: { total: true }
    });
    
    const sentInvoicesData = await prisma.invoice.findMany({
      where: { status: 'sent' },
      select: { total: true }
    });
    
    const overdueInvoicesData = await prisma.invoice.findMany({
      where: {
        status: { not: 'paid' },
        due_date: { lt: new Date() }
      },
      select: { total: true }
    });

    const allInvoicesData = await prisma.invoice.findMany({
      select: { total: true, created_at: true }
    });

    const totalRevenue = paidInvoicesData.reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = sentInvoicesData.reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = overdueInvoicesData.reduce((sum, inv) => sum + inv.total, 0);
    
    const avgInvoiceValue = allInvoicesData.length > 0 
      ? allInvoicesData.reduce((sum, inv) => sum + inv.total, 0) / allInvoicesData.length
      : 0;

    // Get this month's invoices
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const thisMonthInvoices = await prisma.invoice.count({
      where: {
        created_at: { gt: monthAgo }
      }
    });

    const stats = {
      totalInvoices,
      totalReceipts,
      paidInvoices,
      draftInvoices,
      sentInvoices,
      overdueInvoices,
      totalRevenue,
      pendingAmount,
      overdueAmount,
      averageInvoiceValue: Math.round(avgInvoiceValue),
      thisMonthInvoices
    };

    console.log('✅ Successfully calculated invoice stats from database');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error getting invoice stats from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoice statistics',
      details: error.message
    });
  }
});

// POST /api/invoices - Create new invoice
router.post('/', async (req, res) => {
  try {
    console.log('🆕 Creating new invoice in database:', req.body);

    const {
      customerName,
      customerEmail,
      customerPhone,
      dueDate,
      type = 'invoice',
      items = [],
      tax = 0,
      discount = 0,
      notes,
      paymentMethod
    } = req.body;

    // Validation
    if (!customerName || !customerEmail || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, email, and at least one item are required'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount - discount;

    // Generate invoice number
    const prefix = type === 'invoice' ? 'INV' : 'RCP';
    
    // Get existing invoice numbers for this type
    const existingInvoices = await prisma.invoice.findMany({
      where: { type },
      select: { invoice_number: true }
    });
    
    const existingNumbers = existingInvoices
      .map(inv => parseInt(inv.invoice_number.split('-')[1]))
      .filter(num => !isNaN(num));
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const invoiceNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;

    // Create invoice with items in database
    const newInvoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || '',
        due_date: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        type,
        subtotal,
        tax: taxAmount,
        discount,
        total,
        notes: notes || '',
        payment_method: paymentMethod || null,
        items: {
          create: items.map(item => ({
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Transform response to match frontend interface
    const transformedInvoice = {
      id: newInvoice.id,
      invoiceNumber: newInvoice.invoice_number,
      customerName: newInvoice.customer_name,
      customerEmail: newInvoice.customer_email,
      customerPhone: newInvoice.customer_phone || '',
      issueDate: newInvoice.issue_date.toISOString(),
      dueDate: newInvoice.due_date.toISOString(),
      status: newInvoice.status,
      type: newInvoice.type,
      items: newInvoice.items.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      })),
      subtotal: newInvoice.subtotal,
      tax: newInvoice.tax,
      discount: newInvoice.discount,
      total: newInvoice.total,
      notes: newInvoice.notes || '',
      paymentMethod: newInvoice.payment_method,
      paymentDate: newInvoice.payment_date?.toISOString(),
      createdAt: newInvoice.created_at.toISOString()
    };

    console.log('✅ Successfully created invoice in database:', newInvoice.invoice_number);

    res.status(201).json({
      success: true,
      data: transformedInvoice
    });

  } catch (error) {
    console.error('❌ Error creating invoice in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      details: error.message
    });
  }
});

// PUT /api/invoices/:id - Update invoice
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating invoice in database:', id);

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      dueDate,
      items,
      tax,
      discount,
      notes,
      paymentMethod,
      status
    } = req.body;

    // Calculate totals if items are provided
    let updateData = {};
    
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxRate = tax !== undefined ? tax : (existingInvoice.tax / existingInvoice.subtotal) * 100;
      const taxAmount = subtotal * (taxRate / 100);
      const discountAmount = discount !== undefined ? discount : existingInvoice.discount;
      const total = subtotal + taxAmount - discountAmount;

      updateData = {
        customer_name: customerName || existingInvoice.customer_name,
        customer_email: customerEmail || existingInvoice.customer_email,
        customer_phone: customerPhone !== undefined ? customerPhone : existingInvoice.customer_phone,
        due_date: dueDate ? new Date(dueDate) : existingInvoice.due_date,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        notes: notes !== undefined ? notes : existingInvoice.notes,
        payment_method: paymentMethod !== undefined ? paymentMethod : existingInvoice.payment_method,
        status: status || existingInvoice.status,
        items: {
          deleteMany: {}, // Delete all existing items
          create: items.map(item => ({
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      };
    } else {
      // Update without items
      updateData = {
        customer_name: customerName || existingInvoice.customer_name,
        customer_email: customerEmail || existingInvoice.customer_email,
        customer_phone: customerPhone !== undefined ? customerPhone : existingInvoice.customer_phone,
        due_date: dueDate ? new Date(dueDate) : existingInvoice.due_date,
        notes: notes !== undefined ? notes : existingInvoice.notes,
        payment_method: paymentMethod !== undefined ? paymentMethod : existingInvoice.payment_method,
        status: status || existingInvoice.status
      };
      
      if (tax !== undefined) updateData.tax = tax;
      if (discount !== undefined) updateData.discount = discount;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });

    // Transform response to match frontend interface
    const transformedInvoice = {
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoice_number,
      customerName: updatedInvoice.customer_name,
      customerEmail: updatedInvoice.customer_email,
      customerPhone: updatedInvoice.customer_phone || '',
      issueDate: updatedInvoice.issue_date.toISOString(),
      dueDate: updatedInvoice.due_date.toISOString(),
      status: updatedInvoice.status,
      type: updatedInvoice.type,
      items: updatedInvoice.items.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      })),
      subtotal: updatedInvoice.subtotal,
      tax: updatedInvoice.tax,
      discount: updatedInvoice.discount,
      total: updatedInvoice.total,
      notes: updatedInvoice.notes || '',
      paymentMethod: updatedInvoice.payment_method,
      paymentDate: updatedInvoice.payment_date?.toISOString(),
      createdAt: updatedInvoice.created_at.toISOString()
    };

    console.log('✅ Successfully updated invoice in database:', id);

    res.json({
      success: true,
      data: transformedInvoice
    });

  } catch (error) {
    console.error('❌ Error updating invoice in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice',
      details: error.message
    });
  }
});

// PATCH /api/invoices/:id/status - Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, paymentDate } = req.body;
    
    console.log('🔄 Updating invoice status in database:', { id, status });

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const updateData = {
      status,
      payment_method: status === 'paid' ? (paymentMethod || 'Bank Transfer') : existingInvoice.payment_method,
      payment_date: status === 'paid' ? (paymentDate ? new Date(paymentDate) : new Date()) : null
    };

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });

    // Transform response to match frontend interface
    const transformedInvoice = {
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoice_number,
      customerName: updatedInvoice.customer_name,
      customerEmail: updatedInvoice.customer_email,
      customerPhone: updatedInvoice.customer_phone || '',
      issueDate: updatedInvoice.issue_date.toISOString(),
      dueDate: updatedInvoice.due_date.toISOString(),
      status: updatedInvoice.status,
      type: updatedInvoice.type,
      items: updatedInvoice.items.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      })),
      subtotal: updatedInvoice.subtotal,
      tax: updatedInvoice.tax,
      discount: updatedInvoice.discount,
      total: updatedInvoice.total,
      notes: updatedInvoice.notes || '',
      paymentMethod: updatedInvoice.payment_method,
      paymentDate: updatedInvoice.payment_date?.toISOString(),
      createdAt: updatedInvoice.created_at.toISOString()
    };

    console.log('✅ Successfully updated invoice status in database:', id);

    res.json({
      success: true,
      data: transformedInvoice
    });

  } catch (error) {
    console.error('❌ Error updating invoice status in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice status',
      details: error.message
    });
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting invoice from database:', id);

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Delete invoice (items will be deleted automatically due to CASCADE)
    await prisma.invoice.delete({
      where: { id }
    });

    console.log('✅ Successfully deleted invoice from database:', existingInvoice.invoice_number);

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      data: { id, invoiceNumber: existingInvoice.invoice_number }
    });

  } catch (error) {
    console.error('❌ Error deleting invoice from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice',
      details: error.message
    });
  }
});

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 Getting invoice by ID from database:', id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Transform response to match frontend interface
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone || '',
      issueDate: invoice.issue_date.toISOString(),
      dueDate: invoice.due_date.toISOString(),
      status: invoice.status,
      type: invoice.type,
      items: invoice.items.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      })),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      notes: invoice.notes || '',
      paymentMethod: invoice.payment_method,
      paymentDate: invoice.payment_date?.toISOString(),
      createdAt: invoice.created_at.toISOString()
    };

    console.log('✅ Successfully retrieved invoice from database:', invoice.invoice_number);

    res.json({
      success: true,
      data: transformedInvoice
    });

  } catch (error) {
    console.error('❌ Error getting invoice from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoice',
      details: error.message
    });
  }
});

// GET /api/invoices/download/:id - Download invoice as PDF
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📄 Downloading invoice PDF:', id);

    const invoice = mockInvoices.find(inv => inv.id === id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // For now, just return a message since PDF generation requires additional libraries
    console.log('✅ PDF download requested for invoice:', invoice.invoiceNumber);

    res.json({
      success: true,
      message: 'PDF generation not implemented yet',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        downloadUrl: `/api/invoices/download/${id}`,
        note: 'PDF generation requires additional setup with libraries like puppeteer or jsPDF'
      }
    });

  } catch (error) {
    console.error('❌ Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download invoice',
      details: error.message
    });
  }
});

// Cleanup function
process.on('SIGINT', async () => {
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

module.exports = router;