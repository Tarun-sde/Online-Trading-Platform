/**
 * strategies.routes.js
 *
 * POST   /api/strategies              → create user strategy
 * GET    /api/strategies              → list (defaults + user's own)
 * GET    /api/strategies/:id          → get one
 * PUT    /api/strategies/:id          → update (user's own only)
 * DELETE /api/strategies/:id          → delete (user's own only)
 * POST   /api/strategies/run          → run one or more strategies on real data
 * POST   /api/strategies/copy/:id     → copy a default into user's library
 */

import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createStrategy,
  listStrategies,
  getStrategy,
  updateStrategy,
  deleteStrategy,
  copyStrategy,
  runStrategies,
} from '../controllers/strategies.controller.js';

const router = express.Router();

router.use(protect);

// IMPORTANT: specific named routes before /:id to avoid Express matching them as IDs
router.post('/run', runStrategies);
router.post('/copy/:id', copyStrategy);

router.route('/')
  .get(listStrategies)
  .post(createStrategy);

router.route('/:id')
  .get(getStrategy)
  .put(updateStrategy)
  .delete(deleteStrategy);

export default router;
