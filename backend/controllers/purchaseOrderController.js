const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
const getPurchaseOrders = async (req, res) => {
  try {
    const { vendorId, status } = req.query;

    let query = {};

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (status) {
      query.status = status;
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('quotationId')
      .populate('vendorId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
const getPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('quotationId')
      .populate('vendorId');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create purchase order from quotation
// @route   POST /api/purchase-orders
// @access  Private
const createPurchaseOrder = async (req, res) => {
  try {
    const { quotationId } = req.body;

    const quotation = await Quotation.findById(quotationId).populate('vendorId');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const taxRate = 18; // 18% GST
    const subtotal = quotation.totalAmount;
    const tax = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + tax;

    const purchaseOrder = await PurchaseOrder.create({
      quotationId,
      vendorId: quotation.vendorId._id,
      items: quotation.items,
      subtotal,
      tax,
      totalAmount,
      status: 'Draft',
    });

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('quotationId')
      .populate('vendorId');

    res.status(201).json({
      success: true,
      data: populatedPO,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Private
const updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('quotationId')
      .populate('vendorId');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private
const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder };
