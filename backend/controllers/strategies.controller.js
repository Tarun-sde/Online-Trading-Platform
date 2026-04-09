/**
 * strategies.controller.js
 * Handles both system (default) and user-created strategies.
 *
 * POST   /api/strategies           → create user strategy
 * GET    /api/strategies           → list defaults + user's own
 * GET    /api/strategies/:id       → get one
 * PUT    /api/strategies/:id       → update (user's own only)
 * DELETE /api/strategies/:id       → delete (user's own only)
 * POST   /api/strategies/copy/:id  → copy a default into user's library
 * POST   /api/strategies/run       → run one or more strategies on real data
 */

import UserStrategy from '../models/UserStrategy.js';
import { getHistoricalData } from '../services/stockService.js';
import { runStrategyLogic, validateStrategyLogic } from '../services/strategyEngine.js';

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createStrategy(req, res) {
  const { name, logic, description = '', category = 'custom', tags = [] } = req.body ?? {};

  if (!name?.trim()) return res.status(400).json({ message: '`name` is required.' });
  if (!logic?.trim()) return res.status(400).json({ message: '`logic` is required.' });

  try {
    validateStrategyLogic(logic.trim());
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Prevent duplicate names per user (ignore defaults)
  const existing = await UserStrategy.findOne({
    user: req.user._id,
    name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });

  if (existing) {
    return res.status(409).json({
      message: `You already have a strategy named "${name.trim()}". Choose a different name.`,
    });
  }

  try {
    const strategy = await UserStrategy.create({
      user: req.user._id,
      name: name.trim(),
      logic: logic.trim(),
      description: description.trim(),
      category: category.trim(),
      tags: Array.isArray(tags) ? tags : [],
      isDefault: false,
    });
    return res.status(201).json(strategy);
  } catch (err) {
    console.error('[POST /api/strategies]', err);
    return res.status(500).json({ message: 'Failed to create strategy.' });
  }
}

// ── LIST ── returns defaults + user's own ──────────────────────────────────────

export async function listStrategies(req, res) {
  try {
    const [defaults, userStrategies] = await Promise.all([
      UserStrategy.find({ isDefault: true }).sort({ createdAt: 1 }).select('-__v'),
      UserStrategy.find({ user: req.user._id, isDefault: false }).sort({ createdAt: -1 }).select('-__v'),
    ]);

    // Tag each so the frontend can show badges
    const taggedDefaults = defaults.map((d) => ({ ...d.toObject(), _source: 'default' }));
    const taggedUser = userStrategies.map((u) => ({ ...u.toObject(), _source: 'custom' }));

    return res.json([...taggedDefaults, ...taggedUser]);
  } catch (err) {
    console.error('[GET /api/strategies]', err);
    return res.status(500).json({ message: 'Failed to fetch strategies.' });
  }
}

// ── GET ONE ────────────────────────────────────────────────────────────────────

export async function getStrategy(req, res) {
  try {
    // Allow fetching defaults OR user's own
    const strategy = await UserStrategy.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { isDefault: true }],
    });
    if (!strategy) return res.status(404).json({ message: 'Strategy not found.' });
    return res.json(strategy);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch strategy.' });
  }
}

// ── UPDATE (user's own only) ───────────────────────────────────────────────────

