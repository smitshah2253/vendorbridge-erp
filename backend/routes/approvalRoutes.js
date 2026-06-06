const express = require('express');
const router = express.Router();
const { getApprovals, getApproval, createApproval, approveQuotation, rejectQuotation } = require('../controllers/approvalController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, authorize('Manager', 'Admin'), getApprovals)
  .post(protect, createApproval);

router.route('/:id')
  .get(protect, authorize('Manager', 'Admin'), getApproval);

router.route('/:id/approve')
  .post(protect, authorize('Manager'), approveQuotation);

router.route('/:id/reject')
  .post(protect, authorize('Manager'), rejectQuotation);

module.exports = router;
