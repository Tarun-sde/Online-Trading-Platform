/**
 * Market Data Service
 * Handles fetching and broadcasting real-time market data
 */

import finnhub from 'finnhub';
import fetch from 'node-fetch';
import moment from 'moment';
import { setupWebSocketServer } from '../utils/websocket.js';

// Market data cache
const dataCache = {
  symbols: new Map(),    // Stocks
  indices: new Map(),    // Market indices
  forex: new Map(),      // Forex pairs
  crypto: new Map(),     // Cryptocurrencies
  commodities: new Map(),// Commodities
  economy: new Map(),    // Economic indicators
  charts: new Map(),     // Chart data
  news: []               // News
};

// Initialize Finnhub client
let finnhubClient;

// Websocket object from server.js
let ioInstance;
// WebSocket server instance
let wsServer;

// Mock data for development without API key
const mockMarketIndices = [
  {
    name: 'S&P 500',
    symbol: 'SPX',
    currentValue: 4892.37,
    change: 72.14,
    percentChange: 1.49,
    previousClose: 4820.23,
    lastUpdated: new Date(),
  },
  {
    name: 'Nasdaq',
    symbol: 'COMP',
    currentValue: 15628.95,
    change: 198.89,
    percentChange: 1.29,
    previousClose: 15430.06,
    lastUpdated: new Date(),
  },
  {
    name: 'Dow Jones',
    symbol: 'DJI',
    currentValue: 38711.24,
    change: -5.58,
    percentChange: -0.01,
    previousClose: 38716.82,
    lastUpdated: new Date(),
  },
  {
    name: 'Russell 2000',
    symbol: 'RUT',
    currentValue: 2026.39,
    change: 35.06,
    percentChange: 1.76,
    previousClose: 1991.33,
    lastUpdated: new Date(),
  },
];

const mockForexPairs = [
  {
    symbol: 'EUR/USD',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    rate: 1.0912,
    change: 0.0021,
    percentChange: 0.19,
    bid: 1.0910,
    ask: 1.0914,
    high24h: 1.0925,
    low24h: 1.0880,
    lastUpdated: new Date(),
  },
  {
    symbol: 'GBP/USD',
    baseCurrency: 'GBP',
    quoteCurrency: 'USD',
    rate: 1.2754,
    change: -0.0032,
    percentChange: -0.25,
    bid: 1.2752,
    ask: 1.2756,
    high24h: 1.2791,
    low24h: 1.2741,
    lastUpdated: new Date(),
  },
  {
    symbol: 'USD/JPY',
    baseCurrency: 'USD',
    quoteCurrency: 'JPY',
    rate: 149.28,
    change: 0.42,
    percentChange: 0.28,
    bid: 149.26,
    ask: 149.30,
    high24h: 149.50,
    low24h: 148.80,
    lastUpdated: new Date(),
  },
  {
    symbol: 'USD/CAD',
    baseCurrency: 'USD',
    quoteCurrency: 'CAD',
    rate: 1.3495,
    change: -0.0024,
    percentChange: -0.18,
    bid: 1.3493,
    ask: 1.3497,
    high24h: 1.3520,
    low24h: 1.3470,
    lastUpdated: new Date(),
  },
];

const mockCryptocurrencies = [
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    price: 58372.41,
    change: 1247.32,
    percentChange: 2.19,
    volume24h: 28345612987,
    marketCap: 1143620483265,
    high24h: 58750.92,
    low24h: 56890.25,
    lastUpdated: new Date(),
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    price: 3182.57,
    change: 87.25,
    percentChange: 2.82,
    volume24h: 15672891234,
    marketCap: 382534912567,
    high24h: 3198.45,
    low24h: 3080.12,
    lastUpdated: new Date(),
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    price: 121.65,
    change: -3.42,
    percentChange: -2.73,
    volume24h: 3567128945,
    marketCap: 52987124365,
    high24h: 125.80,
    low24h: 120.15,
    lastUpdated: new Date(),
  },
  {
    symbol: 'XRP/USD',
    name: 'XRP',
    price: 0.5342,
    change: 0.0098,
    percentChange: 1.87,
    volume24h: 1928345671,
    marketCap: 28765123490,
    high24h: 0.5380,
    low24h: 0.5240,
    lastUpdated: new Date(),
  },
];

