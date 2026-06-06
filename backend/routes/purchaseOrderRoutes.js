const express = require('express');
const router = express.Router();
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getPurchaseOrders)
  .post(protect, authorize('Admin', 'Procurement Officer'), createPurchaseOrder);

router.route('/:id')
  .get(protect, getPurchaseOrder)
  .put(protect, authorize('Admin', 'Procurement Officer'), updatePurchaseOrder)
  .delete(protect, authorize('Admin', 'Procurement Officer'), deletePurchaseOrder);

module.exports = router;
