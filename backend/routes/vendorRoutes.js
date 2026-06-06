const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const protect = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('gstNumber').trim().notEmpty().withMessage('GST Number is required'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required')
], validateRequest, vendorController.createVendor);

router.get('/', protect, vendorController.getVendors);
router.get('/:id', protect, vendorController.getVendor);
router.put('/:id', protect, vendorController.updateVendor);
router.delete('/:id', protect, vendorController.deleteVendor);

module.exports = router;
