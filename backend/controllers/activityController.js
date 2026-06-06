const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/activity
// @access  Private
const getActivityLogs = async (req, res) => {
  try {
    const { userId, entity, limit } = req.query;

    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (entity) {
      query.entity = entity;
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
    // This would typically aggregate data from various collections
    // For now, returning mock data structure
    const analytics = {
      totalVendors: await require('../models/Vendor').countDocuments(),
      totalRFQs: await require('../models/RFQ').countDocuments(),
      totalQuotations: await require('../models/Quotation').countDocuments(),
      totalInvoices: await require('../models/Invoice').countDocuments(),
      pendingApprovals: await require('../models/Approval').countDocuments({ status: 'Pending' }),
      totalSpending: await require('../models/Invoice').aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
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
