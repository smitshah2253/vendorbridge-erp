const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, entity, entityId, details = {}) => {
  try {
    if (!userId || !action || !entity || !entityId) {
      console.warn('Skipping logActivity: missing required fields', { userId, action, entity, entityId });
      return;
    }
    await ActivityLog.create({
      userId,
      action,
      entity,
      entityId,
      details,
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};

module.exports = logActivity;
