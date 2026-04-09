/**
 * portfolio.controller.js
 * Handles buy, sell, get portfolio, and strategy CRUD.
 * Portfolio always starts empty — no seeding, no defaults.
 */

import UserPortfolio from '../models/UserPortfolio.js';
import { getHistoricalData } from '../services/stockService.js';
import { executeStrategies } from '../services/strategies/strategyFactory.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Finds or creates an empty portfolio document for a user.
 * On first access, holdings = [], strategy = null.
 */
async function getOrCreatePortfolio(userId) {
  let portfolio = await UserPortfolio.findOne({ user: userId });
  if (!portfolio) {
    portfolio = await UserPortfolio.create({ user: userId, holdings: [], strategy: null });
  }
  return portfolio;
}

// ─── GET /api/portfolio ───────────────────────────────────────────────────────

export async function getPortfolio(req, res) {
  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);
    return res.json({
      holdings: portfolio.holdings,
      strategy: portfolio.strategy,
      totalHoldings: portfolio.holdings.length,
    });
  } catch (err) {
    console.error('[GET /api/portfolio]', err);
    return res.status(500).json({ message: 'Failed to fetch portfolio.' });
  }
}

// ─── POST /api/portfolio/buy ─────────────────────────────────────────────────

export async function buyStock(req, res) {
  const { symbol, quantity, buyPrice } = req.body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = [];
  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    errors.push('`symbol` is required (e.g. "RELIANCE.NS").');
  }
  if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    errors.push('`quantity` must be a positive number.');
  }
  if (!buyPrice || isNaN(Number(buyPrice)) || Number(buyPrice) <= 0) {
    errors.push('`buyPrice` must be a positive number.');
  }
  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const sym = symbol.trim().toUpperCase();
  const qty = parseFloat(Number(quantity).toFixed(6));
  const price = parseFloat(Number(buyPrice).toFixed(4));

  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);

    const existing = portfolio.holdings.find((h) => h.symbol === sym);

    if (existing) {
      // Weighted average price: (oldQty * oldAvg + newQty * newPrice) / totalQty
      const totalQty = existing.quantity + qty;
      const newAvg = (existing.quantity * existing.avgPrice + qty * price) / totalQty;
      existing.quantity = parseFloat(totalQty.toFixed(6));
      existing.avgPrice = parseFloat(newAvg.toFixed(4));
    } else {
      portfolio.holdings.push({ symbol: sym, quantity: qty, avgPrice: price });
    }

    await portfolio.save();

    return res.status(200).json({
      message: `Successfully bought ${qty} share(s) of ${sym}.`,
      holding: portfolio.holdings.find((h) => h.symbol === sym),
      totalHoldings: portfolio.holdings.length,
    });
  } catch (err) {
    console.error('[POST /api/portfolio/buy]', err);
    return res.status(500).json({ message: 'Failed to process buy transaction.' });
  }
}

// ─── POST /api/portfolio/sell ─────────────────────────────────────────────────

export async function sellStock(req, res) {
  const { symbol, quantity } = req.body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = [];
  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    errors.push('`symbol` is required.');
  }
  if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    errors.push('`quantity` must be a positive number.');
  }
  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const sym = symbol.trim().toUpperCase();
  const qty = parseFloat(Number(quantity).toFixed(6));

  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);

    const idx = portfolio.holdings.findIndex((h) => h.symbol === sym);

    if (idx === -1) {
      return res.status(404).json({ message: `You don't hold any shares of ${sym}.` });
    }

    const holding = portfolio.holdings[idx];

    if (qty > holding.quantity) {
      return res.status(400).json({
        message: `Cannot sell ${qty} share(s). You only hold ${holding.quantity}.`,
      });
    }

    if (Math.abs(holding.quantity - qty) < 0.000001) {
      // Remove the holding entirely when all shares are sold
      portfolio.holdings.splice(idx, 1);
    } else {
      holding.quantity = parseFloat((holding.quantity - qty).toFixed(6));
    }

    await portfolio.save();

    return res.status(200).json({
      message: `Successfully sold ${qty} share(s) of ${sym}.`,
      remaining: portfolio.holdings.find((h) => h.symbol === sym) ?? null,
      totalHoldings: portfolio.holdings.length,
    });
  } catch (err) {
    console.error('[POST /api/portfolio/sell]', err);
    return res.status(500).json({ message: 'Failed to process sell transaction.' });
  }
}

// ─── PUT /api/portfolio/:symbol ───────────────────────────────────────────────

