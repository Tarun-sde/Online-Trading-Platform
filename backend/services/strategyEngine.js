/**
 * strategyEngine.js
 * Safe execution engine for user-defined strategy expressions.
 *
 * Available variables inside a strategy expression:
 *   price        — current (latest) closing price
 *   prices       — array of all closing prices (oldest → newest)
 *   average(arr) — simple average of an array
 *   sma(n)       — simple moving average over last n prices
 *   ema(n)       — exponential moving average over last n prices
 *   rsi()        — 14-period RSI (Wilder's smoothing)
 *   high         — max price in the dataset
 *   low          — min price in the dataset
 *
 * Expressions must return a boolean or number:
 *   true / truthy  → BUY
 *   false / falsy  → SELL
 *   (or return the string "BUY" | "SELL" | "HOLD" directly)
 */

// ── Banned patterns (prevent system access) ────────────────────────────────────

const BANNED_PATTERNS = [
  'require', 'import', 'process', '__dirname', '__filename',
  'global', 'globalThis', 'window', 'document', 'fetch',
  'XMLHttpRequest', 'eval', 'Function', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'fs.', 'child_process', 'os.',
  'Buffer', 'Deno', 'crypto',
];

/**
 * Validates a strategy logic string for banned patterns.
 * @param {string} logic
 * @throws {Error} if a banned pattern is found
 */
export function validateStrategyLogic(logic) {
  const lower = logic.toLowerCase();
  for (const pattern of BANNED_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      throw new Error(
        `Disallowed expression: "${pattern}". Strategies must only use price data and the provided helper functions.`
      );
    }
  }
}

// ── Indicator helpers (all operate on real price arrays) ──────────────────────

/**
 * Simple average of an array.
 * @param {number[]} arr
 * @returns {number}
 */
function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Simple Moving Average over the last `n` prices.
 * @param {number[]} prices
 * @param {number} n
 * @returns {number}
 */
function sma(prices, n) {
  if (!prices || prices.length === 0) return 0;
  const slice = prices.slice(-Math.min(n, prices.length));
  return average(slice);
}

/**
 * Exponential Moving Average over the last `n` prices.
 * Uses multiplier = 2 / (n + 1).
 * @param {number[]} prices
 * @param {number} n
 * @returns {number}
 */
function ema(prices, n) {
  if (!prices || prices.length === 0) return 0;
  const period = Math.min(n, prices.length);
  const k = 2 / (period + 1);

  // Seed with simple average of first `period` values
  let result = average(prices.slice(0, period));

  for (let i = period; i < prices.length; i++) {
    result = prices[i] * k + result * (1 - k);
  }

  return result;
}

/**
 * 14-period RSI using Wilder's Smoothing Method.
 * @param {number[]} prices
 * @returns {number} RSI value in range [0, 100]
 */
function rsi(prices) {
  const PERIOD = 14;
  if (!prices || prices.length < PERIOD + 1) return 50; // neutral if insufficient data

  const gains = [];
  const losses = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  // Phase 1: initial average
  let avgGain = average(gains.slice(0, PERIOD));
  let avgLoss = average(losses.slice(0, PERIOD));

  // Phase 2: Wilder's smoothing
  for (let i = PERIOD; i < gains.length; i++) {
    avgGain = (avgGain * (PERIOD - 1) + gains[i]) / PERIOD;
    avgLoss = (avgLoss * (PERIOD - 1) + losses[i]) / PERIOD;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── Safe execution ────────────────────────────────────────────────────────────

function min(prices, n) {
  if (!prices || prices.length === 0) return 0;
  const slice = prices.slice(-Math.min(n, prices.length));
  return Math.min(...slice);
}

function max(prices, n) {
  if (!prices || prices.length === 0) return 0;
  const slice = prices.slice(-Math.min(n, prices.length));
  return Math.max(...slice);
}

function vwap(prices) {
  // Rough VWAP proxy using average of all prices (since we don't have volume)
  return average(prices);
}

/**
 * Safely evaluates a user strategy expression against real price data.
 *
 * @param {string} logic          — User-written expression
 * @param {number[]} closingPrices — Real historical prices (oldest → newest)
 * @returns {{ signal: 'BUY'|'SELL'|'HOLD', evaluatedValue: unknown }}
 * @throws {Error} for syntax errors or evaluation failures
 */
export function runStrategyLogic(logic, closingPrices) {
  // Validate before executing
  validateStrategyLogic(logic);

  const price = closingPrices[closingPrices.length - 1];           // latest price
  const high = Math.max(...closingPrices);
  const low = Math.min(...closingPrices);

  // Build the sandboxed function
  // Helper wrappers bind `closingPrices` so users only write e.g. sma(20)
  const smaFn = (n) => sma(closingPrices, n);
  const emaFn = (n) => ema(closingPrices, n);
  const rsiFn = () => rsi(closingPrices);
  const avgFn = (arr) => average(arr || closingPrices);
  const minFn = (arr, n) => min(arr || closingPrices, n);
  const maxFn = (arr, n) => max(arr || closingPrices, n);
  const vwapFn = (arr) => vwap(arr || closingPrices);

  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'price', 'prices', 'average', 'sma', 'ema', 'rsi', 'high', 'low', 'min', 'max', 'vwap',
    `"use strict"; return (${logic})`
  );

  const result = fn(price, closingPrices, avgFn, smaFn, emaFn, rsiFn, high, low, minFn, maxFn, vwapFn);

  let signal;

  if (typeof result === 'string' && ['BUY', 'SELL', 'HOLD'].includes(result.toUpperCase())) {
    signal = result.toUpperCase();
  } else if (typeof result === 'boolean') {
    signal = result ? 'BUY' : 'SELL';
  } else if (typeof result === 'number') {
    signal = result > 0 ? 'BUY' : result < 0 ? 'SELL' : 'HOLD';
  } else {
    signal = 'HOLD';
  }

  return { signal, evaluatedValue: result };
}
