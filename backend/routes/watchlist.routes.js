import express from 'express';
const router = express.Router();
import { 
  createWatchlist, 
  getUserWatchlists, 
  getWatchlistById, 
  updateWatchlist, 
  deleteWatchlist, 
  addProductToWatchlist, 
  removeProductFromWatchlist 
} from '../controllers/watchlist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

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

export default router; 