const mockCommodities = [
  {
    symbol: 'GOLD',
    name: 'Gold',
    price: 2347.80,
    change: 15.60,
    percentChange: 0.67,
    unit: 'troy ounce',
    lastUpdated: new Date(),
  },
  {
    symbol: 'SILVER',
    name: 'Silver',
    price: 27.85,
    change: 0.32,
    percentChange: 1.16,
    unit: 'troy ounce',
    lastUpdated: new Date(),
  },
  {
    symbol: 'CRUDE',
    name: 'Crude Oil WTI',
    price: 78.42,
    change: -1.24,
    percentChange: -1.56,
    unit: 'barrel',
    lastUpdated: new Date(),
  },
  {
    symbol: 'NATGAS',
    name: 'Natural Gas',
    price: 2.17,
    change: 0.05,
    percentChange: 2.36,
    unit: 'MMBtu',
    lastUpdated: new Date(),
  },
];

const mockEconomicIndicators = [
  {
    symbol: 'US_CPI',
    name: 'US Consumer Price Index',
    value: 3.7,
    previousValue: 3.8,
    unit: '%',
    period: 'YoY',
    lastUpdated: new Date(),
    nextRelease: new Date(2023, 10, 15),
  },
  {
    symbol: 'US_GDP',
    name: 'US GDP Growth Rate',
    value: 2.1,
    previousValue: 2.4,
    unit: '%',
    period: 'QoQ',
    lastUpdated: new Date(),
    nextRelease: new Date(2023, 10, 26),
  },
  {
    symbol: 'US_UNEMPLOYMENT',
    name: 'US Unemployment Rate',
    value: 3.8,
    previousValue: 3.7,
    unit: '%',
    period: 'Monthly',
    lastUpdated: new Date(),
    nextRelease: new Date(2023, 11, 3),
  },
  {
    symbol: 'FED_RATE',
    name: 'Federal Funds Rate',
    value: 5.5,
    previousValue: 5.5,
    unit: '%',
    period: 'Current',
    lastUpdated: new Date(),
    nextRelease: new Date(2023, 11, 14),
  },
];

const mockStocks = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 187.45,
    change: 3.28,
    percentChange: 1.78,
    volume: 23456789,
    marketCap: 2950000000000,
    peRatio: 30.5,
    lastUpdated: new Date(),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    currentPrice: 408.59,
    change: 4.23,
    percentChange: 1.05,
    volume: 18765432,
    marketCap: 3050000000000,
    peRatio: 34.2,
    lastUpdated: new Date(),
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    currentPrice: 142.89,
    change: -0.76,
    percentChange: -0.53,
    volume: 15432678,
    marketCap: 1800000000000,
    peRatio: 25.6,
    lastUpdated: new Date(),
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    currentPrice: 153.42,
    change: 2.31,
    percentChange: 1.53,
    volume: 19876543,
    marketCap: 1600000000000,
    peRatio: 62.8,
    lastUpdated: new Date(),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    currentPrice: 218.89,
    change: -3.24,
    percentChange: -1.46,
    volume: 21345678,
    marketCap: 700000000000,
    peRatio: 58.3,
    lastUpdated: new Date(),
  },
];

