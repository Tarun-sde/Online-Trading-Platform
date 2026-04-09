/**
 * analyze.js
 * Routes:
 *   POST /api/analyze         → run one or more strategies on a symbol
 *   GET  /api/analyze/strategies → list all available strategies with metadata
 */

import express from 'express';
import { getHistoricalData } from '../services/stockService.js';
import {
  executeStrategy,
  executeStrategies,
  getAvailableStrategies,
} from '../services/strategies/strategyFactory.js';

const router = express.Router();

// ─── GET /api/analyze/strategies ─────────────────────────────────────────────
// Returns strategy metadata for the frontend to build its UI dynamically.
// Must be registered BEFORE the POST / handler to avoid Express swallowing it.
router.get('/strategies', (_req, res) => {
  res.json(getAvailableStrategies());
});

// ─── POST /api/analyze ────────────────────────────────────────────────────────
// Accepts single strategy (string) or multiple (string[]).
// Returns results + historical chart data in one call.
router.post('/', async (req, res) => {
  const { symbol, strategy, strategies } = req.body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    return res.status(400).json({
      status: 'error',
      message: '`symbol` is required (e.g. "RELIANCE.NS").',
    });
  }

  // Support both single `strategy` and array `strategies`
  const requestedStrategies = (() => {
    if (Array.isArray(strategies) && strategies.length > 0) return strategies;
    if (typeof strategy === 'string' && strategy.trim()) return [strategy.trim()];
    return null;
  })();

  if (!requestedStrategies) {
    const available = getAvailableStrategies().map(s => s.name).join(', ');
    return res.status(400).json({
      status: 'error',
      message: `\`strategy\` or \`strategies[]\` is required. Available: ${available}`,
    });
  }

  const trimmedSymbol = symbol.trim().toUpperCase();

  try {
    // Fetch real historical data once — shared across all strategies
    const stockData = await getHistoricalData(trimmedSymbol);

    // Run all requested strategies
    const results = executeStrategies(requestedStrategies, stockData);

    // Build chart-ready data: [ { date: "Apr 01", price: 2456.75 }, ... ]
    const chartData = stockData.closingPrices.map((price, i) => ({
      date: stockData.timestamps[i]
        ? new Date(stockData.timestamps[i] * 1000).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
          })
        : `Day ${i + 1}`,
      price: parseFloat(price.toFixed(2)),
    }));

    return res.status(200).json({
      symbol: stockData.symbol,
      currentPrice: stockData.currentPrice,
      dataPoints: stockData.closingPrices.length,
      chartData,      // for frontend chart rendering
      results,        // one object per strategy
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Invalid symbol / not enough data → 400
    if (
      /not found|misspelled|delisted|Insufficient|requires at least/i.test(err.message)
    ) {
      return res.status(400).json({ status: 'error', message: err.message });
    }

    // External API failures → 502
    if (/Yahoo Finance|Network error|timed out|HTTP \d{3}/i.test(err.message)) {
      return res.status(502).json({
        status: 'error',
        message: 'Failed to fetch market data from Yahoo Finance. Try again shortly.',
        detail: err.message,
      });
    }

    console.error('[POST /api/analyze]', err);
    return res.status(500).json({ status: 'error', message: 'Unexpected server error.' });
  }
});

export default router;
