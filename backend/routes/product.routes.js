import express from 'express';
const router = express.Router();
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsByType, 
  getProductPriceHistory 
} from '../controllers/product.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

// Public routes
router.get('/', getAllProducts);
router.get('/type/:type', getProductsByType);
router.get('/:id', getProductById);
router.get('/:id/price-history', getProductPriceHistory);

// Admin routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router; 