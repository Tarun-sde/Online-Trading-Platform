import express from 'express';
import { 
  getDemoAccount, 
  buyDemoStock, 
  sellDemoStock, 
  resetDemoAccount 
} from '../controllers/demoTrading.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getDemoAccount);

router.route('/buy')
  .post(protect, buyDemoStock);

router.route('/sell')
  .post(protect, sellDemoStock);

router.route('/reset')
  .post(protect, resetDemoAccount);

export default router;
