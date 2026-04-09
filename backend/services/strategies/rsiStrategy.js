/**
 * rsiStrategy.js
 * Calculates the 14-period RSI using Wilder's Smoothing Method.
 * ALL values are derived from real closing price data — no hardcoding.
 */

const RSI_PERIOD = 14;

/**
 * Runs the RSI strategy on a real stock data object.
 *
 * @param {{ closingPrices: number[], currentPrice: number, symbol: string }} stockData
 * @returns {{ value: number, signal: "BUY"|"SELL"|"HOLD", reason: string }}
 */
export function runRsiStrategy(stockData) {
  const { closingPrices } = stockData;

  if (closingPrices.length < RSI_PERIOD + 1) {
    throw new Error(
      `RSI requires at least ${RSI_PERIOD + 1} closing prices. Got ${closingPrices.length}.`
    );
  }

  const rsi = calculateRsi(closingPrices);
  const rounded = parseFloat(rsi.toFixed(2));

  let signal, reason;

  if (rsi < 30) {
    signal = 'BUY';
    reason = `RSI is ${rounded}, indicating an oversold condition (below 30). Price may be due for a recovery.`;
  } else if (rsi > 70) {
    signal = 'SELL';
    reason = `RSI is ${rounded}, indicating an overbought condition (above 70). Price may face downward pressure.`;
  } else {
    signal = 'HOLD';
    reason = `RSI is ${rounded}, in the neutral zone (30–70). No clear directional bias at this time.`;
  }

  return { value: rounded, signal, reason };
}

/**
 * Core RSI calculation using Wilder's exponential smoothing.
 *
 * Phase 1 — Simple average of the first 14 periods.
 * Phase 2 — Wilder's smoothing: avgGain = (prevAvg * 13 + current) / 14
 *
 * @param {number[]} prices - Array of closing prices (oldest → newest)
 * @returns {number} RSI value between 0 and 100
 */
function calculateRsi(prices) {
  // Step 1: Compute daily price changes
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Step 2: Separate gains and losses
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

  // Step 3: Seed — simple average of first 14 periods
  let avgGain =
    gains.slice(0, RSI_PERIOD).reduce((sum, g) => sum + g, 0) / RSI_PERIOD;
  let avgLoss =
    losses.slice(0, RSI_PERIOD).reduce((sum, l) => sum + l, 0) / RSI_PERIOD;

  // Step 4: Wilder's smoothing for the remaining periods
  for (let i = RSI_PERIOD; i < changes.length; i++) {
    avgGain = (avgGain * (RSI_PERIOD - 1) + gains[i]) / RSI_PERIOD;
    avgLoss = (avgLoss * (RSI_PERIOD - 1) + losses[i]) / RSI_PERIOD;
  }

  // Step 5: Prevent division by zero (all gains → RSI = 100)
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
