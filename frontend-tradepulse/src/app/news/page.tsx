'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import NewsSection from '@/components/NewsSection';

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };

  // Categories for news filtering
  const categories = [
    'All News',
    'Markets',
    'Stocks',
    'Commodities',
    'Forex',
    'Crypto',
    'Economy',
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">Financial News</h1>
          <p className="text-gray-400 mt-2">Stay updated with the latest market and financial news</p>
        </div>
        
        {/* Search and Categories */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex w-full max-w-lg">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-white"
                placeholder="Search for news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 border border-transparent rounded-r-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  index === 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Featured News */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/3 pr-0 md:pr-8">
                  <span className="inline-block bg-blue-700 text-blue-100 px-2.5 py-1 rounded text-xs font-medium mb-3">
                    Breaking
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Federal Reserve Holds Interest Rates Steady, Signals Potential Cuts Later This Year
                  </h2>
                  <p className="text-blue-100 mb-4 line-clamp-3">
                    The Federal Reserve decided to maintain its benchmark interest rate at the current level today,
                    but indicated that rate cuts may be on the horizon as inflation continues to moderate and economic
                    growth remains steady.
                  </p>
                  <div className="flex items-center text-sm text-blue-200">
                    <span>Financial Times</span>
                    <span className="mx-2">•</span>
                    <span>3 hours ago</span>
                  </div>
                  <button className="mt-4 bg-white text-indigo-800 hover:bg-blue-50 px-5 py-2 rounded-lg font-medium transition-colors">
                    Read Full Story
                  </button>
                </div>
                <div className="md:w-1/3 mt-6 md:mt-0 relative h-48 md:h-auto rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ 
                      backgroundImage: "url('https://placehold.co/800x600/111827/FFFFFF?text=Federal+Reserve')",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Latest News */}
        <div>
          <NewsSection />
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
  );
} 