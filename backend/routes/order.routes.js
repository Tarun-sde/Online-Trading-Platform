const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getAllOrders, 
  getUserOrders, 
  getOrderById, 
  updateOrder, 
  cancelOrder, 
  getOrdersByStatus 
} = require('../controllers/order.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// User specific routes
router.get('/user', protect, getUserOrders);
router.get('/status/:status', protect, getOrdersByStatus);

// Create order route
router.post('/', protect, createOrder);

// Admin route to get all orders
router.get('/', protect, admin, getAllOrders);

// Order by ID routes
router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, admin, updateOrder)
  .delete(protect, cancelOrder);

module.exports = router; 