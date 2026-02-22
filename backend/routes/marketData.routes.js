import express from 'express';
const router = express.Router();
import { 
  getAllStocks, 
  getAllMarketIndices, 
  getChartData,
  getAllForexPairs,
  getAllCryptocurrencies,
  getAllCommodities,
  getAllEconomicIndicators,
  getLatestNews,
  getNewsForSymbol
} from '../services/marketData.service.js';

/**
 * @route   GET /api/market-data/stocks
 * @desc    Get all stock data
 * @access  Public
 */
router.get('/stocks', (req, res) => {
  const stocks = getAllStocks();
  res.json(stocks);
});

/**
 * @route   GET /api/market-data/indices
 * @desc    Get all market indices
 * @access  Public
 */
router.get('/indices', (req, res) => {
  const indices = getAllMarketIndices();
  res.json(indices);
});

/**
 * @route   GET /api/market-data/forex
 * @desc    Get all forex pairs
 * @access  Public
 */
router.get('/forex', (req, res) => {
  const forex = getAllForexPairs();
  res.json(forex);
});

/**
 * @route   GET /api/market-data/crypto
 * @desc    Get all cryptocurrencies
 * @access  Public
 */
router.get('/crypto', (req, res) => {
  const crypto = getAllCryptocurrencies();
  res.json(crypto);
});

/**
 * @route   GET /api/market-data/commodities
 * @desc    Get all commodities
 * @access  Public
 */
router.get('/commodities', (req, res) => {
  const commodities = getAllCommodities();
  res.json(commodities);
});

/**
 * @route   GET /api/market-data/economy
 * @desc    Get all economic indicators
 * @access  Public
 */
router.get('/economy', (req, res) => {
  const indicators = getAllEconomicIndicators();
  res.json(indicators);
});

/**
 * @route   GET /api/market-data/chart/:symbol
 * @desc    Get chart data for a symbol
 * @access  Public
 */
router.get('/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { timeframe = '1d' } = req.query;
  
  try {
    const chartData = await getChartData(symbol, timeframe);
    if (!chartData) {
      return res.status(404).json({ message: `No chart data found for ${symbol}` });
    }
    res.json(chartData);
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
});

/**
 * @route   GET /api/market-data/news
 * @desc    Get latest news, optionally filtered by category
 * @access  Public
 */
router.get('/news', (req, res) => {
  const { category } = req.query;
  const news = category ? getLatestNews(category) : getLatestNews();
  res.json(news);
});

/**
 * @route   GET /api/market-data/news/:symbol
 * @desc    Get news for a specific symbol
 * @access  Public
 */
router.get('/news/:symbol', (req, res) => {
  const { symbol } = req.params;
  const news = getNewsForSymbol(symbol);
  res.json(news);
});

export default router; 