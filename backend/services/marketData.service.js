/**
 * Market Data Service
 * Handles fetching and broadcasting real-time market data
 */

import moment from 'moment';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
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

// Whether to use Yahoo Finance real API (default true — fallback to mock per-request on failure)
let useRealAPI = true;

let ioInstance;
// WebSocket server instance
let wsServer;

const indexSymbolMap = {
  '^NSEI': { name: 'NIFTY 50', yahooSymbol: '^NSEI' },
  '^BSESN': { name: 'SENSEX', yahooSymbol: '^BSESN' },
  '^NSEBANK': { name: 'NIFTY BANK', yahooSymbol: '^NSEBANK' }
};

const forexSymbolMap = {
  'EUR/USD': { yahooSymbol: 'EURUSD=X', baseCurrency: 'EUR', quoteCurrency: 'USD' },
  'GBP/USD': { yahooSymbol: 'GBPUSD=X', baseCurrency: 'GBP', quoteCurrency: 'USD' },
  'USD/JPY': { yahooSymbol: 'JPY=X', baseCurrency: 'USD', quoteCurrency: 'JPY' },
  'USD/INR': { yahooSymbol: 'USDINR=X', baseCurrency: 'USD', quoteCurrency: 'INR' }
};

// Yahoo Finance symbol mapping for cryptocurrencies
const cryptoSymbolMap = {
  'BTC/USD': { yahooSymbol: 'BTC-USD', name: 'Bitcoin' },
  'ETH/USD': { yahooSymbol: 'ETH-USD', name: 'Ethereum' }
};

// Yahoo Finance symbol mapping for commodities
const commoditySymbolMap = {
  'GOLD':  { yahooSymbol: 'GC=F', name: 'Gold', unit: 'troy ounce' },
  'SILVER': { yahooSymbol: 'SI=F', name: 'Silver', unit: 'troy ounce' },
  'CRUDE': { yahooSymbol: 'CL=F', name: 'Crude Oil WTI', unit: 'barrel' }
};

// Mock data for development without API key
const mockMarketIndices = [
  { name: 'NIFTY 50', symbol: '^NSEI', currentValue: 22456.78, change: 125.45, percentChange: 0.56, previousClose: 22331.33, lastUpdated: new Date() },
  { name: 'SENSEX', symbol: '^BSESN', currentValue: 73845.67, change: 234.12, percentChange: 0.32, previousClose: 73611.55, lastUpdated: new Date() },
  { name: 'NIFTY BANK', symbol: '^NSEBANK', currentValue: 48567.89, change: 345.67, percentChange: 0.72, previousClose: 48222.22, lastUpdated: new Date() }
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
    symbol: 'USD/INR',
    baseCurrency: 'USD',
    quoteCurrency: 'INR',
    rate: 83.12,
    change: 0.15,
    percentChange: 0.18,
    bid: 83.10,
    ask: 83.14,
    high24h: 83.35,
    low24h: 82.90,
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
];

const mockCommodities = [
  {
    symbol: 'GOLD',
    name: 'Gold',
    price: 2347.80,
    change: 15.60,
    percentChange: 0.67,
    high24h: 2360.00,
    low24h: 2330.00,
    unit: 'troy ounce',
    lastUpdated: new Date(),
  },
  {
    symbol: 'SILVER',
    name: 'Silver',
    price: 27.85,
    change: 0.32,
    percentChange: 1.16,
    high24h: 28.10,
    low24h: 27.50,
    unit: 'troy ounce',
    lastUpdated: new Date(),
  },
  {
    symbol: 'CRUDE',
    name: 'Crude Oil WTI',
    price: 78.42,
    change: -1.24,
    percentChange: -1.56,
    high24h: 79.80,
    low24h: 77.90,
    unit: 'barrel',
    lastUpdated: new Date(),
  },
];

const mockEconomicIndicators = [
  {
    symbol: 'IN_CPI',
    name: 'India Consumer Price Index',
    value: 5.1,
    previousValue: 5.3,
    unit: '%',
    period: 'YoY',
    lastUpdated: new Date(),
    nextRelease: new Date(2024, 0, 12),
  },
  {
    symbol: 'IN_GDP',
    name: 'India GDP Growth Rate',
    value: 7.6,
    previousValue: 7.8,
    unit: '%',
    period: 'QoQ',
    lastUpdated: new Date(),
    nextRelease: new Date(2024, 1, 28),
  },
  {
    symbol: 'IN_UNEMPLOYMENT',
    name: 'India Unemployment Rate',
    value: 7.1,
    previousValue: 7.3,
    unit: '%',
    period: 'Monthly',
    lastUpdated: new Date(),
    nextRelease: new Date(2024, 0, 15),
  },
  {
    symbol: 'RBI_REPO',
    name: 'RBI Repo Rate',
    value: 6.5,
    previousValue: 6.5,
    unit: '%',
    period: 'Current',
    lastUpdated: new Date(),
    nextRelease: new Date(2024, 1, 8),
  },
];

