import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
} from '../controllers/watchlist.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getWatchlist);
router.post('/add', addSymbolToWatchlist);
router.delete('/remove/:symbol', removeSymbolFromWatchlist);

export default router;