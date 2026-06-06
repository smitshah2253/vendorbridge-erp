const Approval = require('../models/Approval');
const Quotation = require('../models/Quotation');

// @desc    Get all approvals
// @route   GET /api/approvals
// @access  Private
const getApprovals = async (req, res) => {
  try {
    const { status, approverId } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (approverId) {
      query.approverId = approverId;
    }

    const approvals = await Approval.find(query)
      .populate({
        path: 'quotationId',
        populate: { path: 'vendorId' }
      })
      .populate('rfqId')
      .populate('approverId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: approvals.length,
      data: approvals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single approval
// @route   GET /api/approvals/:id
// @access  Private
const getApproval = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id)
      .populate({
        path: 'quotationId',
        populate: { path: 'vendorId' }
      })
      .populate('rfqId')
      .populate('approverId', 'name email');

    if (!approval) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create approval request
// @route   POST /api/approvals
// @access  Private
const createApproval = async (req, res) => {
  try {
    const { quotationId, rfqId, approverId } = req.body;

    const approval = await Approval.create({
      quotationId,
      rfqId,
      approverId,
    });

    const populatedApproval = await Approval.findById(approval._id)
      .populate({
        path: 'quotationId',
        populate: { path: 'vendorId' }
      })
      .populate('rfqId')
      .populate('approverId', 'name email');

    res.status(201).json({
      success: true,
      data: populatedApproval,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve quotation
// @route   POST /api/approvals/:id/approve
// @access  Private
const approveQuotation = async (req, res) => {
  try {
    const { remarks } = req.body;

    const approval = await Approval.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Approved',
        remarks,
        approvedAt: Date.now(),
      },
      { new: true }
    )
      .populate({
        path: 'quotationId',
        populate: { path: 'vendorId' }
      })
      .populate('rfqId')
      .populate('approverId', 'name email');

    if (!approval) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    if (!approval.quotationId) {
      return res.status(400).json({ message: 'The quotation associated with this approval request has been deleted.' });
    }

    // Update quotation status
    await Quotation.findByIdAndUpdate(approval.quotationId._id, { status: 'Approved' });

    // Send email notification to vendor
    const { sendQuotationStatusNotification } = require('../utils/emailService');
    if (approval.quotationId?.vendorId?.email) {
      sendQuotationStatusNotification(
        approval.quotationId.vendorId.email,
        approval.rfqId?.title || 'RFQ',
        'Approved'
      ).catch(err => {
        console.error('Failed to send approval notification:', err);
      });
    }

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject quotation
// @route   POST /api/approvals/:id/reject
// @access  Private
const rejectQuotation = async (req, res) => {
  try {
    const { remarks } = req.body;

    const approval = await Approval.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Rejected',
        remarks,
        approvedAt: Date.now(),
      },
      { new: true }
    )
      .populate({
        path: 'quotationId',
        populate: { path: 'vendorId' }
      })
      .populate('rfqId')
      .populate('approverId', 'name email');

    if (!approval) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    if (!approval.quotationId) {
      return res.status(400).json({ message: 'The quotation associated with this approval request has been deleted.' });
    }

    // Update quotation status
    await Quotation.findByIdAndUpdate(approval.quotationId._id, { status: 'Rejected' });

    // Send email notification to vendor
    const { sendQuotationStatusNotification } = require('../utils/emailService');
    if (approval.quotationId?.vendorId?.email) {
      sendQuotationStatusNotification(
        approval.quotationId.vendorId.email,
        approval.rfqId?.title || 'RFQ',
        'Rejected'
      ).catch(err => {
        console.error('Failed to send rejection notification:', err);
      });
    }

    res.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getApprovals, getApproval, createApproval, approveQuotation, rejectQuotation };
