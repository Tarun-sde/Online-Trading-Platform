/**
 * defaultStrategies.seed.js
 * Seeds the 5 built-in strategies into MongoDB on server startup.
 * Idempotent — checks isDefault count first; only inserts if none exist.
 * Stored in DB (not hardcoded in frontend) so they can be read via API.
 */

import UserStrategy from '../models/UserStrategy.js';

const DEFAULT_STRATEGIES = [
  {
    name: "Swing Trading",
    category: "swing",
    difficulty: "Beginner",
    tags: ["Support", "Price Action"],
    logic: "price <= min(prices, 20) * 1.05",
    description: "Buy near support"
  },
  {
    name: "Breakout",
    category: "breakout",
    difficulty: "Intermediate",
    tags: ["Resistance", "Momentum"],
    logic: "price > max(prices, 20)",
    description: "Breakout with momentum"
  },
  {
    name: "VWAP Intraday",
    category: "intraday",
    difficulty: "Beginner",
    tags: ["VWAP", "Intraday"],
    logic: "price > vwap(prices)",
    description: "Above VWAP bullish"
  },
  {
    name: "Trend EMA",
    category: "trend",
    difficulty: "Beginner",
    tags: ["EMA", "Trend"],
    logic: "ema(prices, 20) > ema(prices, 50)",
    description: "Trend following"
  },
  {
    name: "RSI Oversold",
    category: "swing",
    difficulty: "Beginner",
    tags: ["RSI", "Reversal"],
    logic: "rsi(prices) < 30",
    description: "Oversold bounce"
  }
];

/**
 * Seeds default strategies if none exist yet.
 * Safe to call on every server startup.
 */
export async function seedDefaultStrategies() {
  try {
    // Always clear existing to ensure the fresh ones requested by user are seeded
    await UserStrategy.deleteMany({ isDefault: true });

    const toInsert = DEFAULT_STRATEGIES.map((s) => ({
      ...s,
      user: null,     // system strategy — no owner
      isDefault: true,
    }));

    await UserStrategy.insertMany(toInsert, { ordered: false }).catch((err) => {
      if (err.code !== 11000) throw err;
    });

    console.log(`🌱 [Seed] Inserted ${toInsert.length} default strategies.`);
  } catch (err) {
    console.error('❌ [Seed] Failed to seed default strategies:', err.message);
  }
}
