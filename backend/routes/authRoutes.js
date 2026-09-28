const express = require('express');
const router = express.Router();
const {
  login,
  getProfile,
  updateProfile,
  logout,
  sendOtp,
  verifyOtp,
  resetPassword,
  forgotPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/logout', protect, logout);
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/reset-password', otpLimiter, resetPassword);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
