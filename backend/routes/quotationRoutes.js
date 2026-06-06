const express = require('express');
const router = express.Router();
const { getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, compareQuotations, updateQuotationStatus } = require('../controllers/quotationController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getQuotations)
  .post(protect, authorize('Vendor'), createQuotation);

router.route('/compare/:rfqId')
  .get(protect, authorize('Admin', 'Procurement Officer', 'Manager'), compareQuotations);

router.route('/:id/status')
  .put(protect, authorize('Manager'), updateQuotationStatus);

router.route('/:id')
  .get(protect, getQuotation)
  .put(protect, authorize('Vendor'), updateQuotation)
  .delete(protect, authorize('Vendor', 'Admin'), deleteQuotation);

module.exports = router;
