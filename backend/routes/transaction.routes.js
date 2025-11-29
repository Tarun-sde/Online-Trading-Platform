const express = require('express');
const router = express.Router();
const { 
  getAllTransactions, 
  getUserTransactions, 
  getTransactionById, 
  createDeposit, 
  createWithdrawal, 
  getTransactionsByType 
} = require('../controllers/transaction.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// User specific routes
router.get('/user', protect, getUserTransactions);
router.get('/type/:type', protect, getTransactionsByType);
router.post('/deposit', protect, createDeposit);
router.post('/withdrawal', protect, createWithdrawal);

// Get transaction by ID
router.get('/:id', protect, getTransactionById);

// Admin only route
router.get('/', protect, admin, getAllTransactions);

module.exports = router; 