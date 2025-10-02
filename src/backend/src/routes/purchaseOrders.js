const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  getPurchaseOrderAnalytics,
  receiveItems
} = require('../controllers/purchaseOrderController');

// GET /api/purchase-orders - Get all purchase orders with optional filters
router.get('/', getPurchaseOrders);

// GET /api/purchase-orders/analytics - Get purchase order analytics
router.get('/analytics', getPurchaseOrderAnalytics);

// GET /api/purchase-orders/:id - Get purchase order by ID
router.get('/:id', getPurchaseOrderById);

// POST /api/purchase-orders - Create new purchase order
router.post('/', createPurchaseOrder);

// PUT /api/purchase-orders/:id - Update purchase order
router.put('/:id', updatePurchaseOrder);

// PATCH /api/purchase-orders/:id/status - Update purchase order status
router.patch('/:id/status', updatePurchaseOrderStatus);

// PATCH /api/purchase-orders/:id/receive - Receive items (partial or full)
router.patch('/:id/receive', receiveItems);

// DELETE /api/purchase-orders/:id - Delete purchase order
router.delete('/:id', deletePurchaseOrder);

module.exports = router;