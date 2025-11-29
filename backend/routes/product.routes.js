const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsByType, 
  getProductPriceHistory 
} = require('../controllers/product.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getAllProducts);
router.get('/type/:type', getProductsByType);
router.get('/:id', getProductById);
router.get('/:id/price-history', getProductPriceHistory);

// Admin routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router; 