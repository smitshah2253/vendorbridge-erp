const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/activity
// @access  Private
const getActivityLogs = async (req, res) => {
  try {
    const { userId, entity, limit } = req.query;

    let query = {};

    if (req.user && req.user.role === 'Vendor') {
      const Vendor = require('../models/Vendor');
      const Quotation = require('../models/Quotation');
      const PurchaseOrder = require('../models/PurchaseOrder');
      const Invoice = require('../models/Invoice');

      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.json({ success: true, count: 0, data: [] });
      }

      // Find all entity IDs belonging to this vendor
      const [quotes, pos, invoices] = await Promise.all([
        Quotation.find({ vendorId: vendor._id }).select('_id'),
        PurchaseOrder.find({ vendorId: vendor._id }).select('_id'),
        Invoice.find({ vendorId: vendor._id }).select('_id')
      ]);

      const quoteIds = quotes.map(q => q._id);
      const poIds = pos.map(p => p._id);
      const invoiceIds = invoices.map(i => i._id);

      // Build the $or conditions for Vendor visibility
      query.$or = [
        { userId: req.user._id },
        { entity: 'Vendor', entityId: vendor._id },
        { entity: 'Quotation', entityId: { $in: quoteIds } },
        { entity: 'Purchase Order', entityId: { $in: poIds } },
        { entity: 'Invoice', entityId: { $in: invoiceIds } }
      ];

      if (userId) {
        query.userId = userId;
      }
      if (entity) {
        query.entity = entity;
      }
    } else {
      if (userId) {
        query.userId = userId;
      }
      if (entity) {
        query.entity = entity;
      }
    }

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 50);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create activity log
// @route   POST /api/activity
// @access  Private
const createActivityLog = async (req, res) => {
  try {
    const { userId, action, entity, entityId, details } = req.body;

    const log = await ActivityLog.create({
      userId,
      action,
      entity,
      entityId,
      details,
    });

    const populatedLog = await ActivityLog.findById(log._id).populate('userId', 'name email role');

    res.status(201).json({
      success: true,
      data: populatedLog,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');

    const totalSpendingRes = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalSpending = totalSpendingRes.length > 0 ? totalSpendingRes[0].total : 0;

    const spendingTrends = await Invoice.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const spendByCategory = await Invoice.aggregate([
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$vendor.category',
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const analytics = {
      totalVendors: await require('../models/Vendor').countDocuments(),
      totalRFQs: await require('../models/RFQ').countDocuments(),
      totalQuotations: await require('../models/Quotation').countDocuments(),
      totalInvoices: await require('../models/Invoice').countDocuments(),
      pendingApprovals: await require('../models/Approval').countDocuments({ status: 'Pending' }),
      totalSpending,
      spendingTrends,
      spendByCategory,
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivityLogs, createActivityLog, getAnalytics };
