const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const { USER_ROLES, normalizeRole } = require('../constants/roles');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().trim().custom((value) => {
    if (!value) return true;
    return USER_ROLES.includes(normalizeRole(value));
  }).withMessage(`Invalid role. Must be one of: ${USER_ROLES.join(', ')}`)
], validateRequest, signup);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, login);

router.get('/me', protect, getMe);

module.exports = router;
