const rateLimit = require('express-rate-limit');

// General API Rate Limiter: 300 requests per 15-minute window per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Strict Login Rate Limiter: 10 login attempts per 15-minute window per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
});

// Strict OTP Rate Limiter: 5 OTP requests per 15-minute window per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 15 minutes before requesting again.',
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  otpLimiter,
};
