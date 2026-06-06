const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const logActivity = require('../utils/activityLogger');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
const getPurchaseOrders = async (req, res) => {
  try {
    const { vendorId, status } = req.query;

    let query = {};

    if (req.user && req.user.role === 'Vendor') {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.vendorId = vendor._id;
    } else if (vendorId) {
      query.vendorId = vendorId;
    }

    if (status) {
      query.status = status;
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate({
        path: 'quotationId',
        populate: {
          path: 'rfqId'
        }
      })
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
      .populate({
        path: 'quotationId',
        populate: {
          path: 'rfqId'
        }
      })
      .populate('vendorId');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (req.user && req.user.role === 'Vendor' && purchaseOrder.vendorId && purchaseOrder.vendorId.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this purchase order' });
    }

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const { quotationId } = req.body;

    const existingPO = await PurchaseOrder.findOne({ quotationId });
    if (existingPO) {
      return res.status(400).json({ message: 'A Purchase Order has already been generated for this quotation.' });
    }

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
      .populate({
        path: 'quotationId',
        populate: {
          path: 'rfqId'
        }
      })
      .populate('vendorId');

    await logActivity(req.user.id, 'Generated', 'Purchase Order', purchaseOrder._id, {
      poNumber: populatedPO.poNumber,
      vendorName: populatedPO.vendorId?.name,
      totalAmount
    });

    // Send email notification to vendor
    const { sendPONotification } = require('../utils/emailService');
    if (populatedPO.vendorId?.email) {
      sendPONotification(
        populatedPO.vendorId.email,
        populatedPO.poNumber,
        totalAmount
      ).catch(err => {
        console.error(`Failed to send PO notification to ${populatedPO.vendorId.email}:`, err);
      });
    }

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
      .populate({
        path: 'quotationId',
        populate: {
          path: 'rfqId'
        }
      })
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
