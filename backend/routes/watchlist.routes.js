const express = require('express');
const router = express.Router();
const { 
  createWatchlist, 
  getUserWatchlists, 
  getWatchlistById, 
  updateWatchlist, 
  deleteWatchlist, 
  addProductToWatchlist, 
  removeProductFromWatchlist 
} = require('../controllers/watchlist.controller');
const { protect } = require('../middleware/auth.middleware');

// Watchlist routes
router.route('/')
  .post(protect, createWatchlist)
  .get(protect, getUserWatchlists);

router.route('/:id')
  .get(protect, getWatchlistById)
  .put(protect, updateWatchlist)
  .delete(protect, deleteWatchlist);

router.route('/:id/products/:productId')
  .post(protect, addProductToWatchlist)
  .delete(protect, removeProductFromWatchlist);

module.exports = router; 