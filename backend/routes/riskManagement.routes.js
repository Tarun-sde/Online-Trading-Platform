const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/risk-management/stop-loss
 * @desc    Create a stop-loss order
 * @access  Private
 */
router.post('/stop-loss', protect, async (req, res) => {
  try {
    const { symbol, quantity, triggerPrice, timeInForce = 'GTC' } = req.body;
    
    // Check for required fields
    if (!symbol || !quantity || !triggerPrice) {
      return res.status(400).json({ message: 'Symbol, quantity, and trigger price are required' });
    }
    
    // In a real implementation, this would interact with a brokerage API or database
    // For this demo, we'll just return a success response
    const stopLossOrder = {
      id: Math.random().toString(36).substring(2, 15),
      userId: req.user.id,
      symbol,
      quantity: parseFloat(quantity),
      triggerPrice: parseFloat(triggerPrice),
      orderType: 'STOP_LOSS',
      timeInForce,
      status: 'ACTIVE',
      createdAt: new Date()
    };
    
    res.status(201).json(stopLossOrder);
  } catch (error) {
    console.error('Error creating stop-loss order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/risk-management/take-profit
 * @desc    Create a take-profit order
 * @access  Private
 */
router.post('/take-profit', protect, async (req, res) => {
  try {
    const { symbol, quantity, targetPrice, timeInForce = 'GTC' } = req.body;
    
    // Check for required fields
    if (!symbol || !quantity || !targetPrice) {
      return res.status(400).json({ message: 'Symbol, quantity, and target price are required' });
    }
    
    // In a real implementation, this would interact with a brokerage API or database
    // For this demo, we'll just return a success response
    const takeProfitOrder = {
      id: Math.random().toString(36).substring(2, 15),
      userId: req.user.id,
      symbol,
      quantity: parseFloat(quantity),
      targetPrice: parseFloat(targetPrice),
      orderType: 'TAKE_PROFIT',
      timeInForce,
      status: 'ACTIVE',
      createdAt: new Date()
    };
    
    res.status(201).json(takeProfitOrder);
  } catch (error) {
    console.error('Error creating take-profit order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/risk-management/trailing-stop
 * @desc    Create a trailing stop order
 * @access  Private
 */
router.post('/trailing-stop', protect, async (req, res) => {
  try {
    const { symbol, quantity, trailAmount, trailType, timeInForce = 'GTC' } = req.body;
    
    // Check for required fields
    if (!symbol || !quantity || !trailAmount || !trailType) {
      return res.status(400).json({ 
        message: 'Symbol, quantity, trail amount, and trail type are required' 
      });
    }
    
    // Validate trail type
    if (!['PRICE', 'PERCENTAGE'].includes(trailType)) {
      return res.status(400).json({ 
        message: 'Trail type must be either PRICE or PERCENTAGE' 
      });
    }
    
    // In a real implementation, this would interact with a brokerage API or database
    // For this demo, we'll just return a success response
    const trailingStopOrder = {
      id: Math.random().toString(36).substring(2, 15),
      userId: req.user.id,
      symbol,
      quantity: parseFloat(quantity),
      trailAmount: parseFloat(trailAmount),
      trailType,
      orderType: 'TRAILING_STOP',
      timeInForce,
      status: 'ACTIVE',
      createdAt: new Date()
    };
    
    res.status(201).json(trailingStopOrder);
  } catch (error) {
    console.error('Error creating trailing stop order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/risk-management/stop-limit
 * @desc    Create a stop-limit order
 * @access  Private
 */
router.post('/stop-limit', protect, async (req, res) => {
  try {
    const { symbol, quantity, stopPrice, limitPrice, timeInForce = 'GTC' } = req.body;
    
    // Check for required fields
    if (!symbol || !quantity || !stopPrice || !limitPrice) {
      return res.status(400).json({ 
        message: 'Symbol, quantity, stop price, and limit price are required' 
      });
    }
    
    // In a real implementation, this would interact with a brokerage API or database
    // For this demo, we'll just return a success response
    const stopLimitOrder = {
      id: Math.random().toString(36).substring(2, 15),
      userId: req.user.id,
      symbol,
      quantity: parseFloat(quantity),
      stopPrice: parseFloat(stopPrice),
      limitPrice: parseFloat(limitPrice),
      orderType: 'STOP_LIMIT',
      timeInForce,
      status: 'ACTIVE',
      createdAt: new Date()
    };
    
    res.status(201).json(stopLimitOrder);
  } catch (error) {
    console.error('Error creating stop-limit order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/risk-management/orders
 * @desc    Get all risk management orders for the user
 * @access  Private
 */
router.get('/orders', protect, async (req, res) => {
  try {
    // In a real implementation, this would fetch from a database
    // For this demo, we'll return mock data
    const mockOrders = [
      {
        id: '1a2b3c',
        userId: req.user.id,
        symbol: 'AAPL',
        quantity: 10,
        triggerPrice: 175.50,
        orderType: 'STOP_LOSS',
        timeInForce: 'GTC',
        status: 'ACTIVE',
        createdAt: new Date()
      },
      {
        id: '4d5e6f',
        userId: req.user.id,
        symbol: 'MSFT',
        quantity: 5,
        targetPrice: 420.00,
        orderType: 'TAKE_PROFIT',
        timeInForce: 'GTC',
        status: 'ACTIVE',
        createdAt: new Date()
      }
    ];
    
    res.json(mockOrders);
  } catch (error) {
    console.error('Error fetching risk management orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/risk-management/orders/:id
 * @desc    Cancel a risk management order
 * @access  Private
 */
router.delete('/orders/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, this would delete from a database
    // For this demo, we'll just return a success response
    res.json({ message: `Order ${id} canceled successfully` });
  } catch (error) {
    console.error(`Error canceling order ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 