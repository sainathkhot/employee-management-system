const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', protect, authController.me);

module.exports = router;