const mockStocks = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', currentPrice: 2456.75, change: 12.50, percentChange: 0.51, volume: 12345678, marketCap: 16500000000000, peRatio: 28.5, lastUpdated: new Date() },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', currentPrice: 3856.20, change: -15.30, percentChange: -0.39, volume: 2345678, marketCap: 14000000000000, peRatio: 32.1, lastUpdated: new Date() },
  { symbol: 'INFY.NS', name: 'Infosys Ltd.', currentPrice: 1523.45, change: 8.75, percentChange: 0.58, volume: 3456789, marketCap: 6300000000000, peRatio: 29.8, lastUpdated: new Date() },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', currentPrice: 1689.30, change: 22.10, percentChange: 1.33, volume: 4567890, marketCap: 12500000000000, peRatio: 18.9, lastUpdated: new Date() },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', currentPrice: 1123.50, change: 5.25, percentChange: 0.47, volume: 5678901, marketCap: 7800000000000, peRatio: 16.2, lastUpdated: new Date() },
  { symbol: 'SBIN.NS', name: 'State Bank of India', currentPrice: 678.90, change: 3.45, percentChange: 0.51, volume: 6789012, marketCap: 6000000000000, peRatio: 12.5, lastUpdated: new Date() },
  { symbol: 'ITC.NS', name: 'ITC Ltd.', currentPrice: 456.75, change: -2.30, percentChange: -0.50, volume: 7890123, marketCap: 5600000000000, peRatio: 24.3, lastUpdated: new Date() },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd.', currentPrice: 3456.80, change: 45.20, percentChange: 1.32, volume: 8901234, marketCap: 4800000000000, peRatio: 22.7, lastUpdated: new Date() },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', currentPrice: 1234.56, change: 12.34, percentChange: 1.01, volume: 9012345, marketCap: 6900000000000, peRatio: 19.4, lastUpdated: new Date() }
];

