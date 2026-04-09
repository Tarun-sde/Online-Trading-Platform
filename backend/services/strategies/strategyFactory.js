/**
 * strategyFactory.js
 * Central registry for all strategies.
 *
 * Adding a new strategy:
 *   1. Create yourStrategy.js here — export a run function
 *   2. Import it below
 *   3. Add one entry to STRATEGY_REGISTRY
 *   → Nothing else changes anywhere
 */

import { runRsiStrategy } from './rsiStrategy.js';
import { runMovingAverageStrategy } from './maStrategy.js';
import { runEmaStrategy } from './emaStrategy.js';

/**
 * Registry: normalized key → { label, description, run }
 * The key is lowercase, letters only — derived from strategy name at runtime.
 */
const STRATEGY_REGISTRY = new Map([
  ['rsi', {
    name: 'RSI',
    label: 'RSI (Relative Strength Index)',
    description: 'Measures momentum using 14-period Wilder RSI. Signals oversold (<30) or overbought (>70).',
    run: runRsiStrategy,
  }],
  ['movingaverage', {
    name: 'MovingAverage',
    label: 'Moving Average Crossover (SMA)',
    description: '20-period SMA vs 50-period SMA simple crossover. Bullish when short SMA > long SMA.',
    run: runMovingAverageStrategy,
  }],
  ['ema', {
    name: 'EMA',
    label: 'EMA Crossover (12/26)',
    description: '12-period vs 26-period Exponential Moving Average crossover.',
    run: runEmaStrategy,
  }],
]);

/**
 * Returns full metadata for all registered strategies.
 * Used by GET /api/analyze/strategies so the frontend can build its UI dynamically.
 *
 * @returns {{ name: string, label: string, description: string }[]}
 */
export function getAvailableStrategies() {
  return Array.from(STRATEGY_REGISTRY.values()).map(({ name, label, description }) => ({
    name,
    label,
    description,
  }));
}

/**
 * Normalizes a strategy name to a registry key.
 * e.g. "MovingAverage" → "movingaverage"
 *
 * @param {string} name
 * @returns {string}
 */
function toKey(name) {
  return name.trim().toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Executes one strategy against real stock data.
 *
 * @param {string} strategyName
 * @param {object} stockData - from stockService.getHistoricalData()
 * @returns {{ value: number, signal: string, reason: string, [extras] }}
 */
export function executeStrategy(strategyName, stockData) {
  if (!strategyName || typeof strategyName !== 'string') {
    throw new Error('Strategy name must be a non-empty string.');
  }

  const entry = STRATEGY_REGISTRY.get(toKey(strategyName));

  if (!entry) {
    const available = getAvailableStrategies().map(s => s.name).join(', ');
    throw new Error(
      `Strategy "${strategyName}" is not supported. Available: ${available}`
    );
  }

  return entry.run(stockData);
}

/**
 * Executes multiple strategies in parallel against real stock data.
 * Returns an array of results, one per strategy.
 *
 * @param {string[]} strategyNames
 * @param {object} stockData
 * @returns {{ strategy: string, label: string, value: number, signal: string, reason: string, error?: string }[]}
 */
export function executeStrategies(strategyNames, stockData) {
  return strategyNames.map((name) => {
    const entry = STRATEGY_REGISTRY.get(toKey(name));
    if (!entry) {
      return { strategy: name, label: name, error: `Unknown strategy "${name}"` };
    }
    try {
      const result = entry.run(stockData);
      return { strategy: entry.name, label: entry.label, ...result };
    } catch (err) {
      return { strategy: entry.name, label: entry.label, error: err.message };
    }
  });
}
