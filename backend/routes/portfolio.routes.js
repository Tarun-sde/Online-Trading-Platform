/**
 * portfolio.routes.js
 * All routes are protected — require valid JWT via Authorization: Bearer <token>
 *
 * GET  /api/portfolio               → get user's portfolio (empty by default)
 * POST /api/portfolio/buy           → buy a stock
 * POST /api/portfolio/sell          → sell a stock
 * POST /api/portfolio/strategy      → save custom strategy expression
 * POST /api/portfolio/strategy/run  → run saved strategy on a symbol
 */

import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getPortfolio,
  buyStock,
  sellStock,
  editStock,
  removeStock,
  saveStrategy,
  runStrategy,
} from '../controllers/portfolio.controller.js';

const router = express.Router();

// All portfolio routes require authentication
router.use(protect);

router.get('/', getPortfolio);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.put('/:symbol', editStock);
router.delete('/:symbol', removeStock);
router.post('/strategy', saveStrategy);
router.post('/strategy/run', runStrategy);

export default router;
