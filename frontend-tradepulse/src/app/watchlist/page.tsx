'use client';

import { FolderPlusIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import WatchList from '@/components/WatchList';
import StockChart from '@/components/StockChart';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function WatchlistPage() {
  // Sample featured stock data
  const featuredStock = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 187.45,
    priceChange: 3.28,
    percentChange: 1.78,
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <div className="mt-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Watchlist</h1>
              <p className="text-gray-400 mt-2">Keep track of stocks you're interested in</p>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-lg">
              <FolderPlusIcon className="h-5 w-5" />
              <span>Create New List</span>
            </button>
          </div>
          
          {/* Featured Stock */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Featured Stock</h2>
            <StockChart
              symbol={featuredStock.symbol}
              name={featuredStock.name}
              currentPrice={featuredStock.currentPrice}
              priceChange={featuredStock.priceChange}
              percentChange={featuredStock.percentChange}
              trend="up"
            />
          </div>
          
          {/* Watchlist */}
          <div>
            <WatchList />
          </div>
          
          {/* Watchlist Management Callout */}
          <div className="mt-8 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Create Custom Watchlists</h3>
                <p className="text-blue-200 mt-1">
                  Organize your favorite stocks by sector, strategy, or any way you choose.
                </p>
              </div>
              <button className="mt-4 md:mt-0 bg-white text-indigo-800 hover:bg-blue-100 transition-colors font-semibold px-5 py-2 rounded-lg">
                Learn More
              </button>
            </div>
          </div>
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