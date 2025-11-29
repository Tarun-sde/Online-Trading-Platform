const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private/Admin
 */
const getAllTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = {};
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Filter by transaction type if provided
  if (req.query.type) {
    query.transactionType = req.query.type;
  }
  
  // Count total documents for pagination
  const total = await Transaction.countDocuments(query);
  
  // Get transactions with populated fields
  const transactions = await Transaction.find(query)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name symbol')
    .populate('order', 'orderType side')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  res.json({
    transactions,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get user transactions
 * @route   GET /api/transactions/user
 * @access  Private
 */
const getUserTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = { user: req.user._id };
  
  // Filter by transaction type if provided
  if (req.query.type) {
    query.transactionType = req.query.type;
  }
  
  // Count total documents for pagination
  const total = await Transaction.countDocuments(query);
  
  // Get user transactions
  const transactions = await Transaction.find(query)
    .populate('product', 'name symbol')
    .populate('order', 'orderType side')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  res.json({
    transactions,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name symbol currentPrice')
    .populate('order', 'orderType side quantity');
  
  if (transaction) {
    // Check if the user is the owner or an admin
    if (transaction.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this transaction');
    }
    
    res.json(transaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

/**
 * @desc    Create a deposit transaction
 * @route   POST /api/transactions/deposit
 * @access  Private
 */
const createDeposit = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, reference } = req.body;
  
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid amount');
  }
  
  // Create the transaction
  const transaction = await Transaction.create({
    user: req.user._id,
    transactionType: 'deposit',
    amount,
    status: 'completed', // In a real app, this might be pending initially
    paymentMethod: paymentMethod || 'bank_transfer',
    reference,
    description: `Deposit of ${amount} to account`
  });
  
  if (transaction) {
    // Add amount to user balance
    const user = await User.findById(req.user._id);
    if (user) {
      user.accountBalance += amount;
      await user.save();
    }
    
    res.status(201).json(transaction);
  } else {
    res.status(400);
    throw new Error('Invalid transaction data');
  }
});

/**
 * @desc    Create a withdrawal transaction
 * @route   POST /api/transactions/withdrawal
 * @access  Private
 */
const createWithdrawal = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, reference } = req.body;
  
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid amount');
  }
  
  // Check if user has enough balance
  const user = await User.findById(req.user._id);
  if (!user || user.accountBalance < amount) {
    res.status(400);
    throw new Error('Insufficient funds');
  }
  
  // Create the transaction
  const transaction = await Transaction.create({
    user: req.user._id,
    transactionType: 'withdrawal',
    amount,
    status: 'pending', // Withdrawals are usually pending until processed
    paymentMethod: paymentMethod || 'bank_transfer',
    reference,
    description: `Withdrawal of ${amount} from account`
  });
  
  if (transaction) {
    // Deduct amount from user balance
    user.accountBalance -= amount;
    await user.save();
    
    res.status(201).json(transaction);
  } else {
    res.status(400);
    throw new Error('Invalid transaction data');
  }
});

/**
 * @desc    Get transactions by type
 * @route   GET /api/transactions/type/:type
 * @access  Private
 */
const getTransactionsByType = asyncHandler(async (req, res) => {
  const transactionType = req.params.type;
  
  // Validate transaction type
  const validTypes = ['buy', 'sell', 'deposit', 'withdrawal', 'fee', 'dividend', 'interest', 'transfer', 'refund', 'adjustment'];
  if (!validTypes.includes(transactionType)) {
    res.status(400);
    throw new Error('Invalid transaction type');
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = { 
    user: req.user._id,
    transactionType
  };
  
  // Count total documents for pagination
  const total = await Transaction.countDocuments(query);
  
  // Get transactions
  const transactions = await Transaction.find(query)
    .populate('product', 'name symbol')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  res.json({
    transactions,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

module.exports = {
  getAllTransactions,
  getUserTransactions,
  getTransactionById,
  createDeposit,
  createWithdrawal,
  getTransactionsByType
}; 