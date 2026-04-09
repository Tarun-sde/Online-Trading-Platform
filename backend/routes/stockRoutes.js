/**
 * stockRoutes.js
 * GET /api/stocks/:symbol
 *
 * Returns real historical data + chart-ready format from Yahoo Finance.
 * No mock data. No hardcoded prices.
 */

import express from 'express';
import { getHistoricalData, getStockPrice, searchStocks } from '../services/stockService.js';

const router = express.Router();

/**
 * GET /api/stocks/search?q=keyword
 * Returns list of matching stocks
 */
router.get('/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query ?q= is required.' });
  }

  try {
    const results = await searchStocks(query);
    // Optionally filter by symbol ends with .NS or let Yahoo Finance do its thing
    // We will just let Yahoo Finance results pass through, filtering is in service.
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search stocks.' });
  }
});

/**
 * GET /api/stocks/:symbol
 * Returns: symbol, currentPrice, closingPrices[], timestamps[], chartData[]
 */
router.get('/:symbol', async (req, res) => {
  const symbol = req.params.symbol?.trim().toUpperCase();

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required.' });
  }

  try {
    const data = await getHistoricalData(symbol);

    // Build chart-ready array for the frontend
    const chartData = data.closingPrices.map((price, i) => ({
      date: data.timestamps[i]
        ? new Date(data.timestamps[i] * 1000).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
          })
        : `Day ${i + 1}`,
      price: parseFloat(price.toFixed(2)),
    }));

    return res.json({
      symbol: data.symbol,
      currentPrice: data.currentPrice,
      dataPoints: data.closingPrices.length,
      closingPrices: data.closingPrices,
      timestamps: data.timestamps,
      chartData,
    });
  } catch (err) {
    const status = /not found|misspelled|delisted/i.test(err.message) ? 404 : 502;
    return res.status(status).json({ error: err.message });
  }
});

export default router;
