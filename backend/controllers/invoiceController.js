const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const { vendorId, status } = req.query;

    let query = {};

    if (vendorId) {
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

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create invoice from purchase order
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const { poId, dueDate } = req.body;

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
