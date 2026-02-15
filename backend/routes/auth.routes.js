import express from 'express';
const router = express.Router();
import { register, login, logout, refreshToken, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/logout', protect, logout);

export default router; 