// Initialize service and connect to market data APIs
const initializeMarketData = async (io) => {
  ioInstance = io;
  
  try {
    // Initialize WebSocket server once
    wsServer = setupWebSocketServer(io);
    
    // Initialize Finnhub API client if API key exists
    if (process.env.FINNHUB_API_KEY) {
      finnhubClient = new finnhub.DefaultApi();
      finnhubClient.apiKey = process.env.FINNHUB_API_KEY;
      console.log('Finnhub API client initialized');
    } else {
      console.log('Using mock data - Finnhub API key not provided');
      
      // Load mock data into cache
      mockStocks.forEach(stock => {
        dataCache.symbols.set(stock.symbol, stock);
      });
      
      mockMarketIndices.forEach(index => {
        dataCache.indices.set(index.symbol, index);
      });
      
      mockForexPairs.forEach(pair => {
        dataCache.forex.set(pair.symbol, pair);
      });
      
      mockCryptocurrencies.forEach(crypto => {
        dataCache.crypto.set(crypto.symbol, crypto);
      });
      
      mockCommodities.forEach(commodity => {
        dataCache.commodities.set(commodity.symbol, commodity);
      });
      
      mockEconomicIndicators.forEach(indicator => {
        dataCache.economy.set(indicator.symbol, indicator);
      });
    }
    
    // Start periodic updates
    startPeriodicUpdates();
    
  } catch (error) {
    console.error('Failed to initialize market data service:', error);
  }
};

// Start periodic data updates
const startPeriodicUpdates = () => {
  // Update stock prices every 10 seconds
  setInterval(updateStockPrices, 60000);
  
  // Update market indices every 15 seconds
  setInterval(updateMarketIndices, 15000);
  
  // Update forex every 5 seconds (forex markets move quickly)
  setInterval(updateForexPairs, 5000);
  
  // Update cryptocurrencies every 7 seconds
  setInterval(updateCryptocurrencies, 7000);
  
  // Update commodities every 20 seconds
  setInterval(updateCommodities, 20000);
  
  // Update economic indicators every hour (these don't change often)
  setInterval(updateEconomicIndicators, 3600000);
  
  // Update news every 15 minutes
  setInterval(fetchLatestNews, 900000);
  
  // Initial updates
  updateStockPrices();
  updateMarketIndices();
  updateForexPairs();
  updateCryptocurrencies();
  updateCommodities();
  updateEconomicIndicators();
  fetchLatestNews();
  
  console.log('Periodic market data updates started');
};

