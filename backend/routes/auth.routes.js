const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router; 