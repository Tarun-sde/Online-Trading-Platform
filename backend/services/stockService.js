/**
 * stockService.js
 * Fetches real historical closing prices from Yahoo Finance public API.
 * No API key required. No mock data. No hardcoded values.
 */

import axios from 'axios';

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YAHOO_SEARCH_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';

// Browser-like headers to avoid Yahoo Finance 429/403 rejections
const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/**
 * Fetches historical daily closing prices for the given symbol.
 *
 * @param {string} symbol   - e.g. "RELIANCE.NS", "TCS.NS"
 * @param {number} days     - How many calendar days of history to request (default 120)
 * @returns {{ symbol, currentPrice, closingPrices: number[], timestamps: number[] }}
 * @throws {Error} with a descriptive message on API or symbol failure
 */
export async function getHistoricalData(symbol, days = 120) {
  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    throw new Error('Symbol must be a non-empty string.');
  }

  const trimmedSymbol = symbol.trim().toUpperCase();

  // Request a slightly larger window to account for weekends & market holidays
  const range = `${days + 20}d`;
  const url = `${YAHOO_CHART_BASE}${encodeURIComponent(trimmedSymbol)}?interval=1d&range=${range}`;

  let response;
  try {
    response = await axios.get(url, {
      headers: REQUEST_HEADERS,
      timeout: 12000, // 12-second timeout
    });
  } catch (err) {
    // Network-level errors (DNS failure, timeout, etc.)
    if (err.code === 'ECONNABORTED') {
      throw new Error(`Request timed out fetching data for "${trimmedSymbol}".`);
    }
    if (err.response) {
      const status = err.response.status;
      if (status === 404) {
        throw new Error(`Symbol "${trimmedSymbol}" not found on Yahoo Finance.`);
      }
      throw new Error(
        `Yahoo Finance returned HTTP ${status} for "${trimmedSymbol}".`
      );
    }
    throw new Error(`Network error fetching "${trimmedSymbol}": ${err.message}`);
  }

  // ---------- Parse the chart response ----------
  const chart = response.data?.chart;

  // API-level error (e.g. invalid symbol returns 200 with an error object)
  const apiError = chart?.error;
  if (apiError && apiError !== null) {
    throw new Error(
      `Yahoo Finance error for "${trimmedSymbol}": ${apiError.description || JSON.stringify(apiError)}`
    );
  }

  const result = chart?.result?.[0];
  if (!result) {
    throw new Error(
      `No data available for symbol "${trimmedSymbol}". It may be delisted or misspelled.`
    );
  }

  const rawTimestamps = result.timestamp ?? [];
  const rawClose = result.indicators?.quote?.[0]?.close ?? [];

  if (rawClose.length === 0) {
    throw new Error(`Yahoo Finance returned empty price data for "${trimmedSymbol}".`);
  }

  // Filter out null/undefined bars (market holidays)
  const closingPrices = [];
  const timestamps = [];

  for (let i = 0; i < rawClose.length; i++) {
    const price = rawClose[i];
    if (price !== null && price !== undefined && !isNaN(price)) {
      closingPrices.push(parseFloat(price.toFixed(4)));
      timestamps.push(rawTimestamps[i]);
    }
  }

  if (closingPrices.length < 15) {
    throw new Error(
      `Insufficient data for "${trimmedSymbol}" — only ${closingPrices.length} valid bars returned. Need at least 15.`
    );
  }

  const currentPrice = closingPrices[closingPrices.length - 1];

  return {
    symbol: trimmedSymbol,
    currentPrice,
    closingPrices,
    timestamps,
  };
}

/**
 * Backward-compatible alias for stockRoutes.js which imports getStockPrice.
 * Returns the current price as a simple object: { price: number }
 *
 * @param {string} symbol
 * @returns {{ price: number }}
 */
export async function getStockPrice(symbol) {
  const data = await getHistoricalData(symbol);
  return { price: data.currentPrice };
}

/**
 * Searches for stocks using Yahoo Finance autocomplete API.
 * @param {string} query - The search string
 * @returns {Promise<Array<{symbol: string, name: string}>>}
 */
export async function searchStocks(query) {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }
  
  const url = `${YAHOO_SEARCH_BASE}?q=${encodeURIComponent(query.trim())}&quotesCount=10&newsCount=0`;
  
  try {
    const response = await axios.get(url, {
      headers: REQUEST_HEADERS,
      timeout: 8000,
    });
    
    if (response.data && response.data.quotes) {
      return response.data.quotes
        .filter(q => q.quoteType === 'EQUITY' && q.symbol && q.shortname)
        .map(q => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol
        }));
    }
    return [];
  } catch (err) {
    console.error(`[searchStocks] Failed to fetch. Query: ${query}`, err.message);
    return [];
  }
}
