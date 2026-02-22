import express from 'express';
const router = express.Router();  
import { 
  getAllTransactions, 
  getUserTransactions, 
  getTransactionById, 
  createDeposit, 
  createWithdrawal, 
  getTransactionsByType 
} from '../controllers/transaction.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

// User specific routes
router.get('/user', protect, getUserTransactions);
router.get('/type/:type', protect, getTransactionsByType);
router.post('/deposit', protect, createDeposit);
router.post('/withdrawal', protect, createWithdrawal);

// Get transaction by ID
router.get('/:id', protect, getTransactionById);

// Admin only route
router.get('/', protect, admin, getAllTransactions);

export default router; 