export async function editStock(req, res) {
  const symbol = req.params.symbol?.trim().toUpperCase();
  const { quantity, avgPrice } = req.body ?? {};

  if (!symbol) return res.status(400).json({ message: 'Symbol parameter is required.' });
  
  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ message: '`quantity` must be a positive number.' });
  }
  if (avgPrice === undefined || isNaN(Number(avgPrice)) || Number(avgPrice) <= 0) {
    return res.status(400).json({ message: '`avgPrice` must be a positive number.' });
  }

  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);
    const existing = portfolio.holdings.find((h) => h.symbol === symbol);

    if (!existing) {
      return res.status(404).json({ message: `You don't hold any shares of ${symbol}.` });
    }

    existing.quantity = parseFloat(Number(quantity).toFixed(6));
    existing.avgPrice = parseFloat(Number(avgPrice).toFixed(4));
    
    await portfolio.save();

    return res.status(200).json({
      message: `Successfully updated ${symbol}.`,
      holding: existing
    });
  } catch (err) {
    console.error('[PUT /api/portfolio/:symbol]', err);
    return res.status(500).json({ message: 'Failed to update transaction.' });
  }
}

// ─── DELETE /api/portfolio/:symbol ────────────────────────────────────────────

export async function removeStock(req, res) {
  const symbol = req.params.symbol?.trim().toUpperCase();

  if (!symbol) return res.status(400).json({ message: 'Symbol parameter is required.' });

  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);
    const idx = portfolio.holdings.findIndex((h) => h.symbol === symbol);

    if (idx === -1) {
      return res.status(404).json({ message: `You don't hold any shares of ${symbol}.` });
    }

    portfolio.holdings.splice(idx, 1);
    await portfolio.save();

    return res.status(200).json({
      message: `Successfully removed ${symbol}.`,
      totalHoldings: portfolio.holdings.length
    });
  } catch (err) {
    console.error('[DELETE /api/portfolio/:symbol]', err);
    return res.status(500).json({ message: 'Failed to delete transaction.' });
  }
}

// ─── POST /api/portfolio/strategy ─────────────────────────────────────────────

export async function saveStrategy(req, res) {
  const { strategy } = req.body ?? {};

  if (!strategy || typeof strategy !== 'string' || !strategy.trim()) {
    return res.status(400).json({ message: '`strategy` must be a non-empty string expression.' });
  }

  // Basic safety check — reject obviously dangerous patterns
  const BANNED = ['require(', 'import(', 'process.', '__dirname', 'eval(', 'Function('];
  const lower = strategy.toLowerCase();
  const banned = BANNED.find((p) => lower.includes(p.toLowerCase()));
  if (banned) {
    return res.status(400).json({
      message: `Strategy contains disallowed expression: "${banned}". Use only mathematical operations on the "prices" array.`,
    });
  }

  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);
    portfolio.strategy = strategy.trim();
    await portfolio.save();

    return res.json({
      message: 'Strategy saved successfully.',
      strategy: portfolio.strategy,
    });
  } catch (err) {
    console.error('[POST /api/portfolio/strategy]', err);
    return res.status(500).json({ message: 'Failed to save strategy.' });
  }
}

// ─── POST /api/portfolio/strategy/run ─────────────────────────────────────────

export async function runStrategy(req, res) {
  const { symbol } = req.body ?? {};

  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    return res.status(400).json({ message: '`symbol` is required.' });
  }

  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);

    if (!portfolio.strategy) {
      return res.status(400).json({
        message: 'No strategy saved. Save a strategy first via POST /api/portfolio/strategy.',
      });
    }

    // Fetch REAL historical data from Yahoo Finance
    const stockData = await getHistoricalData(symbol.trim().toUpperCase());
    const prices = stockData.closingPrices;

    // Simple helper available inside the strategy expression
    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    let signal = 'HOLD';
    let signalValue;

    try {
      // Evaluate user-defined strategy with real prices array
      // eslint-disable-next-line no-new-func
      const fn = new Function('prices', 'average', `return (${portfolio.strategy})`);
      const result = fn(prices, average);

      if (typeof result === 'boolean') {
        signal = result ? 'BUY' : 'SELL';
        signalValue = result;
      } else if (typeof result === 'number') {
        signal = result > 0 ? 'BUY' : result < 0 ? 'SELL' : 'HOLD';
        signalValue = result;
      } else {
        signalValue = result;
      }
    } catch (evalErr) {
      return res.status(400).json({
        message: `Strategy evaluation failed: ${evalErr.message}`,
        hint: 'Strategy must be a valid JS expression. Use "prices" array and "average(prices)" helper.',
      });
    }

    return res.json({
      symbol: stockData.symbol,
      currentPrice: stockData.currentPrice,
      dataPoints: prices.length,
      strategy: portfolio.strategy,
      evaluatedValue: signalValue,
      signal,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (/not found|misspelled|delisted/i.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    if (/Yahoo Finance|timed out|Network/i.test(err.message)) {
      return res.status(502).json({ message: 'Failed to fetch market data. Try again.' });
    }
    console.error('[POST /api/portfolio/strategy/run]', err);
    return res.status(500).json({ message: 'Unexpected error during strategy run.' });
  }
}
