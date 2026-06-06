const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const logActivity = require('../utils/activityLogger');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
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

    const invoices = await Invoice.find(query)
      .populate('poId')
      .populate('vendorId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('poId')
      .populate('vendorId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (req.user && req.user.role === 'Vendor' && invoice.vendorId && invoice.vendorId.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { poId, dueDate } = req.body;

    const existingInvoice = await Invoice.findOne({ poId });
    if (existingInvoice) {
      return res.status(400).json({ message: 'An Invoice has already been generated for this Purchase Order.' });
    }

    const purchaseOrder = await PurchaseOrder.findById(poId).populate('vendorId');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const invoice = await Invoice.create({
      poId,
      vendorId: purchaseOrder.vendorId._id,
      items: purchaseOrder.items,
      subtotal: purchaseOrder.subtotal,
      tax: purchaseOrder.tax,
      taxRate: purchaseOrder.taxRate || 18,
      totalAmount: purchaseOrder.totalAmount,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'Draft',
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('poId')
      .populate('vendorId');

    await logActivity(req.user.id, 'Generated', 'Invoice', invoice._id, {
      invoiceNumber: populatedInvoice.invoiceNumber,
      vendorName: populatedInvoice.vendorId?.name,
      totalAmount: populatedInvoice.totalAmount
    });

    res.status(201).json({
      success: true,
      data: populatedInvoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('poId')
      .populate('vendorId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice };
