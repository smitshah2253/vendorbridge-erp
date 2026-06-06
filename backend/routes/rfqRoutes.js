const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

router.post('/upload', protect, authorize('Admin', 'Procurement Officer'), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    success: true,
    data: {
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`
    }
  });
});

router.post('/', protect, authorize('Admin', 'Procurement Officer'), [
  body('title').trim().notEmpty().withMessage('RFQ title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('deadline').isISO8601().toDate().withMessage('Valid deadline date is required'),
  body('assignedVendors').isArray({ min: 1 }).withMessage('At least one vendor must be assigned'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], validateRequest, rfqController.createRFQ);

router.get('/', protect, rfqController.getRFQs);
router.get('/:id', protect, rfqController.getRFQ);
router.put('/:id', protect, authorize('Admin', 'Procurement Officer'), rfqController.updateRFQ);
router.delete('/:id', protect, authorize('Admin', 'Procurement Officer'), rfqController.deleteRFQ);

module.exports = router;
