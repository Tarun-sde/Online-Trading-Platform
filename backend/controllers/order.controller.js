import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    productId,
    orderType,
    side,
    quantity,
    price,
    stopPrice,
    timeInForce
  } = req.body;
  
  // Validate required fields
  if (!productId || !orderType || !side || !quantity) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }
  
  // Validate order type
  if (!['market', 'limit', 'stop', 'stop_limit'].includes(orderType)) {
    res.status(400);
    throw new Error('Invalid order type');
  }
  
  // Validate order side
  if (!['buy', 'sell'].includes(side)) {
    res.status(400);
    throw new Error('Invalid order side');
  }
  
  // Validate price for limit orders
  if ((orderType === 'limit' || orderType === 'stop_limit') && !price) {
    res.status(400);
    throw new Error('Price is required for limit orders');
  }
  
  // Validate stop price for stop orders
  if ((orderType === 'stop' || orderType === 'stop_limit') && !stopPrice) {
    res.status(400);
    throw new Error('Stop price is required for stop orders');
  }
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Create order
  const order = await Order.create({
    user: req.user._id,
    product: productId,
    orderType,
    side,
    quantity,
    price,
    stopPrice,
    timeInForce: timeInForce || 'GTC',
    status: 'pending'
  });
  
  if (order) {
    // For market orders, execute immediately
    if (orderType === 'market') {
      await executeOrder(order._id);
    }
    
    res.status(201).json(order);
  } else {
    res.status(400);
    throw new Error('Invalid order data');
  }
});

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build query
  let query = {};
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Count total documents for pagination
  const total = await Order.countDocuments(query);
  
  // Get orders with populated fields
  const orders = await Order.find(query)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name symbol currentPrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get user orders
 * @route   GET /api/orders/user
 * @access  Private
 */
const getUserOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = { user: req.user._id };
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Count total documents for pagination
  const total = await Order.countDocuments(query);
  
  // Get user orders
  const orders = await Order.find(query)
    .populate('product', 'name symbol currentPrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name symbol currentPrice');
  
  if (order) {
    // Check if the user is the owner or an admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
    
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Update order
 * @route   PUT /api/orders/:id
 * @access  Private/Admin
 */
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (order) {
    // Only pending orders can be updated
    if (order.status !== 'pending') {
      res.status(400);
      throw new Error('Only pending orders can be updated');
    }
    
    // Update order fields
    order.orderType = req.body.orderType || order.orderType;
    order.price = req.body.price || order.price;
    order.stopPrice = req.body.stopPrice || order.stopPrice;
    order.timeInForce = req.body.timeInForce || order.timeInForce;
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Cancel order
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (order) {
    // Check if the user is the owner or an admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to cancel this order');
    }
    
    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      res.status(400);
      throw new Error('Only pending orders can be cancelled');
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json({ message: 'Order cancelled' });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Get orders by status
 * @route   GET /api/orders/status/:status
 * @access  Private
 */
const getOrdersByStatus = asyncHandler(async (req, res) => {
  const status = req.params.status;
  
  // Validate status
  const validStatuses = ['pending', 'filled', 'partially_filled', 'cancelled', 'expired', 'rejected'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  
  const orders = await Order.find({ 
    user: req.user._id,
    status
  })
    .populate('product', 'name symbol currentPrice')
    .sort({ createdAt: -1 });
  
  res.json(orders);
});

/**
 * Helper function to execute a market order
 * This would be called by a task scheduler in a real system
 */
const executeOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order || order.status !== 'pending') return;
  
  const product = await Product.findById(order.product);
  const user = await User.findById(order.user);
  
  if (!product || !user) return;
  
  // Use current product price for market orders
  const executionPrice = product.currentPrice;
  const totalValue = executionPrice * order.quantity;
  
  // Sample fee calculation (would be more complex in a real system)
  const fee = totalValue * 0.002; // 0.2% fee
  
  // Handle buy orders
  if (order.side === 'buy') {
    // Check if user has enough balance
    if (user.accountBalance < totalValue + fee) {
      // Reject order if insufficient funds
      order.status = 'rejected';
      await order.save();
      return;
    }
    
    // Deduct funds from user balance
    user.accountBalance -= (totalValue + fee);
    await user.save();
    
    // Update portfolio
    let portfolio = await Portfolio.findOne({ user: user._id });
    
    // Create portfolio if it doesn't exist
    if (!portfolio) {
      portfolio = await Portfolio.create({
        user: user._id,
        assets: []
      });
    }
    
    // Find existing asset or add new one
    const assetIndex = portfolio.assets.findIndex(
      asset => asset.product.toString() === product._id.toString()
    );
    
    if (assetIndex >= 0) {
      // Update existing asset
      const asset = portfolio.assets[assetIndex];
      const newTotalQuantity = asset.quantity + order.quantity;
      const newTotalInvestment = asset.initialInvestment + totalValue;
      
      // Calculate new average buy price
      asset.averageBuyPrice = newTotalInvestment / newTotalQuantity;
      asset.quantity = newTotalQuantity;
      asset.initialInvestment = newTotalInvestment;
      asset.currentValue = newTotalQuantity * product.currentPrice;
      asset.profitLoss = asset.currentValue - newTotalInvestment;
      asset.profitLossPercentage = (asset.profitLoss / newTotalInvestment) * 100;
    } else {
      // Add new asset
      portfolio.assets.push({
        product: product._id,
        quantity: order.quantity,
        averageBuyPrice: executionPrice,
        initialInvestment: totalValue,
        currentValue: totalValue,
        profitLoss: 0,
        profitLossPercentage: 0
      });
    }
    
    // Update portfolio totals
    portfolio.totalInvestment += totalValue;
    portfolio.currentValue = portfolio.assets.reduce((total, asset) => total + asset.currentValue, 0);
    portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvestment;
    portfolio.totalProfitLossPercentage = (portfolio.totalProfitLoss / portfolio.totalInvestment) * 100;
    portfolio.lastUpdated = Date.now();
    
    await portfolio.save();
  } 
  // Handle sell orders
  else if (order.side === 'sell') {
    // Get user portfolio
    const portfolio = await Portfolio.findOne({ user: user._id });
    
    if (!portfolio) {
      // Reject order if user has no portfolio
      order.status = 'rejected';
      await order.save();
      return;
    }
    
    // Find asset in portfolio
    const assetIndex = portfolio.assets.findIndex(
      asset => asset.product.toString() === product._id.toString()
    );
    
    if (assetIndex < 0 || portfolio.assets[assetIndex].quantity < order.quantity) {
      // Reject order if asset not found or insufficient quantity
      order.status = 'rejected';
      await order.save();
      return;
    }
    
    // Update asset
    const asset = portfolio.assets[assetIndex];
    
    // Calculate proceeds from sale
    const proceedsBeforeFee = totalValue;
    const proceeds = proceedsBeforeFee - fee;
    
    // Update asset quantity
    asset.quantity -= order.quantity;
    
    // If quantity is 0, remove asset from portfolio
    if (asset.quantity === 0) {
      portfolio.assets.splice(assetIndex, 1);
    } else {
      // Reduce investment amount proportionally
      const soldPercentage = order.quantity / (asset.quantity + order.quantity);
      const soldInvestment = asset.initialInvestment * soldPercentage;
      
      asset.initialInvestment -= soldInvestment;
      asset.currentValue = asset.quantity * product.currentPrice;
      asset.profitLoss = asset.currentValue - asset.initialInvestment;
      asset.profitLossPercentage = (asset.profitLoss / asset.initialInvestment) * 100;
    }
    
    // Update portfolio totals
    const soldPercentage = order.quantity / (asset.quantity + order.quantity);
    const soldInvestment = portfolio.totalInvestment * soldPercentage;
    
    portfolio.totalInvestment -= soldInvestment;
    portfolio.currentValue = portfolio.assets.reduce((total, asset) => total + asset.currentValue, 0);
    portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvestment;
    portfolio.totalProfitLossPercentage = portfolio.totalInvestment > 0 
      ? (portfolio.totalProfitLoss / portfolio.totalInvestment) * 100 
      : 0;
    portfolio.lastUpdated = Date.now();
    
    await portfolio.save();
    
    // Add proceeds to user balance
    user.accountBalance += proceeds;
    await user.save();
  }
  
  // Create transaction record
  await Transaction.create({
    user: user._id,
    product: product._id,
    order: order._id,
    transactionType: order.side,
    amount: totalValue,
    quantity: order.quantity,
    price: executionPrice,
    fee,
    status: 'completed',
    description: `${order.side === 'buy' ? 'Purchase' : 'Sale'} of ${order.quantity} ${product.symbol} at ${executionPrice}`
  });
  
  // Update order status
  order.status = 'filled';
  order.filledQuantity = order.quantity;
  order.averageFilledPrice = executionPrice;
  order.fills.push({
    price: executionPrice,
    quantity: order.quantity,
    fee,
    timestamp: Date.now()
  });
  
  await order.save();
};

export {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  getOrdersByStatus
}; 