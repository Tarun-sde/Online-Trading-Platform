'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RealTimeStockChart from '@/components/RealTimeStockChart';
import RiskManagementForm from '@/components/RiskManagementForm';
import { wsService } from '@/services/websocket';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock stock data for different symbols
const mockStockData: {[key: string]: any} = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 188.63,
    change: 2.14,
    percentChange: 1.15,
    volume: 48215632,
    marketCap: 2950000000000, // $2.95T
    peRatio: 31.2,
    fiftyTwoWeekHigh: 200.48,
    fiftyTwoWeekLow: 150.22
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    currentPrice: 402.79,
    change: 4.56,
    percentChange: 1.14,
    volume: 21536982,
    marketCap: 3020000000000, // $3.02T
    peRatio: 38.1,
    fiftyTwoWeekHigh: 420.12,
    fiftyTwoWeekLow: 310.36
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    currentPrice: 141.16,
    change: 1.36,
    percentChange: 0.97,
    volume: 22536712,
    marketCap: 1750000000000, // $1.75T
    peRatio: 25.2,
    fiftyTwoWeekHigh: 155.22,
    fiftyTwoWeekLow: 120.79
  },
  'AMZN': {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    currentPrice: 168.59,
    change: 3.21,
    percentChange: 1.94,
    volume: 31256489,
    marketCap: 1820000000000, // $1.82T
    peRatio: 52.4,
    fiftyTwoWeekHigh: 172.50,
    fiftyTwoWeekLow: 118.93
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    currentPrice: 193.57,
    change: -2.63,
    percentChange: -1.34,
    volume: 68947512,
    marketCap: 620000000000, // $620B
    peRatio: 48.7,
    fiftyTwoWeekHigh: 278.98,
    fiftyTwoWeekLow: 138.80
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
        const data = mockStockData[symbolKey] || mockStockData['AAPL'];
        
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
                  <p className="text-3xl font-bold">${currentPrice.toFixed(2)}</p>
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
                        <p className="text-lg font-semibold">${(stockData.marketCap / 1000000000).toFixed(2)}B</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Volume</p>
                        <p className="text-lg font-semibold">{(stockData.volume / 1000000).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">P/E Ratio</p>
                        <p className="text-lg font-semibold">{stockData.peRatio?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">52W Range</p>
                        <p className="text-lg font-semibold">${stockData.fiftyTwoWeekLow?.toFixed(2)} - ${stockData.fiftyTwoWeekHigh?.toFixed(2)}</p>
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
                          <span className="text-gray-400">5 shares @ ${(currentPrice * 0.95).toFixed(2)}</span>
                          <button className="text-red-400 hover:text-red-300">Cancel</button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-3 border border-green-800/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-white">Take Profit</span>
                          <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">ACTIVE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">10 shares @ ${(currentPrice * 1.05).toFixed(2)}</span>
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