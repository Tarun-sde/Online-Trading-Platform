import express from 'express';
const router = express.Router();
import { 
  createOrder, 
  getAllOrders, 
  getUserOrders, 
  getOrderById, 
  updateOrder, 
  cancelOrder, 
  getOrdersByStatus 
} from '../controllers/order.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

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

export default router; 