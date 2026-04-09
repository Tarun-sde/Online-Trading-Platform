/**
 * maStrategy.js
 * Implements a Simple Moving Average (SMA) crossover strategy.
 * Short SMA (20-period) vs Long SMA (50-period) on real closing price data.
 * No hardcoded prices. No mock values.
 */

const SHORT_PERIOD = 20;
const LONG_PERIOD = 50;

/**
 * Runs the Moving Average crossover strategy on real stock data.
 *
 * @param {{ closingPrices: number[], currentPrice: number, symbol: string }} stockData
 * @returns {{ value: number, shortSma: number, longSma: number, signal: "BUY"|"SELL"|"HOLD", reason: string }}
 */
export function runMovingAverageStrategy(stockData) {
  const { closingPrices, currentPrice } = stockData;

  if (closingPrices.length < LONG_PERIOD) {
    throw new Error(
      `Moving Average strategy requires at least ${LONG_PERIOD} closing prices. Got ${closingPrices.length}.`
    );
  }

  // Calculate SMAs from the most recent N prices
  const shortSma = calculateSma(closingPrices, SHORT_PERIOD);
  const longSma = calculateSma(closingPrices, LONG_PERIOD);

  const roundedShort = parseFloat(shortSma.toFixed(2));
  const roundedLong = parseFloat(longSma.toFixed(2));

  let signal, reason;

  if (shortSma > longSma) {
    signal = 'BUY';
    reason = `Short SMA (${SHORT_PERIOD}d: ${roundedShort}) is above Long SMA (${LONG_PERIOD}d: ${roundedLong}). Bullish momentum detected.`;
  } else if (shortSma < longSma) {
    signal = 'SELL';
    reason = `Short SMA (${SHORT_PERIOD}d: ${roundedShort}) is below Long SMA (${LONG_PERIOD}d: ${roundedLong}). Bearish pressure detected.`;
  } else {
    signal = 'HOLD';
    reason = `Short SMA and Long SMA are equal (${roundedShort}). No crossover signal present.`;
  }

  return {
    value: roundedShort,
    shortSma: roundedShort,
    longSma: roundedLong,
    signal,
    reason,
  };
}

/**
 * Computes a simple moving average over the last `period` entries of an array.
 *
 * @param {number[]} prices - Array of closing prices (oldest → newest)
 * @param {number} period   - Lookback window
 * @returns {number} The SMA value
 */
function calculateSma(prices, period) {
  const window = prices.slice(-period);
  const sum = window.reduce((acc, p) => acc + p, 0);
  return sum / window.length;
}