const initializeMarketData = async (io) => {
  ioInstance = io;
  
  try {
    wsServer = setupWebSocketServer(io);
    
    // Verify Yahoo Finance connectivity with a test call
    try {
      const testQuote = await yahooFinance.quote('BTC-USD');
      if (testQuote && testQuote.regularMarketPrice) {
        useRealAPI = true;
        console.log(`Yahoo Finance API initialized - using real market data (BTC-USD test price: $${testQuote.regularMarketPrice})`);
      } else {
        useRealAPI = false;
        console.warn('Yahoo Finance returned empty data for test quote — falling back to mock data');
      }
    } catch (error) {
      useRealAPI = false;
      console.error('Yahoo Finance unavailable — falling back to mock data. Error:', error.message || error);
    }

    // Pre-load mock data into cache as baseline (real data will overwrite on each update)
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

const updateStockPrices = async () => {
  try {
    if (useRealAPI) {
      let successCount = 0;

      for (const base of mockStocks) {
        try {
          const q = await yahooFinance.quote(base.symbol);

          if (!q || !q.regularMarketPrice) continue;

          const updated = {
            symbol: base.symbol,
            name: base.name,
            currentPrice: q.regularMarketPrice,
            change: q.regularMarketChange ?? 0,
            percentChange: q.regularMarketChangePercent ?? 0,
            previousClose: q.regularMarketPreviousClose ?? base.currentPrice,
            volume: q.regularMarketVolume ?? base.volume,
            marketCap: q.marketCap ?? base.marketCap,
            peRatio: q.trailingPE ?? base.peRatio,
            lastUpdated: new Date()
          };

          dataCache.symbols.set(base.symbol, updated);
          successCount++;

          if (wsServer) {
            wsServer.broadcastSymbolUpdate(base.symbol, updated);
          }

        } catch (err) {
          console.error(`[Stock] Yahoo Finance error for ${base.symbol}:`, err.message);
        }
      }

      if (successCount > 0) {
        console.log(`[Stock] Real data fetched for ${successCount}/${mockStocks.length} stocks`);
        return;
      }
      console.warn('[Stock] All real API calls failed — falling back to mock data');
    }

    // MOCK FALLBACK MODE

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
    console.error('Stock update error:', error.message || error);
  }
};


// Update market indices
const updateMarketIndices = async () => {
  try {
    if (useRealAPI) {
      let successCount = 0;

      for (const [symbol, meta] of Object.entries(indexSymbolMap)) {
        try {
          const q = await yahooFinance.quote(meta.yahooSymbol);
          if (!q || !q.regularMarketPrice) continue;

          const previousClose = q.regularMarketPreviousClose ?? 0;
          const currentValue = q.regularMarketPrice;
          const change = q.regularMarketChange ?? (currentValue - previousClose);
          const percentChange = q.regularMarketChangePercent ?? (previousClose ? ((change / previousClose) * 100) : 0);

          const updated = {
            name: meta.name,
            symbol: symbol,
            currentValue: parseFloat(currentValue.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            percentChange: parseFloat(percentChange.toFixed(2)),
            previousClose: parseFloat(previousClose.toFixed(2)),
            lastUpdated: new Date()
          };

          dataCache.indices.set(symbol, updated);
          successCount++;

          if (wsServer) {
            wsServer.broadcastIndexUpdate(symbol, updated);
          }
        } catch (err) {
          console.error(`[Index] Yahoo Finance error for ${meta.yahooSymbol}:`, err.message);
        }
      }

      if (successCount > 0) {
        console.log(`[Index] Real data fetched for ${successCount}/${Object.keys(indexSymbolMap).length} indices`);
        return;
      }
      console.warn('[Index] All real API calls failed — falling back to mock data');
    }

    // MOCK FALLBACK MODE 
    mockMarketIndices.forEach(index => {
      const randomChange = (Math.random() * 2 - 1) * (index.currentValue * 0.002);
      const oldValue = index.currentValue;
      index.currentValue = parseFloat((oldValue + randomChange).toFixed(2));
      index.change = parseFloat((index.currentValue - index.previousClose).toFixed(2));
      index.percentChange = parseFloat(((index.change / index.previousClose) * 100).toFixed(2));
      index.lastUpdated = new Date();

      dataCache.indices.set(index.symbol, index);

      if (wsServer) {
        wsServer.broadcastIndexUpdate(index.symbol, index);
      }
    });
  } catch (error) {
    console.error('Error updating market indices:', error.message || error);
  }
};

// Fetch latest news with categories for different asset classes
const fetchLatestNews = async () => {
  try {
    if (useRealAPI) {
      // Implementation with real API
      // TODO: Implement real API calls when API key is available
    } else {
      // Use mock news with categories
      const mockNews = [
        {
          id: '1',
          headline: 'RBI Signals Potential Repo Rate Cut as Inflation Eases Below 5%',
          summary: 'Reserve Bank of India officials indicated they could begin cutting the repo rate soon if CPI inflation continues to cool toward their 4% target.',
          source: 'Economic Times',
          datetime: new Date(),
          url: '#',
          related: 'MARKET',
          categories: ['MARKET', 'ECONOMY', 'RBI_REPO'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Reserve+Bank+of+India'
        },
        {
          id: '2',
          headline: 'TCS Reports Strong Q3 Earnings, Beats Street Estimates',
          summary: 'Tata Consultancy Services posted robust revenue growth driven by strong deal wins in cloud and AI services.',
          source: 'Moneycontrol',
          datetime: new Date(),
          url: '#',
          related: 'TCS.NS',
          categories: ['STOCKS', 'TECHNOLOGY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=TCS+Earnings'
        },
        {
          id: '3',
          headline: 'Reliance Industries Plans Major Green Energy Investment',
          summary: 'Reliance Industries announced a massive investment in renewable energy and green hydrogen, signaling a strategic shift.',
          source: 'Business Standard',
          datetime: new Date(),
          url: '#',
          related: 'RELIANCE.NS',
          categories: ['STOCKS', 'ENERGY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Reliance+Green+Energy'
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
          headline: 'Rupee Strengthens Against Dollar on Strong FII Inflows',
          summary: 'The Indian rupee gained against the US Dollar as foreign institutional investors increased their equity allocations to India.',
          source: 'Livemint',
          datetime: new Date(),
          url: '#',
          related: 'USD/INR',
          categories: ['FOREX', 'ECONOMY'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Rupee+Dollar'
        },
        {
          id: '6',
          headline: 'Gold Prices Hit Record High on Geopolitical Tensions',
          summary: 'Safe-haven demand pushed gold prices to an all-time high as geopolitical tensions escalated in the Middle East.',
          source: 'Economic Times',
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
          headline: 'India CPI Inflation Falls to 5.1%, Below Expectations',
          summary: 'The latest CPI data shows inflation cooling more than expected, raising hopes for an earlier RBI rate cut.',
          source: 'Moneycontrol',
          datetime: new Date(),
          url: '#',
          related: 'IN_CPI',
          categories: ['ECONOMY', 'MARKET'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=India+CPI+Data'
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
          headline: 'HDFC Bank Posts Record Quarterly Profit on Strong Loan Growth',
          summary: 'HDFC Bank reported its highest-ever quarterly profit, driven by robust retail and corporate loan growth.',
          source: 'Business Standard',
          datetime: new Date(),
          url: '#',
          related: 'HDFCBANK.NS',
          categories: ['STOCKS', 'MARKET'],
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=HDFC+Bank'
        },
      ];
      
      mockNews.forEach(news => {
        const randomHours = Math.floor(Math.random() * 10);
        news.datetime = new Date(Date.now() - randomHours * 3600000);
        news.time = getRelativeTime(news.datetime);
      });
      
      dataCache.news = mockNews;

      if (wsServer) {
        wsServer.broadcastNewsUpdate(mockNews);
      }
    }
  } catch (error) {
    console.error('Error fetching latest news:', error);
  }
};

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


const getChartData = async (symbol, timeframe = '1d') => {
  try {
    const cacheKey = `${symbol}-${timeframe}`;
    
    if (dataCache.charts.has(cacheKey)) {
      return dataCache.charts.get(cacheKey);
    }
    
    if (useRealAPI) {
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

const timeframeToResolution = (timeframe) => {
  switch (timeframe) {
    case '1d': return '5'; 
    case '1w': return '30'; 
    case '1m': return 'D'; 
    case '3m': return 'D'; 
    case '1y': return 'W'; 
    case 'all': return 'M'; 
    default: return 'D'; 
  }
};

// calculate time range based on timeframe
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
  
  let interval;
  let dataPoints;
  
  switch (resolution) {
    case '5': // 5 minutes
      interval = 300; // 5 minutes in seconds
      break;
    case '30': 
      interval = 1800; 
      break;
    case 'D': 
      interval = 86400; 
      break;
    case 'W': 
      interval = 604800; 
      break;
    case 'M': 
      interval = 2592000; 
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

// Get all Indian market indices
const getAllIndianIndices = () => {
  return Array.from(dataCache.indices.values()).filter(index => 
    ['^NSEI', '^BSESN', '^NSEBANK'].includes(index.symbol)
  );
};

const getAllMarketIndices = () => {
  return Array.from(dataCache.indices.values());
};

const getAllStocks = () => {
  return Array.from(dataCache.symbols.values());
};

const getAllForexPairs = () => {
  return Array.from(dataCache.forex.values());
};

const getAllCryptocurrencies = () => {
  return Array.from(dataCache.crypto.values());
};

const getAllCommodities = () => {
  return Array.from(dataCache.commodities.values());
};

const getAllEconomicIndicators = () => {
  return Array.from(dataCache.economy.values());
};

const getLatestNews = (category = null) => {
  if (!category) return dataCache.news;
  
  return dataCache.news.filter(news => 
    news.categories && news.categories.includes(category)
  );
};

const getNewsForSymbol = (symbol) => {
  return dataCache.news.filter(news => news.related === symbol);
};

const updateForexPairs = async () => {
  try {
    if (useRealAPI) {
      let successCount = 0;

      for (const [pairSymbol, meta] of Object.entries(forexSymbolMap)) {
        try {
          const q = await yahooFinance.quote(meta.yahooSymbol);
          if (!q || !q.regularMarketPrice) continue;

          const rate = q.regularMarketPrice;
          const previousClose = q.regularMarketPreviousClose ?? rate;
          const change = q.regularMarketChange ?? (rate - previousClose);
          const percentChange = q.regularMarketChangePercent ?? (previousClose ? ((change / previousClose) * 100) : 0);

          const spread = rate * 0.0003;
          const updated = {
            symbol: pairSymbol,
            baseCurrency: meta.baseCurrency,
            quoteCurrency: meta.quoteCurrency,
            rate: parseFloat(rate.toFixed(4)),
            change: parseFloat(change.toFixed(4)),
            percentChange: parseFloat(percentChange.toFixed(2)),
            bid: parseFloat((rate - spread / 2).toFixed(4)),
            ask: parseFloat((rate + spread / 2).toFixed(4)),
            high24h: parseFloat((q.regularMarketDayHigh ?? rate).toFixed(4)),
            low24h: parseFloat((q.regularMarketDayLow ?? rate).toFixed(4)),
            lastUpdated: new Date()
          };

          dataCache.forex.set(pairSymbol, updated);
          successCount++;

          if (wsServer) {
            wsServer.broadcastForexUpdate(pairSymbol, updated);
          }
        } catch (err) {
          console.error(`[Forex] Yahoo Finance error for ${meta.yahooSymbol}:`, err.message);
        }
      }

      if (successCount > 0) {
        console.log(`[Forex] Real data fetched for ${successCount}/${Object.keys(forexSymbolMap).length} pairs`);
        return;
      }
      console.warn('[Forex] All real API calls failed — falling back to mock data');
    }

    // MOCK FALLBACK MODE
    mockForexPairs.forEach(pair => {
      const randomChange = (Math.random() * 2 - 1) * (pair.rate * 0.0008);
      const oldRate = pair.rate;
      pair.rate = parseFloat((oldRate + randomChange).toFixed(4));
      pair.change = parseFloat((pair.rate - (oldRate - pair.change)).toFixed(4));
      pair.percentChange = parseFloat(((pair.change / (oldRate - pair.change)) * 100).toFixed(2));

      const spread = 0.0004;
      pair.bid = parseFloat((pair.rate - spread / 2).toFixed(4));
      pair.ask = parseFloat((pair.rate + spread / 2).toFixed(4));

      if (pair.rate > pair.high24h) pair.high24h = pair.rate;
      if (pair.rate < pair.low24h) pair.low24h = pair.rate;

      pair.lastUpdated = new Date();

      dataCache.forex.set(pair.symbol, pair);

      if (wsServer) {
        wsServer.broadcastForexUpdate(pair.symbol, pair);
      }
    });
  } catch (error) {
    console.error('Error updating forex pairs:', error.message || error);
  }
};

const updateCryptocurrencies = async () => {
  try {
    if (useRealAPI) {
      let successCount = 0;

      for (const [pairSymbol, meta] of Object.entries(cryptoSymbolMap)) {
        try {
          const q = await yahooFinance.quote(meta.yahooSymbol);
          if (!q || !q.regularMarketPrice) continue;

          const price = q.regularMarketPrice;
          const previousClose = q.regularMarketPreviousClose ?? price;
          const change = q.regularMarketChange ?? (price - previousClose);
          const percentChange = q.regularMarketChangePercent ?? (previousClose ? ((change / previousClose) * 100) : 0);

          const updated = {
            symbol: pairSymbol,
            name: meta.name,
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            percentChange: parseFloat(percentChange.toFixed(2)),
            volume24h: q.regularMarketVolume ?? 0,
            marketCap: q.marketCap ?? 0,
            high24h: parseFloat((q.regularMarketDayHigh ?? price).toFixed(2)),
            low24h: parseFloat((q.regularMarketDayLow ?? price).toFixed(2)),
            lastUpdated: new Date()
          };

          dataCache.crypto.set(pairSymbol, updated);
          successCount++;

          if (wsServer) {
            wsServer.broadcastCryptoUpdate(pairSymbol, updated);
          }
        } catch (err) {
          console.error(`[Crypto] Yahoo Finance error for ${meta.yahooSymbol}:`, err.message);
        }
      }

      if (successCount > 0) {
        console.log(`[Crypto] Real data fetched for ${successCount}/${Object.keys(cryptoSymbolMap).length} cryptocurrencies`);
        return;
      }
      console.warn('[Crypto] All real API calls failed — falling back to mock data');
    }

    // MOCK FALLBACK MODE 
    mockCryptocurrencies.forEach(crypto => {
      const randomChange = (Math.random() * 2 - 1) * (crypto.price * 0.01);
      const oldPrice = crypto.price;
      crypto.price = parseFloat((oldPrice + randomChange).toFixed(2));
      crypto.change = parseFloat((crypto.price - (oldPrice - crypto.change)).toFixed(2));
      crypto.percentChange = parseFloat(((crypto.change / (oldPrice - crypto.change)) * 100).toFixed(2));

      const volumeChange = Math.random() * 0.02 - 0.01;
      crypto.volume24h = Math.round(crypto.volume24h * (1 + volumeChange));

      const priceRatio = crypto.price / oldPrice;
      crypto.marketCap = Math.round(crypto.marketCap * priceRatio);

      if (crypto.price > crypto.high24h) crypto.high24h = crypto.price;
      if (crypto.price < crypto.low24h) crypto.low24h = crypto.price;

      crypto.lastUpdated = new Date();

      dataCache.crypto.set(crypto.symbol, crypto);

      if (wsServer) {
        wsServer.broadcastCryptoUpdate(crypto.symbol, crypto);
      }
    });
  } catch (error) {
    console.error('Error updating cryptocurrencies:', error.message || error);
  }
};

const updateCommodities = async () => {
  try {
    if (useRealAPI) {
      let successCount = 0;

      for (const [commoditySymbol, meta] of Object.entries(commoditySymbolMap)) {
        try {
          const q = await yahooFinance.quote(meta.yahooSymbol);
          if (!q || !q.regularMarketPrice) continue;

          const price = q.regularMarketPrice;
          const previousClose = q.regularMarketPreviousClose ?? price;
          const change = q.regularMarketChange ?? (price - previousClose);
          const percentChange = q.regularMarketChangePercent ?? (previousClose ? ((change / previousClose) * 100) : 0);

          const updated = {
            symbol: commoditySymbol,
            name: meta.name,
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            percentChange: parseFloat(percentChange.toFixed(2)),
            high24h: parseFloat((q.regularMarketDayHigh ?? price).toFixed(2)),
            low24h: parseFloat((q.regularMarketDayLow ?? price).toFixed(2)),
            unit: meta.unit,
            lastUpdated: new Date()
          };

          dataCache.commodities.set(commoditySymbol, updated);
          successCount++;

          if (wsServer) {
            wsServer.broadcastCommodityUpdate(commoditySymbol, updated);
          }
        } catch (err) {
          console.error(`[Commodity] Yahoo Finance error for ${meta.yahooSymbol}:`, err.message);
        }
      }

      if (successCount > 0) {
        console.log(`[Commodity] Real data fetched for ${successCount}/${Object.keys(commoditySymbolMap).length} commodities`);
        return;
      }
      console.warn('[Commodity] All real API calls failed — falling back to mock data');
    }

    // MOCK FALLBACK MODE 
    mockCommodities.forEach(commodity => {
      const randomChange = (Math.random() * 2 - 1) * (commodity.price * 0.003);
      const oldPrice = commodity.price;
      commodity.price = parseFloat((oldPrice + randomChange).toFixed(2));
      commodity.change = parseFloat((commodity.price - (oldPrice - commodity.change)).toFixed(2));
      commodity.percentChange = parseFloat(((commodity.change / (oldPrice - commodity.change)) * 100).toFixed(2));

      commodity.lastUpdated = new Date();

      dataCache.commodities.set(commodity.symbol, commodity);

      if (wsServer) {
        wsServer.broadcastCommodityUpdate(commodity.symbol, commodity);
      }
    });
  } catch (error) {
    console.error('Error updating commodities:', error.message || error);
  }
};

const updateEconomicIndicators = async () => {
  try {
    // Economic indicators change rarely, so we simulate occasional small changes
    mockEconomicIndicators.forEach(indicator => {
      // Only change with 20% probability to simulate infrequent updates
      if (Math.random() < 0.2) {
        const randomChange = (Math.random() * 2 - 1) * 0.1;
        const oldValue = indicator.value;
        indicator.value = parseFloat((oldValue + randomChange).toFixed(1));

        indicator.previousValue = oldValue;
        indicator.lastUpdated = new Date();

        dataCache.economy.set(indicator.symbol, indicator);

        if (wsServer) {
          wsServer.broadcastEconomyUpdate(indicator.symbol, indicator);
        }
      }
    });
  } catch (error) {
    console.error('Error updating economic indicators:', error);
  }
};

export {
  initializeMarketData,
  getChartData,
  getAllMarketIndices,
  getAllIndianIndices,
  getAllStocks,
  getAllForexPairs,
  getAllCryptocurrencies,
  getAllCommodities,
  getAllEconomicIndicators,
  getLatestNews,
  getNewsForSymbol
}; 