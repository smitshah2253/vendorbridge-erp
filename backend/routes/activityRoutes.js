const express = require('express');
const router = express.Router();
const { getActivityLogs, createActivityLog, getAnalytics } = require('../controllers/activityController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getActivityLogs)
  .post(protect, createActivityLog);

router.get('/analytics', protect, authorize('Admin', 'Procurement Officer', 'Manager'), getAnalytics);

module.exports = router;
