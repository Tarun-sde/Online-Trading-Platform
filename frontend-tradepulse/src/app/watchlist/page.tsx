'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderPlusIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import WatchList from '@/components/WatchList';
import StockChart, { ChartDataPoint } from '@/components/StockChart';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { API_BASE, getAuthHeaders } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthContext';

const PREDEFINED_STOCKS = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS'];

export default function WatchlistPage() {
  const { user } = useAuth();
  
  const [featuredSymbol, setFeaturedSymbol] = useState<string>('RELIANCE.NS');
  const [featuredData, setFeaturedData] = useState<{
    currentPrice: number;
    change: number;
    percentChange: number;
    chartData: ChartDataPoint[];
  } | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // 1. Fetch random rotated stock every 10 seconds
  useEffect(() => {
    let watchSymbols: string[] = [];
    
    const fetchLoop = async () => {
      // Refresh the watchlist symbols array every time we loop so it stays fresh
      if (user) {
        try {
          const res = await fetch(`${API_BASE}/api/watchlist`, { headers: getAuthHeaders() });
          if (res.ok) {
            const data = await res.json();
            if (data.symbols && data.symbols.length > 0) {
              watchSymbols = data.symbols;
            } else {
              watchSymbols = PREDEFINED_STOCKS;
            }
          }
        } catch {
          watchSymbols = PREDEFINED_STOCKS;
        }
      } else {
        watchSymbols = PREDEFINED_STOCKS;
      }
      
      // Pick random
      const selected = watchSymbols[Math.floor(Math.random() * watchSymbols.length)];
      setFeaturedSymbol(selected);
      setFeaturedLoading(true);

      // Fetch precise chart data
      try {
        const stockRes = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(selected)}`);
        if (stockRes.ok) {
          const sData = await stockRes.json();
          const prices = sData.closingPrices ?? [];
          let change = 0, percentChange = 0;
          if (prices.length >= 2) {
            const current = sData.currentPrice ?? prices[prices.length - 1];
            const prev = prices[prices.length - 2];
            change = current - prev;
            percentChange = (change / prev) * 100;
          }
          setFeaturedData({
            currentPrice: sData.currentPrice ?? 0,
            change,
            percentChange,
            chartData: sData.chartData ?? []
          });
        }
      } catch {
        console.error('Failed to load featured stock context');
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchLoop();
    const intc = setInterval(fetchLoop, 10000);
    return () => clearInterval(intc);
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">

          <div className="mt-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Watchlist</h1>
              <p className="text-gray-400 mt-2">
                Keep track of stocks you're interested in
              </p>
            </div>

            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-lg">
              <FolderPlusIcon className="h-5 w-5" />
              <span>Create New List</span>
            </button>
          </div>

          {/* Featured Stock */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Featured Stock
            </h2>

            <StockChart
              symbol={featuredSymbol}
              currentPrice={featuredData?.currentPrice ?? 0}
              priceChange={featuredData?.change ?? 0}
              percentChange={featuredData?.percentChange ?? 0}
              chartData={featuredData?.chartData ?? []}
              loading={featuredLoading}
              variant="default"
            />
          </div>

          <WatchList />

          <div className="mt-8 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Create Custom Watchlists
                </h3>
                <p className="text-blue-200 mt-1">
                  Organize your favorite stocks by sector or strategy.
                </p>
              </div>

              <button className="mt-4 md:mt-0 bg-white text-indigo-800 hover:bg-blue-100 transition-colors font-semibold px-5 py-2 rounded-lg">
                Learn More
              </button>
            </div>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