// Update stock prices with small random changes for mock data
// Update stock prices — REAL Finnhub mode + mock fallback
const updateStockPrices = async () => {
  try {

    // ===== REAL API MODE =====
    if (process.env.FINNHUB_API_KEY) {

      for (const base of mockStocks) {
        try {
          const resp = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${base.symbol}&token=${process.env.FINNHUB_API_KEY}`
          );

          if (!resp.ok) continue;

          const q = await resp.json();

          if (!q || !q.c) continue;

          const updated = {
            symbol: base.symbol,
            name: base.name,
            currentPrice: q.c,
            change: q.d,
            percentChange: q.dp,
            previousClose: q.pc,
            volume: base.volume,
            marketCap: base.marketCap,
            peRatio: base.peRatio,
            lastUpdated: new Date()
          };

          dataCache.symbols.set(base.symbol, updated);

          if (wsServer) {
            wsServer.broadcastSymbolUpdate(base.symbol, updated);
          }

        } catch (err) {
          console.log("Finnhub error:", base.symbol);
        }
      }

      return;
    }

    // ===== MOCK FALLBACK MODE =====

    mockStocks.forEach(stock => {
      const randomChange = (Math.random() * 2 - 1) * (stock.currentPrice * 0.005);
      const oldPrice = stock.currentPrice;

      stock.currentPrice = +(oldPrice + randomChange).toFixed(2);
      stock.change = +(stock.currentPrice - oldPrice).toFixed(2);
      stock.percentChange = +((stock.change / oldPrice) * 100).toFixed(2);
      stock.lastUpdated = new Date();

      dataCache.symbols.set(stock.symbol, stock);

      if (wsServer) {
        wsServer.broadcastSymbolUpdate(stock.symbol, stock);
      }
    });

  } catch (error) {
    console.error('Stock update error:', error);
  }
};


// Update market indices
const updateMarketIndices = async () => {
  try {
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Update mock indices with random changes
      mockMarketIndices.forEach(index => {
        const randomChange = (Math.random() * 2 - 1) * (index.currentValue * 0.002); // Random ±0.2% change
        const oldValue = index.currentValue;
        index.currentValue = parseFloat((oldValue + randomChange).toFixed(2));
        index.change = parseFloat((index.currentValue - index.previousClose).toFixed(2));
        index.percentChange = parseFloat(((index.change / index.previousClose) * 100).toFixed(2));
        index.lastUpdated = new Date();
        
        // Update cache
        dataCache.indices.set(index.symbol, index);
        
        // Broadcast update via websocket with enhanced change tracking
        if (wsServer) {
          wsServer.broadcastIndexUpdate(index.symbol, index);
        }
      });
    }
  } catch (error) {
    console.error('Error updating market indices:', error);
  }
};

// Fetch latest news with categories for different asset classes
const fetchLatestNews = async () => {
  try {
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Use mock news with categories
      const mockNews = [
        {
          id: '1',
          headline: 'Fed Signals Potential Rate Cuts as Inflation Cools Down',
          summary: 'Federal Reserve officials indicated they could begin cutting interest rates soon if inflation continues to cool toward their 2% target.',
          source: 'Financial Times',
          datetime: new Date(),
          url: '#',
          related: 'MARKET',
          categories: ['MARKET', 'ECONOMY', 'FED_RATE'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Federal+Reserve'
        },
        {
          id: '2',
          headline: 'Apple Unveils New iPhone 16 with Advanced AI Features',
          summary: 'Apple\'s latest iPhone comes packed with new AI capabilities, promising to revolutionize how users interact with their devices',
          source: 'Wall Street Journal',
          datetime: new Date(),
          url: '#',
          related: 'AAPL',
          categories: ['STOCKS', 'TECHNOLOGY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Apple+iPhone'
        },
        {
          id: '3',
          headline: 'Tesla Beats Quarterly Delivery Estimates Despite China Slowdown',
          summary: 'Tesla delivered more vehicles than expected in Q2, defying concerns about weakening demand in China.',
          source: 'Reuters',
          datetime: new Date(),
          url: '#',
          related: 'TSLA',
          categories: ['STOCKS', 'AUTOMOTIVE'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Tesla'
        },
        {
          id: '4',
          headline: 'Bitcoin Surges Past $60,000 Amid Institutional Adoption',
          summary: 'Bitcoin prices rallied as more institutional investors announced investments in the leading cryptocurrency.',
          source: 'Bloomberg',
          datetime: new Date(),
          url: '#',
          related: 'BTC/USD',
          categories: ['CRYPTO', 'MARKET'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Bitcoin'
        },
        {
          id: '5',
          headline: 'Euro Weakens Against Dollar Following ECB Policy Meeting',
          summary: 'The Euro fell against the US Dollar after the European Central Bank signaled a cautious approach to further interest rate hikes.',
          source: 'CNBC',
          datetime: new Date(),
          url: '#',
          related: 'EUR/USD',
          categories: ['FOREX', 'ECONOMY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Euro+Dollar'
        },
        {
          id: '6',
          headline: 'Gold Prices Hit Record High on Geopolitical Tensions',
          summary: 'Safe-haven demand pushed gold prices to an all-time high as geopolitical tensions escalated in the Middle East.',
          source: 'Financial Times',
          datetime: new Date(),
          url: '#',
          related: 'GOLD',
          categories: ['COMMODITIES', 'MARKET'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Gold+Bullion'
        },
        {
          id: '7',
          headline: 'Oil Prices Fall as OPEC+ Considers Production Increase',
          summary: 'Crude oil prices declined after reports that OPEC+ members are discussing a potential increase in production quotas.',
          source: 'Reuters',
          datetime: new Date(),
          url: '#',
          related: 'CRUDE',
          categories: ['COMMODITIES', 'ENERGY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Oil+Rig'
        },
        {
          id: '8',
          headline: 'US Inflation Rate Falls to 3.7%, Below Expectations',
          summary: 'The latest Consumer Price Index report shows inflation cooling more than expected, raising hopes for earlier Fed rate cuts.',
          source: 'Wall Street Journal',
          datetime: new Date(),
          url: '#',
          related: 'US_CPI',
          categories: ['ECONOMY', 'MARKET'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Inflation+Data'
        },
        {
          id: '9',
          headline: 'Ethereum Completes Major Network Upgrade',
          summary: 'Ethereum has successfully implemented its latest upgrade, promising faster transactions and lower fees.',
          source: 'CoinDesk',
          datetime: new Date(),
          url: '#',
          related: 'ETH/USD',
          categories: ['CRYPTO', 'TECHNOLOGY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Ethereum'
        },
        {
          id: '10',
          headline: 'Amazon Expands AWS with New AI Services',
          summary: 'Amazon Web Services announced a suite of new AI tools for businesses, boosting its cloud computing offerings.',
          source: 'TechCrunch',
          datetime: new Date(),
          url: '#',
          related: 'AMZN',
          categories: ['STOCKS', 'TECHNOLOGY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Amazon+Cloud'
        },
      ];
      
      // Format dates for displaying relative time
      mockNews.forEach(news => {
        // Add a random offset to make news appear from different times
        const randomHours = Math.floor(Math.random() * 10);
        news.datetime = new Date(Date.now() - randomHours * 3600000);
        news.time = getRelativeTime(news.datetime);
      });
      
      // Update cache
      dataCache.news = mockNews;
      
      // Broadcast news using enhanced method
      if (wsServer) {
        wsServer.broadcastNewsUpdate(mockNews);
      }
    }
  } catch (error) {
    console.error('Error fetching latest news:', error);
  }
};

// Helper function to format date as relative time
const getRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

// Get historical chart data for a symbol
const getChartData = async (symbol, timeframe = '1d') => {
  try {
    const cacheKey = `${symbol}-${timeframe}`;
    
    // Check cache first
    if (dataCache.charts.has(cacheKey)) {
      return dataCache.charts.get(cacheKey);
    }
    
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Generate mock chart data
      const resolution = timeframeToResolution(timeframe);
      const { from, to } = calculateTimeRange(timeframe);
      const mockChartData = generateMockChartData(symbol, from, to, resolution);
      
      // Update cache
      dataCache.charts.set(cacheKey, mockChartData);
      
      return mockChartData;
    }
  } catch (error) {
    console.error(`Error getting chart data for ${symbol}:`, error);
    return null;
  }
};

// Helper function to convert timeframe to resolution
const timeframeToResolution = (timeframe) => {
  switch (timeframe) {
    case '1d': return '5'; // 5 minutes
    case '1w': return '30'; // 30 minutes
    case '1m': return 'D'; // 1 day
    case '3m': return 'D'; // 1 day
    case '1y': return 'W'; // 1 week
    case 'all': return 'M'; // 1 month
    default: return 'D'; // Default to daily
  }
};

// Helper function to calculate time range based on timeframe
const calculateTimeRange = (timeframe) => {
  const to = moment().unix();
  let from;
  
  switch (timeframe) {
    case '1d':
      from = moment().subtract(1, 'days').unix();
      break;
    case '1w':
      from = moment().subtract(1, 'weeks').unix();
      break;
    case '1m':
      from = moment().subtract(1, 'months').unix();
      break;
    case '3m':
      from = moment().subtract(3, 'months').unix();
      break;
    case '1y':
      from = moment().subtract(1, 'years').unix();
      break;
    case 'all':
      from = moment().subtract(5, 'years').unix();
      break;
    default:
      from = moment().subtract(1, 'months').unix();
  }
  
  return { from, to };
};

// Generate mock chart data for a given symbol and time range
const generateMockChartData = (symbol, from, to, resolution) => {
  // Get base price from mock data or generate one
  let basePrice = 100;
  const mockStock = [...mockStocks].find(stock => stock.symbol === symbol);
  if (mockStock) {
    basePrice = mockStock.currentPrice;
  }
  
  // Determine data points based on resolution and time range
  let interval;
  let dataPoints;
  
  switch (resolution) {
    case '5': // 5 minutes
      interval = 300; // 5 minutes in seconds
      break;
    case '30': // 30 minutes
      interval = 1800; // 30 minutes in seconds
      break;
    case 'D': // 1 day
      interval = 86400; // 1 day in seconds
      break;
    case 'W': // 1 week
      interval = 604800; // 1 week in seconds
      break;
    case 'M': // 1 month
      interval = 2592000; // 30 days in seconds
      break;
    default:
      interval = 86400; // Default to daily
  }
  
  dataPoints = Math.min(1000, Math.ceil((to - from) / interval)); // Cap at 1000 points
  
  // Generate price data with trend
  const trend = Math.random() > 0.5 ? 'up' : 'down';
  const volatility = 0.01; // 1% volatility
  const trendStrength = trend === 'up' ? 0.0005 : -0.0005; // 0.05% trend per point
  
  const timestamps = [];
  const prices = [];
  const volumes = [];
  
  let currentTime = from;
  let currentPrice = basePrice;
  
  for (let i = 0; i < dataPoints; i++) {
    timestamps.push(currentTime);
    
    // Add random price change with trend bias
    const randomChange = (Math.random() * 2 - 1) * volatility * currentPrice;
    const trendChange = trendStrength * currentPrice;
    currentPrice = Math.max(0.01, currentPrice + randomChange + trendChange);
    prices.push(parseFloat(currentPrice.toFixed(2)));
    
    // Generate random volume
    const baseVolume = mockStock ? mockStock.volume / dataPoints : 1000000 / dataPoints;
    const randomVolume = Math.floor(baseVolume * (0.5 + Math.random()));
    volumes.push(randomVolume);
    
    currentTime += interval;
  }
  
  return {
    symbol,
    timeframe: resolution,
    timestamps,
    prices,
    volumes,
    lastUpdated: new Date(),
  };
};

// Get all current market indices
const getAllMarketIndices = () => {
  return Array.from(dataCache.indices.values());
};

// Get all tracked symbols with current data
const getAllStocks = () => {
  return Array.from(dataCache.symbols.values());
};

// Get all forex pairs
const getAllForexPairs = () => {
  return Array.from(dataCache.forex.values());
};

// Get all cryptocurrencies
const getAllCryptocurrencies = () => {
  return Array.from(dataCache.crypto.values());
};

// Get all commodities
const getAllCommodities = () => {
  return Array.from(dataCache.commodities.values());
};

// Get all economic indicators
const getAllEconomicIndicators = () => {
  return Array.from(dataCache.economy.values());
};

// Get latest news
const getLatestNews = (category = null) => {
  // If no category specified, return all news
  if (!category) return dataCache.news;
  
  // Filter news by category
  return dataCache.news.filter(news => 
    news.categories && news.categories.includes(category)
  );
};

// Get news for a specific symbol
const getNewsForSymbol = (symbol) => {
  return dataCache.news.filter(news => news.related === symbol);
};

// Update forex pairs with small random changes for mock data
const updateForexPairs = async () => {
  try {
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Update mock data with random changes
      mockForexPairs.forEach(pair => {
        // Forex rates typically move in small increments
        const randomChange = (Math.random() * 2 - 1) * (pair.rate * 0.0008); // Random ±0.08% change
        const oldRate = pair.rate;
        pair.rate = parseFloat((oldRate + randomChange).toFixed(4));
        pair.change = parseFloat((pair.rate - (oldRate - pair.change)).toFixed(4));
        pair.percentChange = parseFloat(((pair.change / (oldRate - pair.change)) * 100).toFixed(2));
        
        // Update bid/ask
        const spread = 0.0004; // Typical small spread
        pair.bid = parseFloat((pair.rate - spread / 2).toFixed(4));
        pair.ask = parseFloat((pair.rate + spread / 2).toFixed(4));
        
        // Update high/low if needed
        if (pair.rate > pair.high24h) pair.high24h = pair.rate;
        if (pair.rate < pair.low24h) pair.low24h = pair.rate;
        
        pair.lastUpdated = new Date();
        
        // Update cache
        dataCache.forex.set(pair.symbol, pair);
        
        // Broadcast update via websocket with enhanced change tracking
        if (wsServer) {
          wsServer.broadcastForexUpdate(pair.symbol, pair);
        }
      });
    }
  } catch (error) {
    console.error('Error updating forex pairs:', error);
  }
};

// Update cryptocurrencies with small random changes for mock data
const updateCryptocurrencies = async () => {
  try {
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Update mock data with random changes
      mockCryptocurrencies.forEach(crypto => {
        // Crypto can have more volatility
        const randomChange = (Math.random() * 2 - 1) * (crypto.price * 0.01); // Random ±1% change
        const oldPrice = crypto.price;
        crypto.price = parseFloat((oldPrice + randomChange).toFixed(2));
        crypto.change = parseFloat((crypto.price - (oldPrice - crypto.change)).toFixed(2));
        crypto.percentChange = parseFloat(((crypto.change / (oldPrice - crypto.change)) * 100).toFixed(2));
        
        // Update volume with a small change
        const volumeChange = Math.random() * 0.02 - 0.01; // -1% to +1%
        crypto.volume24h = Math.round(crypto.volume24h * (1 + volumeChange));
        
        // Update market cap based on price
        const priceRatio = crypto.price / oldPrice;
        crypto.marketCap = Math.round(crypto.marketCap * priceRatio);
        
        // Update high/low if needed
        if (crypto.price > crypto.high24h) crypto.high24h = crypto.price;
        if (crypto.price < crypto.low24h) crypto.low24h = crypto.price;
        
        crypto.lastUpdated = new Date();
        
        // Update cache
        dataCache.crypto.set(crypto.symbol, crypto);
        
        // Broadcast update via websocket with enhanced change tracking
        if (wsServer) {
          wsServer.broadcastCryptoUpdate(crypto.symbol, crypto);
        }
      });
    }
  } catch (error) {
    console.error('Error updating cryptocurrencies:', error);
  }
};

// Update commodities with small random changes for mock data
const updateCommodities = async () => {
  try {
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Update mock data with random changes
      mockCommodities.forEach(commodity => {
        // Commodities typically move less than stocks
        const randomChange = (Math.random() * 2 - 1) * (commodity.price * 0.003); // Random ±0.3% change
        const oldPrice = commodity.price;
        commodity.price = parseFloat((oldPrice + randomChange).toFixed(2));
        commodity.change = parseFloat((commodity.price - (oldPrice - commodity.change)).toFixed(2));
        commodity.percentChange = parseFloat(((commodity.change / (oldPrice - commodity.change)) * 100).toFixed(2));
        
        commodity.lastUpdated = new Date();
        
        // Update cache
        dataCache.commodities.set(commodity.symbol, commodity);
        
        // Broadcast update via websocket with enhanced change tracking
        if (wsServer) {
          wsServer.broadcastCommodityUpdate(commodity.symbol, commodity);
        }
      });
    }
  } catch (error) {
    console.error('Error updating commodities:', error);
  }
};

// Update economic indicators (these change infrequently in real world)
const updateEconomicIndicators = async () => {
  try {
    if (finnhubClient) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Economic indicators change rarely, so we're just simulating occasional small changes
      mockEconomicIndicators.forEach(indicator => {
        // Only change with 20% probability to simulate infrequent updates
        if (Math.random() < 0.2) {
          const randomChange = (Math.random() * 2 - 1) * 0.1; // Random ±0.1 unit change
          const oldValue = indicator.value;
          indicator.value = parseFloat((oldValue + randomChange).toFixed(1));
          
          // Update previous value when there's a change
          indicator.previousValue = oldValue;
          indicator.lastUpdated = new Date();
          
          // Update cache
          dataCache.economy.set(indicator.symbol, indicator);
          
          // Broadcast update via websocket with enhanced change tracking
          if (wsServer) {
            wsServer.broadcastEconomyUpdate(indicator.symbol, indicator);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error updating economic indicators:', error);
  }
};

export {
  initializeMarketData,
  getChartData,
  getAllMarketIndices,
  getAllStocks,
  getAllForexPairs,
  getAllCryptocurrencies,
  getAllCommodities,
  getAllEconomicIndicators,
  getLatestNews,
  getNewsForSymbol
}; 