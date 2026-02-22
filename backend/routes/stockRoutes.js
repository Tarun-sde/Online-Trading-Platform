import express from 'express';
const router = express.Router();
import { getStockPrice } from '../services/stockService.js';

router.get('/:symbol', async (req, res) => {
  try {
    const data = await getStockPrice(req.params.symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

export default router;
