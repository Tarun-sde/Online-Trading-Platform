'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RealTimeStockChart from '@/components/RealTimeStockChart';
import RiskManagementForm from '@/components/RiskManagementForm';
import wsService from '@/utils/websocket';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock stock data for different symbols
const mockStockData: {[key: string]: any} = {
  'RELIANCE.NS': {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    currentPrice: 2456.75,
    change: 12.50,
    percentChange: 1.15,
    volume: 12345678,
    marketCap: 16500000000000,
    peRatio: 28.5,
    fiftyTwoWeekHigh: 2650.00,
    fiftyTwoWeekLow: 2200.00
  },
  'TCS.NS': {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Ltd.',
    currentPrice: 3856.20,
    change: -15.30,
    percentChange: -0.39,
    volume: 2345678,
    marketCap: 14000000000000,
    peRatio: 32.1,
    fiftyTwoWeekHigh: 4000.00,
    fiftyTwoWeekLow: 3200.00
  },
  'INFY.NS': {
  symbol: 'INFY.NS',
  name: 'Infosys Ltd.',
  currentPrice: 1625.40,
  change: 8.75,
  percentChange: 0.54,
  volume: 3456789,
  marketCap: 6750000000000,
  peRatio: 29.8,
  fiftyTwoWeekHigh: 1750.00,
  fiftyTwoWeekLow: 1350.00
  },
  'HDFCBANK.NS': {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd.',
    currentPrice: 1589.60,
    change: -5.20,
    percentChange: -0.33,
    volume: 4567890,
    marketCap: 12000000000000,
    peRatio: 21.4,
    fiftyTwoWeekHigh: 1725.00,
    fiftyTwoWeekLow: 1450.00
  },

  'ICICIBANK.NS': {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Ltd.',
    currentPrice: 1045.80,
    change: 10.15,
    percentChange: 0.98,
    volume: 5678901,
    marketCap: 7350000000000,
    peRatio: 18.9,
    fiftyTwoWeekHigh: 1115.00,
    fiftyTwoWeekLow: 890.00
  },

  'SBIN.NS': {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    currentPrice: 745.25,
    change: 6.40,
    percentChange: 0.87,
    volume: 6789012,
    marketCap: 6650000000000,
    peRatio: 12.6,
    fiftyTwoWeekHigh: 780.00,
    fiftyTwoWeekLow: 540.00
  },

  'ITC.NS': {
    symbol: 'ITC.NS',
    name: 'ITC Ltd.',
    currentPrice: 468.90,
    change: -2.35,
    percentChange: -0.50,
    volume: 7890123,
    marketCap: 5850000000000,
    peRatio: 24.3,
    fiftyTwoWeekHigh: 499.00,
    fiftyTwoWeekLow: 399.00
  },

  'LT.NS': {
    symbol: 'LT.NS',
    name: 'Larsen & Toubro Ltd.',
    currentPrice: 3525.75,
    change: 22.10,
    percentChange: 0.63,
    volume: 890123,
    marketCap: 4850000000000,
    peRatio: 34.7,
    fiftyTwoWeekHigh: 3700.00,
    fiftyTwoWeekLow: 2900.00
  },

  'BHARTIARTL.NS': {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Ltd.',
    currentPrice: 1215.30,
    change: 14.80,
    percentChange: 1.23,
    volume: 9012345,
    marketCap: 6850000000000,
    peRatio: 41.2,
    fiftyTwoWeekHigh: 1290.00,
    fiftyTwoWeekLow: 950.00
  }
};

export default function SymbolPage() {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect();
    
    return () => {
      // Cleanup
      if (symbol) {
        wsService.unsubscribeFromSymbol(symbol as string);
      }
    };
  }, [symbol]);

  // Fetch stock data (using mock data)
  useEffect(() => {
    const loadStockData = () => {
      setIsLoading(true);
      try {
        // Get data for the current symbol or fallback to AAPL if symbol not found
        const symbolKey = symbol as string;
        const data = mockStockData[symbolKey] || mockStockData['RELIANCE.NS'];
        
        setStockData(data);
        setCurrentPrice(data.currentPrice);
        setPriceChange(data.change);
        setPercentChange(data.percentChange);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load stock data. Please try again later.');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    if (symbol) {
      loadStockData();
    }
  }, [symbol]);

  // Handle real-time price updates
  const handlePriceUpdate = (price: number, change: number, percent: number) => {
    setCurrentPrice(price);
    setPriceChange(change);
    setPercentChange(percent);
  };

  // Handle order creation
  const handleOrderCreated = (order: any) => {
    console.log('Order created:', order);
    // In a real app, you might refresh a list of orders or show a notification
  };

  const isPositive = percentChange >= 0;
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          {isLoading && !stockData ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/50 border border-red-800 rounded-xl p-4 my-4">
              <p className="text-red-300">{error}</p>
            </div>
          ) : stockData ? (
            <>
              {/* Stock Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">{stockData.symbol}</h1>
                  <p className="text-xl text-gray-400">{stockData.name}</p>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                  <p className="text-3xl font-bold">&#8377;{currentPrice.toFixed(2)}</p>
                  <p className={`text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
                  </p>
                </div>
              </div>
              
              {/* Main content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2">
                  <RealTimeStockChart
                    symbol={symbol as string}
                    name={stockData.name}
                    onPriceUpdate={handlePriceUpdate}
                    showVolume={true}
                    height={500}
                  />
                  
                  {/* Key Stats */}
                  <div className="mt-6 bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
                    <h2 className="text-xl font-bold text-white mb-4">Key Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Market Cap</p>
                        <p className="text-lg font-semibold">&#8377;{(stockData.marketCap / 10000000).toFixed(2)} Cr</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Volume</p>
                        <p className="text-lg font-semibold">{(stockData.volume / 100000).toFixed(2)}L</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">P/E Ratio</p>
                        <p className="text-lg font-semibold">{stockData.peRatio?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">52W Range</p>
                        <p className="text-lg font-semibold">&#8377;{stockData.fiftyTwoWeekLow?.toFixed(2)} - &#8377;{stockData.fiftyTwoWeekHigh?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Risk Management */}
                <div>
                  <RiskManagementForm
                    symbol={symbol as string}
                    currentPrice={currentPrice}
                    onOrderCreated={handleOrderCreated}
                  />
                  
                  {/* Recent Orders */}
                  <div className="mt-6 bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
                    <h2 className="text-xl font-bold text-white mb-4">Recent Orders</h2>
                    <div className="space-y-4">
                      <div className="bg-gray-800 rounded-lg p-3 border border-red-800/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-white">Stop Loss</span>
                          <span className="px-2 py-0.5 text-xs bg-red-900/50 text-red-300 rounded">ACTIVE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">5 shares @ &#8377;{(currentPrice * 0.95).toFixed(2)}</span>
                          <button className="text-red-400 hover:text-red-300">Cancel</button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-3 border border-green-800/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-white">Take Profit</span>
                          <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">ACTIVE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">10 shares @ &#8377;{(currentPrice * 1.05).toFixed(2)}</span>
                          <button className="text-red-400 hover:text-red-300">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
        
        <footer className="bg-black/30 border-t border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © 2025 NexTrade. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm text-gray-400 hover:text-white">Terms</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Privacy</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Cookie Policy</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
} 