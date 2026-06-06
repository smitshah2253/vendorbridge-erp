const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const logActivity = require('../utils/activityLogger');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    const { rfqId, vendorId, status } = req.query;

    let query = {};

    if (rfqId) {
      query.rfqId = rfqId;
    }

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

    const quotations = await Quotation.find(query)
      .populate('rfqId')
      .populate('vendorId')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
const getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('rfqId')
      .populate('vendorId');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (req.user && req.user.role === 'Vendor' && quotation.vendorId && quotation.vendorId.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this quotation' });
    }

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createQuotation = async (req, res) => {
  try {
    const { rfqId, vendorId, items, notes } = req.body;

    if (req.user && req.user.role === 'Vendor') {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor || vendor._id.toString() !== vendorId.toString()) {
        return res.status(403).json({ message: 'Not authorized to submit quotation for this vendor' });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const quotation = await Quotation.create({
      rfqId,
      vendorId,
      items,
      totalAmount,
      notes,
    });

    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate('rfqId')
      .populate('vendorId');

    // Create approval request automatically
    const User = require('../models/User');
    const Approval = require('../models/Approval');
    const manager = await User.findOne({ role: 'Manager' });
    if (manager) {
      await Approval.create({
        quotationId: quotation._id,
        rfqId,
        approverId: manager._id,
        status: 'Pending'
      });
    }

    await logActivity(req.user?.id || vendorId, 'Submitted', 'Quotation', quotation._id, {
      rfqTitle: populatedQuotation.rfqId?.title,
      totalAmount
    });

    res.status(201).json({
      success: true,
      data: populatedQuotation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuotation = async (req, res) => {
  try {
    // Recalculate total if items are updated
    if (req.body.items) {
      req.body.totalAmount = req.body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    const existingQuotation = await Quotation.findById(req.params.id).populate('vendorId');
    if (!existingQuotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (req.user && req.user.role === 'Vendor' && existingQuotation.vendorId && existingQuotation.vendorId.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to update this quotation' });
    }

    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('rfqId')
      .populate('vendorId');

    // Check if an Approval request exists for this quotation. If not, create one.
    const User = require('../models/User');
    const Approval = require('../models/Approval');
    const approvalExists = await Approval.findOne({ quotationId: quotation._id });
    if (!approvalExists) {
      const manager = await User.findOne({ role: 'Manager' });
      if (manager) {
        await Approval.create({
          quotationId: quotation._id,
          rfqId: quotation.rfqId?._id || quotation.rfqId,
          approverId: manager._id,
          status: 'Pending'
        });
      }
    } else if (approvalExists.status !== 'Pending' && req.body.status === 'Pending') {
      // Reset approval status if vendor modifies and resubmits
      approvalExists.status = 'Pending';
      approvalExists.remarks = 'Resubmitted by vendor';
      await approvalExists.save();
    }

    await logActivity(req.user?.id || quotation.vendorId?._id, 'Updated', 'Quotation', quotation._id, {
      rfqTitle: quotation.rfqId?.title,
      totalAmount: quotation.totalAmount
    });

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
const deleteQuotation = async (req, res) => {
  try {
    const existingQuotation = await Quotation.findById(req.params.id).populate('vendorId');
    if (!existingQuotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (req.user && req.user.role === 'Vendor' && existingQuotation.vendorId && existingQuotation.vendorId.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to delete this quotation' });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    // Cascade delete approvals for this quotation
    const Approval = require('../models/Approval');
    await Approval.deleteMany({ quotationId: req.params.id });

    res.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Compare quotations for an RFQ
// @route   GET /api/quotations/compare/:rfqId
// @access  Private
const compareQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ rfqId: req.params.rfqId })
      .populate('rfqId')
      .populate('vendorId')
      .sort({ totalAmount: 1 });

    res.json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation status (accepts { status })
// @route   PUT /api/quotations/:id/status
// @access  Private
const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('rfqId')
      .populate('vendorId');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Update corresponding Approval status if exists
    const Approval = require('../models/Approval');
    await Approval.findOneAndUpdate(
      { quotationId: quotation._id, status: 'Pending' },
      { status, approvedAt: Date.now(), remarks: `Quotation updated to ${status} via direct status handler` }
    );

    await logActivity(req.user?.id || quotation.vendorId?._id, status, 'Quotation', quotation._id, {
      rfqTitle: quotation.rfqId?.title,
      vendorName: quotation.vendorId?.name
    });

    // Send email notification to vendor
    const { sendQuotationStatusNotification } = require('../utils/emailService');
    if (quotation.vendorId?.email) {
      sendQuotationStatusNotification(
        quotation.vendorId.email,
        quotation.rfqId?.title || 'RFQ',
        status
      ).catch(err => {
        console.error('Failed to send status update notification:', err);
      });
    }

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, compareQuotations, updateQuotationStatus };