export async function updateStrategy(req, res) {
  const { name, logic, description, category, tags } = req.body ?? {};

  const strategy = await UserStrategy.findOne({ _id: req.params.id, user: req.user._id });
  if (!strategy) return res.status(404).json({ message: 'Strategy not found or cannot edit a default strategy.' });

  if (logic) {
    try {
      validateStrategyLogic(logic.trim());
      strategy.logic = logic.trim();
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  if (name?.trim()) strategy.name = name.trim();
  if (description !== undefined) strategy.description = description.trim();
  if (category?.trim()) strategy.category = category.trim();
  if (Array.isArray(tags)) strategy.tags = tags;

  await strategy.save();
  return res.json(strategy);
}

// ── DELETE (user's own only) ───────────────────────────────────────────────────

export async function deleteStrategy(req, res) {
  const result = await UserStrategy.deleteOne({ _id: req.params.id, user: req.user._id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Strategy not found. Default strategies cannot be deleted.' });
  }
  return res.json({ message: 'Strategy deleted.' });
}

// ── COPY DEFAULT → USER'S LIBRARY ─────────────────────────────────────────────

export async function copyStrategy(req, res) {
  try {
    const source = await UserStrategy.findOne({ _id: req.params.id, isDefault: true });
    if (!source) return res.status(404).json({ message: 'Default strategy not found.' });

    // Give it a unique name in the user's library
    const baseName = `${source.name} (Copy)`;
    const existing = await UserStrategy.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${baseName}`, 'i') },
    });

    const finalName = existing ? `${baseName} ${Date.now()}` : baseName;

    const copy = await UserStrategy.create({
      user: req.user._id,
      name: finalName,
      logic: source.logic,
      description: source.description,
      category: source.category,
      tags: source.tags,
      isDefault: false,
      difficulty: source.difficulty,
    });

    return res.status(201).json(copy);
  } catch (err) {
    console.error('[POST /api/strategies/copy/:id]', err);
    return res.status(500).json({ message: 'Failed to copy strategy.' });
  }
}

// ── RUN ───────────────────────────────────────────────────────────────────────
// POST /api/strategies/run
// Body: { symbol, strategyIds: string[] }
// Supports both default and user strategies

export async function runStrategies(req, res) {
  const { symbol, strategyIds } = req.body ?? {};

  if (!symbol?.trim()) {
    return res.status(400).json({ message: '`symbol` is required (e.g. "RELIANCE.NS").' });
  }
  if (!Array.isArray(strategyIds) || strategyIds.length === 0) {
    return res.status(400).json({ message: '`strategyIds` must be a non-empty array.' });
  }

  // Accept defaults OR user-owned strategies
  let strategies;
  try {
    strategies = await UserStrategy.find({
      _id: { $in: strategyIds },
      $or: [{ user: req.user._id }, { isDefault: true }],
    });
    if (strategies.length === 0) {
      return res.status(404).json({ message: 'No valid strategies found for the given IDs.' });
    }
  } catch {
    return res.status(400).json({ message: 'Invalid strategy ID format.' });
  }

  // Fetch REAL historical data once
  let stockData;
  try {
    stockData = await getHistoricalData(symbol.trim().toUpperCase());
  } catch (err) {
    if (/not found|misspelled|delisted/i.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(502).json({ message: 'Failed to fetch market data. Try again.', detail: err.message });
  }

  const chartData = stockData.closingPrices.map((price, i) => ({
    date: stockData.timestamps[i]
      ? new Date(stockData.timestamps[i] * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : `Day ${i + 1}`,
    price: parseFloat(price.toFixed(2)),
  }));

  // Run each strategy
  const results = strategies.map((s) => {
    try {
      const { signal, evaluatedValue } = runStrategyLogic(s.logic, stockData.closingPrices);
      return {
        id: String(s._id),
        strategy: s.name,
        logic: s.logic,
        category: s.category,
        isDefault: s.isDefault,
        signal,
        evaluatedValue: typeof evaluatedValue === 'number'
          ? parseFloat(evaluatedValue.toFixed(4))
          : evaluatedValue,
      };
    } catch (err) {
      return { id: String(s._id), strategy: s.name, signal: 'ERROR', error: err.message, isDefault: s.isDefault };
    }
  });

  // Non-critical: update run counts
  UserStrategy.updateMany(
    { _id: { $in: strategies.map((s) => s._id) } },
    { $inc: { runCount: 1 }, $set: { lastRun: new Date() } }
  ).catch(() => {});

  return res.json({
    symbol: stockData.symbol,
    currentPrice: stockData.currentPrice,
    dataPoints: stockData.closingPrices.length,
    chartData,
    results,
    analyzedAt: new Date().toISOString(),
  });
}
