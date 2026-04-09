/**
 * emaStrategy.js
 * Exponential Moving Average (EMA) strategy.
 * Uses 12-period EMA vs 26-period EMA crossover (same periods as MACD signal line).
 * All values computed from real closing price data — nothing hardcoded.
 */

const SHORT_PERIOD = 12;
const LONG_PERIOD = 26;

/**
 * Computes EMA for a given period using standard exponential smoothing.
 * Seed = simple average of first `period` prices, then EMA[i] = price * k + EMA[i-1] * (1-k).
 *
 * @param {number[]} prices - Chronological closing prices
 * @param {number} period
 * @returns {number} Most recent EMA value
 */
function calculateEma(prices, period) {
  if (prices.length < period) {
    throw new Error(`EMA(${period}) requires at least ${period} prices.`);
  }

  const k = 2 / (period + 1); // Smoothing factor

  // Seed: simple average of first `period` values
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Apply smoothing to the rest
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Runs the EMA crossover strategy on real stock data.
 *
 * @param {{ closingPrices: number[], currentPrice: number, symbol: string }} stockData
 * @returns {{ value: number, shortEma: number, longEma: number, signal: string, reason: string }}
 */
export function runEmaStrategy(stockData) {
  const { closingPrices } = stockData;

  if (closingPrices.length < LONG_PERIOD) {
    throw new Error(
      `EMA strategy requires at least ${LONG_PERIOD} closing prices. Got ${closingPrices.length}.`
    );
  }

  const shortEma = calculateEma(closingPrices, SHORT_PERIOD);
  const longEma = calculateEma(closingPrices, LONG_PERIOD);

  const roundedShort = parseFloat(shortEma.toFixed(2));
  const roundedLong = parseFloat(longEma.toFixed(2));

  let signal, reason;

  if (shortEma > longEma) {
    signal = 'BUY';
    reason = `EMA(${SHORT_PERIOD}): ${roundedShort} is above EMA(${LONG_PERIOD}): ${roundedLong}. Bullish crossover — upward momentum.`;
  } else if (shortEma < longEma) {
    signal = 'SELL';
    reason = `EMA(${SHORT_PERIOD}): ${roundedShort} is below EMA(${LONG_PERIOD}): ${roundedLong}. Bearish crossover — downward pressure.`;
  } else {
    signal = 'HOLD';
    reason = `EMA(${SHORT_PERIOD}) and EMA(${LONG_PERIOD}) are equal (${roundedShort}). No crossover signal.`;
  }

  return {
    value: roundedShort,
    shortEma: roundedShort,
    longEma: roundedLong,
    signal,
    reason,
  };
}
